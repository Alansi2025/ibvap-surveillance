import React from 'react';
import { 
  LayoutDashboard, 
  Video, 
  ShieldAlert, 
  Camera, 
  BarChart3, 
  Settings, 
  UserCheck, 
  LogOut,
  Radio,
  Car,
  ScanFace,
  Spline
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeTab = 'dashboard', onSelectTab }) => {
  return (
    <aside className="sidebar-container">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">
          <Radio className="brand-logo-icon" size={22} />
        </div>
        <div className="brand-text-group">
          <h1 className="brand-title">IBVAP</h1>
          <span className="brand-subtitle">BORDER VIDEO ANALYTICS</span>
        </div>
      </div>

      {/* Navigation Group Header */}
      <div className="nav-section-header">
        <span className="nav-section-title">COMMAND MODULES</span>
        <span className="defcon-pill">
          <span className="dot-green status-dot"></span> DEFCON 4
        </span>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('dashboard')}
        >
          <LayoutDashboard size={18} className="nav-icon" />
          <span>Dashboard</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'surveillance' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('surveillance')}
        >
          <Video size={18} className="nav-icon" />
          <span>Live Surveillance</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'anpr' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('anpr')}
        >
          <Car size={18} className="nav-icon" />
          <span>ANPR & Vehicles</span>
          <span className="nav-feature-badge">OCR</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'frs' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('frs')}
        >
          <ScanFace size={18} className="nav-icon" />
          <span>FRS & Watchlist</span>
          <span className="nav-feature-badge">AI</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'virtual-fence' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('virtual-fence')}
        >
          <Spline size={18} className="nav-icon" />
          <span>Virtual Fence</span>
          <span className="nav-feature-badge">GEO</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('alerts')}
        >
          <ShieldAlert size={18} className="nav-icon" />
          <span>Alerts & Events</span>
          <span className="nav-crit-badge">CRIT</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'cameras' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('cameras')}
        >
          <Camera size={18} className="nav-icon" />
          <span>CCTV Cameras</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('analytics')}
        >
          <BarChart3 size={18} className="nav-icon" />
          <span>Analytics & Heatmaps</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('settings')}
        >
          <Settings size={18} className="nav-icon" />
          <span>C2 & AI Settings</span>
        </button>
      </nav>

      {/* Bottom Profile Footer */}
      <div className="sidebar-footer">
        <div className="agent-card">
          <div className="agent-avatar">
            <UserCheck size={18} />
          </div>
          <div className="agent-info">
            <div className="agent-name">Cmdr. V. Rathore</div>
            <div className="agent-role">BORDER C2 • L4</div>
          </div>
          <span className="agent-status-badge">ACTIVE</span>
        </div>

        <button className="signout-btn">
          <LogOut size={16} />
          <span>Secure Signout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
