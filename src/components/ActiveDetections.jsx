import React from 'react';
import { Target, AlertTriangle, ShieldCheck, Eye, Truck, Camera, CheckCircle2 } from 'lucide-react';
import './ActiveDetections.css';

const ActiveDetections = () => {
  const detections = [
    {
      id: 'P-102',
      type: 'UNAUTHORIZED PERSON',
      sub: 'Fence Line (Zone 4)',
      conf: '94%',
      cam: 'Camera C-03',
      badge: 'Breach Alert Active',
      theme: 'red',
      icon: <AlertTriangle size={18} />
    },
    {
      id: 'P-115',
      type: 'Authorized Person',
      sub: 'Role: Security Officer',
      conf: '98%',
      cam: 'Camera C-01',
      badge: 'Verified Credential',
      theme: 'green',
      icon: <ShieldCheck size={18} />
    },
    {
      id: 'P-308',
      type: 'Suspicious Activity',
      sub: 'Activity: Loitering [04:32]',
      conf: '91%',
      cam: 'Camera C-07',
      badge: 'Vector Monitored',
      theme: 'purple',
      icon: <Eye size={18} />
    },
    {
      id: 'V-021',
      type: 'Vehicle',
      sub: 'Plate: WR768R1234',
      conf: '97%',
      cam: 'Camera C-02',
      badge: 'Authorized Patrol',
      theme: 'blue',
      icon: <Truck size={18} />
    }
  ];

  return (
    <div className="tactical-card active-detections-card">
      {/* Card Top Header */}
      <div className="card-header">
        <div className="card-title-group">
          <div className="card-title-row">
            <Target size={18} className="card-title-icon" />
            <h3 className="card-title">Active Detections</h3>
          </div>
          <span className="card-subtitle">Real-time neural tracking & vector classification</span>
        </div>

        <span className="pill-badge pill-cyan">
          4 TRACKED ENTITIES
        </span>
      </div>

      {/* 2x2 Detections Grid */}
      <div className="detections-grid">
        {detections.map((item) => (
          <div key={item.id} className={`detection-item-card theme-${item.theme}`}>
            {/* Top Row inside Item */}
            <div className="item-top-row">
              <div className="item-icon-box">
                {item.icon}
                <span className="item-id">{item.id}</span>
              </div>

              <div className="item-main-details">
                <h4 className="item-title">{item.type}</h4>
                <p className="item-sub">{item.sub}</p>
              </div>

              <div className="item-conf-box">
                <span className="conf-value">{item.conf}</span>
                <span className="conf-label">Conf</span>
              </div>
            </div>

            {/* Bottom Strip inside Item */}
            <div className="item-bottom-strip">
              <span className="item-cam-name">
                <Camera size={12} /> {item.cam}
              </span>
              <span className={`item-status-badge badge-${item.theme}`}>
                {item.theme === 'green' && <CheckCircle2 size={11} />}
                {item.theme === 'red' && <span className="status-dot dot-red pulse-ring"></span>}
                {item.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Card Footer Bar */}
      <div className="card-footer-bar">
        <div className="footer-status-info">
          <span className="dot-green status-dot pulse-ring"></span>
          <span className="footer-status-text">
            <strong>6 Entities Tracked</strong> <span className="text-sep">•</span> <span className="cyan-highlight">AI Vision Pipeline Active</span>
          </span>
        </div>

        <span className="fps-counter-badge">
          Kalman Filter: 60 FPS
        </span>
      </div>
    </div>
  );
};

export default ActiveDetections;
