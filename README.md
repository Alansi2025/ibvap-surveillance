# IBVAP – Intelligent Border Video Analytics Platform

An AI-driven software-defined surveillance command and control platform designed to transform standard CCTV infrastructure into an intelligent border monitoring network without requiring expensive proprietary FRS, ANPR, or specialized smart-camera hardware.

---

## 🎯 Problem Statement & Core Value
Border security forces deploy standard IP-based CCTV cameras at Border Out Posts (BOPs), check posts, border roads, and strategic perimeters. However, conventional systems primarily provide passive video recording, requiring continuous human observation and failing in low-visibility or night conditions.

**IBVAP eliminates hardware lock-in by providing a software-defined video analytics platform that delivers:**
- **Human Detection & Behavioral Tracking**: Continuous multi-target tracking with speed estimation, loitering analysis, and prone/crawling infiltration posture detection.
- **Automatic Number Plate Recognition (ANPR)**: Real-time optical plate localization, OCR extraction, speed radar tracking, and automatic BSF whitelist vs suspicious vehicle blacklist matching.
- **Facial Recognition System (FRS)**: Integrated OpenCV YuNet detector and SFace ONNX 128-D cosine embedding engine with fast watchlist matching and identity enrollment.
- **Virtual Fence & Geo-Fencing Studio**: Interactive tripwire vector and exclusion polygon zone manager with directional crossing alarms.
- **Night-Time Movement Detection**: Adaptive CLAHE (Contrast Limited Adaptive Histogram Equalization) and Thermal IR false-color LUT processing.
- **Tactical Alerts & C2 Integration**: Instant audio-visual alerts, Quick Reaction Team (QRT) dispatch, drone reconnaissance deployment, and exportable forensic audit logs.

---

## 🏗️ Architecture Overview

```
[Standard CCTV / RTSP / IP Cameras / USB Webcams]
                       │
                       ▼
         ┌───────────────────────────┐
         │  IBVAP Python AI Backend  │
         │ (YOLOv8 + YuNet + SFace)  │
         └─────────────┬─────────────┘
                       │
      ┌────────────────┴────────────────┐
      ▼                                 ▼
[FastAPI REST API]             [WebSocket Telemetry]
(/api/v1/stream, /alerts,       (ws://localhost:8000/ws/telemetry)
 /anpr, /faces, /tripwires)
      │                                 │
      └────────────────┬────────────────┘
                       │
                       ▼
      ┌─────────────────────────────────┐
      │  IBVAP Tactical React C2 UI     │
      │ • Live Surveillance Matrix 3x3  │
      │ • ANPR & Vehicle Intelligence   │
      │ • FRS & Identity Watchlist      │
      │ • Virtual Fence Geo-Studio      │
      │ • Tactical Alerts & QRT Command │
      │ • Forensic Threat Heatmaps      │
      └─────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Frontend Command & Control UI (React + Vite)
```bash
# Install dependencies
npm install

# Launch Development Server
npm run dev
```
The interface is accessible at `http://localhost:5173`.

### 2. Python AI Video Analytics Backend (FastAPI + OpenCV + YOLOv8)
```bash
# Navigate to backend directory
cd backend

# Create & activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run the AI server
python3 run_server.py
```
The API server runs on `http://localhost:8000` and streams live annotated video feeds and real-time telemetry events.

---

## 🛠️ Modules Summary

| Module | Features & Capabilities |
| :--- | :--- |
| **Live Surveillance** | Multi-feed grid (1x1, 2x2, 3x3), real-time bounding boxes (Human, Vehicle, Pose skeletons), Thermal & Low-light toggles, PTZ controls. |
| **ANPR & Vehicles** | Optical license plate OCR, speed radar telemetry, authorized convoy pass vs blacklisted intercept alerts, plate enrollment. |
| **FRS & Watchlist** | Biometric facial recognition (YuNet + SFace), cosine similarity threshold tuning, suspect watchlist matching, photo enrollment. |
| **Virtual Fence Studio**| Interactive canvas to draw custom tripwire vectors and polygon exclusion zones directly on CCTV streams with directional breach triggers. |
| **Alerts & Incidents** | Critical / Warning / Info filtering, audio sirens, 1-click Quick Reaction Team (QRT) dispatch, drone deployment, forensic snapshot review. |
| **Analytics & Heatmaps**| 24-hour intrusion vectors, night-vs-day breach comparison, threat classification pie charts, exportable CSV/PDF reports. |
| **CCTV Stream Manager** | IP/RTSP camera source configuration, ONVIF discovery, resolution & bitrate monitoring. |
| **C2 & AI Settings** | YOLO confidence thresholds, YuNet & SFace similarity sliders, DEFCON level controls, edge hardware performance diagnostics. |
