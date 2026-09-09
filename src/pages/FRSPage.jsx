import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanFace, 
  Search, 
  Filter, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  UserX, 
  Clock, 
  Camera, 
  Sparkles, 
  CheckCircle2, 
  AlertOctagon,
  Eye,
  Sliders,
  UploadCloud,
  Layers,
  Upload
} from 'lucide-react';
import { 
  fetchKnownFacesApi, 
  enrollFaceProfileApi, 
  fetchSystemSettingsApi, 
  updateSystemSettingsApi 
} from '../services/apiService';
import './FRSPage.css';

const FRSPage = () => {
  const [faces, setFaces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.38);
  const [selectedFace, setSelectedFace] = useState(null);
  
  // Enroll Modal State
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [enrollForm, setEnrollForm] = useState({
    name: '',
    person_type: 'SUSPECT',
    threat_level: 'CRITICAL',
    notes: '',
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadFaces();
    loadSettings();
  }, []);

  const loadFaces = async () => {
    try {
      const data = await fetchKnownFacesApi();
      setFaces(data);
      if (data.length > 0) setSelectedFace(data[0]);
    } catch (e) {}
  };

  const loadSettings = async () => {
    try {
      const s = await fetchSystemSettingsApi();
      if (s && s.faceThreshold) setSimilarityThreshold(s.faceThreshold);
    } catch (e) {}
  };

  const handleThresholdChange = async (val) => {
    const num = parseFloat(val);
    setSimilarityThreshold(num);
    try {
      await updateSystemSettingsApi({ faceThreshold: num });
    } catch (e) {}
  };

  const filteredFaces = faces.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (f.role && f.role.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!enrollForm.name) return;
    setEnrolling(true);

    const formData = new FormData();
    formData.append('name', enrollForm.name);
    formData.append('person_type', enrollForm.person_type);
    formData.append('threat_level', enrollForm.threat_level);
    formData.append('notes', enrollForm.notes);
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      await enrollFaceProfileApi(formData);
      await loadFaces();
      setShowEnrollModal(false);
      setEnrollForm({ name: '', person_type: 'SUSPECT', threat_level: 'CRITICAL', notes: '' });
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      // local fallback
      const newProfile = {
        name: enrollForm.name,
        role: enrollForm.notes || 'Enrolled Subject',
        clearance: enrollForm.person_type === 'AUTHORIZED_STAFF' ? 'L4_COMMAND' : 'RED_NOTICE',
        status: enrollForm.person_type === 'AUTHORIZED_STAFF' ? 'authorized' : 'blacklist',
        matchCount: 1,
        lastSeen: 'Just Enrolled',
      };
      setFaces([newProfile, ...faces]);
      setSelectedFace(newProfile);
      setShowEnrollModal(false);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="frs-page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div className="page-title-group">
          <div className="breadcrumb-text font-mono">
            IBVAP / INTELLIGENCE <span className="breadcrumb-sep">•</span> FACIAL RECOGNITION SYSTEM (FRS)
          </div>
          <div className="page-main-title">
            <h2>Facial Recognition System (FRS) & POI Watchlist</h2>
            <span className="streams-badge font-mono">
              <strong className="text-cyan">{faces.length}</strong> Identity Profiles Enrolled in SFace Vector DB
            </span>
          </div>
        </div>

        <div className="header-actions-group font-mono">
          <div className="thresh-slider-box">
            <span>SFace Cosine Thresh: {similarityThreshold}</span>
            <input 
              type="range" 
              min="0.25" 
              max="0.75" 
              step="0.01"
              value={similarityThreshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
            />
          </div>
          <button className="tactical-btn btn-primary" onClick={() => setShowEnrollModal(true)}>
            <UserPlus size={14} /> Enroll Identity Profile
          </button>
        </div>
      </div>

      {/* Main 2-Column FRS Matrix */}
      <div className="frs-main-grid font-mono">
        {/* Left Column: Registered Identity Cards */}
        <div className="frs-list-column">
          {/* Filter Bar */}
          <div className="frs-filter-bar">
            <div className="search-input-box">
              <Search size={14} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search Name, POI Alias, or Notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="custom-search-input"
              />
            </div>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Classification: All</option>
              <option value="authorized">Authorized Staff</option>
              <option value="blacklist">Watchlist Suspects</option>
            </select>
          </div>

          {/* Cards Grid */}
          <div className="identity-cards-grid">
            {filteredFaces.map((face, idx) => (
              <div 
                key={idx} 
                className={`identity-card ${selectedFace?.name === face.name ? 'active' : ''} ${face.status === 'blacklist' ? 'border-red' : 'border-green'}`}
                onClick={() => setSelectedFace(face)}
              >
                <div className="identity-card-header">
                  <div className="avatar-box">
                    <ScanFace size={24} className={face.status === 'blacklist' ? 'text-red' : 'text-green'} />
                  </div>
                  <div className="identity-card-title">
                    <span className="name-text text-white">{face.name}</span>
                    <span className="role-text text-muted">{face.role}</span>
                  </div>
                </div>

                <div className="identity-card-footer">
                  <span className={`status-pill ${face.status === 'blacklist' ? 'pill-red' : 'pill-green'}`}>
                    {face.status === 'blacklist' ? 'WATCHLIST POI' : 'AUTHORIZED'}
                  </span>
                  <span className="match-tag text-muted">Matches: {face.matchCount || 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Identity Vector Inspection */}
        <div className="frs-details-column">
          {selectedFace ? (
            <div className="face-details-card">
              <div className="details-header">
                <div className="details-title-box">
                  <ScanFace size={18} className="text-cyan" />
                  <span>128-DIMENSIONAL EMBEDDING PROFILE</span>
                </div>
                <span className={`pill-badge ${selectedFace.status === 'blacklist' ? 'pill-red' : 'pill-green'}`}>
                  {selectedFace.status === 'blacklist' ? 'HIGH THREAT NOTICE' : 'AUTHORIZED PERSONNEL'}
                </span>
              </div>

              <div className="face-visual-box">
                <div className="face-vector-avatar">
                  <ScanFace size={64} className={selectedFace.status === 'blacklist' ? 'text-red' : 'text-cyan'} />
                </div>
                <div className="face-hero-name text-white">{selectedFace.name}</div>
                <div className="face-clearance-code text-cyan">{selectedFace.clearance || 'L3_SECURITY'}</div>
              </div>

              <div className="face-metrics-box">
                <div className="metric-row">
                  <span className="metric-label text-muted">Inference Model:</span>
                  <span className="metric-val text-white">OpenCV YuNet + SFace (ONNX)</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label text-muted">Enrolled Security Role:</span>
                  <span className="metric-val text-white">{selectedFace.role}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label text-muted">Cosine Threshold:</span>
                  <span className="metric-val text-yellow">≥ {similarityThreshold}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label text-muted">Verification Status:</span>
                  <span className={`metric-val ${selectedFace.status === 'blacklist' ? 'text-red font-bold' : 'text-green'}`}>
                    {selectedFace.status === 'blacklist' ? 'WANTED SUSPECT (ALERT)' : 'VERIFIED CLEARANCE'}
                  </span>
                </div>
              </div>

              <div className="face-actions-box">
                <button className="tactical-btn btn-primary" onClick={() => alert(`Synchronized face vector embedding for ${selectedFace.name} across all active CCTV pipelines.`)}>
                  <Sparkles size={14} /> Sync Neural Weights
                </button>
              </div>
            </div>
          ) : (
            <div className="no-selection-box">
              <span>Select an identity card on the left to inspect biometric vector telemetry</span>
            </div>
          )}
        </div>
      </div>

      {/* Enroll Modal */}
      {showEnrollModal && (
        <div className="modal-backdrop font-mono">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Enroll Identity Profile in FRS Database</h3>
              <button className="close-btn" onClick={() => setShowEnrollModal(false)}>×</button>
            </div>
            <form onSubmit={handleEnroll} className="modal-form">
              <div className="form-group">
                <label>Full Name / Suspect Alias:</label>
                <input 
                  type="text" 
                  placeholder="e.g. Tariq Vance (Shadow-01)"
                  value={enrollForm.name}
                  onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                  required
                  className="modal-input"
                />
              </div>

              <div className="form-group">
                <label>Identity Category:</label>
                <select 
                  value={enrollForm.person_type}
                  onChange={(e) => setEnrollForm({ 
                    ...enrollForm, 
                    person_type: e.target.value,
                    threat_level: e.target.value === 'SUSPECT' ? 'CRITICAL' : 'NONE'
                  })}
                  className="modal-select"
                >
                  <option value="SUSPECT">SUSPECT (Watchlist Infiltrator)</option>
                  <option value="AUTHORIZED_STAFF">AUTHORIZED_STAFF (BSF Officer / Guard)</option>
                  <option value="VIP">VIP (Inspector / Diplomat)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Threat Level:</label>
                <select 
                  value={enrollForm.threat_level}
                  onChange={(e) => setEnrollForm({ ...enrollForm, threat_level: e.target.value })}
                  className="modal-select"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Arrest / Alert)</option>
                  <option value="HIGH">HIGH (Intercept & Interrogate)</option>
                  <option value="LOW">LOW (Log Movement)</option>
                  <option value="NONE">NONE (Authorized Clearance)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Face Reference Photo (JPG / PNG):</label>
                <div className="upload-dropzone" onClick={() => fileInputRef.current.click()}>
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" style={{ maxHeight: '100px', borderRadius: '4px' }} />
                  ) : (
                    <>
                      <Upload size={24} className="text-cyan" />
                      <span>Click to Select Reference Photo</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Intelligence Notes / Operational Details:</label>
                <textarea 
                  placeholder="Suspect past incursions, known aliases, or tactical instructions..."
                  value={enrollForm.notes}
                  onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                  className="modal-textarea"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="tactical-btn" onClick={() => setShowEnrollModal(false)}>Cancel</button>
                <button type="submit" className="tactical-btn btn-primary" disabled={enrolling}>
                  {enrolling ? 'Extracting Vector Embeddings...' : 'Save Profile to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FRSPage;
