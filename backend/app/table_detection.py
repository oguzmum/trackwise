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
