import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  User, 
  Target, 
  Scan, 
  ShieldAlert, 
  Shield, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Calendar, 
  ChevronDown, 
  PieChart as PieIcon, 
  Layers, 
  Activity, 
  Tv, 
  CheckCircle2,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import './AnalyticsPage.css';

// Timeline chart mock data (24-Hour Timeline)
const timelineData = [
  { time: '00:00', events: 4, alerts: 0 },
  { time: '04:00', events: 12, alerts: 1 },
  { time: '08:00', events: 18, alerts: 2 },
  { time: '12:00', events: 21, alerts: 3 },
  { time: '16:00', events: 24, alerts: 4 },
  { time: '20:00', events: 38, alerts: 18 },
  { time: '24:00', events: 8, alerts: 1 }
];

// Donut Chart data for Events by Type
const pieData = [
  { name: 'P (Person)', value: 182, color: '#38bdf8' },
  { name: 'V (Vehicle)', value: 131, color: '#22c55e' },
  { name: 'L (Plate)', value: 28, color: '#c084fc' },
  { name: 'A (ANPR)', value: 117, color: '#00f2fe' },
  { name: 'I (Intrusion)', value: 8, color: '#ef4444' },
  { name: 'L (Loitering)', value: 7, color: '#a855f7' },
  { name: 'S (Suspicious)', value: 5, color: '#f97316' },
  { name: 'N (Noise)', value: 23, color: '#64748b' }
];

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState('24h');

  return (
    <div className="analytics-page-container font-sans">
      {/* Top Header & Breadcrumb Bar */}
      <div className="analytics-header-row">
        <div className="analytics-header-left">
          <span className="mono-sub-label font-mono text-cyan">
            SURVEILLANCE INTELLIGENCE • Real-Time Ingestion
          </span>
          <div className="analytics-title-group">
            <h2>Analytics</h2>
            <p className="analytics-sub-text">
              Overview of AI-detected surveillance events and activity.
            </p>
          </div>
        </div>

        <div className="analytics-header-right font-mono">
          <span className="status-pill pill-online">
            <span className="status-dot dot-green pulse-ring"></span> System Online 24ms
          </span>
          <button className="time-select-btn font-mono">
            <Calendar size={13} className="text-cyan" />
            <span>Last 24 Hours</span>
            <ChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* Row 1: Top 4 KPI Summary Cards Grid */}
      <div className="analytics-kpi-grid">
        {/* KPI Card 1: Person Detections */}
        <div className="kpi-analytics-card">
          <div className="kpi-top font-mono">
            <span className="kpi-title">Person Detections</span>
            <div className="kpi-icon-box box-blue">
              <User size={18} />
            </div>
          </div>
          <div className="kpi-num font-mono text-white">182</div>
          <div className="kpi-footer font-mono">
            <span><strong className="text-green font-bold">● Auth: 154</strong></span>
            <span><strong className="text-coral font-bold">● Unauth: 28</strong></span>
            <span className="text-muted">48.4% vol</span>
          </div>
        </div>

        {/* KPI Card 2: Tracking Summary */}
        <div className="kpi-analytics-card">
          <div className="kpi-top font-mono">
            <span className="kpi-title">Tracking Summary</span>
            <div className="kpi-icon-box box-cyan">
              <Target size={18} />
            </div>
          </div>
          <div className="kpi-num-row font-mono">
            <span className="kpi-num text-white">170</span>
            <span className="pill-badge pill-green-xs font-mono">23 Active</span>
          </div>
          <div className="kpi-footer font-mono text-sub">
            <span>Persons: <strong>96</strong></span>
            <span className="dot-divider">•</span>
            <span>Vehicles: <strong>74</strong></span>
          </div>
        </div>

        {/* KPI Card 3: ANPR Summary */}
        <div className="kpi-analytics-card">
          <div className="kpi-top font-mono">
            <span className="kpi-title">ANPR Summary</span>
            <div className="kpi-icon-box box-cyan">
              <Scan size={18} />
            </div>
          </div>
          <div className="kpi-num-row font-mono">
            <span className="kpi-num text-white">131</span>
            <span className="rate-text-cyan font-mono font-bold">89.3% Rate</span>
          </div>
          <div className="kpi-footer font-mono text-sub">
            <span>Recognized: <strong className="text-white">117</strong></span>
            <span className="dot-divider">•</span>
            <span>Unrec: <strong className="text-white">14</strong></span>
          </div>
        </div>

        {/* KPI Card 4: Security Alerts */}
        <div className="kpi-analytics-card">
          <div className="kpi-top font-mono">
            <span className="kpi-title">Security Alerts</span>
            <div className="kpi-icon-box box-red">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="kpi-num font-mono text-white">63</div>
          <div className="kpi-footer font-mono">
            <span className="text-muted">Requires review / ledg.</span>
            <span className="badge-crit-red font-mono">3 CRIT</span>
          </div>
        </div>
      </div>

      {/* Row 2: 2 Detailed Intelligence Cards */}
      <div className="analytics-two-col-grid">
        {/* Card 1: PERSON RECOGNITION */}
        <div className="tactical-card intel-card">
          <div className="intel-card-header font-mono">
            <div className="intel-header-left">
              <User size={15} className="text-cyan" />
              <span className="intel-title font-bold">PERSON RECOGNITION</span>
            </div>
            <span className="pill-badge pill-cyan-sub font-mono">84.6% Recognition Rate</span>
          </div>

          <div className="intel-stats-3col font-mono">
            <div className="intel-stat-cell">
              <span className="stat-label text-muted">Authorized</span>
              <span className="stat-val text-green font-bold">154</span>
              <span className="stat-sub text-muted">Verified ID</span>
            </div>
            <div className="intel-stat-cell border-left-divider">
              <span className="stat-label text-muted">Unauthorized</span>
              <span className="stat-val text-coral font-bold">28</span>
              <span className="stat-sub text-muted">Escalated</span>
            </div>
            <div className="intel-stat-cell border-left-divider">
              <span className="stat-label text-muted">Recognition</span>
              <span className="stat-val text-white font-bold">84.6%</span>
              <span className="stat-sub text-muted">Target &gt;85%</span>
            </div>
          </div>
        </div>

        {/* Card 2: SUSPICIOUS ACTIVITY */}
        <div className="tactical-card intel-card">
          <div className="intel-card-header font-mono">
            <div className="intel-header-left">
              <AlertTriangle size={15} className="text-coral" />
              <span className="intel-title font-bold">SUSPICIOUS ACTIVITY</span>
            </div>
            <span className="pill-badge pill-red-sub font-mono">12 Total Events</span>
          </div>

          <div className="intel-stats-3col font-mono">
            <div className="intel-stat-cell">
              <span className="stat-label text-muted">Suspicious Total</span>
              <span className="stat-val text-white font-bold">12</span>
              <span className="stat-sub text-muted">Anomalous logs</span>
            </div>
            <div className="intel-stat-cell border-left-divider">
              <span className="stat-label text-muted">Loitering</span>
              <span className="stat-val text-white font-bold">7</span>
              <span className="stat-sub text-muted">&gt;180s dwell</span>
            </div>
            <div className="intel-stat-cell border-left-divider">
              <span className="stat-label text-muted">Other Activity</span>
              <span className="stat-val text-white font-bold">5</span>
              <span className="stat-sub text-muted">Boundary probe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Detection Activity (24-Hour Timeline Chart) */}
      <div className="tactical-card chart-card-container">
        <div className="chart-header-row">
          <div className="chart-title-left">
            <div className="chart-title-line">
              <h3 className="font-bold text-white">Detection Activity</h3>
              <span className="pill-badge pill-muted font-mono">24-Hour Timeline</span>
            </div>
            <p className="chart-sub-text">
              Hourly aggregated video event ingestion with security spike telemetry
            </p>
          </div>

          <div className="chart-legend-right font-mono">
            <span className="legend-item">
              <span className="legend-line line-blue"></span> Standard Events
            </span>
            <span className="legend-item">
              <span className="legend-line line-red"></span> Alert Window (20:00-22:00)
            </span>
          </div>
        </div>

        {/* Recharts Timeline Area Chart Viewport */}
        <div className="timeline-chart-wrapper font-mono">
          {/* Spike Badge Overlay at 21:00 */}
          <div className="chart-callout-badge font-mono">
            21:00 • 38 alerts
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={timelineData} margin={{ top: 25, right: 30, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                domain={[0, 40]}
              />
              <Tooltip 
                contentStyle={{ 
                  background: '#090e1a', 
                  border: '1px solid #1e293b', 
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="events" 
                stroke="#38bdf8" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorEvents)" 
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Shaded Alert Window Overlay (20:00 - 22:00) */}
          <div className="alert-window-shade"></div>
        </div>
      </div>

      {/* Row 4: 2 Cards (Events by Type & Alerts by Severity) */}
      <div className="analytics-two-col-grid">
        {/* Card 1: Events by Type (Donut Chart) */}
        <div className="tactical-card chart-card">
          <div className="card-header-simple font-mono">
            <div>
              <h4 className="card-title-text font-bold text-white">Events by Type</h4>
              <p className="card-subtitle-text">AI classification breakdown across streams</p>
            </div>
            <PieIcon size={16} className="text-muted" />
          </div>

          <div className="events-type-body font-mono">
            {/* Donut Canvas Box */}
            <div className="donut-chart-container">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center-text font-mono">
                <span className="donut-big-num text-white font-bold">376</span>
                <span className="donut-sub-label text-muted">TOTAL EVENTS</span>
              </div>
            </div>

            {/* 2-Column Legend Grid */}
            <div className="pie-legend-grid font-mono">
              <div className="pie-legend-item"><span className="legend-dot" style={{ background: '#38bdf8' }}></span> P 48% (182)</div>
              <div className="pie-legend-item"><span className="legend-dot" style={{ background: '#22c55e' }}></span> V 35% (131)</div>
              <div className="pie-legend-item"><span className="legend-dot" style={{ background: '#c084fc' }}></span> L 7.4% (28)</div>
              <div className="pie-legend-item"><span className="legend-dot" style={{ background: '#00f2fe' }}></span> A 31% (117)</div>
              <div className="pie-legend-item"><span className="legend-dot" style={{ background: '#ef4444' }}></span> I 2.1% (8)</div>
              <div className="pie-legend-item"><span className="legend-dot" style={{ background: '#a855f7' }}></span> L 1.9% (7)</div>
              <div className="pie-legend-item"><span className="legend-dot" style={{ background: '#f97316' }}></span> S 1.3% (5)</div>
              <div className="pie-legend-item"><span className="legend-dot" style={{ background: '#64748b' }}></span> N 6% (23)</div>
            </div>
          </div>
        </div>

        {/* Card 2: Alerts by Severity */}
        <div className="tactical-card chart-card">
          <div className="card-header-simple font-mono">
            <div>
              <h4 className="card-title-text font-bold text-white">Alerts by Severity</h4>
              <p className="card-subtitle-text">Security triage priority distribution</p>
            </div>
            <BarChart3 size={16} className="text-muted" />
          </div>

          <div className="severity-bars-list font-mono">
            {/* Item 1 */}
            <div className="severity-item">
              <div className="severity-top-row">
                <div className="severity-label-group">
                  <span className="dot-red status-dot"></span>
                  <span className="severity-name font-bold text-white">Critical Priority</span>
                  <span className="badge-immediate-action font-mono">Immediate Action</span>
                </div>
                <span className="severity-count font-bold text-white">6 Incidents</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-red" style={{ width: '20%' }}></div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="severity-item">
              <div className="severity-top-row">
                <span className="severity-name font-bold text-white">● High Severity</span>
                <span className="severity-count font-bold text-white">14 Incidents</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-purple" style={{ width: '45%' }}></div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="severity-item">
              <div className="severity-top-row">
                <span className="severity-name font-bold text-white">● Warning / Anomalies</span>
                <span className="severity-count font-bold text-white">29 Incidents</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-blue" style={{ width: '75%' }}></div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="severity-item">
              <div className="severity-top-row">
                <span className="severity-name font-bold text-white">● Informational</span>
                <span className="severity-count font-bold text-white">14 Incidents</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-gray" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: 2 Cards (Activity by Type & Most Active Objects) */}
      <div className="analytics-two-col-grid">
        {/* Card 1: Activity by Type */}
        <div className="tactical-card chart-card">
          <div className="card-header-simple font-mono">
            <div>
              <h4 className="card-title-text font-bold text-white">Activity by Type</h4>
              <p className="card-subtitle-text">Specific incident breakdown and anomaly volumes</p>
            </div>
            <Layers size={16} className="text-muted" />
          </div>

          <div className="activity-type-list font-mono">
            {/* Item 1 */}
            <div className="activity-type-item">
              <div className="activity-top-row">
                <span className="activity-name font-bold text-white">● Unauthorized Person</span>
                <span className="activity-val font-bold text-white">28</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-coral" style={{ width: '85%' }}></div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="activity-type-item">
              <div className="activity-top-row">
                <span className="activity-name font-bold text-white">● Loitering</span>
                <span className="activity-val font-bold text-white">7</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-purple-soft" style={{ width: '30%' }}></div>
              </div>
            </div>

            {/* Item 3 */}
            <div className="activity-type-item">
              <div className="activity-top-row">
                <span className="activity-name font-bold text-white">● Intrusion</span>
                <span className="activity-val font-bold text-white">8</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-red" style={{ width: '35%' }}></div>
              </div>
            </div>

            {/* Item 4 */}
            <div className="activity-type-item">
              <div className="activity-top-row">
                <span className="activity-name font-bold text-white">● Suspicious Activity</span>
                <span className="activity-val font-bold text-white">5</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-blue" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Most Active Objects */}
        <div className="tactical-card chart-card">
          <div className="card-header-simple font-mono">
            <div>
              <h4 className="card-title-text font-bold text-white">Most Active Objects</h4>
              <p className="card-subtitle-text">Historical telemetry rankings and aggregated event counts</p>
            </div>
            <span className="pill-badge pill-muted font-mono text-xs">AGGREGATE LOGS</span>
          </div>

          <div className="active-objects-list font-mono">
            {/* Object 1 */}
            <div className="active-object-row">
              <div className="obj-left font-mono">
                <span className="obj-tag-badge badge-red-tag font-mono font-bold">P-102</span>
                <div className="obj-text-group">
                  <span className="obj-title-bold text-white">Unauthorized Person</span>
                  <span className="obj-sub-text text-muted">Perimeter Sector 04 • High Spike</span>
                </div>
              </div>
              <span className="events-count-pill font-mono">18 events</span>
            </div>

            {/* Object 2 */}
            <div className="active-object-row">
              <div className="obj-left font-mono">
                <span className="obj-tag-badge badge-purple-tag font-mono font-bold">P-108</span>
                <div className="obj-text-group">
                  <span className="obj-title-bold text-white">Loitering</span>
                  <span className="obj-sub-text text-muted">Fence Zone East • Dwell Anomaly</span>
                </div>
              </div>
              <span className="events-count-pill font-mono">12 events</span>
            </div>

            {/* Object 3 */}
            <div className="active-object-row">
              <div className="obj-left font-mono">
                <span className="obj-tag-badge badge-dark-tag font-mono font-bold">V-021</span>
                <div className="obj-text-group">
                  <span className="obj-title-bold text-white">Vehicle (HR26AB1234)</span>
                  <span className="obj-sub-text text-muted">North Gate Access • ANPR Tagged</span>
                </div>
              </div>
              <span className="events-count-pill font-mono">10 events</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 6: 2 Cards (Top 5 Active Cameras & Tactical Insights) */}
      <div className="analytics-two-col-grid">
        {/* Card 1: Top 5 Active Cameras */}
        <div className="tactical-card chart-card">
          <div className="card-header-simple font-mono">
            <div>
              <h4 className="card-title-text font-bold text-white">Top 5 Active Cameras</h4>
              <p className="card-subtitle-text">Ranked by continuous detection activity in the selected window</p>
            </div>
            <span className="pill-badge pill-muted font-mono text-xs">TELEMETRY RANKS</span>
          </div>

          <div className="top-cameras-list font-mono">
            {/* Cam 1 */}
            <div className="top-cam-item">
              <div className="top-cam-label-row">
                <div className="cam-code-title">
                  <span className="cam-badge-code code-red font-mono">C-03</span>
                  <span className="cam-name-text text-white font-bold">Fence Zone</span>
                </div>
                <span className="cam-events-val font-bold text-white">85 events</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-coral" style={{ width: '85%' }}></div>
              </div>
            </div>

            {/* Cam 2 */}
            <div className="top-cam-item">
              <div className="top-cam-label-row">
                <div className="cam-code-title">
                  <span className="cam-badge-code code-dark font-mono">C-02</span>
                  <span className="cam-name-text text-white font-bold">Border Road</span>
                </div>
                <span className="cam-events-val font-bold text-white">72 events</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-blue" style={{ width: '72%' }}></div>
              </div>
            </div>

            {/* Cam 3 */}
            <div className="top-cam-item">
              <div className="top-cam-label-row">
                <div className="cam-code-title">
                  <span className="cam-badge-code code-dark font-mono">C-01</span>
                  <span className="cam-name-text text-white font-bold">North Gate</span>
                </div>
                <span className="cam-events-val font-bold text-white">64 events</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-blue" style={{ width: '64%' }}></div>
              </div>
            </div>

            {/* Cam 4 */}
            <div className="top-cam-item">
              <div className="top-cam-label-row">
                <div className="cam-code-title">
                  <span className="cam-badge-code code-dark font-mono">C-04</span>
                  <span className="cam-name-text text-white font-bold">BOP Entry</span>
                </div>
                <span className="cam-events-val font-bold text-white">51 events</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-blue" style={{ width: '51%' }}></div>
              </div>
            </div>

            {/* Cam 5 */}
            <div className="top-cam-item">
              <div className="top-cam-label-row">
                <div className="cam-code-title">
                  <span className="cam-badge-code code-dark font-mono">C-11</span>
                  <span className="cam-name-text text-white font-bold">Sector 04</span>
                </div>
                <span className="cam-events-val font-bold text-white">43 events</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill fill-blue" style={{ width: '43%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Tactical Insights */}
        <div className="tactical-card chart-card">
          <div className="card-header-simple font-mono">
            <div>
              <h4 className="card-title-text font-bold text-white">Tactical Insights</h4>
              <p className="card-subtitle-text">AUTOMATED AGGREGATE SUMMARY</p>
            </div>
            <FileText size={16} className="text-muted" />
          </div>

          <div className="tactical-insights-list font-mono">
            {/* Insight 1 */}
            <div className="insight-box-card">
              <div className="insight-box-title font-mono">
                <Tv size={13} className="text-cyan" />
                <span className="text-cyan font-bold">MOST ACTIVE CAMERA</span>
              </div>
              <div className="insight-main-title font-bold text-white">
                C-03 — Fence Zone
              </div>
              <p className="insight-body-text text-muted">
                85 detections logged across infrared and optical feeds.
              </p>
            </div>

            {/* Insight 2 */}
            <div className="insight-box-card">
              <div className="insight-box-title font-mono">
                <User size={13} className="text-green" />
                <span className="text-green font-bold">PRIMARY DETECTION MODE</span>
              </div>
              <div className="insight-main-title font-bold text-white">
                Person Detection
              </div>
              <p className="insight-body-text text-muted">
                182 classified events representing 48.4% of all activity.
              </p>
            </div>

            {/* Insight 3 */}
            <div className="insight-box-card">
              <div className="insight-box-title font-mono">
                <AlertTriangle size={13} className="text-coral" />
                <span className="text-coral font-bold">PEAK ALERT PERIOD</span>
              </div>
              <div className="insight-main-title font-bold text-coral font-bold">
                20:00 – 22:00
              </div>
              <p className="insight-body-text text-muted">
                Breach alerts and high-probability intrusion spikes concentrated near fence perimeter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
