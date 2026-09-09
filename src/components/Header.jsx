import React, { useState, useEffect } from 'react';
import { Bell, Sliders, User, ShieldCheck } from 'lucide-react';
import './Header.css';

const Header = () => {
  const [timeStr, setTimeStr] = useState('14:28:09 UTC');

  useEffect(() => {
    const updateZuluTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setTimeStr(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateZuluTime();
    const timer = setInterval(updateZuluTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="top-header">
      {/* Left Operational Cluster Tag */}
      <div className="cluster-status-pill">
        <ShieldCheck size={14} className="cluster-icon" />
        <span className="dot-green status-dot pulse-ring"></span>
        <span className="cluster-text">SECTOR 7 - OPERATIONAL CLUSTER: STABLE</span>
      </div>

      {/* Right Controls & Clock */}
      <div className="header-right-actions">
        <div className="zulu-clock-container">
          <span className="zulu-label">ZULU:</span>
          <span className="zulu-time">{timeStr}</span>
        </div>

        <button className="header-icon-btn" title="Alert Notifications">
          <Bell size={16} />
          <span className="notification-dot"></span>
        </button>

        <button className="header-icon-btn" title="Dashboard Controls">
          <Sliders size={16} />
        </button>

        <button className="header-icon-btn profile-btn" title="User Profile">
          <User size={16} />
        </button>
      </div>
    </header>
  );
};

export default Header;
