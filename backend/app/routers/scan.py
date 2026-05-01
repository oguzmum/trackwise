import base64
import tempfile
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from ..table_detection import (
    detect_table_pipeline,
    draw_grid,
    draw_marks,
    load_image,
    resize_to_max,
)

router = APIRouter()


class ScanResponse(BaseModel):
    success: bool
    n_rows: int
    n_cols: int
    habit_names: list[str]
    marks_matrix: list[list[bool]]
    result_image: Optional[str] = None
    error: Optional[str] = None


def _img_to_b64(img: np.ndarray) -> str:
    _, buf = cv2.imencode('.png', img)
    return base64.b64encode(buf.tobytes()).decode()


@router.post("/", response_model=ScanResponse)
async def scan_image(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    content = await file.read()
    suffix = Path(file.filename or 'upload.jpg').suffix or '.jpg'

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        result = detect_table_pipeline(tmp_path)

        if not result.success:
            return ScanResponse(
                success=False, n_rows=0, n_cols=0,
                habit_names=[], marks_matrix=[],
                error=result.error,
            )

        n_data_cols = result.n_cols - 1
        marks_matrix: list[list[bool]] = []
        for row_idx in range(len(result.habit_names)):
            actual_row = row_idx + 1
            row_marks = [False] * n_data_cols
            for cell in result.cells:
                if cell.row == actual_row and 0 < cell.col <= n_data_cols:
                    row_marks[cell.col - 1] = cell.has_mark
            marks_matrix.append(row_marks)

        img = load_image(tmp_path)
        img = resize_to_max(img)
        combined = draw_grid(draw_marks(img, result), result)

        return ScanResponse(
            success=True,
            n_rows=result.n_rows,
            n_cols=result.n_cols,
            habit_names=result.habit_names,
            marks_matrix=marks_matrix,
            result_image=_img_to_b64(combined),
        )
    finally:
        tmp_path.unlink(missing_ok=True)
