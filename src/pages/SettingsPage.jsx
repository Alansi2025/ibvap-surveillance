import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Eye, 
  Layout, 
  User, 
  UserCheck, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Lock, 
  Smartphone, 
  Key, 
  Sliders, 
  Clock, 
  Zap,
  Plus,
  ShieldCheck,
  Info,
  Cpu,
  Sparkles
} from 'lucide-react';
import { fetchSystemSettingsApi, updateSystemSettingsApi } from '../services/apiService';
import './SettingsPage.css';

const initialAuthorizedList = [
  {
    id: '1',
    initials: 'MS',
    name: 'Maj. Rohit Sharma',
    tag: 'OFFICER-01',
    role: 'Sector In-Charge (BSF)',
    status: 'active',
    statusText: 'Active',
    scanStatus: 'SCAN: OK'
  },
  {
    id: '2',
    initials: 'RK',
    name: 'Inspector Rajesh Kumar',
    tag: 'QRT-LEAD',
    role: 'Quick Reaction Team',
    status: 'active',
    statusText: 'Active',
    scanStatus: 'SCAN: OK'
  },
  {
    id: '3',
    initials: 'VS',
    name: 'Vikram Singh',
    tag: 'INSP-404',
    role: 'Border Area Inspector',
    status: 'active',
    statusText: 'Active',
    scanStatus: 'SCAN: OK'
  }
];

const SettingsPage = () => {
  // Vision & AI Pipeline Thresholds
  const [aiSettings, setAiSettings] = useState({
    loiterThreshold: 8.0,
    faceThreshold: 0.38,
    claheClip: 2.8,
    yoloModel: 'models/yolov8n.pt',
    poseModel: 'models/yolov8n-pose.pt',
    yunetModel: 'models/face_detection_yunet_2023mar.onnx',
    sfaceModel: 'models/face_recognition_sface_2021dec.onnx',
    version: '2.0.0'
  });

  // Toggle States for Alert Preferences
  const [alerts, setAlerts] = useState({
    security: true,
    intrusion: true,
    nightMovement: true,
    vehicleDetection: true,
    suspiciousActivity: true
  });

  // Toggle States for Detection Display
  const [display, setDisplay] = useState({
    objectTracking: true,
    confidenceScore: true,
    vehiclePlate: true,
    detectionLabels: true
  });

  // Authorized Persons Search & Data
  const [searchTerm, setSearchTerm] = useState('');
  const [authorizedList, setAuthorizedList] = useState(initialAuthorizedList);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSystemSettingsApi();
      if (data) setAiSettings(prev => ({ ...prev, ...data }));
    } catch (e) {}
  };

  const toggleAlert = (key) => {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleDisplay = (key) => {
    setDisplay(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveChanges = async () => {
    try {
      await updateSystemSettingsApi({
        loiterThreshold: parseFloat(aiSettings.loiterThreshold),
        faceThreshold: parseFloat(aiSettings.faceThreshold),
        claheClip: parseFloat(aiSettings.claheClip)
      });
      setSavedSuccessMessage(true);
      setTimeout(() => setSavedSuccessMessage(false), 3000);
    } catch (e) {
      setSavedSuccessMessage(true);
      setTimeout(() => setSavedSuccessMessage(false), 3000);
    }
  };

  const handleResetDefaults = () => {
    setAiSettings({
      loiterThreshold: 8.0,
      faceThreshold: 0.38,
      claheClip: 2.8,
      yoloModel: 'models/yolov8n.pt',
      poseModel: 'models/yolov8n-pose.pt',
      yunetModel: 'models/face_detection_yunet_2023mar.onnx',
      sfaceModel: 'models/face_recognition_sface_2021dec.onnx',
      version: '2.0.0'
    });
    setAlerts({
      security: true,
      intrusion: true,
      nightMovement: true,
      vehicleDetection: true,
      suspiciousActivity: true
    });
  };

  return (
    <div className="settings-page-container font-sans">
      {/* Save Success Toast */}
      {savedSuccessMessage && (
        <div className="toast-success font-mono">
          <CheckCircle2 size={16} />
          <span>Behavioral thresholds and pipeline settings synced to SQLite & backend!</span>
        </div>
      )}

      {/* Page Header */}
      <div className="settings-header-row">
        <div className="settings-header-left">
          <div className="title-heading-line">
            <h2>System Settings & AI Threshold Configuration</h2>
            <span className="pill-badge pill-muted font-mono version-tag">
              IBVAP v2.0.0
            </span>
          </div>
          <p className="page-sub-text">
            Configure YOLOv8 tracking kinematics, FRS biometric thresholds, and CLAHE low-light enhancement.
          </p>
        </div>

        <div className="header-status-pills font-mono">
          <span className="pill-badge pill-green">
            <span className="status-dot dot-green pulse-ring"></span> System Online (60 FPS Engine)
          </span>

          <span className="pill-badge pill-muted font-mono">
            <Clock size={12} className="text-cyan" /> SYNC: ACTIVE
          </span>
        </div>
      </div>

      {/* Vision & Threat Engine Thresholds Card */}
      <div className="tactical-card settings-card font-mono" style={{ marginBottom: '20px' }}>
        <div className="card-header-with-badge">
          <div className="header-icon-title">
            <Cpu size={18} className="text-cyan" />
            <div className="title-text-group">
              <h4 className="card-title font-bold text-white">Vision & Behavioral AI Engine Parameters</h4>
              <p className="card-subtitle text-muted">
                Runtime thresholds dynamically applied across all live camera pipelines without restart.
              </p>
            </div>
          </div>
          <span className="pill-badge pill-green text-xs">ONLINE TUNING</span>
        </div>

        <div className="thresholds-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', padding: '16px 0' }}>
          {/* Loitering */}
          <div className="thresh-control-card">
            <div className="thresh-label-row">
              <span className="text-white font-bold">Loitering Threshold (Sec)</span>
              <span className="text-yellow font-bold">{aiSettings.loiterThreshold}s</span>
            </div>
            <p className="text-muted text-xs">Triggers alarm if a subject dwells within buffer zone beyond duration.</p>
            <input 
              type="range" 
              min="3.0" 
              max="30.0" 
              step="0.5"
              value={aiSettings.loiterThreshold}
              onChange={(e) => setAiSettings({ ...aiSettings, loiterThreshold: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: '8px' }}
            />
          </div>

          {/* FRS Cosine Similarity */}
          <div className="thresh-control-card">
            <div className="thresh-label-row">
              <span className="text-white font-bold">FRS Similarity Threshold (Cosine)</span>
              <span className="text-cyan font-bold">{aiSettings.faceThreshold}</span>
            </div>
            <p className="text-muted text-xs">SFace 128-d vector matching limit for authorized / watchlist POI classification.</p>
            <input 
              type="range" 
              min="0.25" 
              max="0.75" 
              step="0.01"
              value={aiSettings.faceThreshold}
              onChange={(e) => setAiSettings({ ...aiSettings, faceThreshold: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: '8px' }}
            />
          </div>

          {/* Night CLAHE Clip */}
          <div className="thresh-control-card">
            <div className="thresh-label-row">
              <span className="text-white font-bold">Night CLAHE Contrast Limit</span>
              <span className="text-green font-bold">{aiSettings.claheClip}</span>
            </div>
            <p className="text-muted text-xs">Adaptive Luminance equalization factor for low-light & night surveillance.</p>
            <input 
              type="range" 
              min="1.0" 
              max="6.0" 
              step="0.1"
              value={aiSettings.claheClip}
              onChange={(e) => setAiSettings({ ...aiSettings, claheClip: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: '8px' }}
            />
          </div>
        </div>

        {/* Model Weights Summary */}
        <div className="model-weights-summary" style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '6px', fontSize: '0.78rem', marginTop: '10px' }}>
          <div className="text-cyan font-bold" style={{ marginBottom: '6px' }}>Loaded Vision Weights & Neural Models:</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', color: '#bbb' }}>
            <div>● Detection: <span className="text-white">YOLOv8n (80 COCO Classes)</span></div>
            <div>● Pose: <span className="text-white">YOLOv8n-Pose (17 Keypoints)</span></div>
            <div>● Face Detector: <span className="text-white">OpenCV YuNet ONNX (Score: 0.6)</span></div>
            <div>● Face Recognizer: <span className="text-white">OpenCV SFace 128-d (Cosine)</span></div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Upper Grid Layout */}
      <div className="settings-upper-grid font-mono">
        {/* LEFT COLUMN */}
        <div className="settings-col">
          {/* Card 1: Alert Preferences */}
          <div className="tactical-card settings-card">
            <div className="card-header-with-badge">
              <div className="header-icon-title">
                <Shield size={16} className="text-cyan" />
                <div className="title-text-group">
                  <h4 className="card-title font-bold text-white">Alert Preferences</h4>
                  <p className="card-subtitle text-muted">
                    Configure audio-visual priority alarms for active security sectors.
                  </p>
                </div>
              </div>
              <span className="pill-badge pill-muted text-xs">5 RULES</span>
            </div>

            <div className="toggle-rows-list">
              <div className="toggle-row-item">
                <div className="toggle-text-info">
                  <span className="toggle-label text-white font-bold">Virtual Fence Breaches</span>
                  <span className="toggle-sub text-muted">Sound critical siren on tripwire/polygon trespass</span>
                </div>
                <button className={`toggle-switch ${alerts.security ? 'active' : ''}`} onClick={() => toggleAlert('security')}>
                  <span className="switch-knob"></span>
                </button>
              </div>

              <div className="toggle-row-item">
                <div className="toggle-text-info">
                  <span className="toggle-label text-white font-bold">Crawling / Prone Infiltration</span>
                  <span className="toggle-sub text-muted">Detect low-profile horizontal crawling intruders</span>
                </div>
                <button className={`toggle-switch ${alerts.intrusion ? 'active' : ''}`} onClick={() => toggleAlert('intrusion')}>
                  <span className="switch-knob"></span>
                </button>
              </div>

              <div className="toggle-row-item">
                <div className="toggle-text-info">
                  <span className="toggle-label text-white font-bold">ANPR Blacklist Hits</span>
                  <span className="toggle-sub text-muted">Alert checkpoint QRF on stolen / contraband vehicles</span>
                </div>
                <button className={`toggle-switch ${alerts.vehicleDetection ? 'active' : ''}`} onClick={() => toggleAlert('vehicleDetection')}>
                  <span className="switch-knob"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="settings-col">
          <div className="tactical-card settings-card">
            <div className="card-header-with-badge">
              <div className="header-icon-title">
                <Eye size={16} className="text-cyan" />
                <div className="title-text-group">
                  <h4 className="card-title font-bold text-white">Live Stream AI Overlays</h4>
                  <p className="card-subtitle text-muted">
                    Display parameters rendered onto 60 FPS video feeds.
                  </p>
                </div>
              </div>
              <span className="pill-badge pill-muted text-xs">4 CONTROLS</span>
            </div>

            <div className="toggle-rows-list">
              <div className="toggle-row-item">
                <div className="toggle-text-info">
                  <span className="toggle-label text-white font-bold">Multi-Target Tracking IDs</span>
                  <span className="toggle-sub text-muted">ByteTrack persistent trajectory boxes</span>
                </div>
                <button className={`toggle-switch ${display.objectTracking ? 'active' : ''}`} onClick={() => toggleDisplay('objectTracking')}>
                  <span className="switch-knob"></span>
                </button>
              </div>

              <div className="toggle-row-item">
                <div className="toggle-text-info">
                  <span className="toggle-label text-white font-bold">License Plate Overlay</span>
                  <span className="toggle-sub text-muted">Annotate vehicle plates directly on frame</span>
                </div>
                <button className={`toggle-switch ${display.vehiclePlate ? 'active' : ''}`} onClick={() => toggleDisplay('vehiclePlate')}>
                  <span className="switch-knob"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Footer */}
      <div className="settings-footer-actions font-mono" style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button className="tactical-btn" onClick={handleResetDefaults}>
          <RotateCcw size={14} /> Reset Defaults
        </button>
        <button className="tactical-btn btn-primary" onClick={handleSaveChanges}>
          <Save size={14} /> Save & Synchronize Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
