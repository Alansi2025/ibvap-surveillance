import { useState, useEffect } from 'react';
import { soundController } from '../utils/audioAlert';

/**
 * Custom hook connecting to IBVAP WebSocket telemetry feed & real-time alarm broadcasting
 */
export const useWebSocket = (url = 'ws://localhost:8000/ws/live') => {
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(14);
  const [lastPing, setLastPing] = useState(3);
  const [trackedCount, setTrackedCount] = useState(4);
  const [defcon, setDefcon] = useState(4);
  const [activeCameras, setActiveCameras] = useState(5);
  const [alerts, setAlerts] = useState([
    { id: 'ALT-1001', type: 'Virtual Fence Breach', camera: 'CAM-BOP-01', text: 'Perimeter fence tripwire crossed in Sector Alpha (Crawling Infiltrator)', time: '16:17:02', level: 'crit', acknowledged: false },
    { id: 'ALT-1002', type: 'Suspicious Loitering', camera: 'CAM-OUT-03', text: 'Unidentified subject loitering at Zero Line (>8.0s)', time: '16:15:44', level: 'warn', acknowledged: false },
    { id: 'ALT-1003', type: 'ANPR Blacklist Hit', camera: 'CAM-CHK-02', text: 'Vehicle DL01AB1234 flagged: Suspected Contraband Convoy', time: '16:12:10', level: 'crit', acknowledged: true },
    { id: 'ALT-1004', type: 'Weapon Visual Match', camera: 'CAM-WPN-04', text: 'Armed infiltrator carrying tactical knife visual confirmed', time: '16:08:30', level: 'crit', acknowledged: false },
  ]);

  useEffect(() => {
    let socket = null;
    let reconnectTimeout = null;

    const connect = () => {
      try {
        socket = new WebSocket(url);

        socket.onopen = () => {
          setIsConnected(true);
        };

        socket.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 5000);
        };

        socket.onerror = () => {
          setIsConnected(false);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY_UPDATE') {
              if (data.latency) setLatency(data.latency);
              if (data.tracked_count !== undefined) setTrackedCount(data.tracked_count);
              if (data.defcon !== undefined) setDefcon(data.defcon);
              if (data.active_cameras !== undefined) setActiveCameras(data.active_cameras);
              if (data.recent_alerts && data.recent_alerts.length > 0) {
                setAlerts(data.recent_alerts.map(a => ({
                  id: a.id || a.event_id,
                  type: a.type || a.title || a.category,
                  camera: a.camera_id || a.camera_name || 'CAM',
                  text: a.message || a.description,
                  time: a.timestamp ? (new Date(a.timestamp).toLocaleTimeString()) : 'Now',
                  level: (a.severity === 'CRITICAL' || a.severity === 'critical') ? 'crit' : ((a.severity === 'HIGH' || a.severity === 'warning' || a.severity === 'WARNING') ? 'warn' : 'info'),
                  acknowledged: a.acknowledged || (a.status === 'ACKNOWLEDGED') || false,
                })));
              }
            } else if (data.type === 'ALERT_EVENT' || data.event_id) {
              // Real-time critical alert broadcast
              const isCrit = data.severity === 'CRITICAL';
              if (isCrit) {
                soundController.playBreachAlarm();
              } else {
                soundController.playWarningChime();
              }

              const newAlertItem = {
                id: data.event_id || `ALT-${Date.now() % 10000}`,
                type: data.title || data.category,
                camera: data.camera_id || 'CAM-01',
                text: data.description,
                time: new Date().toLocaleTimeString(),
                level: isCrit ? 'crit' : 'warn',
                acknowledged: false
              };
              setAlerts(prev => [newAlertItem, ...prev.slice(0, 19)]);
            }
          } catch (err) {
            // fallback
          }
        };
      } catch (e) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    const interval = setInterval(() => {
      setLastPing((prev) => (prev >= 5 ? 1 : prev + 1));
      if (!isConnected) {
        setLatency(12 + Math.floor(Math.random() * 5));
      }
    }, 2500);

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      clearInterval(interval);
    };
  }, [url]);

  return {
    isConnected,
    latency,
    lastPing,
    trackedCount,
    defcon,
    activeCameras,
    alerts,
    setAlerts,
  };
};
