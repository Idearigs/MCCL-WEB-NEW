import { useState } from 'react';
import API_BASE_URL from '../config/api';
import { getDeviceId } from './authHelper';

interface ChatLoginProps {
  onLogin: (user: any, token: string, refreshToken?: string, deviceId?: string) => void;
}

export default function ChatLogin({ onLogin }: ChatLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          device_id: getDeviceId() || undefined
        }),
      });
      const data = await res.json();

      if (res.ok && data.data) {
        onLogin(data.data.admin, data.data.token, data.data.refresh_token, data.data.device_id);
      } else {
        setError(data.message || 'Invalid credentials');
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);
      }
    } catch {
      setError('Connection failed. Please try again.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo-wrap">
          <img
            src="/mcculloch-logo.png"
            alt="McCulloch"
            className="login-logo"
          />
        </div>
        <h1 className="login-title">McCulloch Chat</h1>
        <p className="login-subtitle">Sign in to manage chats</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-wrap">
            <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7l-10 6L2 7" />
            </svg>
            <input
              type="email"
              className="login-input has-icon"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
            />
          </div>
          <div className="login-input-wrap">
            <svg className="login-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <input
              type="password"
              className="login-input has-icon"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className={`login-error ${shakeError ? 'shake' : ''}`}>{error}</p>
          )}
          <button type="submit" className="login-btn gold-gradient" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
          </button>
        </form>

        <p className="login-footer">McCulloch Jewelry</p>
      </div>
    </div>
  );
}
