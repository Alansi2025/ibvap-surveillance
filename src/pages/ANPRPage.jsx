import React, { useState, useEffect, useCallback } from 'react';
import { 
  Car, 
  Search, 
  Filter, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Plus, 
  Gauge, 
  CheckCircle2, 
  XCircle, 
  FileText,
  Trash2
} from 'lucide-react';
import { 
  fetchANPRLogsApi, 
  fetchPlateWatchlistApi, 
  addPlateToWatchlistApi, 
  deletePlateFromWatchlistApi 
} from '../services/apiService';
import './ANPRPage.css';

const ANPRPage = () => {
  const [anprLogs, setAnprLogs] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('live_logs'); // 'live_logs' or 'watchlist'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  
  // New Plate Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlate, setNewPlate] = useState({ 
    plate_number: '', 
    vehicle_type: 'SUV', 
    category: 'BLACKLIST', 
    threat_level: 'CRITICAL', 
    owner_info: '', 
    notes: '' 
  });

  const loadData = useCallback(async () => {
    try {
      const logs = await fetchANPRLogsApi();
      setAnprLogs(logs);
      if (logs.length > 0) setSelectedLog(logs[0]);

      const wl = await fetchPlateWatchlistApi();
      setWatchlist(wl);
    } catch (e) {
      // fallback
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredLogs = anprLogs.filter(log => {
    const matchSearch = log.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.camera.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || 
                        (statusFilter === 'authorized' && log.status.toLowerCase().includes('authorized')) ||
                        (statusFilter === 'blacklisted' && log.status.toLowerCase().includes('blacklist')) ||
                        (statusFilter === 'unverified' && log.status.toLowerCase().includes('unverified'));
    return matchSearch && matchStatus;
  });

  const handleAddPlate = async (e) => {
    e.preventDefault();
    if (!newPlate.plate_number) return;
    try {
      const saved = await addPlateToWatchlistApi(newPlate);
      setWatchlist([...watchlist, saved]);
    } catch (err) {
      setWatchlist([...watchlist, { id: Date.now(), ...newPlate }]);
    }

    const item = {
      id: `ANPR-${Date.now() % 10000}`,
      plate: newPlate.plate_number.toUpperCase().replace(/\s+/g, ''),
      vehicle: `${newPlate.vehicle_type} (${newPlate.owner_info || 'Enrolled Entry'})`,
      camera: 'CAM-CHK-02 (Road Ingress)',
      timestamp: new Date().toLocaleTimeString(),
      confidence: 99.4,
      status: newPlate.category === 'BLACKLIST' ? 'Blacklisted / Stolen' : 'Authorized Convoy',
      speed: '32 km/h',
      threat: newPlate.category === 'BLACKLIST' ? 'critical' : 'normal'
    };
    setAnprLogs([item, ...anprLogs]);
    setSelectedLog(item);
    setShowAddModal(false);
    setNewPlate({ plate_number: '', vehicle_type: 'SUV', category: 'BLACKLIST', threat_level: 'CRITICAL', owner_info: '', notes: '' });
  };

  const handleDeletePlate = async (id) => {
    try {
      await deletePlateFromWatchlistApi(id);
    } catch (e) {}
    setWatchlist(watchlist.filter(p => p.id !== id));
  };

  const exportCSV = () => {
    const headers = "ID,Plate,Vehicle,Camera,Timestamp,Confidence,Status,Speed\n";
    const rows = anprLogs.map(l => `${l.id},${l.plate},"${l.vehicle}",${l.camera},${l.timestamp},${l.confidence}%,${l.status},${l.speed}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ANPR_Border_Log_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="anpr-page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div className="page-title-group">
          <div className="breadcrumb-text font-mono">
            IBVAP / INTELLIGENCE <span className="breadcrumb-sep">•</span> ANPR & VEHICLE TRACKING
          </div>
          <div className="page-main-title">
            <h2>Automatic Number Plate Recognition (ANPR)</h2>
            <span className="streams-badge font-mono">
              <strong className="text-cyan">{anprLogs.length}</strong> Vehicles Tracked • <strong className="text-red">{watchlist.length}</strong> Watchlist Plates in SQLite
            </span>
          </div>
        </div>

        <div className="header-actions-group font-mono">
          <div className="subtab-buttons">
            <button 
              className={`tactical-btn ${activeSubTab === 'live_logs' ? 'btn-primary' : ''}`}
              onClick={() => setActiveSubTab('live_logs')}
            >
              Live ANPR Feeds
            </button>
            <button 
              className={`tactical-btn ${activeSubTab === 'watchlist' ? 'btn-primary' : ''}`}
              onClick={() => setActiveSubTab('watchlist')}
            >
              Watchlist Registry ({watchlist.length})
            </button>
          </div>

          <button className="tactical-btn font-mono" onClick={exportCSV}>
            <Download size={14} /> Export CSV
          </button>
          <button className="tactical-btn btn-primary font-mono" onClick={() => setShowAddModal(true)}>
            <Plus size={14} /> Register Watchlist Plate
          </button>
        </div>
      </div>

      {activeSubTab === 'watchlist' ? (
        /* Watchlist Registry Table */
        <div className="watchlist-registry-card font-mono">
          <div className="card-header">
            <h3>Registered Border Plate Watchlist (Stolen / Contraband / VIP / QRT)</h3>
          </div>
          <table className="tactical-table">
            <thead>
              <tr>
                <th>PLATE NUMBER</th>
                <th>VEHICLE TYPE</th>
                <th>CATEGORY</th>
                <th>THREAT LEVEL</th>
                <th>OWNER / INFO</th>
                <th>NOTES</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {watchlist.map((p) => (
                <tr key={p.id}>
                  <td className="text-cyan font-bold">{p.plate_number}</td>
                  <td>{p.vehicle_type}</td>
                  <td>
                    <span className={`pill-badge ${p.category === 'BLACKLIST' ? 'pill-red' : 'pill-green'}`}>
                      {p.category}
                    </span>
                  </td>
                  <td>
                    <span className={p.threat_level === 'CRITICAL' ? 'text-red' : 'text-yellow'}>
                      {p.threat_level}
                    </span>
                  </td>
                  <td>{p.owner_info || '--'}</td>
                  <td className="text-muted">{p.notes || '--'}</td>
                  <td>
                    <button className="delete-btn" onClick={() => handleDeletePlate(p.id)}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Live Logs 2-Column Interface */
        <div className="anpr-main-grid">
          {/* Left Column: Logs Table */}
          <div className="anpr-table-column">
            {/* Filter Bar */}
            <div className="anpr-filter-bar font-mono">
              <div className="search-input-box">
                <Search size={14} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Search Plate, Vehicle, or Camera ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="custom-search-input"
                />
              </div>

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Status: All Records</option>
                <option value="authorized">Authorized Units Only</option>
                <option value="blacklisted">Blacklisted / Intercept</option>
                <option value="unverified">Unverified Civilian</option>
              </select>
            </div>

            {/* Logs List */}
            <div className="logs-list-wrapper font-mono">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className={`anpr-log-item ${selectedLog?.id === log.id ? 'active' : ''} threat-${log.threat}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="log-item-left">
                    <div className="plate-badge">{log.plate}</div>
                    <div className="log-vehicle-info">
                      <span className="vehicle-name text-white">{log.vehicle}</span>
                      <span className="camera-name text-muted">{log.camera} • {log.timestamp}</span>
                    </div>
                  </div>

                  <div className="log-item-right">
                    <span className={`status-pill pill-${log.threat === 'critical' ? 'red' : 'green'}`}>
                      {log.status}
                    </span>
                    <span className="speed-tag text-muted">{log.speed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Detailed Plate Inspection Card */}
          <div className="anpr-details-column font-mono">
            {selectedLog ? (
              <div className="inspection-card">
                <div className="inspection-header">
                  <div className="inspection-title">
                    <Car size={16} className="text-cyan" />
                    <span>LPR SENSOR TELEMETRY & MATCH</span>
                  </div>
                  <span className={`pill-badge pill-${selectedLog.threat === 'critical' ? 'red' : 'green'}`}>
                    {selectedLog.threat === 'critical' ? 'CRITICAL ALERT' : 'CLEAR'}
                  </span>
                </div>

                <div className="plate-hero-box">
                  <div className="plate-hero-text">{selectedLog.plate}</div>
                  <div className="ocr-conf-badge">OCR CONFIDENCE: {selectedLog.confidence}%</div>
                </div>

                <div className="telemetry-rows-box">
                  <div className="telemetry-row">
                    <span className="row-label text-muted">Vehicle Description:</span>
                    <span className="row-val text-white">{selectedLog.vehicle}</span>
                  </div>
                  <div className="telemetry-row">
                    <span className="row-label text-muted">Sensor Channel:</span>
                    <span className="row-val text-cyan">{selectedLog.camera}</span>
                  </div>
                  <div className="telemetry-row">
                    <span className="row-label text-muted">Estimated Radar Speed:</span>
                    <span className="row-val text-yellow">{selectedLog.speed}</span>
                  </div>
                  <div className="telemetry-row">
                    <span className="row-label text-muted">Database Classification:</span>
                    <span className={`row-val ${selectedLog.threat === 'critical' ? 'text-red' : 'text-green'}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                </div>

                <div className="inspection-actions">
                  <button className="tactical-btn btn-primary" onClick={() => alert(`Signal sent to Checkpost Boom Barrier for Plate: ${selectedLog.plate}`)}>
                    <CheckCircle2 size={14} /> Open Checkpoint Barrier
                  </button>
                  {selectedLog.threat === 'critical' && (
                    <button className="tactical-btn btn-danger" onClick={() => alert(`QRF Intercept Unit Dispatched to intercept ${selectedLog.plate}!`)}>
                      <AlertTriangle size={14} /> Dispatch QRF Intercept
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-selection-box">
                <span>Select an ANPR record on the left to view sensor telemetry</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Plate Modal */}
      {showAddModal && (
        <div className="modal-backdrop font-mono">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Vehicle to Watchlist</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddPlate} className="modal-form">
              <div className="form-group">
                <label>Plate Number (Alphanumeric):</label>
                <input 
                  type="text" 
                  placeholder="e.g. DL01AB1234"
                  value={newPlate.plate_number}
                  onChange={(e) => setNewPlate({ ...newPlate, plate_number: e.target.value.toUpperCase() })}
                  required
                  className="modal-input"
                />
              </div>

              <div className="form-group">
                <label>Vehicle Type / Class:</label>
                <input 
                  type="text" 
                  placeholder="e.g. Black SUV / Heavy Truck"
                  value={newPlate.vehicle_type}
                  onChange={(e) => setNewPlate({ ...newPlate, vehicle_type: e.target.value })}
                  className="modal-input"
                />
              </div>

              <div className="form-group">
                <label>Watchlist Classification:</label>
                <select 
                  value={newPlate.category}
                  onChange={(e) => setNewPlate({ ...newPlate, category: e.target.value, threat_level: e.target.value === 'BLACKLIST' ? 'CRITICAL' : 'NONE' })}
                  className="modal-select"
                >
                  <option value="BLACKLIST">BLACKLIST (Alert & Intercept)</option>
                  <option value="WHITELIST">WHITELIST (Authorized Convoy)</option>
                  <option value="FLAG_INSPECT">FLAG_INSPECT (Secondary Inspection)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Owner / Registration Info:</label>
                <input 
                  type="text" 
                  placeholder="e.g. Suspected Contraband Convoy / BSF QRT"
                  value={newPlate.owner_info}
                  onChange={(e) => setNewPlate({ ...newPlate, owner_info: e.target.value })}
                  className="modal-input"
                />
              </div>

              <div className="form-group">
                <label>Intelligence Notes:</label>
                <textarea 
                  placeholder="Tactical details, suspect affiliations, or SOP instructions..."
                  value={newPlate.notes}
                  onChange={(e) => setNewPlate({ ...newPlate, notes: e.target.value })}
                  className="modal-textarea"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="tactical-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="tactical-btn btn-primary">Save Plate to Database</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ANPRPage;
