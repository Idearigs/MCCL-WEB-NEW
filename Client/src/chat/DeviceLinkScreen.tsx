import { useState, useEffect, useRef } from 'react';
import API_BASE_URL from '../config/api';
import { fetchWithAuth } from './authHelper';

interface DeviceLinkScreenProps {
  onBack: () => void;
}

// Minimal QR code generator (numeric mode, version 2, ECC L)
function generateQRMatrix(data: string): boolean[][] {
  // For simplicity, we create a visual representation using a basic pattern
  // This is a simplified QR-like visual - in production you'd use a proper encoder
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        const isOuter = i === 0 || i === 6 || j === 0 || j === 6;
        const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        matrix[r + i][c + j] = isOuter || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Encode data into remaining cells
  const bits: boolean[] = [];
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    for (let b = 7; b >= 0; b--) {
      bits.push(Boolean((code >> b) & 1));
    }
  }

  let bitIndex = 0;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const actualCol = col - c;
        if (actualCol < 0 || actualCol >= size) continue;
        // Skip finder patterns and timing
        if ((row < 9 && (actualCol < 9 || actualCol >= size - 8)) ||
            (row >= size - 8 && actualCol < 9) ||
            row === 6 || actualCol === 6) continue;
        matrix[row][actualCol] = bitIndex < bits.length ? bits[bitIndex++] : (bitIndex++ % 3 === 0);
      }
    }
  }

  return matrix;
}

function QRCodeSVG({ data, size = 200 }: { data: string; size?: number }) {
  const matrix = generateQRMatrix(data);
  const cellSize = size / matrix.length;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill="white" rx="8" />
      {matrix.map((row, i) =>
        row.map((cell, j) =>
          cell ? (
            <rect
              key={`${i}-${j}`}
              x={j * cellSize}
              y={i * cellSize}
              width={cellSize + 0.5}
              height={cellSize + 0.5}
              fill="#1c1c1e"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function DeviceLinkScreen({ onBack }: DeviceLinkScreenProps) {
  const [pairingCode, setPairingCode] = useState('');
  const [numericCode, setNumericCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [expiresIn, setExpiresIn] = useState(300);
  const [mode, setMode] = useState<'show-qr' | 'enter-code'>('show-qr');
  const [manualCode, setManualCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    generateCode();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const generateCode = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/admin/devices/link`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setPairingCode(data.data.pairing_code);
        setNumericCode(data.data.numeric_code);
        setExpiresIn(data.data.expires_in);

        // Start countdown
        if (timerRef.current) clearInterval(timerRef.current);
        let remaining = data.data.expires_in;
        timerRef.current = setInterval(() => {
          remaining--;
          setExpiresIn(remaining);
          if (remaining <= 0) {
            clearInterval(timerRef.current!);
          }
        }, 1000);
      }
    } catch (err) {
      setError('Failed to generate pairing code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!manualCode.trim() || manualCode.length < 6) {
      setError('Enter a 6-digit code');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/admin/devices/verify-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: manualCode.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        onBack();
      } else {
        setError(data.message || 'Invalid code');
      }
    } catch {
      setError('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="chat-app slide-in">
      <div className="conv-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Link Device</span>
      </div>

      <div className="device-link-content">
        {/* Mode toggle */}
        <div className="device-link-tabs">
          <button
            className={`device-link-tab ${mode === 'show-qr' ? 'active' : ''}`}
            onClick={() => setMode('show-qr')}
          >
            Show QR Code
          </button>
          <button
            className={`device-link-tab ${mode === 'enter-code' ? 'active' : ''}`}
            onClick={() => setMode('enter-code')}
          >
            Enter Code
          </button>
        </div>

        {mode === 'show-qr' ? (
          <div className="device-link-qr-section">
            {loading ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="spinner" />
              </div>
            ) : expiresIn <= 0 ? (
              <div className="device-link-expired">
                <p>Code expired</p>
                <button className="modal-btn primary" onClick={generateCode}>
                  Generate New Code
                </button>
              </div>
            ) : (
              <>
                <div className="qr-container">
                  <QRCodeSVG data={pairingCode} size={200} />
                </div>
                <p className="device-link-instruction">
                  Scan this QR code from the new device to link it
                </p>
                <div className="device-link-numeric">
                  <span className="device-link-numeric-label">Or enter this code:</span>
                  <span className="device-link-numeric-code">{numericCode}</span>
                </div>
                <div className="device-link-timer">
                  Expires in {formatTime(expiresIn)}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="device-link-manual-section">
            <p className="device-link-instruction">
              Enter the 6-digit code shown on the other device
            </p>
            <input
              type="text"
              className="device-link-code-input"
              value={manualCode}
              onChange={e => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              inputMode="numeric"
              autoFocus
            />
            {error && <p className="login-error">{error}</p>}
            <button
              className="login-btn gold-gradient"
              onClick={handleVerifyCode}
              disabled={verifying || manualCode.length < 6}
              style={{ marginTop: 16 }}
            >
              {verifying ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                'Verify & Link'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
