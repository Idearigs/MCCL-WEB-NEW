import { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import { fetchWithAuth } from './authHelper';
import DeviceLinkScreen from './DeviceLinkScreen';

interface Device {
  id: string;
  device_name: string;
  ip_address: string;
  last_active_at: string;
  is_linked: boolean;
  is_current: boolean;
  created_at: string;
}

interface DeviceManagerProps {
  onBack: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DeviceManager({ onBack }: DeviceManagerProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [maxDevices, setMaxDevices] = useState(3);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [showLinkScreen, setShowLinkScreen] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/admin/devices`);
      const data = await res.json();
      if (data.success) {
        setDevices(data.data.devices);
        setMaxDevices(data.data.max_devices);
      }
    } catch (err) {
      console.error('Failed to fetch devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (sessionId: string) => {
    if (removing) return;
    setRemoving(sessionId);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/admin/devices/${sessionId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setDevices(prev => prev.filter(d => d.id !== sessionId));
      }
    } catch (err) {
      console.error('Failed to remove device:', err);
    } finally {
      setRemoving(null);
    }
  };

  if (showLinkScreen) {
    return <DeviceLinkScreen onBack={() => { setShowLinkScreen(false); fetchDevices(); }} />;
  }

  return (
    <div className="chat-app slide-in">
      {/* Header */}
      <div className="conv-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>Linked Devices</div>
          <div style={{ fontSize: 12, color: 'var(--chat-text-muted)', marginTop: 2 }}>
            {devices.length} of {maxDevices} devices
          </div>
        </div>
      </div>

      <div className="device-list-scroll">
        {loading ? (
          <div className="empty-state">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Device count bar */}
            <div className="device-count-bar">
              <div className="device-count-track">
                {Array.from({ length: maxDevices }).map((_, i) => (
                  <div
                    key={i}
                    className={`device-count-dot ${i < devices.length ? 'filled' : ''}`}
                  />
                ))}
              </div>
            </div>

            {/* Device list */}
            {devices.map(device => (
              <div key={device.id} className="device-card">
                <div className="device-icon-wrap">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {device.device_name.includes('iPhone') || device.device_name.includes('Android') ? (
                      <>
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </>
                    ) : device.device_name.includes('iPad') ? (
                      <>
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                        <line x1="12" y1="18" x2="12.01" y2="18" />
                      </>
                    ) : (
                      <>
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </>
                    )}
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{device.device_name}</span>
                    {device.is_current && (
                      <span className="device-current-badge">This device</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--chat-text-muted)', marginTop: 3 }}>
                    Last active {timeAgo(device.last_active_at)}
                  </div>
                </div>
                {!device.is_current && (
                  <button
                    className="device-remove-btn"
                    onClick={() => handleRemove(device.id)}
                    disabled={removing === device.id}
                  >
                    {removing === device.id ? (
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            ))}

            {/* Link new device button */}
            {devices.length < maxDevices && (
              <button
                className="device-link-btn"
                onClick={() => setShowLinkScreen(true)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Link a new device
              </button>
            )}

            <p className="device-info-text">
              You can link up to {maxDevices} devices at a time. New devices can be linked by scanning a QR code or entering a pairing code.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
