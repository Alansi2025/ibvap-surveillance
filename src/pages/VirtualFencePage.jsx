import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  Check, 
  AlertTriangle, 
  RotateCcw,
  Camera,
  Shield,
  Layers,
  Plus,
  Play
} from 'lucide-react';
import { 
  API_BASE, 
  fetchCameraZonesApi, 
  createZoneApi, 
  deleteZoneApi, 
  fetchCamerasApi 
} from '../services/apiService';
import './VirtualFencePage.css';

const VirtualFencePage = () => {
  const [cameras, setCameras] = useState([]);
  const [selectedCam, setSelectedCam] = useState('CAM-BOP-01');
  const [drawMode, setDrawMode] = useState('tripwire'); // 'tripwire' or 'polygon'
  const [threatLevel, setThreatLevel] = useState('CRITICAL');
  const [tripwireDirection, setTripwireDirection] = useState('bidirectional');
  const [newFenceName, setNewFenceName] = useState('');
  const [activeDrawPoints, setActiveDrawPoints] = useState([]);

  const [tripwires, setTripwires] = useState([
    { id: 'tw-01', name: 'Fence Tripwire Alpha', start: { x: 60, y: 260 }, end: { x: 580, y: 260 }, direction: 'forward', enabled: true },
  ]);
  const [zones, setZones] = useState([
    { 
      id: 'zone-01', 
      name: 'Red Line Zero Buffer Zone', 
      polygon: [{ x: 100, y: 200 }, { x: 540, y: 200 }, { x: 600, y: 460 }, { x: 40, y: 460 }], 
      severity: 'critical', 
      enabled: true 
    }
  ]);

  const [breachEvents, setBreachEvents] = useState([
    { id: 'BR-1', fence: 'Fence Tripwire Alpha', entity: 'Target #102 (Crawling Infiltrator)', time: '16:17:02', dir: 'Inward Breach', severity: 'critical' },
    { id: 'BR-2', fence: 'Checkpost Approach Road', entity: 'Vehicle DL01AB1234', time: '16:12:10', dir: 'Northbound', severity: 'critical' },
    { id: 'BR-3', fence: 'Red Line Zero Buffer Zone', entity: 'Target #308 (Loitering Subject)', time: '15:40:12', dir: 'Zone Trespass', severity: 'warning' },
  ]);

  const canvasRef = useRef(null);

  // Load cameras & zones on mount and camera change
  useEffect(() => {
    loadCameras();
  }, []);

  useEffect(() => {
    loadZones(selectedCam);
  }, [selectedCam]);

  const loadCameras = async () => {
    try {
      const data = await fetchCamerasApi();
      if (data && data.length > 0) setCameras(data);
    } catch (e) {
      // fallback
    }
  };

  const loadZones = async (camId) => {
    try {
      const data = await fetchCameraZonesApi(camId);
      if (data && data.length > 0) {
        const tw = [];
        const zn = [];
        data.forEach(item => {
          const pts = item.coordinates || [];
          if (item.zone_type === 'tripwire' && pts.length >= 2) {
            tw.push({
              id: String(item.id),
              name: item.name,
              start: { x: pts[0][0], y: pts[0][1] },
              end: { x: pts[1][0], y: pts[1][1] },
              direction: item.direction || 'bidirectional',
              enabled: item.is_active
            });
          } else if (item.zone_type === 'polygon' && pts.length >= 3) {
            zn.push({
              id: String(item.id),
              name: item.name,
              polygon: pts.map(p => ({ x: p[0], y: p[1] })),
              severity: (item.threat_level || 'CRITICAL').toLowerCase(),
              enabled: item.is_active
            });
          }
        });
        if (tw.length > 0) setTripwires(tw);
        if (zn.length > 0) setZones(zn);
      }
    } catch (e) {
      // fallback to current local state
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw Background Grid Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Exclusion Polygon Zones
    zones.forEach(zone => {
      if (zone.polygon.length < 3) return;
      ctx.beginPath();
      ctx.moveTo(zone.polygon[0].x, zone.polygon[0].y);
      for (let i = 1; i < zone.polygon.length; i++) {
        ctx.lineTo(zone.polygon[i].x, zone.polygon[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = zone.severity === 'critical' ? 'rgba(255, 59, 59, 0.25)' : 'rgba(234, 179, 8, 0.22)';
      ctx.fill();
      ctx.strokeStyle = zone.severity === 'critical' ? '#ff3b3b' : '#eab308';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.fillText(`⬡ ${zone.name}`, zone.polygon[0].x + 6, zone.polygon[0].y + 16);
    });

    // Draw Tripwires
    tripwires.forEach(tw => {
      ctx.beginPath();
      ctx.moveTo(tw.start.x, tw.start.y);
      ctx.lineTo(tw.end.x, tw.end.y);
      ctx.strokeStyle = '#00f2fe';
      ctx.lineWidth = 3;
      ctx.stroke();

      // End points
      ctx.fillStyle = '#00f2fe';
      ctx.beginPath();
      ctx.arc(tw.start.x, tw.start.y, 5, 0, Math.PI * 2);
      ctx.arc(tw.end.x, tw.end.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Midpoint tag
      const midX = (tw.start.x + tw.end.x) / 2;
      const midY = (tw.start.y + tw.end.y) / 2;
      ctx.fillStyle = '#ffea00';
      ctx.font = '11px monospace';
      ctx.fillText(`⚡ ${tw.name} [${tw.direction.toUpperCase()}]`, midX - 60, midY - 10);
    });

    // Draw Active Drafting Points
    if (activeDrawPoints.length > 0) {
      ctx.strokeStyle = '#38ef7d';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(activeDrawPoints[0].x, activeDrawPoints[0].y);
      for (let i = 1; i < activeDrawPoints.length; i++) {
        ctx.lineTo(activeDrawPoints[i].x, activeDrawPoints[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      activeDrawPoints.forEach(p => {
        ctx.fillStyle = '#38ef7d';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [tripwires, zones, activeDrawPoints]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleCanvasClick = async (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const newPoints = [...activeDrawPoints, { x, y }];
    setActiveDrawPoints(newPoints);

    if (drawMode === 'tripwire' && newPoints.length === 2) {
      const name = newFenceName.trim() || `Tripwire Line #${tripwires.length + 1}`;
      const payload = {
        camera_id: selectedCam,
        name,
        zone_type: 'tripwire',
        coordinates: [[newPoints[0].x, newPoints[0].y], [newPoints[1].x, newPoints[1].y]],
        threat_level: threatLevel,
        direction: tripwireDirection
      };

      try {
        const saved = await createZoneApi(payload);
        const newTw = {
          id: String(saved.id || Date.now()),
          name,
          start: newPoints[0],
          end: newPoints[1],
          direction: tripwireDirection,
          enabled: true,
        };
        setTripwires([...tripwires, newTw]);
      } catch (err) {
        setTripwires([...tripwires, { id: `tw-${Date.now()}`, name, start: newPoints[0], end: newPoints[1], direction: tripwireDirection, enabled: true }]);
      }
      setActiveDrawPoints([]);
      setNewFenceName('');
    }
  };

  const finishPolygonZone = async () => {
    if (activeDrawPoints.length >= 3) {
      const name = newFenceName.trim() || `Polygon Zone #${zones.length + 1}`;
      const coords = activeDrawPoints.map(p => [p.x, p.y]);
      const payload = {
        camera_id: selectedCam,
        name,
        zone_type: 'polygon',
        coordinates: coords,
        threat_level: threatLevel,
        direction: 'bidirectional'
      };

      try {
        const saved = await createZoneApi(payload);
        const newZone = {
          id: String(saved.id || Date.now()),
          name,
          polygon: activeDrawPoints,
          severity: threatLevel.toLowerCase(),
          enabled: true,
        };
        setZones([...zones, newZone]);
      } catch (err) {
        setZones([...zones, { id: `zn-${Date.now()}`, name, polygon: activeDrawPoints, severity: threatLevel.toLowerCase(), enabled: true }]);
      }
      setActiveDrawPoints([]);
      setNewFenceName('');
    }
  };

  const handleDeleteTripwire = async (id) => {
    try {
      await deleteZoneApi(id);
    } catch (e) {}
    setTripwires(tripwires.filter(t => t.id !== id));
  };

  const handleDeleteZone = async (id) => {
    try {
      await deleteZoneApi(id);
    } catch (e) {}
    setZones(zones.filter(z => z.id !== id));
  };

  const triggerTestBreach = () => {
    const testBreach = {
      id: `BR-${Date.now() % 1000}`,
      fence: tripwires[0]?.name || 'Sector Tripwire Alpha',
      entity: 'SIMULATED INTRUDER (Crawling Stance)',
      time: new Date().toLocaleTimeString(),
      dir: 'Southward Incursion',
      severity: 'critical'
    };
    setBreachEvents([testBreach, ...breachEvents]);
  };

  return (
    <div className="vfence-page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div className="page-title-group">
          <div className="breadcrumb-text font-mono">
            IBVAP / GEO-FENCING <span className="breadcrumb-sep">•</span> VIRTUAL FENCE & TRIPWIRE STUDIO
          </div>
          <div className="page-main-title">
            <h2>Virtual Fence & Geofence Intrusion Studio</h2>
            <span className="streams-badge font-mono">
              <strong className="text-cyan">{tripwires.length}</strong> Tripwires & <strong className="text-red">{zones.length}</strong> Polygon Zones Active in SQLite
            </span>
          </div>
        </div>

        <div className="header-actions-group">
          <button className="tactical-btn btn-danger font-mono" onClick={triggerTestBreach}>
            <AlertTriangle size={14} /> Simulate Breach Trigger
          </button>
          <button className="tactical-btn font-mono" onClick={() => setActiveDrawPoints([])}>
            <RotateCcw size={14} /> Clear Active Drafting
          </button>
        </div>
      </div>

      {/* Main 2-Column Work Area */}
      <div className="vfence-layout-grid">
        {/* Left Column: Live Video Canvas Editor */}
        <div className="canvas-column">
          <div className="canvas-header-bar font-mono">
            <div className="canvas-title-group">
              <Camera size={14} className="text-cyan" />
              <span>Camera Feed Backdrop:</span>
              <select 
                value={selectedCam} 
                onChange={(e) => setSelectedCam(e.target.value)}
                className="cam-select-input"
              >
                {cameras.map(c => (
                  <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                ))}
              </select>
            </div>
            <span className="pill-badge pill-green status-pill-sm">
              <span className="status-dot dot-green pulse-ring"></span> INTERACTIVE CANVAS ACTIVE
            </span>
          </div>

          <div className="canvas-wrapper">
            {/* Live Camera Backdrop Stream */}
            <img 
              src={`${API_BASE}/cameras/${selectedCam}/stream`} 
              alt="Camera Backdrop" 
              className="canvas-bg-stream"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/cam1.png';
              }}
            />

            {/* Interactive Vector Canvas */}
            <canvas 
              ref={canvasRef}
              width={640}
              height={480}
              className="drawing-canvas"
              onClick={handleCanvasClick}
            />

            <div className="canvas-hud-instructions font-mono">
              {drawMode === 'tripwire' 
                ? 'CLICK 2 POINTS ON CANVAS TO PLACE TRIPWIRE LINE' 
                : 'CLICK POINTS ON CANVAS, THEN HIT "SAVE POLYGON ZONE"'}
            </div>
          </div>

          {/* Drawing Tool Toolbar */}
          <div className="drawing-toolbar font-mono">
            <div className="tool-btn-group">
              <button 
                className={`tactical-btn ${drawMode === 'tripwire' ? 'btn-primary' : ''}`}
                onClick={() => { setDrawMode('tripwire'); setActiveDrawPoints([]); }}
              >
                ⚡ Draw Tripwire Line (2-Point)
              </button>
              <button 
                className={`tactical-btn ${drawMode === 'polygon' ? 'btn-primary' : ''}`}
                onClick={() => { setDrawMode('polygon'); setActiveDrawPoints([]); }}
              >
                ⬡ Draw Polygon Zone (Multi-Point)
              </button>
            </div>

            <div className="tool-inputs-group">
              <input 
                type="text" 
                placeholder="Zone / Tripwire Name..."
                value={newFenceName}
                onChange={(e) => setNewFenceName(e.target.value)}
                className="name-input"
              />

              <select 
                value={threatLevel} 
                onChange={(e) => setThreatLevel(e.target.value)}
                className="threat-select"
              >
                <option value="CRITICAL">CRITICAL (Red Alarm)</option>
                <option value="HIGH">HIGH (Amber Alert)</option>
                <option value="WARNING">WARNING (Yellow Alert)</option>
              </select>

              {drawMode === 'tripwire' && (
                <select 
                  value={tripwireDirection} 
                  onChange={(e) => setTripwireDirection(e.target.value)}
                  className="threat-select"
                >
                  <option value="bidirectional">Both Directions</option>
                  <option value="forward">Forward Only</option>
                  <option value="backward">Backward Only</option>
                </select>
              )}

              {drawMode === 'polygon' && activeDrawPoints.length >= 3 && (
                <button className="tactical-btn btn-success" onClick={finishPolygonZone}>
                  <Check size={14} /> Save Polygon Zone ({activeDrawPoints.length} pts)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Rules & Breach Logs */}
        <div className="rules-column">
          {/* Active Geofence Rules Card */}
          <div className="panel-card">
            <div className="panel-header font-mono">
              <Shield size={14} className="text-cyan" />
              <span>Configured Perimeter Vectors ({tripwires.length + zones.length})</span>
            </div>
            <div className="panel-body list-body">
              {tripwires.map(tw => (
                <div key={tw.id} className="rule-item font-mono">
                  <div className="rule-info">
                    <span className="rule-name text-cyan">⚡ {tw.name}</span>
                    <span className="rule-sub text-muted">Direction: {tw.direction} • Enabled</span>
                  </div>
                  <button className="delete-btn" onClick={() => handleDeleteTripwire(tw.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              {zones.map(zn => (
                <div key={zn.id} className="rule-item font-mono">
                  <div className="rule-info">
                    <span className="rule-name text-red">⬡ {zn.name}</span>
                    <span className="rule-sub text-muted">Exclusion Area • {zn.severity.toUpperCase()}</span>
                  </div>
                  <button className="delete-btn" onClick={() => handleDeleteZone(zn.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Geofence Breach Events */}
          <div className="panel-card">
            <div className="panel-header font-mono">
              <AlertTriangle size={14} className="text-red" />
              <span>Perimeter Breach Audit Log</span>
            </div>
            <div className="panel-body breach-log-body font-mono">
              {breachEvents.map(evt => (
                <div key={evt.id} className={`breach-card severity-${evt.severity}`}>
                  <div className="breach-card-top">
                    <span className="breach-fence-name">{evt.fence}</span>
                    <span className="breach-time">{evt.time}</span>
                  </div>
                  <div className="breach-entity-name text-white">{evt.entity}</div>
                  <div className="breach-dir-tag text-muted">{evt.dir}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualFencePage;
