"""
IBVAP - Core Configuration Settings
"""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
if not (BASE_DIR / "models").exists() and (Path(__file__).resolve().parent.parent.parent / "models").exists():
    BASE_DIR = Path(__file__).resolve().parent.parent.parent

MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"
SNAPSHOTS_DIR = DATA_DIR / "snapshots"
KNOWN_FACES_DIR = BASE_DIR / "known_faces"

# Ensure runtime directories exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)
SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
KNOWN_FACES_DIR.mkdir(parents=True, exist_ok=True)


class Settings:
    PROJECT_NAME: str = "IBVAP - Intelligent Border Video Analytics Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Storage & DB
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'ibvap.db'}"
    SNAPSHOTS_PATH: Path = SNAPSHOTS_DIR
    MODELS_PATH: Path = MODELS_DIR
    KNOWN_FACES_PATH: Path = KNOWN_FACES_DIR
    
    # Model defaults
    YOLO_POSE_MODEL: str = str(MODELS_DIR / "yolov8n-pose.pt")
    YOLO_DET_MODEL: str = str(MODELS_DIR / "yolov8n.pt")
    YUNET_MODEL: str = str(MODELS_DIR / "face_detection_yunet_2023mar.onnx")
    SFACE_MODEL: str = str(MODELS_DIR / "face_recognition_sface_2021dec.onnx")
    
    # Model download URLs for automatic acquisition
    YUNET_URL: str = "https://github.com/opencv/opencv_zoo/raw/master/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
    SFACE_URL: str = "https://github.com/opencv/opencv_zoo/raw/master/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
    
    # Pipeline & Behavioral Thresholds
    FACE_SIMILARITY_THRESH: float = 0.38
    LOITERING_SECONDS_THRESH: float = 8.0
    FACE_CHECK_INTERVAL_SEC: float = 1.0
    TRACK_TIMEOUT_SEC: float = 5.0
    NIGHT_CLAHE_CLIP_LIMIT: float = 2.8
    
    # Target Classes (COCO mapping for YOLO - Border Surveillance Scope)
    TARGET_CLASSES = {
        0: "person",
        1: "bicycle",
        2: "car",
        3: "motorcycle",
        4: "airplane",
        5: "bus",
        6: "train",
        7: "truck",
        8: "boat",
        14: "bird",
        15: "cat",
        16: "dog",
        17: "horse",
        18: "sheep",
        19: "cow",
        20: "elephant",
        21: "bear",
        22: "zebra",
        23: "giraffe",
        24: "backpack",
        25: "umbrella",
        26: "handbag",
        28: "suitcase",
        34: "baseball bat",
        39: "bottle",
        43: "knife",
        63: "laptop",
        67: "cell phone",
        73: "book",
        76: "scissors"
    }

    # Threat and Object Categorizations
    WEAPON_CLASSES = {"knife", "scissors", "baseball bat"}
    CONTRABAND_CLASSES = {"backpack", "handbag", "suitcase", "cell phone", "laptop", "bottle"}
    VESSEL_CLASSES = {"boat", "airplane"}
    VEHICLE_CLASSES = {"car", "truck", "motorcycle", "bus", "bicycle", "train"}
    ANIMAL_CLASSES = {"dog", "horse", "cow", "sheep", "bird", "elephant", "bear", "cat", "zebra", "giraffe"}


settings = Settings()
