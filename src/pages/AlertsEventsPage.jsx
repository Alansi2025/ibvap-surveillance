import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  LayoutGrid, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  Search, 
  Moon, 
  Truck, 
  UserCheck, 
  UserX,
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  Eye,
  Camera,
  Image as ImageIcon,
  Check,
  Download,
  FileText
} from 'lucide-react';
import { API_BASE, fetchAlerts, acknowledgeAlertApi, fetchAlertStatsApi, fetchFrsWatchlistApi, fetchPlateWatchlistApi } from '../services/apiService';
import { exportIncidentsToCSV, exportIntelligenceSummaryJSON } from '../utils/reportExporter';
import './AlertsEventsPage.css';

const AlertsEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ total_incidents: 0, critical_threats: 0, high_threats: 0, warning_alerts: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 4000);
    return () => clearInterval(interval);
  }, [severityFilter]);

  const loadAlerts = async () => {
    try {
      const data = await fetchAlerts(severityFilter);
      if (data) setEvents(data);
      const st = await fetchAlertStatsApi();
      if (st) setStats(st);
    } catch (e) {}
  };

  const handleExportCSV = () => {
    exportIncidentsToCSV(events);
  };

  const handleExportJSON = async () => {
    try {
      const frs = await fetchFrsWatchlistApi();
      const anpr = await fetchPlateWatchlistApi();
      exportIntelligenceSummaryJSON(events, frs, anpr);
    } catch (e) {
      exportIntelligenceSummaryJSON(events);
    }
  };

  const handleAcknowledge = async (eventId) => {
    try {
      await acknowledgeAlertApi(eventId);
      setEvents(events.map(ev => ev.event_id === eventId ? { ...ev, status: 'ACKNOWLEDGED' } : ev));
    } catch (e) {}
  };

  const filteredEvents = events.filter(ev => {
    const matchSearch = (ev.title && ev.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (ev.description && ev.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (ev.camera_id && ev.camera_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (ev.category && ev.category.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchSearch;
  });

  return (
    <div className="alerts-page-container font-mono">
      {/* Top Header */}
      <div className="page-header-row">
        <div className="page-title-group">
          <div className="breadcrumb-text">
            IBVAP / LOGS & AUDIT <span className="breadcrumb-sep">•</span> REAL-TIME INCIDENT AUDIT LEDGER
          </div>
          <div className="page-main-title">
            <h2>Border Threat Alerts & Incident Ledger</h2>
            <span className="streams-badge">
              <strong className="text-red">{stats.critical_threats}</strong> Critical Incursions • <strong className="text-cyan">{events.length}</strong> Events Logged
            </span>
          </div>
        </div>

        <div className="header-actions-group">
          <button className="tactical-btn font-mono" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV Ledger
          </button>
          <button className="tactical-btn font-mono" onClick={handleExportJSON}>
            <FileText size={14} /> Intelligence Briefing (JSON)
          </button>
          <button className="tactical-btn btn-primary font-mono" onClick={loadAlerts}>
            <CheckCircle2 size={14} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* 4 KPI Top Cards Row */}
      <div className="kpi-cards-grid">
        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">TOTAL INCIDENTS</span>
            <span className="kpi-value">{stats.total_incidents || events.length}</span>
            <span className="kpi-sub font-sans">Telemetry window: 24h</span>
          </div>
          <div className="kpi-icon-box box-blue">
            <LayoutGrid size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label text-red">● CRITICAL THREATS</span>
            <span className="kpi-value text-red">{stats.critical_threats || 4}</span>
            <span className="kpi-sub font-sans">Immediate QRF Dispatch</span>
          </div>
          <div className="kpi-icon-box box-red">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label text-yellow">HIGH WARNINGS</span>
            <span className="kpi-value text-yellow">{stats.high_threats || 3}</span>
            <span className="kpi-sub font-sans">Elevated Border Anomaly</span>
          </div>
          <div className="kpi-icon-box box-yellow">
            <AlertCircle size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-label text-green">RESOLVED / ACK</span>
            <span className="kpi-value text-green">
              {events.filter(e => e.status === 'ACKNOWLEDGED').length}
            </span>
            <span className="kpi-sub font-sans">Cleared by Operator</span>
          </div>
          <div className="kpi-icon-box box-green">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Control & Filter Strip Bar */}
      <div className="alerts-control-bar">
        <div className="search-input-box">
          <Search size={14} className="text-muted" />
          <input 
            type="text" 
            placeholder="Search Event Title, Category, or Camera ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="custom-search-input"
          />
        </div>

        <div className="filter-dropdowns-group">
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Severity: All Threat Levels</option>
            <option value="critical">CRITICAL Threats Only</option>
            <option value="high">HIGH Threats Only</option>
            <option value="warning">WARNING Alerts Only</option>
          </select>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="alerts-table-card">
        <table className="tactical-table">
          <thead>
            <tr>
              <th>EVENT ID</th>
              <th>SEVERITY</th>
              <th>CAMERA SOURCE</th>
              <th>TITLE & CATEGORY</th>
              <th>DESCRIPTION</th>
              <th>TARGET CLASS</th>
              <th>CONFIDENCE</th>
              <th>EVIDENCE SNAPSHOT</th>
              <th>STATUS / ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map((ev) => (
              <tr key={ev.event_id || ev.id} className={`threat-row-${(ev.severity || 'high').toLowerCase()}`}>
                <td className="text-cyan font-bold">{ev.event_id || `EVT-${ev.id}`}</td>
                <td>
                  <span className={`pill-badge pill-${ev.severity === 'CRITICAL' ? 'red' : (ev.severity === 'HIGH' ? 'yellow' : 'blue')}`}>
                    {ev.severity}
                  </span>
                </td>
                <td className="text-white">{ev.camera_id}</td>
                <td>
                  <div className="event-title-cell">
                    <span className="title-text text-white font-bold">{ev.title}</span>
                    <span className="category-text text-muted">{ev.category}</span>
                  </div>
                </td>
                <td className="text-muted">{ev.description}</td>
                <td className="text-cyan">{ev.target_class ? ev.target_class.toUpperCase() : 'PERSON'}</td>
                <td className="text-green">{Math.round((ev.confidence || 0.95) * 100)}%</td>
                <td>
                  {ev.snapshot_url ? (
                    <button 
                      className="tactical-btn-sm" 
                      onClick={() => setSelectedSnapshot(ev)}
                    >
                      <ImageIcon size={12} /> View Capture
                    </button>
                  ) : (
                    <span className="text-muted">--</span>
                  )}
                </td>
                <td>
                  {ev.status === 'ACKNOWLEDGED' ? (
                    <span className="text-green flex-row items-center gap-1">
                      <Check size={12} /> Acknowledged
                    </span>
                  ) : (
                    <button 
                      className="tactical-btn-sm btn-primary"
                      onClick={() => handleAcknowledge(ev.event_id)}
                    >
                      Acknowledge
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Incident Visual Evidence: {selectedSnapshot.event_id}</h3>
              <button className="close-btn" onClick={() => setSelectedSnapshot(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="snapshot-img-box">
                <img 
                  src={`${API_BASE.replace('/api', '')}${selectedSnapshot.snapshot_url}`} 
                  alt="Incident Snapshot" 
                  className="evidence-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/cam1.png';
                  }}
                />
              </div>
              <div className="snapshot-meta-box">
                <div><strong>Title:</strong> {selectedSnapshot.title}</div>
                <div><strong>Sensor ID:</strong> {selectedSnapshot.camera_id}</div>
                <div><strong>Category:</strong> {selectedSnapshot.category}</div>
                <div><strong>Severity:</strong> <span className="text-red">{selectedSnapshot.severity}</span></div>
                <div><strong>Confidence:</strong> {Math.round(selectedSnapshot.confidence * 100)}%</div>
                <div><strong>Description:</strong> {selectedSnapshot.description}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsEventsPage;
