import React, { useState, useEffect, useMemo } from "react";
import { useUserAuth } from "../contexts/UserAuthContext";
import { useIsMobile } from "../hooks/use-mobile";
import { API_BASE_URL } from "../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "./home-v2/tokens";

/**
 * AuthModalV2 — the sign-in / register modal.
 * VISUAL design: design_handoff_mcculloch_signin_chat_watches (Sign In). An 880px split
 * panel (image plate + form), mode switch between sign-in and register, derived button
 * state, real vendor social buttons; a bottom sheet on mobile.
 *
 * FLOW ADAPTATION: the design's step 2 is a six-digit email code (OTP). The site has no
 * OTP/magic-link backend and SMTP is not configured (signup auto-verifies), and the README
 * lists OTP as "not built — needs decisions". So step 2 is the real PASSWORD step wired to
 * the existing UserAuthContext login/signup. Google is the real OAuth link; Apple has no
 * backend, so it shows a short "coming soon" note rather than a dead redirect.
 */

const M2 = "#8A8377";
const WARN = "#C4A46A"; // the palette's only "warn" tone — no red
const emailValid = (e: string) => /.+@.+\..+/.test(e.trim());

interface AuthModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  initialView?: "login" | "signup";
}

const AuthModalV2: React.FC<AuthModalV2Props> = ({ isOpen, onClose, initialView = "login" }) => {
  const { login, signup, error: authError, clearError } = useUserAuth();
  const isMobile = useIsMobile();

  const [mode, setMode] = useState<"signin" | "register">(initialView === "signup" ? "register" : "signin");
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [appleNote, setAppleNote] = useState(false);

  const reg = mode === "register";

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialView === "signup" ? "register" : "signin");
      setStep("email");
      setEmail(""); setPassword(""); setFirstName(""); setLastName("");
      setShowPw(false); setLoading(false); setLocalError(null); setAppleNote(false);
      clearError();
    }
  }, [isOpen, initialView, clearError]);

  // Escape + body scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [isOpen, onClose]);

  const okToContinue = useMemo(
    () => emailValid(email) && (!reg || (firstName.trim() && lastName.trim())),
    [email, reg, firstName, lastName]
  );

  const toPassword = () => { if (okToContinue) { setLocalError(null); setStep("password"); } };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setLocalError("Please enter your password."); return; }
    setLoading(true); setLocalError(null); clearError();
    try {
      if (reg) await signup(email, password, firstName, lastName);
      else await login(email, password, remember);
      onClose();
    } catch (err: any) {
      setLocalError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const displayError = localError || authError;
  const eBorder = email && !emailValid(email) ? WARN : T.ruleStrong;

  const inputStyle: React.CSSProperties = { width: "100%", padding: "14px", fontFamily: FONT_BODY, fontSize: 14, color: T.ink, background: "#FFFFFF", border: `1px solid ${T.ruleStrong}`, borderRadius: 0, outline: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 8 };

  // ————— Right-column content —————
  const FormColumn = (
    <div className="am-nobar" style={{ display: "flex", flexDirection: "column", minHeight: 0, overflowY: "auto", scrollbarWidth: "none", padding: isMobile ? "26px 22px calc(26px + env(safe-area-inset-bottom))" : "34px clamp(28px, 3.4vw, 48px) 30px" }}>
      {/* Wordmark + close */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ lineHeight: 1 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, letterSpacing: "0.26em", textTransform: "uppercase" }}>McCulloch</div>
          <div style={{ fontSize: 8, letterSpacing: "0.42em", textTransform: "uppercase", color: T.muted, marginTop: 6, paddingLeft: 3 }}>Fine jewellery</div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="am-x" style={{ width: 34, height: 34, margin: "-6px -8px 0 0", cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 20, color: M2 }}>×</button>
      </div>

      <div key={step + mode} style={{ marginTop: isMobile ? 22 : 34, animation: "amStepIn 0.32s cubic-bezier(0.22,1,0.36,1) both" }}>
        {step === "email" ? (
          <>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: isMobile ? 30 : 34, lineHeight: 1.06, margin: "0 0 10px" }}>{reg ? "Create an account." : "Sign in."}</h2>
            <p style={{ margin: "0 0 28px", maxWidth: "34ch", fontSize: 14, lineHeight: 1.7, color: T.muted }}>
              {reg ? "So your specifications, saved pieces and certificates live in one place." : "Your orders, saved pieces and details, all in one place."}
            </p>

            {reg && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>First name</span>
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Hannah" style={inputStyle} />
                </label>
                <label style={{ display: "block" }}>
                  <span style={labelStyle}>Last name</span>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Ward" style={inputStyle} />
                </label>
              </div>
            )}

            <label style={{ display: "block" }}>
              <span style={labelStyle}>Email address</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") toPassword(); }} placeholder="you@example.co.uk" autoFocus style={{ ...inputStyle, padding: "15px 14px", border: `1px solid ${eBorder}` }} />
            </label>

            <button type="button" onClick={toPassword} disabled={!okToContinue}
              style={{ width: "100%", marginTop: 16, padding: 16, cursor: okToContinue ? "pointer" : "not-allowed", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: okToContinue ? T.paper : "#A9A196", background: okToContinue ? T.ink : T.tint, border: 0, transition: "background 0.25s ease" }}>
              Continue
            </button>

            <p style={{ margin: "14px 0 0", fontSize: 12, lineHeight: 1.6, color: M2 }}>
              {reg ? "We only email you about your orders and pieces. No marketing unless you ask for it." : "Ordered as a guest? Use the same email and everything will be waiting."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 14, margin: "26px 0" }}>
              <span style={{ height: 1, background: T.rule }} />
              <span style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#A9A196" }}>or</span>
              <span style={{ height: 1, background: T.rule }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={`${API_BASE_URL}/auth/google`} className="am-social" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, padding: 14, textDecoration: "none", background: "#FFFFFF", border: `1px solid ${T.ruleSoft}`, fontFamily: FONT_BODY, fontSize: 13, color: T.heading }}>
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
              </a>
              <button type="button" onClick={() => setAppleNote(true)} className="am-social" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, padding: 14, cursor: "pointer", background: "#FFFFFF", border: `1px solid ${T.ruleSoft}`, fontFamily: FONT_BODY, fontSize: 13, color: T.heading }}>
                <svg width="15" height="18" viewBox="0 0 384 512" aria-hidden="true"><path fill="#1C1A17" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 62.4 126.7 114.2 125.2 27.1-.6 46.2-19.2 81.5-19.2 34.2 0 51.9 18.6 82.1 18.6 52.2-.8 97-82.5 109.3-119.3-69.9-33-86.8-96.6-86.8-91.3zM255.7 78.6c17.6-21.4 26.4-45.4 25.1-70.6-27.9 1.7-51.7 15.3-70.7 37.4-16.4 19.5-25.1 43.4-23.1 68.5 26.7-2.6 49.8-15 68.7-35.3z"/></svg>
                Continue with Apple
              </button>
              {appleNote && <p style={{ margin: "2px 0 0", fontSize: 12, color: M2 }}>Apple sign-in is coming soon — please use email or Google for now.</p>}
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, letterSpacing: "0.005em", fontSize: isMobile ? 30 : 34, lineHeight: 1.06, margin: "0 0 10px" }}>{reg ? "Choose a password." : "Welcome back."}</h2>
            <p style={{ margin: "0 0 28px", maxWidth: "36ch", fontSize: 14, lineHeight: 1.7, color: T.muted }}>
              {reg ? <>Almost done — set a password for <span style={{ color: T.ink }}>{email}</span>.</> : <>Enter the password for <span style={{ color: T.ink }}>{email}</span>.</>}
            </p>

            <label style={{ display: "block" }}>
              <span style={labelStyle}>Password</span>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus placeholder={reg ? "At least 8 characters" : "Your password"} style={{ ...inputStyle, padding: "15px 58px 15px 14px" }} />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="am-mini" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: 0, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: M2 }}>{showPw ? "Hide" : "Show"}</button>
              </div>
            </label>

            {!reg && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 14 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: T.muted }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ accentColor: T.ink }} />
                  Keep me signed in
                </label>
              </div>
            )}

            {displayError && <p style={{ margin: "16px 0 0", fontSize: 13, color: WARN }}>{displayError}</p>}

            <button type="submit" disabled={loading}
              style={{ width: "100%", marginTop: 20, padding: 16, cursor: loading ? "default" : "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0, opacity: loading ? 0.7 : 1, transition: "background 0.25s ease" }}>
              {loading ? (reg ? "Creating account…" : "Signing in…") : reg ? "Create account" : "Sign in"}
            </button>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 18, marginTop: 20, fontSize: 12.5, color: M2 }}>
              <button type="button" onClick={() => { setStep("email"); setPassword(""); setLocalError(null); }} className="am-mini" style={{ padding: 0, cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 12.5, color: M2 }}>Use a different email</button>
            </div>

            <p style={{ margin: "26px 0 0", paddingTop: 20, borderTop: `1px solid ${T.rule}`, fontSize: 12.5, lineHeight: 1.7, color: T.muted }}>
              Trouble signing in? Telephone the workshop on <a href="tel:01159257552" style={{ color: T.ink }}>0115 925 7552</a> and we will look you up.
            </p>
          </form>
        )}
      </div>

      {/* Footer: mode switch + legal */}
      <div style={{ marginTop: "auto", paddingTop: 28 }}>
        {step === "email" && (
          <div style={{ paddingTop: 20, borderTop: `1px solid ${T.rule}`, fontSize: 13, color: T.muted }}>
            {reg ? "Already have an account?" : "First time here?"}{" "}
            <button type="button" onClick={() => { setMode(reg ? "signin" : "register"); setLocalError(null); }} style={{ padding: 0, cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 13, color: T.ink, borderBottom: `1px solid ${T.ruleStrong}` }}>
              {reg ? "Sign in" : "Create an account"}
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: 20, marginTop: 18, fontSize: 11, letterSpacing: "0.06em", color: "#A9A196" }}>
          <a href="/customer-service" style={{ color: "inherit", textDecoration: "none" }}>Privacy policy</a>
          <a href="/customer-service" style={{ color: "inherit", textDecoration: "none" }}>Terms of service</a>
        </div>
      </div>
    </div>
  );

  const styleTag = (
    <style>{`
      .am-nobar::-webkit-scrollbar { display: none; }
      .am-x:hover { color: ${T.ink} !important; }
      .am-mini:hover { color: ${T.ink} !important; }
      .am-social:hover { border-color: ${T.ink} !important; }
      @keyframes amScrimIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes amModalIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
      @keyframes amSheetUp { from { transform: translateY(100%); } to { transform: none; } }
      @keyframes amStepIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) { .am-panel, .am-panel * { animation: none !important; } }
    `}</style>
  );

  // ————— Mobile: bottom sheet —————
  if (isMobile) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", justifyContent: "center", alignItems: "flex-end", fontFamily: FONT_BODY }}>
        {styleTag}
        <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.52)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", animation: "amScrimIn 0.3s ease both" }} />
        <div className="am-panel" style={{ position: "relative", width: "100%", maxHeight: "94vh", display: "flex", flexDirection: "column", background: T.paper, animation: "amSheetUp 0.36s cubic-bezier(0.22,1,0.36,1) both" }}>
          {FormColumn}
        </div>
      </div>
    );
  }

  // ————— Desktop: split panel —————
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: FONT_BODY }}>
      {styleTag}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(20,18,15,0.52)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", animation: "amScrimIn 0.3s ease both" }} />
      <div className="am-panel" style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gridTemplateRows: "minmax(0, 1fr)", width: "min(880px, 100%)", height: "min(680px, 92vh)", overflow: "hidden", background: T.paper, animation: "amModalIn 0.36s cubic-bezier(0.22,1,0.36,1) both" }}>
        {/* Left plate */}
        <div style={{ position: "relative", minHeight: 0, background: T.tint, overflow: "hidden" }}>
          <img src="/images/Wedding.jpg" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 32, background: "linear-gradient(to top, rgba(18,16,13,0.78), rgba(18,16,13,0) 62%)" }}>
            <p style={{ margin: 0, fontFamily: FONT_DISPLAY, fontSize: 24, lineHeight: 1.3, letterSpacing: "0.005em", color: "#FFFFFF" }}>Your orders, your saved pieces, and the record of everything we have made for you.</p>
          </div>
        </div>
        {FormColumn}
      </div>
    </div>
  );
};

export default AuthModalV2;
