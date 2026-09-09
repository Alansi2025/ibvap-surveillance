"""
IBVAP - Night-Time & Low-Light Video Enhancement Engine
Applies adaptive CLAHE (Contrast Limited Adaptive Histogram Equalization) in LAB/YUV color space
and gamma correction to extract high-definition features from dark/night CCTV streams.
"""
import cv2
import numpy as np
from typing import Tuple


class NightEnhancer:
    def __init__(self, clip_limit: float = 2.8, tile_grid_size: Tuple[int, int] = (8, 8)):
        self.clip_limit = clip_limit
        self.tile_grid_size = tile_grid_size
        self.clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
        
        # Precompute gamma lookup table
        self.gamma_lut = np.array(
            [((i / 255.0) ** (1.0 / 1.4)) * 255 for i in range(256)]
        ).astype("uint8")

    def enhance(self, frame: np.ndarray, apply_gamma: bool = True) -> np.ndarray:
        """
        Enhances low-light CCTV frame while preserving color fidelity and minimizing noise amplification.
        """
        if frame is None or frame.size == 0:
            return frame

        # Convert to LAB color space to equalize Luminance only
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)

        # Apply CLAHE on L channel
        l_enhanced = self.clahe.apply(l_channel)

        # Merge back
        enhanced_lab = cv2.merge((l_enhanced, a_channel, b_channel))
        enhanced_bgr = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

        # Apply optional adaptive gamma brightening for extremely dark regions
        if apply_gamma:
            avg_lum = np.mean(l_channel)
            if avg_lum < 75.0:
                enhanced_bgr = cv2.LUT(enhanced_bgr, self.gamma_lut)

        return enhanced_bgr

    def estimate_lighting(self, frame: np.ndarray) -> str:
        """Estimates lighting condition: 'DAY', 'DUSK', 'NIGHT'."""
        if frame is None or frame.size == 0:
            return "DAY"
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        mean_val = np.mean(gray)
        if mean_val < 60:
            return "NIGHT"
        elif mean_val < 110:
            return "DUSK"
        return "DAY"
