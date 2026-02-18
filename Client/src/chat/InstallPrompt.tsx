import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

// Hook to capture the install prompt globally
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
  });
}

export function canInstall(): boolean {
  return !isStandalone() && (!!globalDeferredPrompt || isIOS());
}

interface InstallPageProps {
  onBack: () => void;
}

export default function InstallPage({ onBack }: InstallPageProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const ios = isIOS();
  const standalone = isStandalone();

  useEffect(() => {
    if (globalDeferredPrompt) {
      setDeferredPrompt(globalDeferredPrompt);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setInstalled(true);
      globalDeferredPrompt = null;
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        globalDeferredPrompt = null;
      }
    } catch {
      // user cancelled or error
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="chat-app slide-in">
      {/* Header */}
      <div className="conv-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span style={{ fontWeight: 600, fontSize: 16 }}>Install App</span>
      </div>

      <div className="install-page-content">
        {/* App Icon & Title */}
        <div className="install-page-hero">
          <div className="install-page-icon">
            <img src="/mcculloch-logo.png" alt="McCulloch Chat" />
          </div>
          <h1 className="install-page-title">McCulloch Chat</h1>
          <p className="install-page-subtitle">Install the app for the best experience</p>
        </div>

        {/* Already installed state */}
        {standalone || installed ? (
          <div className="install-page-status">
            <div className="install-page-check">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <p className="install-page-status-text">App is already installed!</p>
            <p className="install-page-status-sub">You're running McCulloch Chat as an app.</p>
          </div>
        ) : (
          <>
            {/* Features list */}
            <div className="install-page-features">
              <div className="install-feature-item">
                <div className="install-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--chat-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 01-3.46 0" />
                  </svg>
                </div>
                <div className="install-feature-text">
                  <strong>Push Notifications</strong>
                  <span>Get notified of new messages instantly</span>
                </div>
              </div>
              <div className="install-feature-item">
                <div className="install-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--chat-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                    <line x1="12" y1="18" x2="12.01" y2="18" />
                  </svg>
                </div>
                <div className="install-feature-text">
                  <strong>Home Screen Access</strong>
                  <span>Launch directly from your home screen</span>
                </div>
              </div>
              <div className="install-feature-item">
                <div className="install-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--chat-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <div className="install-feature-text">
                  <strong>Full Screen Experience</strong>
                  <span>No browser bars, feels like a native app</span>
                </div>
              </div>
              <div className="install-feature-item">
                <div className="install-feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--chat-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div className="install-feature-text">
                  <strong>Faster Performance</strong>
                  <span>Optimized loading and offline support</span>
                </div>
              </div>
            </div>

            {/* Install action */}
            {ios ? (
              <div className="install-page-ios">
                <h3 className="install-page-ios-title">How to install on iOS</h3>
                <div className="install-ios-steps">
                  <div className="install-ios-step">
                    <div className="install-ios-step-num">1</div>
                    <div className="install-ios-step-text">
                      Tap the{' '}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--chat-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      {' '}Share button in Safari
                    </div>
                  </div>
                  <div className="install-ios-step">
                    <div className="install-ios-step-num">2</div>
                    <div className="install-ios-step-text">
                      Scroll down and tap <strong>"Add to Home Screen"</strong>
                    </div>
                  </div>
                  <div className="install-ios-step">
                    <div className="install-ios-step-num">3</div>
                    <div className="install-ios-step-text">
                      Tap <strong>"Add"</strong> in the top right
                    </div>
                  </div>
                </div>
              </div>
            ) : deferredPrompt ? (
              <button
                className="install-page-btn"
                onClick={handleInstall}
                disabled={installing}
              >
                {installing ? (
                  <div className="spinner" style={{ width: 22, height: 22, borderWidth: 2 }} />
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Install McCulloch Chat
                  </>
                )}
              </button>
            ) : (
              <div className="install-page-status">
                <p className="install-page-status-text">
                  Open this page in Chrome or Edge to install
                </p>
                <p className="install-page-status-sub">
                  Your browser doesn't support direct installation yet.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
