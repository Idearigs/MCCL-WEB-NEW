import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { T, FONT_DISPLAY, FONT_BODY } from './home-v2/tokens';

/**
 * A gentle side nudge that appears after the customer has spent a while on a product
 * page. It first asks whether they got lost choosing their diamond; on "Yes" it turns
 * into a one-tap WhatsApp hand-off to the store, pre-filled with the product they're on.
 */
const WHATSAPP = '447859888649'; // +44 7859 888649
const DELAY_MS = 15_000;         // 15 seconds on the page

export default function DiamondHelpNudge({ productName, title, subtitle }: { productName?: string; title?: string; subtitle?: string }) {
  const askTitle = title || 'Got lost choosing your diamond?';
  const askSub = subtitle || 'Carat, colour, clarity — it’s a lot. We’re happy to guide you.';
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'ask' | 'whatsapp'>('ask');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = sessionStorage.getItem('dh-nudge') === '1'; } catch { /* ignore */ }
    if (dismissed) return;
    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const remember = () => { try { sessionStorage.setItem('dh-nudge', '1'); } catch { /* ignore */ } };
  const close = () => { setClosing(true); remember(); setTimeout(() => setVisible(false), 260); };

  const openWhatsApp = () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const msg = `Hi McCulloch — I'm looking at the ${productName || 'engagement ring'} and would love some help choosing my diamond.\n\n${url}`;
    remember();
    if (typeof window !== 'undefined') window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    close();
  };

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes dhIn { from { opacity: 0; transform: translateX(24px) } to { opacity: 1; transform: translateX(0) } }
        @keyframes dhOut { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(24px) } }
        .dh-nudge { animation: dhIn .34s cubic-bezier(.22,1,.36,1) both; }
        .dh-nudge[data-closing="1"] { animation: dhOut .24s ease both; }
        .dh-btn { cursor: pointer; font-family: ${FONT_BODY}; transition: background-color .2s, border-color .2s, color .2s; }
        .dh-yes:hover { background: ${T.inkDeep} !important; }
        .dh-no:hover { border-color: ${T.ink} !important; color: ${T.ink} !important; }
        .dh-wa:hover { background: #1DA851 !important; }
        .dh-close:hover { color: ${T.ink} !important; }
        @media (prefers-reduced-motion: reduce) { .dh-nudge, .dh-nudge[data-closing="1"] { animation: none !important; } }
      `}</style>
      <div
        className="dh-nudge"
        data-closing={closing ? '1' : '0'}
        role="dialog"
        aria-label="Need help choosing your diamond?"
        style={{
          position: 'fixed', right: 'max(16px, env(safe-area-inset-right))', zIndex: 60,
          bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
          width: 300, maxWidth: 'calc(100vw - 32px)',
          background: T.paper, border: `1px solid ${T.rule}`,
          boxShadow: '0 18px 44px rgba(20,18,15,0.20)', padding: '18px 18px 16px',
        }}
      >
        <button
          className="dh-btn dh-close" onClick={close} aria-label="Dismiss"
          style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 0, color: T.muted }}
        >
          <X size={16} />
        </button>

        {step === 'ask' ? (
          <>
            <div style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gold, marginBottom: 8 }}>A little help?</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, lineHeight: 1.15, color: T.ink, marginBottom: 6, paddingRight: 18 }}>{askTitle}</div>
            <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, marginBottom: 16 }}>{askSub}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                className="dh-btn dh-yes" onClick={() => setStep('whatsapp')}
                style={{ flex: 1, padding: '11px 0', background: T.ink, color: T.paper, border: 0, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >Yes, please</button>
              <button
                className="dh-btn dh-no" onClick={close}
                style={{ flex: 1, padding: '11px 0', background: 'transparent', color: T.muted, border: `1px solid ${T.ruleStrong}`, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase' }}
              >No, thanks</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.gold, marginBottom: 8 }}>We’re here</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, lineHeight: 1.15, color: T.ink, marginBottom: 6, paddingRight: 18 }}>Chat with us on WhatsApp</div>
            <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, marginBottom: 16 }}>Message us for faster, personal help — we’ll pick up right where you are.</div>
            <button
              className="dh-btn dh-wa" onClick={openWhatsApp}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '13px 0', background: '#25D366', color: '#fff', border: 0, fontSize: 12, letterSpacing: '0.08em', fontWeight: 600 }}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.02a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.38 9.38 0 0 1-1.44-5.01c0-5.19 4.23-9.41 9.43-9.41 2.52 0 4.88.98 6.66 2.76a9.35 9.35 0 0 1 2.76 6.66c-.01 5.19-4.24 9.41-9.44 9.41zm8.02-17.43A11.32 11.32 0 0 0 12.04.75C5.8.75.74 5.81.73 12.04c0 2 .52 3.95 1.52 5.67L.64 23.5l5.93-1.56a11.3 11.3 0 0 0 5.47 1.39h.01c6.24 0 11.3-5.06 11.31-11.29a11.24 11.24 0 0 0-3.29-7.97z"/></svg>
              Message us on WhatsApp
            </button>
          </>
        )}
      </div>
    </>
  );
}
