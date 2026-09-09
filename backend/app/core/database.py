"""
IBVAP - Database ORM & Storage Engine (SQLAlchemy)
"""
import datetime
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, Text, Boolean
)
from sqlalchemy.orm import declarative_base, sessionmaker

from backend.app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class CameraModel(Base):
    """Stores configured CCTV / RTSP / Video sources."""
    __tablename__ = "cameras"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    location = Column(String(128), default="Border Outpost Sector A")
    source_type = Column(String(32), default="file")  # file, rtsp, webcam, simulated
    source_uri = Column(String(512), default="data/videos/perimeter_security.mp4")
    is_active = Column(Boolean, default=True)
    night_mode = Column(Boolean, default=False)
    frs_enabled = Column(Boolean, default=True)
    anpr_enabled = Column(Boolean, default=True)
    pose_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "source_type": self.source_type,
            "source_uri": self.source_uri,
            "is_active": self.is_active,
            "night_mode": self.night_mode,
            "frs_enabled": self.frs_enabled,
            "anpr_enabled": self.anpr_enabled,
            "pose_enabled": self.pose_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class VirtualZoneModel(Base):
    """Stores geofence polygons and tripwires for border intrusion detection."""
    __tablename__ = "virtual_zones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(String(64), index=True, nullable=False)
    name = Column(String(128), nullable=False)
    zone_type = Column(String(32), default="polygon")  # polygon, tripwire
    coordinates = Column(Text, nullable=False)
    threat_level = Column(String(32), default="CRITICAL")  # CRITICAL, HIGH, WARNING
    direction = Column(String(32), default="bidirectional")  # forward, backward, bidirectional
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def get_points(self) -> List[List[float]]:
        try:
            return json.loads(self.coordinates)
        except Exception:
            return []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "camera_id": self.camera_id,
            "name": self.name,
            "zone_type": self.zone_type,
            "coordinates": self.get_points(),
            "threat_level": self.threat_level,
            "direction": self.direction,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class AlertEventModel(Base):
    """Stores security breaches, ANPR hits, loitering, crawling, and FRS matches."""
    __tablename__ = "alert_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), unique=True, index=True)
    camera_id = Column(String(64), index=True, nullable=False)
    category = Column(String(64), index=True, nullable=False)
    severity = Column(String(32), default="HIGH")  # CRITICAL, HIGH, WARNING, INFO
    title = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    track_id = Column(Integer, nullable=True)
    target_class = Column(String(32), default="person")
    confidence = Column(Float, default=1.0)
    snapshot_filename = Column(String(256), nullable=True)
    metadata_json = Column(Text, nullable=True)
    status = Column(String(32), default="UNACKNOWLEDGED")  # UNACKNOWLEDGED, ACKNOWLEDGED, RESOLVED
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    def get_metadata(self) -> Dict[str, Any]:
        try:
            return json.loads(self.metadata_json) if self.metadata_json else {}
        except Exception:
            return {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "event_id": self.event_id,
            "camera_id": self.camera_id,
            "category": self.category,
            "severity": self.severity,
            "title": self.title,
            "description": self.description,
            "track_id": self.track_id,
            "target_class": self.target_class,
            "confidence": self.confidence,
            "snapshot_url": f"/api/snapshots/{self.snapshot_filename}" if self.snapshot_filename else None,
            "metadata": self.get_metadata(),
            "status": self.status,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


class WatchlistPersonModel(Base):
    """Stores Persons of Interest (POI) & Known Personnel for Facial Recognition."""
    __tablename__ = "watchlist_persons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    person_type = Column(String(32), default="SUSPECT")  # SUSPECT, VIP, AUTHORIZED_STAFF, UNKNOWN
    threat_level = Column(String(32), default="HIGH")    # CRITICAL, HIGH, LOW, NONE
    notes = Column(Text, nullable=True)
    face_image_path = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "person_type": self.person_type,
            "threat_level": self.threat_level,
            "notes": self.notes,
            "face_image_url": f"/api/faces/{self.face_image_path}" if self.face_image_path else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class VehiclePlateWatchlistModel(Base):
    """Stores vehicle license plate watchlists (Stolen, Banned, Authorized, Military)."""
    __tablename__ = "vehicle_plate_watchlist"

    id = Column(Integer, primary_key=True, autoincrement=True)
    plate_number = Column(String(64), unique=True, index=True, nullable=False)
    vehicle_type = Column(String(64), default="Car")  # Truck, Car, Motorcycle, SUV
    category = Column(String(32), default="BLACKLIST")  # BLACKLIST, WHITELIST, FLAG_INSPECT
    threat_level = Column(String(32), default="HIGH")   # CRITICAL, HIGH, MEDIUM
    owner_info = Column(String(256), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "plate_number": self.plate_number,
            "vehicle_type": self.vehicle_type,
            "category": self.category,
            "threat_level": self.threat_level,
            "owner_info": self.owner_info,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if cameras need update or seeding with real video footage
        db.query(CameraModel).delete()
        default_cameras = [
            CameraModel(
                id="CAM-BOP-01",
                name="BOP Sector Alpha - Perimeter Fence",
                location="Border Outpost Alpha (Post 104)",
                source_type="file",
                source_uri="data/videos/perimeter_security.mp4",
                is_active=True,
                night_mode=True,
                frs_enabled=True,
                anpr_enabled=False,
                pose_enabled=True
            ),
            CameraModel(
                id="CAM-CHK-02",
                name="Border Checkpost 7 - Road Ingress",
                location="International Transit Highway Checkpost",
                source_type="file",
                source_uri="data/videos/traffic_sample.mp4",
                is_active=True,
                night_mode=False,
                frs_enabled=True,
                anpr_enabled=True,
                pose_enabled=False
            ),
            CameraModel(
                id="CAM-OUT-03",
                name="Forward Watchtower 12 - Buffer Zone",
                location="Zero Line Restricted Buffer Zone",
                source_type="file",
                source_uri="data/videos/people_walking.mp4",
                is_active=True,
                night_mode=False,
                frs_enabled=True,
                anpr_enabled=True,
                pose_enabled=True
            ),
            CameraModel(
                id="CAM-WPN-04",
                name="Sector Foxtrot - Armed Threat & Contraband",
                location="Zero Line Infiltration Corridor",
                source_type="file",
                source_uri="data/videos/armed_patrol.mp4",
                is_active=True,
                night_mode=False,
                frs_enabled=True,
                anpr_enabled=False,
                pose_enabled=True
            ),
            CameraModel(
                id="CAM-RIV-05",
                name="Riverine Sector Bravo - Water Border",
                location="International River Boundary Patrol",
                source_type="file",
                source_uri="data/videos/river_patrol.mp4",
                is_active=True,
                night_mode=False,
                frs_enabled=False,
                anpr_enabled=False,
                pose_enabled=False
            )
        ]
        db.add_all(default_cameras)
        db.commit()

        if db.query(VirtualZoneModel).count() == 0:
            default_zones = [
                VirtualZoneModel(
                    camera_id="CAM-BOP-01",
                    name="Red Line Zero Buffer Zone",
                    zone_type="polygon",
                    coordinates=json.dumps([[100, 200], [540, 200], [600, 460], [40, 460]]),
                    threat_level="CRITICAL",
                    direction="bidirectional",
                    is_active=True
                ),
                VirtualZoneModel(
                    camera_id="CAM-BOP-01",
                    name="Fence Tripwire A-1",
                    zone_type="tripwire",
                    coordinates=json.dumps([[60, 260], [580, 260]]),
                    threat_level="CRITICAL",
                    direction="forward",
                    is_active=True
                ),
                VirtualZoneModel(
                    camera_id="CAM-CHK-02",
                    name="Checkpost Barricade Ingress",
                    zone_type="tripwire",
                    coordinates=json.dumps([[80, 280], [560, 280]]),
                    threat_level="HIGH",
                    direction="bidirectional",
                    is_active=True
                ),
                VirtualZoneModel(
                    camera_id="CAM-OUT-03",
                    name="Restricted Sentry Perimeter",
                    zone_type="polygon",
                    coordinates=json.dumps([[120, 160], [520, 160], [580, 440], [60, 440]]),
                    threat_level="HIGH",
                    direction="bidirectional",
                    is_active=True
                ),
                VirtualZoneModel(
                    camera_id="CAM-WPN-04",
                    name="Armed Infiltration Tripwire",
                    zone_type="tripwire",
                    coordinates=json.dumps([[50, 270], [590, 270]]),
                    threat_level="CRITICAL",
                    direction="bidirectional",
                    is_active=True
                ),
                VirtualZoneModel(
                    camera_id="CAM-RIV-05",
                    name="River Zero Line Boundary",
                    zone_type="polygon",
                    coordinates=json.dumps([[40, 220], [600, 220], [620, 430], [20, 430]]),
                    threat_level="CRITICAL",
                    direction="bidirectional",
                    is_active=True
                )
            ]
            db.add_all(default_zones)
            db.commit()

        if db.query(VehiclePlateWatchlistModel).count() == 0:
            sample_plates = [
                VehiclePlateWatchlistModel(
                    plate_number="DL01AB1234",
                    vehicle_type="SUV / Black Pickup",
                    category="BLACKLIST",
                    threat_level="CRITICAL",
                    owner_info="Suspected contraband carrier",
                    notes="Intercept immediately upon detection"
                ),
                VehiclePlateWatchlistModel(
                    plate_number="HR26DQ9999",
                    vehicle_type="Heavy Commercial Truck",
                    category="BLACKLIST",
                    threat_level="HIGH",
                    owner_info="Stolen commercial transport",
                    notes="Alert Border Checkpoint QRF"
                ),
                VehiclePlateWatchlistModel(
                    plate_number="JK02BZ5555",
                    vehicle_type="Military Transport / Quick Reaction",
                    category="WHITELIST",
                    threat_level="NONE",
                    owner_info="BSF Sector Patrol Unit",
                    notes="Authorized security patrol convoy"
                )
            ]
            db.add_all(sample_plates)
            db.commit()

        if db.query(WatchlistPersonModel).count() == 0:
            sample_persons = [
                WatchlistPersonModel(
                    name="Tariq Vance (Alias: Shadow-01)",
                    person_type="SUSPECT",
                    threat_level="CRITICAL",
                    notes="Wanted for unauthorized border cross attempt in Sector 4"
                ),
                WatchlistPersonModel(
                    name="Maj. Rohit Sharma",
                    person_type="AUTHORIZED_STAFF",
                    threat_level="NONE",
                    notes="Sector In-Charge / Border Security Force"
                ),
                WatchlistPersonModel(
                    name="Vikram Singh",
                    person_type="VIP",
                    threat_level="LOW",
                    notes="Designated Border Area Inspector"
                )
            ]
            db.add_all(sample_persons)
            db.commit()

    finally:
        db.close()
