from pathlib import Path
import cv2
import numpy as np

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

    h_size = max(w // 30, 20) 
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
    # count all pixels on the axis (don't need to divide by 255 as the image is black-and-white)
    projection = line_mask.sum(axis=axis)
    line_length_max = line_mask.shape[axis] 
    threshold = line_length_max * 0.25
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