import React from 'react';
import { ShieldAlert, Bell, ChevronRight, Camera, User, Eye, Truck } from 'lucide-react';
import './RightAlertsPanel.css';

const RightAlertsPanel = () => {
  return (
    <div className="tactical-card right-alerts-panel">
      {/* Panel Header */}
      <div className="recent-alerts-header font-mono">
        <div className="header-title-left">
          <Bell size={18} className="text-coral" />
          <h4 className="panel-title-text font-bold text-white">Recent Alerts</h4>
        </div>
        <span className="pill-badge pill-red-badge font-mono font-bold">3 ACTIVE</span>
      </div>

      {/* Alerts Cards List */}
      <div className="recent-alerts-list font-mono">
        {/* Card 1: Critical Alert */}
        <div className="recent-alert-card card-critical font-mono">
          <div className="alert-card-top">
            <span className="badge-level-crit font-mono">CRITICAL</span>
            <span className="alert-utc-time font-mono text-muted">20:41 UTC</span>
          </div>

          <div className="alert-card-main">
            <div className="alert-title-row">
              <span className="status-dot dot-red pulse-ring"></span>
              <h5 className="alert-main-title font-bold text-white">Unauthorized Person</h5>
            </div>
            <p className="alert-sub-desc text-muted">
              Unregistered identity detected in perimeter boundary...
            </p>
          </div>

          <div className="alert-card-bottom font-mono">
            <div className="alert-meta-left">
              <span className="cam-meta-tag"><Camera size={12} /> Camera C-03</span>
              <span className="person-id-tag tag-coral">Person ID: P-102</span>
            </div>
            <span className="alert-ago-time text-muted font-bold">Just now</span>
          </div>
        </div>

        {/* Card 2: Warning Alert */}
        <div className="recent-alert-card card-warning font-mono">
          <div className="alert-card-top">
            <span className="badge-level-warn font-mono">WARNING</span>
            <span className="alert-utc-time font-mono text-muted">20:36 UTC</span>
          </div>

          <div className="alert-card-main">
            <div className="alert-title-row">
              <span className="status-dot dot-purple pulse-ring"></span>
              <h5 className="alert-main-title font-bold text-white">Suspicious Activity</h5>
            </div>
            <p className="alert-sub-desc text-muted">
              Activity: Loitering | Duration: 04:32 | Fence Zone East...
            </p>
          </div>

          <div className="alert-card-bottom font-mono">
            <div className="alert-meta-left">
              <span className="cam-meta-tag"><Camera size={12} /> Camera C-07</span>
              <span className="person-id-tag tag-purple">Person ID: P-108</span>
            </div>
            <span className="alert-ago-time text-muted font-bold">5 mins ago</span>
          </div>
        </div>

        {/* Card 3: Info Alert */}
        <div className="recent-alert-card card-info font-mono">
          <div className="alert-card-top">
            <span className="badge-level-info font-mono">INFO</span>
            <span className="alert-utc-time font-mono text-muted">20:28 UTC</span>
          </div>

          <div className="alert-card-main">
            <div className="alert-title-row">
              <span className="status-dot dot-cyan pulse-ring"></span>
              <h5 className="alert-main-title font-bold text-white">Vehicle Detection</h5>
            </div>
            <p className="alert-sub-desc text-muted">
              ANPR Plate HR26AB1234 tagged on North Gate Access...
            </p>
          </div>

          <div className="alert-card-bottom font-mono">
            <div className="alert-meta-left">
              <span className="cam-meta-tag"><Camera size={12} /> Camera C-02</span>
              <span className="person-id-tag tag-cyan">Vehicle ID: V-021</span>
            </div>
            <span className="alert-ago-time text-muted font-bold">12 mins ago</span>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="panel-bottom-action">
        <button className="btn-tactical btn-view-all font-mono">
          <span>View All Alerts (28)</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default RightAlertsPanel;
