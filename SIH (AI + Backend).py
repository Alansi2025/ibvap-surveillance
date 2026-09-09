import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"
import os
import cv2
import threading
import queue
import time
import json
import asyncio
from contextlib import asynccontextmanager
import numpy as np
from ultralytics import YOLO
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ----------------- CONFIGURATION -----------------
CAMERA_SOURCE = "0"              # "0" for webcam, or "rtsp://..."
YOLO_MODEL_PATH = "yolov8n-pose.pt"
KNOWN_FACES_DIR = "known_faces"  # Directory with .jpg/.png images
FACE_RECOGNITION_INTERVAL = 1.0  # Run heavy face recognition once every 1.0s per ID
SIMILARITY_THRESHOLD = 0.65      # Cosine similarity threshold for face match
LOITERING_THRESHOLD_SEC = 10.0
TRACK_TIMEOUT_SEC = 4.0
FRAME_WIDTH = 640
FRAME_HEIGHT = 480
# --------------------------------------------------

# Ensure known faces directory exists
os.makedirs(KNOWN_FACES_DIR, exist_ok=True)

# Queues
frame_queue = queue.Queue(maxsize=3)
annotated_frame_queue = queue.Queue(maxsize=2)
running = True

# Target State Dictionaries
processed_intrusion_ids = set()
processed_loitering_ids = set()
processed_crawling_ids = set()
tracked_identities = {}          # {obj_id: {"name": str, "status": str, "last_checked": float}}
entry_timers = {}
last_seen_timers = {}

active_connections: list[WebSocket] = []
main_loop: asyncio.AbstractEventLoop | None = None


# =====================================================================
#                 RETINAFACE & FACE RECOGNITION ENGINE
# =====================================================================
class FaceAnalysisEngine:
    """
    RetinaFace face detector and feature matcher.
    Uses DeepFace with RetinaFace backend or InsightFace ArcFace embeddings.
    """
    def __init__(self, known_dir=KNOWN_FACES_DIR):
        self.known_dir = known_dir
        self.known_embeddings = {}  # {name: embedding_vector}
        self.detector_backend = "retinaface"
        self._load_known_database()

    def _load_known_database(self):
        print("🔍 Initializing RetinaFace & Face Database...")
        try:
            from deepface import DeepFace
            self.deepface = DeepFace

            for filename in os.listdir(self.known_dir):
                if filename.lower().endswith((".jpg", ".jpeg", ".png")):
                    name = os.path.splitext(filename)[0]
                    img_path = os.path.join(self.known_dir, filename)
                    
                    try:
                        # Extract 512-d ArcFace / Facenet embedding using RetinaFace detector
                        rep = self.deepface.represent(
                            img_path=img_path,
                            model_name="ArcFace",
                            detector_backend=self.detector_backend,
                            enforce_detection=False
                        )
                        if rep and len(rep) > 0:
                            self.known_embeddings[name] = np.array(rep[0]["embedding"])
                            print(f"  👤 Registered known face: [{name}]")
                    except Exception as e:
                        print(f"  ⚠️ Could not register {filename}: {e}")

            print(f"✅ Loaded {len(self.known_embeddings)} known target profile(s).")
        except ImportError:
            print("⚠️ DeepFace/RetinaFace not installed! Install via: pip install deepface retina-face")
            self.deepface = None

    def analyze_face_crop(self, face_bgr: np.ndarray):
        """Detects and matches a face ROI crop using RetinaFace + ArcFace."""
        if self.deepface is None or face_bgr is None or face_bgr.size == 0:
            return None

        try:
            # Extract representation for the detected human face ROI
            representations = self.deepface.represent(
                img_path=face_bgr,
                model_name="ArcFace",
                detector_backend=self.detector_backend,
                enforce_detection=True
            )
            
            if not representations:
                return None

            best_match = "UNKNOWN"
            best_score = -1.0
            face_box = representations[0].get("facial_area", None)
            unknown_embedding = np.array(representations[0]["embedding"])

            # Cosine similarity search against known DB
            for name, db_embedding in self.known_embeddings.items():
                cosine_sim = np.dot(unknown_embedding, db_embedding) / (
                    np.linalg.norm(unknown_embedding) * np.linalg.norm(db_embedding)
                )
                if cosine_sim > best_score:
                    best_score = cosine_sim
                    if cosine_sim >= SIMILARITY_THRESHOLD:
                        best_match = name

            # Determine security classification
            status = "AUTHORIZED" if "officer" in best_match.lower() or "admin" in best_match.lower() else (
                "WATCHLIST_SUSPECT" if best_match != "UNKNOWN" else "UNIDENTIFIED"
            )

            return {
                "identity": best_match,
                "confidence": round(float(best_score), 3) if best_score > 0 else 0.0,
                "status": status,
                "facial_area": face_box
            }
        except Exception:
            return None


face_engine = FaceAnalysisEngine()


# =====================================================================
#                       FASTAPI & WEBSOCKETS
# =====================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    global main_loop, running
    main_loop = asyncio.get_running_loop()
    print("🎯 Production Event Loop Registered Successfully!")
    yield
    running = False
    print("🛑 Engine shutting down safely...")


app = FastAPI(title="IBVAP Tactical Behavioral & Facial Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws/alerts")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    print(f"💻 Dashboard Connected! Total connections: {len(active_connections)}")
    try:
        while True:
            await asyncio.sleep(5)
            await websocket.send_json({"ping": True})
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in active_connections:
            active_connections.remove(websocket)


async def broadcast_alert(alert_payload: dict):
    if not active_connections:
        return
    payload_str = json.dumps(alert_payload)
    await asyncio.gather(
        *[conn.send_text(payload_str) for conn in active_connections],
        return_exceptions=True
    )


def trigger_ui_alert(alert_data: dict):
    global main_loop
    if main_loop is not None and active_connections:
        asyncio.run_coroutine_threadsafe(broadcast_alert(alert_data), main_loop)


# =====================================================================
#                     VISION PROCESSING PIPELINE
# =====================================================================
def apply_night_vision_clahe(frame: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced_l = clahe.apply(l_channel)
    return cv2.cvtColor(cv2.merge((enhanced_l, a_channel, b_channel)), cv2.COLOR_LAB2BGR)


def video_capture_thread(camera_source):
    global running
    source = int(camera_source) if str(camera_source).isdigit() else camera_source
    cap = cv2.VideoCapture(source)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    while running and cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.01)
            continue
        if frame_queue.full():
            try:
                frame_queue.get_nowait()
            except queue.Empty:
                pass
        frame_queue.put(frame)
    cap.release()


def vision_processing_loop():
    global running
    print(f"⏳ Loading YOLOv8-Pose Model ({YOLO_MODEL_PATH})...")
    pose_model = YOLO(YOLO_MODEL_PATH)
    print("✅ Pose & Tracking System Ready!")

    last_cleanup_time = time.time()

    while running:
        if frame_queue.empty():
            time.sleep(0.005)
            continue

        raw_frame = frame_queue.get()
        enhanced_frame = apply_night_vision_clahe(raw_frame)
        curr_time = time.time()

        # Run YOLO Pose Tracking
        results = pose_model.track(source=enhanced_frame, persist=True, verbose=False)
        result = results[0]
        
        boxes = result.boxes
        keypoints_object = result.keypoints

        if boxes is not None and boxes.id is not None and keypoints_object is not None:
            ids = boxes.id.cpu().numpy().astype(int)
            classes = boxes.cls.cpu().numpy().astype(int)
            xyxy_boxes = boxes.xyxy.cpu().numpy()
            kp_data = keypoints_object.xy.cpu().numpy()

            for idx, (obj_id, cls, box) in enumerate(zip(ids, classes, xyxy_boxes)):
                if cls == 0:  # Human detected
                    last_seen_timers[obj_id] = curr_time
                    x1, y1, x2, y2 = map(int, box)
                    box_w = max(1, x2 - x1)
                    box_h = max(1, y2 - y1)

                    # 1. Intrusion Alert
                    if obj_id not in processed_intrusion_ids:
                        processed_intrusion_ids.add(obj_id)
                        trigger_ui_alert({
                            "event_type": "HUMAN_INTRUSION",
                            "target_id": int(obj_id),
                            "timestamp": time.strftime("%H:%M:%S"),
                            "message": f"Perimeter Intrusion: Human target #{obj_id} detected"
                        })

                    # 2. Loitering Detection
                    if obj_id not in entry_timers:
                        entry_timers[obj_id] = curr_time
                    else:
                        elapsed = curr_time - entry_timers[obj_id]
                        if elapsed > LOITERING_THRESHOLD_SEC and obj_id not in processed_loitering_ids:
                            processed_loitering_ids.add(obj_id)
                            trigger_ui_alert({
                                "event_type": "SUSPICIOUS_LOITERING",
                                "target_id": int(obj_id),
                                "duration_sec": round(elapsed, 1),
                                "timestamp": time.strftime("%H:%M:%S"),
                                "message": f"Suspicious Activity: Target #{obj_id} loitering for {round(elapsed)}s"
                            })

                    # 3. Prone / Crawling Detection
                    if idx < len(kp_data):
                        person_kps = kp_data[idx]
                        if len(person_kps) > 12:
                            nose = person_kps[0]
                            mid_hip_x = (person_kps[11][0] + person_kps[12][0]) / 2
                            mid_hip_y = (person_kps[11][1] + person_kps[12][1]) / 2

                            if nose[0] > 0 and mid_hip_x > 0:
                                dx = abs(nose[0] - mid_hip_x)
                                dy = abs(nose[1] - mid_hip_y)

                                if (box_w > box_h * 1.25) and (dx > dy * 1.1) and (obj_id not in processed_crawling_ids):
                                    processed_crawling_ids.add(obj_id)
                                    trigger_ui_alert({
                                        "event_type": "PRONE_CRAWLING",
                                        "target_id": int(obj_id),
                                        "timestamp": time.strftime("%H:%M:%S"),
                                        "message": f"Tactical Threat: Target #{obj_id} in PRONE/CRAWLING posture!"
                                    })

                    # 4. RetinaFace Face Detection & Recognition
                    # Extract head region ROI (top 40% of bounding box) to optimize speed
                    head_y2 = min(raw_frame.shape[0], y1 + int(box_h * 0.45))
                    head_crop = enhanced_frame[max(0, y1):head_y2, max(0, x1):min(raw_frame.shape[1], x2)]

                    identity_info = tracked_identities.get(obj_id, None)
                    should_check_face = (
                        identity_info is None or
                        (curr_time - identity_info.get("last_checked", 0) > FACE_RECOGNITION_INTERVAL)
                    )

                    if should_check_face and head_crop.size > 0:
                        face_res = face_engine.analyze_face_crop(head_crop)
                        if face_res:
                            tracked_identities[obj_id] = {
                                "name": face_res["identity"],
                                "status": face_res["status"],
                                "confidence": face_res["confidence"],
                                "last_checked": curr_time
                            }

                            # Trigger identity alert
                            trigger_ui_alert({
                                "event_type": "FACE_RECOGNITION",
                                "target_id": int(obj_id),
                                "name": face_res["identity"],
                                "status": face_res["status"],
                                "confidence": face_res["confidence"],
                                "timestamp": time.strftime("%H:%M:%S"),
                                "message": f"Facial Match: ID #{obj_id} -> {face_res['identity']} ({face_res['status']})"
                            })

        # Draw Annotations (YOLO Skeleton + Facial Tag)
        annotated_frame = result.plot()
        for obj_id, id_data in tracked_identities.items():
            if obj_id in last_seen_timers and (curr_time - last_seen_timers[obj_id] < 1.0):
                color = (0, 255, 0) if id_data["status"] == "AUTHORIZED" else (
                    (0, 0, 255) if id_data["status"] == "WATCHLIST_SUSPECT" else (255, 200, 0)
                )
                cv2.putText(
                    annotated_frame,
                    f"ID #{obj_id} | {id_data['name']} [{id_data['status']}]",
                    (10, 30 + (obj_id % 10) * 25),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    color,
                    2
                )

        if annotated_frame_queue.full():
            try:
                annotated_frame_queue.get_nowait()
            except queue.Empty:
                pass
        annotated_frame_queue.put(annotated_frame)

        # Cleanup memory for targets absent > TRACK_TIMEOUT_SEC
        if curr_time - last_cleanup_time > 2.0:
            for tracking_id, last_seen in list(last_seen_timers.items()):
                if curr_time - last_seen > TRACK_TIMEOUT_SEC:
                    last_seen_timers.pop(tracking_id, None)
                    entry_timers.pop(tracking_id, None)
                    tracked_identities.pop(tracking_id, None)
                    processed_intrusion_ids.discard(tracking_id)
                    processed_loitering_ids.discard(tracking_id)
                    processed_crawling_ids.discard(tracking_id)
            last_cleanup_time = curr_time


# =====================================================================
#                     LIVE VIDEO STREAMING
# =====================================================================
def generate_mjpeg_stream():
    while running:
        if not annotated_frame_queue.empty():
            frame = annotated_frame_queue.get()
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        else:
            time.sleep(0.01)


@app.get("/video_feed")
def video_feed():
    return StreamingResponse(
        generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


if __name__ == "__main__":
    vision_thread = threading.Thread(target=vision_processing_loop, daemon=True)
    vision_thread.start()

    capture_thread = threading.Thread(target=video_capture_thread, args=(CAMERA_SOURCE,), daemon=True)
    capture_thread.start()

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="warning")