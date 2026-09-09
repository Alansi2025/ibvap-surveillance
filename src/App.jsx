import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardHeader from './components/DashboardHeader';
import SurveillanceMap from './components/SurveillanceMap';
import ActiveDetections from './components/ActiveDetections';
import DetectionActivity from './components/DetectionActivity';
import CameraHealth from './components/CameraHealth';
import RightAlertsPanel from './components/RightAlertsPanel';
import DashboardKPIs from './components/DashboardKPIs';

// Modules / Pages
import LiveSurveillancePage from './pages/LiveSurveillancePage';
import ANPRPage from './pages/ANPRPage';
import FRSPage from './pages/FRSPage';
import VirtualFencePage from './pages/VirtualFencePage';
import AlertsEventsPage from './pages/AlertsEventsPage';
import CamerasPage from './pages/CamerasPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

import { useWebSocket } from './services/useWebSocket';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { isConnected, latency, lastPing, alerts } = useWebSocket();

  return (
    <div className="app-container">
      {/* Left Sidebar */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="main-layout">
        {/* Top Header */}
        <Header />

        {/* Inner Content Wrapper */}
        <div className="content-wrapper">
          {activeTab === 'surveillance' && <LiveSurveillancePage />}
          
          {activeTab === 'anpr' && <ANPRPage />}

          {activeTab === 'frs' && <FRSPage />}

          {activeTab === 'virtual-fence' && <VirtualFencePage />}

          {activeTab === 'alerts' && <AlertsEventsPage />}

          {activeTab === 'cameras' && <CamerasPage />}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'settings' && <SettingsPage />}

          {activeTab === 'dashboard' && (
            <>
              {/* Dashboard Title & Meta Row */}
              <DashboardHeader />

              {/* Top 4 KPI Summary Cards */}
              <DashboardKPIs />

              {/* Upper / Middle 2-Column Dashboard Grid */}
              <div className="dashboard-grid">
                {/* Left Main Column */}
                <div className="left-column">
                  <SurveillanceMap lastPing={lastPing} latency={latency} />
                  <ActiveDetections />
                </div>

                {/* Right Column Feed Panel */}
                <div className="right-column">
                  <RightAlertsPanel alerts={alerts} />
                </div>
              </div>

              {/* Bottom Row Grid */}
              <div className="bottom-row-grid">
                <DetectionActivity />
                <CameraHealth />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
