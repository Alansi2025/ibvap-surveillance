"""
IBVAP - Facial Recognition System (FRS) Engine
Implements OpenCV YuNet for real-time Face Detection and SFace for 128-d Feature Embedding Extraction.
Integrates automatic model downloader from official OpenCV Zoo and provides classification
into AUTHORIZED, WATCHLIST_SUSPECT, or UNIDENTIFIED.
"""
import logging
import os
from pathlib import Path
import urllib.request
from typing import Dict, List, Optional, Tuple, Any
import cv2
import numpy as np

from backend.app.core.config import settings

logger = logging.getLogger("IBVAP.FaceEngine")


class FaceRecognitionEngine:
    def __init__(
        self,
        yunet_path: Optional[str] = None,
        sface_path: Optional[str] = None,
        known_faces_dir: Optional[str] = None,
        similarity_threshold: float = 0.38
    ):
        self.yunet_path = Path(yunet_path or settings.YUNET_MODEL)
        self.sface_path = Path(sface_path or settings.SFACE_MODEL)
        self.known_faces_dir = Path(known_faces_dir or settings.KNOWN_FACES_PATH)
        self.similarity_threshold = similarity_threshold

        self.detector = None
        self.recognizer = None
        self.known_db: Dict[str, Dict[str, Any]] = {}
        self.is_initialized = False

        self._ensure_models_exist()
        self._init_models()
        self.reload_known_faces()

    def _ensure_models_exist(self) -> None:
        """Downloads official YuNet and SFace ONNX models if not present."""
        self.yunet_path.parent.mkdir(parents=True, exist_ok=True)

        if not self.yunet_path.exists():
            logger.info("Downloading YuNet face detector model...")
            try:
                urllib.request.urlretrieve(settings.YUNET_URL, str(self.yunet_path))
                logger.info("YuNet model downloaded to %s", self.yunet_path)
            except Exception as e:
                logger.warning("Failed to auto-download YuNet: %s", e)

        if not self.sface_path.exists():
            logger.info("Downloading SFace face recognition model...")
            try:
                urllib.request.urlretrieve(settings.SFACE_URL, str(self.sface_path))
                logger.info("SFace model downloaded to %s", self.sface_path)
            except Exception as e:
                logger.warning("Failed to auto-download SFace: %s", e)

    def _init_models(self) -> None:
        """Initializes cv2.FaceDetectorYN and cv2.FaceRecognizerSF."""
        try:
            if self.yunet_path.exists() and self.sface_path.exists():
                self.detector = cv2.FaceDetectorYN.create(
                    model=str(self.yunet_path),
                    config="",
                    input_size=(320, 320),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=5000
                )
                self.recognizer = cv2.FaceRecognizerSF.create(
                    model=str(self.sface_path),
                    config=""
                )
                self.is_initialized = True
                logger.info("OpenCV YuNet & SFace FRS Engine initialized successfully.")
            else:
                logger.warning("YuNet or SFace weights missing. Operating in fallback mode.")
        except Exception as e:
            logger.warning("Failed to initialize OpenCV DNN Face Engine: %s. Using fallback.", e)
            self.is_initialized = False

    def reload_known_faces(self) -> None:
        """Enrolls reference face images from known_faces directory."""
        if not self.known_faces_dir.exists():
            self.known_faces_dir.mkdir(parents=True, exist_ok=True)

        self.known_db.clear()
        valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
        image_files = [p for p in self.known_faces_dir.iterdir() if p.suffix.lower() in valid_exts]

        for img_path in image_files:
            img = cv2.imread(str(img_path))
            if img is None:
                continue

            name = img_path.stem
            # Classify based on naming convention or prefix
            if "officer" in name.lower() or "guard" in name.lower() or "admin" in name.lower():
                status = "AUTHORIZED"
            elif "suspect" in name.lower() or "wanted" in name.lower() or "shadow" in name.lower():
                status = "WATCHLIST_SUSPECT"
            else:
                status = "AUTHORIZED"

            if self.is_initialized and self.detector and self.recognizer:
                h, w = img.shape[:2]
                self.detector.setInputSize((w, h))
                _, faces = self.detector.detect(img)

                if faces is not None and len(faces) > 0:
                    aligned = self.recognizer.alignCrop(img, faces[0])
                    feat = self.recognizer.feature(aligned)
                    self.known_db[name] = {
                        "feature": feat,
                        "status": status,
                        "name": name.replace("_", " ").title()
                    }
                    logger.info("Enrolled FRS Profile: %s [%s]", name, status)
            else:
                # Fallback dummy embedding if weights not loaded
                dummy_feat = np.random.randn(1, 128).astype(np.float32)
                self.known_db[name] = {
                    "feature": dummy_feat,
                    "status": status,
                    "name": name.replace("_", " ").title()
                }

        logger.info("Enrolled %d identity profiles in FRS Database.", len(self.known_db))

    def analyze_face_crop(self, head_crop: np.ndarray) -> Optional[Dict[str, Any]]:
        """
        Detects face within a head/torso crop and matches against enrolled database.
        Returns dict with identity, status (AUTHORIZED, WATCHLIST_SUSPECT, UNIDENTIFIED),
        confidence score, and bounding coordinates.
        """
        if head_crop is None or head_crop.shape[0] < 24 or head_crop.shape[1] < 24:
            return None

        if not self.is_initialized or self.detector is None or self.recognizer is None:
            # Fallback lightweight detection
            return {
                "identity": "Unidentified Target",
                "status": "UNIDENTIFIED",
                "confidence": 0.50,
                "face_box": [0, 0, head_crop.shape[1], head_crop.shape[0]]
            }

        try:
            h, w = head_crop.shape[:2]
            self.detector.setInputSize((w, h))
            _, faces = self.detector.detect(head_crop)

            if faces is None or len(faces) == 0:
                return None

            primary_face = faces[0]
            aligned = self.recognizer.alignCrop(head_crop, primary_face)
            feat = self.recognizer.feature(aligned)

            best_name = "Unidentified Target"
            best_status = "UNIDENTIFIED"
            best_score = -1.0

            for key, profile in self.known_db.items():
                ref_feat = profile["feature"]
                score = float(self.recognizer.match(feat, ref_feat, cv2.FaceRecognizerSF_FR_COSINE))
                if score > best_score:
                    best_score = score
                    if score >= self.similarity_threshold:
                        best_name = profile["name"]
                        best_status = profile["status"]

            face_box = [int(primary_face[0]), int(primary_face[1]), int(primary_face[2]), int(primary_face[3])]

            return {
                "identity": best_name,
                "status": best_status,
                "confidence": round(max(0.0, best_score), 3),
                "face_box": face_box
            }
        except Exception as e:
            logger.debug("Face analysis exception: %s", e)
            return None
