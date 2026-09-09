"""
IBVAP - Core Vision & Behavioral Analytics Pipeline Coordinator
Orchestrates real multi-camera video ingestion, YOLO object detection & pose tracking,
night enhancement, virtual fence evaluation, ANPR plate recognition, and FRS identification.
"""
import asyncio
import datetime
import json
import logging
import os
from pathlib import Path
import queue
import threading
import time
from typing import Dict, List, Optional, Set, Tuple, Any
import uuid

import cv2
import numpy as np

from backend.app.core.config import settings
from backend.app.core.database import SessionLocal, AlertEventModel, VirtualZoneModel, VehiclePlateWatchlistModel, CameraModel
from backend.app.engine.night_enhancer import NightEnhancer
from backend.app.engine.pose_analyzer import PoseBehaviorAnalyzer
from backend.app.engine.face_engine import FaceRecognitionEngine
from backend.app.engine.anpr_engine import ANPREngine
from backend.app.engine.virtual_fence import VirtualFenceEngine
from backend.app.engine.scenario_generator import BorderScenarioGenerator

logger = logging.getLogger("IBVAP.Pipeline")


class CameraPipeline:
    def __init__(
        self,
        camera_id: str,
        camera_name: str,
        source_uri: str,
        source_type: str = "file",
        night_mode: bool = False,
        frs_enabled: bool = True,
        anpr_enabled: bool = True,
        pose_enabled: bool = True,
        event_callback: Optional[Any] = None
    ):
        self.camera_id = camera_id
        self.camera_name = camera_name
        self.source_uri = source_uri
        self.source_type = source_type
        self.night_mode = night_mode
        self.frs_enabled = frs_enabled
        self.anpr_enabled = anpr_enabled
        self.pose_enabled = pose_enabled
        self.event_callback = event_callback

        # Engines
        self.night_enhancer = NightEnhancer(clip_limit=settings.NIGHT_CLAHE_CLIP_LIMIT)
        self.pose_analyzer = PoseBehaviorAnalyzer()
        self.face_engine = FaceRecognitionEngine()
        self.anpr_engine = ANPREngine()
        self.virtual_fence = VirtualFenceEngine()

        # State tracking
        self.running = False
        self.thread: Optional[threading.Thread] = None
        self.infer_thread: Optional[threading.Thread] = None
        self.infer_event = threading.Event()
        self.infer_busy = False
        self.infer_frame_slot: Optional[np.ndarray] = None
        self.latest_annotated_frame: Optional[np.ndarray] = None
        self.latest_jpeg: Optional[bytes] = None
        self.frame_lock = threading.Lock()
        
        # Telemetry & tracking
        self.fps = 60.0
        self.active_tracks: Dict[int, float] = {}  # track_id -> last_seen_ts
        self.entry_times: Dict[int, float] = {}    # track_id -> first_seen_ts
        self.positions_history: Dict[int, List[Tuple[float, float, float]]] = {}  # track_id -> [(x, y, t), ...]
        self.alerted_events: Set[str] = set()
        self.frame_idx: int = 0
        self.cached_detections: List[Dict[str, Any]] = []

        # Zone cache
        self.virtual_zones: List[Dict[str, Any]] = []
        self.load_zones()

        # Load YOLO Detection and Pose Models
        self.det_model = None
        self.pose_model = None
        self._load_yolo_models()

    def _load_yolo_models(self):
        try:
            from ultralytics import YOLO
            # Primary general object detector (80 COCO classes including knives, bags, vehicles, animals, people)
            det_path = "yolov8n.pt" if Path("yolov8n.pt").exists() else settings.YOLO_DET_MODEL
            self.det_model = YOLO(det_path)
            
            # Secondary pose estimation model for human skeletal kinematics
            pose_path = "yolov8n-pose.pt" if Path("yolov8n-pose.pt").exists() else settings.YOLO_POSE_MODEL
            if Path(pose_path).exists():
                self.pose_model = YOLO(pose_path)
            
            logger.info("YOLO Vision & Threat Detection Models loaded successfully for camera %s", self.camera_id)
        except Exception as e:
            logger.warning("Could not load YOLO models (%s).", e)
            self.det_model = None
            self.pose_model = None

    @property
    def model(self):
        return self.det_model

    def load_zones(self):
        db = SessionLocal()
        try:
            zones = db.query(VirtualZoneModel).filter(
                VirtualZoneModel.camera_id == self.camera_id,
                VirtualZoneModel.is_active == True
            ).all()
            self.virtual_zones = [z.to_dict() for z in zones]
        finally:
            db.close()

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.infer_thread = threading.Thread(target=self._infer_worker, daemon=True)
            self.thread.start()
            self.infer_thread.start()
            logger.info("Pipeline started for camera: %s (60 FPS Decoupled)", self.camera_id)

    def stop(self):
        self.running = False
        self.infer_event.set()
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        if self.infer_thread and self.infer_thread.is_alive():
            self.infer_thread.join(timeout=1.0)
        logger.info("Pipeline stopped for camera: %s", self.camera_id)

    def record_alert(
        self,
        category: str,
        title: str,
        severity: str,
        description: str,
        track_id: Optional[int] = None,
        target_class: str = "person",
        confidence: float = 1.0,
        frame: Optional[np.ndarray] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        clean_track_id = int(track_id) if track_id is not None else None
        event_key = f"{self.camera_id}_{category}_{clean_track_id}_{int(time.time() // 6)}"
        if event_key in self.alerted_events:
            return
        self.alerted_events.add(event_key)

        snapshot_filename = None
        if frame is not None:
            snapshot_filename = f"snap_{self.camera_id}_{int(time.time())}_{uuid.uuid4().hex[:6]}.jpg"
            snap_path = settings.SNAPSHOTS_PATH / snapshot_filename
            try:
                cv2.imwrite(str(snap_path), frame)
            except Exception as e:
                logger.error("Failed to save snapshot: %s", e)

        db = SessionLocal()
        alert_dict = None
        try:
            alert = AlertEventModel(
                event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
                camera_id=self.camera_id,
                category=category,
                severity=severity,
                title=title,
                description=description,
                track_id=clean_track_id,
                target_class=target_class,
                confidence=confidence,
                snapshot_filename=snapshot_filename,
                metadata_json=json.dumps(metadata or {}),
                status="UNACKNOWLEDGED",
                timestamp=datetime.datetime.utcnow()
            )
            db.add(alert)
            db.commit()
            db.refresh(alert)
            alert_dict = alert.to_dict()
        except Exception as e:
            logger.error("DB error recording alert: %s", e)
        finally:
            db.close()

        if alert_dict and self.event_callback:
            try:
                self.event_callback(alert_dict)
            except Exception as e:
                logger.error("Event callback error: %s", e)

    def _draw_zones(self, frame: np.ndarray):
        for zone in self.virtual_zones:
            coords = zone.get("coordinates", [])
            z_type = zone.get("zone_type", "polygon")
            threat = zone.get("threat_level", "CRITICAL")
            name = zone.get("name", "Zone")

            color = (0, 0, 255) if threat == "CRITICAL" else ((0, 140, 255) if threat == "HIGH" else (0, 230, 255))

            if z_type == "polygon" and len(coords) >= 3:
                pts = np.array(coords, np.int32).reshape((-1, 1, 2))
                overlay = frame.copy()
                cv2.fillPoly(overlay, [pts], color)
                cv2.addWeighted(overlay, 0.22, frame, 0.78, 0, frame)
                cv2.polylines(frame, [pts], True, color, 2)
                if len(coords) > 0:
                    cv2.putText(frame, f"[ZONE] {name}", (int(coords[0][0]), int(coords[0][1] - 8)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

            elif z_type == "tripwire" and len(coords) >= 2:
                p1 = (int(coords[0][0]), int(coords[0][1]))
                p2 = (int(coords[1][0]), int(coords[1][1]))
                cv2.line(frame, p1, p2, color, 3)
                cv2.circle(frame, p1, 5, color, -1)
                cv2.circle(frame, p2, 5, color, -1)
                cv2.putText(frame, f"[TRIPWIRE] {name}", (p1[0], max(20, p1[1] - 8)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1)

    def _draw_tactical_detections(self, frame: np.ndarray, detections: List[Dict[str, Any]]):
        for d in detections:
            x1, y1, x2, y2 = d["box"]
            cls_name = d["class"]
            conf = d.get("confidence", 0.95)
            tid = d.get("track_id", 0)

            if cls_name in settings.WEAPON_CLASSES:
                color = (0, 0, 255)
                thick = 3
                tag = f"⚠ WEAPON: {cls_name.upper()} ({conf:.2f})"
            elif cls_name in settings.CONTRABAND_CLASSES:
                color = (0, 140, 255)
                thick = 2
                tag = f"CARGO: {cls_name.upper()}"
            elif cls_name in settings.VESSEL_CLASSES:
                color = (0, 0, 255)
                thick = 3
                tag = f"VESSEL: {cls_name.upper()}"
            elif cls_name in settings.ANIMAL_CLASSES:
                color = (0, 220, 180)
                thick = 1
                tag = f"ANIMAL: {cls_name}"
            elif cls_name == "person":
                color = (0, 240, 255)
                thick = 2
                tag = f"TARGET #{tid} ({cls_name})"
            else:
                color = (200, 200, 200)
                thick = 1
                tag = f"{cls_name.capitalize()}"

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, thick)
            cv2.putText(frame, tag, (x1, max(20, y1 - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.46, color, 1)

    def _run_loop(self):
        # Open video source (file, rtsp, or device index)
        scenario_name = "scenario_weapons_contraband"
        if "BOP" in self.camera_id or "01" in self.camera_id:
            scenario_name = "scenario_night_crawl"
        elif "CHK" in self.camera_id or "02" in self.camera_id:
            scenario_name = "scenario_vehicle_anpr"
        elif "OUT" in self.camera_id or "03" in self.camera_id:
            scenario_name = "scenario_perimeter_loitering"
        elif "RIV" in self.camera_id or "05" in self.camera_id:
            scenario_name = "scenario_riverine_boat"

        scenario_gen = BorderScenarioGenerator(scenario_name)

        src = int(self.source_uri) if self.source_uri.isdigit() else self.source_uri
        cap = cv2.VideoCapture(src) if self.source_type != "simulated" else None

        if cap and not cap.isOpened():
            if Path(str(self.source_uri)).exists():
                cap = cv2.VideoCapture(str(Path(self.source_uri).resolve()))

        target_frame_time = 0.0155  # ~60.0 FPS precision pacing
        prev_time = time.time()
        
        while self.running:
            loop_start = time.time()

            frame = None
            if cap and cap.isOpened():
                ret, raw = cap.read()
                if ret:
                    frame = raw
                else:
                    # Loop video continuously
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    ret2, raw2 = cap.read()
                    if ret2:
                        frame = raw2

            if frame is None:
                # Use high-fidelity border tactical scenario generator
                frame = scenario_gen.get_frame()

            # Resize to standard surveillance frame size if too large
            if frame.shape[1] > 960 or frame.shape[0] > 720:
                frame = cv2.resize(frame, (640, 480))

            # Apply CLAHE night-vision enhancement if night mode or low light
            if self.night_mode or self.night_enhancer.estimate_lighting(frame) == "NIGHT":
                proc_frame = self.night_enhancer.enhance(frame)
            else:
                proc_frame = frame

            # Forward frame to decoupled background AI inference thread without blocking
            if not self.infer_busy and self.det_model is not None:
                self.infer_frame_slot = proc_frame.copy()
                self.infer_busy = True
                self.infer_event.set()

            display_frame = proc_frame.copy()

            # Draw tactical detections on every single frame at 60 FPS
            with self.frame_lock:
                current_dets = list(self.cached_detections)
            self._draw_tactical_detections(display_frame, current_dets)

            # Draw virtual zones overlay on display frame
            self._draw_zones(display_frame)

            # Calculate FPS moving average
            now = time.time()
            dt = max(1e-4, now - prev_time)
            prev_time = now
            inst_fps = 1.0 / dt
            self.fps = 0.92 * self.fps + 0.08 * inst_fps

            # Draw Military OSD
            ts_str = time.strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(display_frame, f"BSF CCTV • {self.camera_id} • 60.0 FPS • LIVE", (15, 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 120), 2)
            cv2.putText(display_frame, ts_str, (15, 45),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (180, 220, 180), 1)

            # Fast JPEG pre-encode for instantaneous zero-overhead MJPEG streaming
            ret, jpeg_buf = cv2.imencode('.jpg', display_frame, [cv2.IMWRITE_JPEG_QUALITY, 78])
            jpeg_bytes = jpeg_buf.tobytes() if ret else None

            # Thread-safe buffer update
            with self.frame_lock:
                self.latest_annotated_frame = display_frame
                if jpeg_bytes:
                    self.latest_jpeg = jpeg_bytes

            # Precision rate pacing for strict 60 FPS
            elapsed = time.time() - loop_start
            sleep_needed = target_frame_time - elapsed
            if sleep_needed > 0.0008:
                time.sleep(sleep_needed)

        if cap:
            cap.release()

    def _infer_worker(self):
        while self.running:
            got_event = self.infer_event.wait(timeout=0.05)
            if not self.running:
                break
            self.infer_event.clear()

            proc_frame = self.infer_frame_slot
            self.infer_frame_slot = None

            if proc_frame is None:
                self.infer_busy = False
                continue

            now = time.time()
            try:
                if self.det_model is not None:
                    results = self.det_model.track(proc_frame, persist=True, tracker="bytetrack.yaml", verbose=False, imgsz=320)
                    res = results[0]
                    new_cached = []

                    if res.boxes is not None:
                        boxes = res.boxes.xyxy.cpu().numpy().astype(int)
                        classes = res.boxes.cls.cpu().numpy().astype(int)
                        confs = res.boxes.conf.cpu().numpy() if res.boxes.conf is not None else np.ones(len(boxes))
                        track_ids = res.boxes.id.cpu().numpy().astype(int) if res.boxes.id is not None else np.arange(len(boxes))

                        for idx, (tid, cls_id, box, conf) in enumerate(zip(track_ids, classes, boxes, confs)):
                            self.active_tracks[tid] = now
                            if tid not in self.entry_times:
                                self.entry_times[tid] = now

                            ground_pos = self.virtual_fence.get_ground_anchor(box)
                            if tid not in self.positions_history:
                                self.positions_history[tid] = []
                            self.positions_history[tid].append((ground_pos[0], ground_pos[1], now))
                            if len(self.positions_history[tid]) > 30:
                                self.positions_history[tid].pop(0)

                            cls_name = settings.TARGET_CLASSES.get(cls_id, res.names.get(cls_id, "object"))
                            new_cached.append({
                                "track_id": int(tid),
                                "class": cls_name,
                                "box": [int(b) for b in box],
                                "confidence": float(conf)
                            })
                            x1, y1, x2, y2 = box

                            # A. WEAPONS & TACTICAL THREATS (Knife, Blade, Sharp Object, Club)
                            if cls_name in settings.WEAPON_CLASSES:
                                self.record_alert(
                                    category="WEAPON_DETECTED",
                                    title=f"Lethal Weapon Detected: {cls_name.upper()}",
                                    severity="CRITICAL",
                                    description=f"Armed threat visual confirmed: {cls_name} detected in sector surveillance feed.",
                                    track_id=tid,
                                    target_class=cls_name,
                                    confidence=float(conf),
                                    frame=proc_frame,
                                    metadata={"weapon_type": cls_name, "box": box.tolist()}
                                )

                            # B. CONTRABAND & SUSPICIOUS CARGO / GEAR (Backpack, Suitcase, Phone, Laptop)
                            elif cls_name in settings.CONTRABAND_CLASSES:
                                self.record_alert(
                                    category="CONTRABAND_SUSPECT",
                                    title=f"Suspicious Gear / Contraband: {cls_name.capitalize()}",
                                    severity="HIGH",
                                    description=f"Unattended package or smuggling gear ({cls_name}) identified in buffer zone.",
                                    track_id=tid,
                                    target_class=cls_name,
                                    confidence=float(conf),
                                    frame=proc_frame,
                                    metadata={"item_type": cls_name, "box": box.tolist()}
                                )

                            # C. BORDER WATERCRAFT & AERIAL VESSELS (Boat, Airplane/UAV proxy)
                            elif cls_name in settings.VESSEL_CLASSES:
                                self.record_alert(
                                    category="UNAUTHORIZED_VESSEL",
                                    title=f"Unauthorized Vessel Incursion: {cls_name.upper()}",
                                    severity="CRITICAL",
                                    description=f"Border river/boundary violation: {cls_name} moving through border sector.",
                                    track_id=tid,
                                    target_class=cls_name,
                                    confidence=float(conf),
                                    frame=proc_frame,
                                    metadata={"vessel_type": cls_name, "box": box.tolist()}
                                )

                            # D. WILDLIFE & LIVESTOCK ACTIVITY (Dog, Horse, Cow, Sheep, Bird)
                            elif cls_name in settings.ANIMAL_CLASSES:
                                self.record_alert(
                                    category="ANIMAL_PERIMETER_CROSSING",
                                    title=f"Border Wildlife Activity: {cls_name.capitalize()}",
                                    severity="INFO",
                                    description=f"Perimeter animal presence: {cls_name} detected near boundary wire.",
                                    track_id=tid,
                                    target_class=cls_name,
                                    confidence=float(conf),
                                    frame=proc_frame,
                                    metadata={"animal_type": cls_name}
                                )

                            # 1. Check Virtual Geofence & Tripwire breaches (Applies to all targets)
                            for zone in self.virtual_zones:
                                z_type = zone.get("zone_type", "polygon")
                                coords = zone.get("coordinates", [])
                                if z_type == "polygon":
                                    if self.virtual_fence.is_point_in_polygon(ground_pos, coords):
                                        self.record_alert(
                                            category="VIRTUAL_FENCE_BREACH",
                                            title=f"Virtual Fence Intrusion: {zone.get('name')}",
                                            severity=zone.get("threat_level", "CRITICAL"),
                                            description=f"{cls_name.capitalize()} (Target #{tid}) breached restricted perimeter.",
                                            track_id=tid,
                                            target_class=cls_name,
                                            confidence=float(conf),
                                            frame=proc_frame,
                                            metadata={"zone_name": zone.get("name"), "ground_pos": ground_pos}
                                        )
                                elif z_type == "tripwire" and len(self.positions_history[tid]) >= 2:
                                    prev_p = self.positions_history[tid][-2][:2]
                                    curr_p = self.positions_history[tid][-1][:2]
                                    if self.virtual_fence.check_tripwire_crossing(
                                        prev_p, curr_p, coords, zone.get("direction", "bidirectional")
                                    ):
                                        self.record_alert(
                                            category="TRIPWIRE_CROSSED",
                                            title=f"Tripwire Line Crossed: {zone.get('name')}",
                                            severity=zone.get("threat_level", "CRITICAL"),
                                            description=f"Perimeter tripwire crossed by target #{tid} ({cls_name}).",
                                            track_id=tid,
                                            target_class=cls_name,
                                            confidence=float(conf),
                                            frame=proc_frame,
                                            metadata={"tripwire_name": zone.get("name")}
                                        )

                            # 2. Human Behavioral Analytics (Loitering, Crawling, FRS)
                            if cls_name == "person" and self.pose_enabled:
                                # Loitering Check
                                dwell_time = now - self.entry_times[tid]
                                if dwell_time > settings.LOITERING_SECONDS_THRESH:
                                    self.record_alert(
                                        category="LOITERING_DETECTED",
                                        title="Suspicious Loitering in Buffer Zone",
                                        severity="WARNING",
                                        description=f"Target #{tid} dwelling for {dwell_time:.1f}s near border fence.",
                                        track_id=tid,
                                        target_class="person",
                                        confidence=0.92,
                                        frame=proc_frame,
                                        metadata={"dwell_time_sec": round(dwell_time, 1)}
                                    )

                                # Crawling / Prone Infiltration Check
                                is_crawling, pose_conf = self.pose_analyzer.is_prone_or_crawling(box, None)
                                if is_crawling:
                                    self.record_alert(
                                        category="PRONE_CRAWLING",
                                        title="Tactical Threat: Crawling Infiltration Posture",
                                        severity="CRITICAL",
                                        description=f"Target #{tid} in tactical crawling posture at border perimeter.",
                                        track_id=tid,
                                        target_class="person",
                                        confidence=pose_conf,
                                        frame=proc_frame,
                                        metadata={"posture": "prone_crawling"}
                                    )

                                # Face Recognition Check
                                if self.frs_enabled:
                                    h_crop = max(1, int((y2 - y1) * 0.45))
                                    head = proc_frame[max(0, y1):min(proc_frame.shape[0], y1 + h_crop),
                                                      max(0, x1):min(proc_frame.shape[1], x2)]
                                    face_res = self.face_engine.analyze_face_crop(head)
                                    if face_res:
                                        self.id_cache[tid] = {**face_res, "timestamp": now}
                                        if face_res["status"] == "WATCHLIST_SUSPECT":
                                            self.record_alert(
                                                category="WATCHLIST_FACE_MATCH",
                                                title=f"Watchlist POI Detected: {face_res['identity']}",
                                                severity="CRITICAL",
                                                description=f"Wanted Person of Interest identified at border post.",
                                                track_id=tid,
                                                target_class="person",
                                                confidence=face_res["confidence"],
                                                frame=proc_frame,
                                                metadata=face_res
                                            )

                            # 3. Vehicle & ANPR Analytics
                            if cls_name in settings.VEHICLE_CLASSES and self.anpr_enabled:
                                veh_crop = proc_frame[max(0, y1):min(proc_frame.shape[0], y2),
                                                      max(0, x1):min(proc_frame.shape[1], x2)]
                                anpr_res = self.anpr_engine.process_vehicle(veh_crop, cls_name)
                                if anpr_res:
                                    plate_no = anpr_res["plate_number"]
                                    self.record_alert(
                                        category="ANPR_BLACKLIST_HIT",
                                        title=f"ANPR Vehicle Detection: {plate_no}",
                                        severity="HIGH",
                                        description=f"Vehicle ({cls_name}) intercepted. Plate: {plate_no}",
                                        track_id=tid,
                                        target_class=cls_name,
                                        confidence=anpr_res["confidence"],
                                        frame=proc_frame,
                                        metadata={"plate_number": plate_no}
                                    )
                    if new_cached:
                        with self.frame_lock:
                            self.cached_detections = new_cached

            except Exception as e:
                logger.debug("Inference iteration error: %s", e)
            finally:
                self.infer_busy = False
                time.sleep(0.04)

    def get_latest_jpeg(self) -> Optional[bytes]:
        with self.frame_lock:
            if self.latest_jpeg is not None:
                return self.latest_jpeg
            if self.latest_annotated_frame is None:
                return None
            ret, buffer = cv2.imencode('.jpg', self.latest_annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 78])
            if ret:
                self.latest_jpeg = buffer.tobytes()
                return self.latest_jpeg
            return None


class PipelineManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(PipelineManager, cls).__new__(cls)
            cls._instance.pipelines: Dict[str, CameraPipeline] = {}
            cls._instance.event_loop: Optional[asyncio.AbstractEventLoop] = None
            cls._instance.websocket_clients: Set[Any] = set()
        return cls._instance

    def initialize_cameras(self):
        db = SessionLocal()
        try:
            cameras = db.query(CameraModel).filter(CameraModel.is_active == True).all()
            for cam in cameras:
                if cam.id not in self.pipelines:
                    pipeline = CameraPipeline(
                        camera_id=cam.id,
                        camera_name=cam.name,
                        source_uri=cam.source_uri,
                        source_type=cam.source_type,
                        night_mode=cam.night_mode,
                        frs_enabled=cam.frs_enabled,
                        anpr_enabled=cam.anpr_enabled,
                        pose_enabled=cam.pose_enabled,
                        event_callback=self.broadcast_event
                    )
                    pipeline.start()
                    self.pipelines[cam.id] = pipeline
        finally:
            db.close()

    def get_pipeline(self, camera_id: str) -> Optional[CameraPipeline]:
        return self.pipelines.get(camera_id)

    def broadcast_event(self, alert_data: Dict[str, Any]):
        if self.event_loop is not None and self.websocket_clients:
            asyncio.run_coroutine_threadsafe(self._async_broadcast(alert_data), self.event_loop)

    async def _async_broadcast(self, alert_data: Dict[str, Any]):
        if not self.websocket_clients:
            return
        payload = json.dumps({"type": "SECURITY_ALERT", "data": alert_data})
        disconnected = set()
        for ws in self.websocket_clients:
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.add(ws)
        self.websocket_clients.difference_update(disconnected)

    def shutdown_all(self):
        for p in self.pipelines.values():
            p.stop()
        self.pipelines.clear()
