import React from 'react';
import { Camera, User, Eye, AlertTriangle } from 'lucide-react';
import './DashboardKPIs.css';

const DashboardKPIs = () => {
  return (
    <div className="dashboard-kpi-grid font-mono">
      {/* KPI Card 1: Active Cameras */}
      <div className="kpi-dash-card">
        <div className="kpi-dash-header font-mono">
          <span className="kpi-dash-title font-sans">Active Cameras</span>
          <div className="kpi-dash-icon box-blue">
            <Camera size={18} />
          </div>
        </div>
        <div className="kpi-dash-value-row">
          <span className="kpi-dash-val text-white">24</span>
          <span className="pill-badge pill-green-xs font-mono">● 22 Online</span>
        </div>
        <div className="kpi-dash-footer font-sans">
          <span className="text-green font-bold">91.6%</span> <span className="text-muted">nominal stream availability</span>
        </div>
      </div>

      {/* KPI Card 2: Persons Detected */}
      <div className="kpi-dash-card">
        <div className="kpi-dash-header font-mono">
          <span className="kpi-dash-title font-sans">Persons Detected</span>
          <div className="kpi-dash-icon box-cyan">
            <User size={18} />
          </div>
        </div>
        <div className="kpi-dash-value-row">
          <span className="kpi-dash-val text-white">182</span>
          <span className="text-muted text-xs font-sans">Real-time Scan</span>
        </div>
        <div className="kpi-dash-footer font-mono">
          <span className="badge-auth-box">● Auth: 154</span>
          <span className="badge-unauth-box">● Unauth: 28</span>
        </div>
      </div>

      {/* KPI Card 3: Suspicious Activities */}
      <div className="kpi-dash-card">
        <div className="kpi-dash-header font-mono">
          <span className="kpi-dash-title font-sans">Suspicious Activities</span>
          <div className="kpi-dash-icon box-purple">
            <Eye size={18} />
          </div>
        </div>
        <div className="kpi-dash-value-row">
          <span className="kpi-dash-val text-white">12</span>
          <span className="pill-badge pill-purple-xs font-mono">Active Tracking</span>
        </div>
        <div className="kpi-dash-footer font-sans text-sub">
          <span>● Loitering: <strong>7</strong></span>
          <span className="dot-sep">•</span>
          <span>● Other: <strong>5</strong></span>
        </div>
      </div>

      {/* KPI Card 4: Active Alerts */}
      <div className="kpi-dash-card">
        <div className="kpi-dash-header font-mono">
          <span className="kpi-dash-title font-sans">Active Alerts</span>
          <div className="kpi-dash-icon box-red">
            <AlertTriangle size={18} />
          </div>
        </div>
        <div className="kpi-dash-value-row">
          <span className="kpi-dash-val text-white">3</span>
          <span className="pill-badge pill-red-xs font-mono">2 Critical</span>
        </div>
        <div className="kpi-dash-footer font-sans text-muted">
          <span>Perimeter violation & vector alarms</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardKPIs;
