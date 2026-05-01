from dataclasses import dataclass

from pathlib import Path
from typing import Optional
import cv2
import numpy as np
import math

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class CellResult:
    row: int
    col: int
    has_mark: bool
    confidence: float

@dataclass
class TableDetectionResult:
    success: bool
    n_rows: int
    n_cols: int
    row_positions: list[int]
    col_positions: list[int]
    cells: list[CellResult]
    habit_names: list[str] # later for OCR
    error: Optional[str] = None

    def marks_for_given_row(self, row: int) -> list[bool]:
        return [cell.has_mark for cell in self.cells if cell.row == row and cell.col > 0]

    def as_matrix(self) -> np.ndarray:
        """Return a boolean matrix [n_rows x (n_cols-1)] of mark values."""
        if self.n_rows == 0 or self.n_cols <= 1:
            return np.zeros((0, 0), dtype=bool)
        mat = np.zeros((self.n_rows, self.n_cols - 1), dtype=bool)
        for cell in self.cells:
            if cell.col > 0:
                mat[cell.row, cell.col - 1] = cell.has_mark
        return mat

# ---------------------------------------------------------------------------
# Functions
# ---------------------------------------------------------------------------

def load_image(image_path: str | Path) -> np.ndarray:
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Could not load image: {image_path}")
    return img


def resize_to_max(img: np.ndarray, max_dim: int = 1800) -> np.ndarray:
    h, w = img.shape[:2]
    scale = min(max_dim / max(h, w), 1.0)
    if scale < 1.0:
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img

def preprocess(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img.copy()
    
    h, w = gray.shape[:2]
    
    blur_size = max(3, (w // 500) | 1) 
    blurred = cv2.GaussianBlur(gray, (blur_size, blur_size), 0)
    
    dynamic_block_size = (w // 60) | 1 
    if dynamic_block_size <= 1: 
        dynamic_block_size = 3
        
    binary = cv2.adaptiveThreshold(
        blurred, 
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        blockSize=dynamic_block_size,
        C=5,
    )
    
    noise_kernel_size = max(3, w // 600)
    kernel = np.ones((noise_kernel_size, noise_kernel_size), np.uint8)
    binary_removed_isolated_noise_pixels = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    
    return binary_removed_isolated_noise_pixels


def detect_grid_lines(binary: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    h, w = binary.shape

    kernel_to_close_small_gaps = np.ones((2, 2), np.uint8)
    binary_closed = cv2.dilate(binary, kernel_to_close_small_gaps, iterations=1)

    h_size = max(w // 60, 20)
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (h_size, 1))
    # MORPH_OPEN to remove everything that is smaller than the kernel
    h_lines = cv2.morphologyEx(binary_closed, cv2.MORPH_OPEN, h_kernel)
    
    v_size = max(h // 30, 20)
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, v_size))
    v_lines = cv2.morphologyEx(binary_closed, cv2.MORPH_OPEN, v_kernel)
    
    # add some more pixels to the line (make them thicker)
    # h_lines = cv2.dilate(h_lines, np.ones((3, 3), np.uint8), iterations=1)
    # v_lines = cv2.dilate(v_lines, np.ones((3, 3), np.uint8), iterations=1)

    return h_lines, v_lines


def extract_line_positions(line_mask: np.ndarray, axis: int, min_gap: int = 10) -> list[int]:
    # count all pixels on the axis (divide by 255 to get the actual pixel count (white 255, black 0), the sum counts the intensity, not the pixel value)
    projection = line_mask.sum(axis=axis) / 255
    line_length_max = line_mask.shape[axis] 
    threshold = line_length_max * 0.26 # TODO maybe calucate this dynamically
    active = projection > threshold

    raw: list[int] = []
    i, n = 0, len(active)
    while i < n:
        if active[i]:
            start = i
            while i < n and active[i]:
                i += 1
            raw.append((start + i - 1) // 2)
        else:
            i += 1

    # Merge positions closer than min_gap
    merged: list[int] = []
    for p in raw:
        if not merged or p - merged[-1] > min_gap:
            merged.append(p)
        else:
            merged[-1] = (merged[-1] + p) // 2
    return merged

def detect_mark_in_cell(cell_img: np.ndarray) -> tuple[bool, float, list]:
    if cell_img is None or cell_img.size == 0:
        return False, 0.0, []

    gray = cv2.cvtColor(cell_img, cv2.COLOR_BGR2GRAY) if len(cell_img.shape) == 3 else cell_img.copy()

    short = min(gray.shape[:2])
    kernel = max(3, (short // 10) | 1)
    blurred = cv2.GaussianBlur(gray, (kernel, kernel), 0)

    edge = cv2.Canny(blurred, 30, 100)

    h, w = edge.shape[:2]
    short = min(h, w)

    min_line_len = max(8, int(short * 0.20))
    hough_thresh = max(8, int(short * 0.12))
    max_gap = max(4, int(short * 0.10))

    lines = cv2.HoughLinesP(
        edge, 1, np.pi / 180,
        threshold=hough_thresh,
        minLineLength=min_line_len,
        maxLineGap=max_gap,
    )

    valid_lines = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            dx, dy = x2 - x1, y2 - y1
            angle = math.degrees(math.atan2(abs(dy), abs(dx)))
            if 20 < angle < 75:
                valid_lines.append((x1, y1, x2, y2))

    # Confidence = total detected diagonal length / half cell diagonal
    cell_diag = math.hypot(h, w)
    total_len = sum(math.hypot(x2 - x1, y2 - y1) for x1, y1, x2, y2 in valid_lines)
    confidence = min(1.0, total_len / (cell_diag * 0.5))
    has_mark = confidence > 0.25

    return has_mark, float(confidence), valid_lines

# ---------------------------------------------------------------------------
# Table detection pipeline
# ---------------------------------------------------------------------------

def detect_table_pipeline(image_path: str | Path, max_image_dim: int = 1800, min_gap_rows: int = 10, min_gap_cols: int = 8) -> TableDetectionResult:
    try:
        img = load_image(image_path)
    except ValueError as e:
        return TableDetectionResult(
            success=False, n_rows=0, n_cols=0,
            row_positions=[], col_positions=[],
            cells=[], habit_names=[], error=str(e),
        )

    img = resize_to_max(img, max_image_dim)
    binary = preprocess(img)
    h_lines, v_lines = detect_grid_lines(binary)

    row_positions = extract_line_positions(h_lines, axis=1, min_gap=min_gap_rows)
    col_positions = extract_line_positions(v_lines, axis=0, min_gap=min_gap_cols)

    if len(row_positions) < 2 or len(col_positions) < 2:
        return TableDetectionResult(
            success=False, n_rows=0, n_cols=0,
            row_positions=row_positions, col_positions=col_positions,
            cells=[], habit_names=[],
            error=(
                f"Too few grid lines detected: "
                f"{len(row_positions)} horizontal, {len(col_positions)} vertical"
            ),
        )

    n_rows = len(row_positions) - 1
    n_cols = len(col_positions) - 1

    cells: list[CellResult] = []
    for r in range(1, n_rows):
        y1, y2 = row_positions[r], row_positions[r + 1]
        for c in range(n_cols):
            x1, x2 = col_positions[c], col_positions[c + 1]
            if c == 0:
                cells.append(CellResult(row=r, col=c, has_mark=False, confidence=0.0))
            else:
                has_mark, conf, _ = detect_mark_in_cell(img[y1:y2, x1:x2])
                cells.append(CellResult(row=r, col=c, has_mark=has_mark, confidence=conf))

	# here OCR later
    habit_names = 'habit name XYZ :D'

    return TableDetectionResult(
        success=True,
        n_rows=n_rows,
        n_cols=n_cols,
        row_positions=row_positions,
        col_positions=col_positions,
        cells=cells,
        habit_names=habit_names,
    )


# ---------------------------------------------------------------------------
# Visualization Functions
# ---------------------------------------------------------------------------

def draw_grid(img: np.ndarray, result: TableDetectionResult, color: tuple[int, int, int] = (0, 200, 0),) -> np.ndarray:
    out = img.copy()
    for y_coordinate in result.row_positions:
        cv2.line(out, (0, y_coordinate), (out.shape[1], y_coordinate), color, 1)
    for x_coordinate in result.col_positions:
        cv2.line(out, (x_coordinate, 0), (x_coordinate, out.shape[0]), color, 1)
    return out


def draw_marks(img: np.ndarray, result: TableDetectionResult) -> np.ndarray:
    out = img.copy()
    overlay = out.copy()
    rp, cp = result.row_positions, result.col_positions

    for cell in result.cells:
        if not cell.has_mark:
            continue
        r, c = cell.row, cell.col
        if r + 1 < len(rp) and c + 1 < len(cp):
            cv2.rectangle(overlay, (cp[c], rp[r]), (cp[c + 1], rp[r + 1]), (0, 100, 255), -1)

    cv2.addWeighted(overlay, 0.35, out, 0.65, 0, out)
    return out