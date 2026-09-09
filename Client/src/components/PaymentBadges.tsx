import React from "react";

/**
 * Real card-scheme marks (Visa, Mastercard, Amex) + a "Secured by Stripe" badge,
 * drawn as inline SVG so they stay crisp and need no external assets.
 * Used on the checkout payment step and in the footer to signal secure payment.
 */

const cardWrap: React.CSSProperties = {
  width: 40,
  height: 26,
  borderRadius: 4,
  background: "#FFFFFF",
  border: "1px solid #E4DFD4",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
};

export const VisaMark = (): JSX.Element => (
  <span style={cardWrap} aria-label="Visa" title="Visa">
    <svg width="30" height="12" viewBox="0 0 48 16" role="img" aria-hidden="true">
      <path fill="#1434CB" d="M20.7 15.7h-3.9L19.2.4h3.9l-2.4 15.3zM33.8.8C33 .5 31.8.1 30.2.1c-3.8 0-6.5 2-6.5 4.9 0 2.1 2 3.3 3.5 4 1.6.7 2.1 1.2 2.1 1.9 0 1-1.2 1.5-2.4 1.5-1.6 0-2.4-.2-3.7-.8l-.5-.2-.6 3.4c1 .4 2.7.8 4.6.8 4 0 6.6-2 6.7-5 0-1.7-1-3-3.3-4-1.4-.7-2.2-1.1-2.2-1.8 0-.6.7-1.3 2.3-1.3 1.3 0 2.3.3 3 .6l.4.2.6-3.5zM43.9.4h-3c-.9 0-1.6.3-2 1.3l-5.8 14h4.1s.7-1.9.8-2.3h5c.1.5.5 2.3.5 2.3h3.6L43.9.4zm-4.8 9.9c.3-.9 1.6-4.3 1.6-4.3s.3-.9.5-1.5l.3 1.3.9 4.4h-3.3zM16.4.4L12.6 11l-.4-2.1C11.5 6.4 9.3 3.8 6.9 2.5l3.5 13.2h4.2L20.6.4h-4.2z"/>
      <path fill="#F7A600" d="M9.2.4H2.7l-.1.3c5 1.3 8.4 4.4 9.8 8.2L11 1.7C10.7.7 10 .4 9.2.4z"/>
    </svg>
  </span>
);

export const MastercardMark = (): JSX.Element => (
  <span style={cardWrap} aria-label="Mastercard" title="Mastercard">
    <svg width="30" height="19" viewBox="0 0 48 30" role="img" aria-hidden="true">
      <circle cx="18" cy="15" r="12" fill="#EB001B"/>
      <circle cx="30" cy="15" r="12" fill="#F79E1B"/>
      <path fill="#FF5F00" d="M24 5.5A11.96 11.96 0 0 0 19.5 15c0 3.8 1.8 7.2 4.5 9.5A11.96 11.96 0 0 0 28.5 15c0-3.8-1.8-7.2-4.5-9.5z"/>
    </svg>
  </span>
);

export const AmexMark = (): JSX.Element => (
  <span style={{ ...cardWrap, background: "#1F72CD", border: "1px solid #1F72CD" }} aria-label="American Express" title="American Express">
    <svg width="34" height="14" viewBox="0 0 60 20" role="img" aria-hidden="true">
      <text x="30" y="14" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700" fontSize="9" letterSpacing="0.5" fill="#FFFFFF">AMEX</text>
    </svg>
  </span>
);

const LockIcon = ({ size = 13, color = "#635BFF" }: { size?: number; color?: string }): JSX.Element => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" fill={color} />
    <path d="M7.5 10.5V8a4.5 4.5 0 0 1 9 0v2.5" stroke={color} strokeWidth="2" fill="none" />
    <circle cx="12" cy="15.2" r="1.6" fill="#FFFFFF" />
  </svg>
);

interface Props {
  /** Show the "Secured by Stripe" lock line alongside the card marks. */
  showStripe?: boolean;
  /** Colour of the surrounding text (defaults to a muted tone). */
  textColor?: string;
  /** Alignment of the row. */
  align?: "flex-start" | "center" | "flex-end";
  style?: React.CSSProperties;
}

const PaymentBadges = ({ showStripe = true, textColor = "#6E6A60", align = "flex-start", style }: Props): JSX.Element => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: align, flexWrap: "wrap", gap: 10, ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <VisaMark />
      <MastercardMark />
      <AmexMark />
    </div>
    {showStripe && (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, letterSpacing: "0.04em", color: textColor }}>
        <LockIcon />
        Secure payments powered by <strong style={{ color: "#635BFF", fontWeight: 600 }}>Stripe</strong>
      </span>
    )}
  </div>
);

export default PaymentBadges;
