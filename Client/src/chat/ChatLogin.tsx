import { useState } from 'react';
import API_BASE_URL from '../config/api';

interface ChatLoginProps {
  onLogin: (user: any, token: string) => void;
}

export default function ChatLogin({ onLogin }: ChatLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (res.ok && data.data) {
        onLogin(data.data.admin, data.data.token);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <img
        src="/mcculloch-logo.png"
        alt="McCulloch"
        style={{ width: 80, height: 80, marginBottom: 24, borderRadius: 16 }}
      />
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4, color: '#f5f5f5' }}>
        McCulloch Chat
      </h1>
      <p style={{ fontSize: 14, color: '#999', marginBottom: 32 }}>
        Sign in to manage chats
      </p>

      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="email"
          className="login-input"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoCapitalize="none"
        />
        <input
          type="password"
          className="login-input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
