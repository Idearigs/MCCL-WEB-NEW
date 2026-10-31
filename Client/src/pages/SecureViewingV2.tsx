import React, { useEffect, useRef, useState } from "react";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { api } from "../config/api";

/**
 * Secure viewing — the guest-facing ID check used in the showroom before a
 * piece is brought out of the cabinet (reached from a QR code at the counter).
 * Submits name, email, ID details and two photos; then shows the reference code
 * and updates live when the owner approves in /secure-viewing/admin.
 */

const ID_TYPES = ["Passport", "Driving licence", "National ID card", "Residence permit", "Other photo ID"];
const STORAGE_KEY = "secure_viewing_code";
const STORAGE_TTL = 400 * 24 * 60 * 60 * 1000; // long enough to outlast the furthest booking

type Status = "pending" | "approved" | "declined" | "expired";

const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };
const fieldLabel: React.CSSProperties = { display: "block", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 4 };
const input: React.CSSProperties = {
  width: "100%", padding: "13px 0", background: "transparent", border: 0, borderBottom: `1px solid ${T.ruleStrong}`,
  outline: "none", color: T.ink, fontFamily: FONT_BODY, fontSize: 16, borderRadius: 0,
};

// Bookable from one month after today (UK time), clamped to month end, e.g. 31 Oct -> 30 Nov.
// The one-year limit only stops typing errors keeping ID data for years.
const londonToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(new Date());
const addMonths = (iso: string, n: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m + n, 0)).getUTCDate();
  return new Date(Date.UTC(y, m - 1 + n, Math.min(d, lastDay))).toISOString().slice(0, 10);
};
const prettyDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const loadSaved = (): string | null => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && Date.now() - saved.at < STORAGE_TTL) return saved.code;
  } catch { /* ignore */ }
  return null;
};

const PhotoPicker = ({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) => {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return (
    <label className="sv-photo" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 150, padding: 12, border: `1px dashed ${file ? T.gold : T.ruleStrong}`, background: file ? "#fff" : "transparent", cursor: "pointer", textAlign: "center" }}>
      <input type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => onChange(e.target.files?.[0] || null)} />
      {preview
        ? <img src={preview} alt={label} style={{ maxWidth: "100%", maxHeight: 120, objectFit: "contain" }} />
        : <span style={{ fontSize: 28, color: T.gold, lineHeight: 1 }}>+</span>}
      <span style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: file ? T.ink : T.muted }}>{file ? `${label} ✓ – tap to retake` : label}</span>
    </label>
  );
};

const SecureViewingV2 = (): JSX.Element => {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", id_type: "", id_number: "", appointment_date: "", consent: false });
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState<string | null>(loadSaved);
  const [status, setStatus] = useState<Status>("pending");
  const [appointment, setAppointment] = useState<string | null>(null);
  const minDate = addMonths(londonToday(), 1);
  const maxDate = addMonths(londonToday(), 12);
  const dateUnavailable = !!form.appointment_date && (form.appointment_date < minDate || form.appointment_date > maxDate);
  const pollRef = useRef<number>();

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    document.title = "Secure viewing | McCulloch";
    const meta = document.createElement("meta");
    meta.name = "robots"; meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  // Live status while waiting for the owner.
  useEffect(() => {
    if (!code) return;
    const check = async () => {
      try {
        const res = await fetch(api(`secure-viewing/status/${encodeURIComponent(code)}`));
        if (res.status === 404) { localStorage.removeItem(STORAGE_KEY); setCode(null); return; }
        const json = await res.json();
        if (json.success) { setStatus(json.data.status); setAppointment(json.data.appointment_date); }
      } catch { /* keep polling */ }
    };
    check();
    pollRef.current = window.setInterval(check, 5000);
    return () => window.clearInterval(pollRef.current);
  }, [code]);

  useEffect(() => { if (status !== "pending") window.clearInterval(pollRef.current); }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.phone.replace(/\D/g, "").length < 7) { setError("Please enter your phone number."); return; }
    if (!form.appointment_date) { setError("Please choose an appointment date."); return; }
    if (dateUnavailable) { setError(`That date is not available. Appointments start from ${prettyDate(minDate)}.`); return; }
    if (!front || !back) { setError("Please add a photo of the front and the back of your ID."); return; }
    if (!form.consent) { setError("Please confirm you agree to the ID check."); return; }
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => body.append(k, String(v)));
    body.append("id_front", front);
    body.append("id_back", back);
    setSubmitting(true);
    try {
      const res = await fetch(api("secure-viewing"), { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) { setError(json.message || "Something went wrong. Please try again."); return; }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: json.data.code, at: Date.now() }));
      setStatus("pending");
      setCode(json.data.code);
      window.scrollTo(0, 0);
    } catch {
      setError("We couldn't send your details. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const startAgain = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCode(null);
    setForm({ full_name: "", email: "", phone: "", id_type: "", id_number: "", appointment_date: "", consent: false });
    setFront(null); setBack(null);
  };

  const STATUS_COPY: Record<Status, { eyebrow: string; title: string; body: string; tone: string }> = {
    pending: { eyebrow: "Thank you", title: "We're checking your details.", body: "This page will update as soon as you're confirmed, and we'll email you too.", tone: T.tint },
    approved: { eyebrow: "Confirmed", title: "You're all set.", body: "Please show this screen or your email to a member of our team when you arrive.", tone: "#E6F0E3" },
    declined: { eyebrow: "Viewing request", title: "We couldn't confirm your details.", body: "Please speak to a member of our team, who will be happy to help.", tone: "#F4E4E0" },
    expired: { eyebrow: "Viewing request", title: "This confirmation has expired.", body: "Confirmations are valid until the end of your appointment day. Please submit your details again.", tone: T.tint },
  };

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        .sv-input:focus { border-bottom-color: ${T.ink} !important; }
        .sv-btn { transition: background 0.3s ease; }
        .sv-btn:hover:not(:disabled) { background: ${T.gold} !important; }
        .sv-photo:hover { border-color: ${T.gold} !important; }
        @keyframes sv-pulse { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        @media (max-width: 640px) { .sv-two { grid-template-columns: 1fr !important; } }
      `}</style>

      <header style={{ textAlign: "center", padding: "28px 20px 22px", borderBottom: `1px solid ${T.rule}` }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, letterSpacing: "0.18em", textTransform: "uppercase" }}>McCulloch</div>
        <div style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: T.muted, marginTop: 4 }}>Fine Jewellery · Beeston</div>
      </header>

      <main style={{ maxWidth: 620, margin: "0 auto", padding: "clamp(28px,5vw,56px) 22px 72px" }}>
        {code ? (
          <section style={{ background: STATUS_COPY[status].tone, padding: "40px 26px", textAlign: "center" }}>
            <div style={{ ...eyebrow, marginBottom: 14 }}>{STATUS_COPY[status].eyebrow}</div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(30px,6vw,42px)", lineHeight: 1.1, margin: "0 0 16px" }}>{STATUS_COPY[status].title}</h1>
            <p style={{ margin: "0 auto 26px", maxWidth: "42ch", fontSize: 15, lineHeight: 1.7, color: T.body }}>{STATUS_COPY[status].body}</p>
            <div style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.muted, marginBottom: 8 }}>Your reference code</div>
            <div style={{ fontFamily: "'Courier New', monospace", fontSize: "clamp(30px,8vw,42px)", letterSpacing: "0.18em", fontWeight: 600 }}>{code}</div>
            {appointment && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.muted, marginBottom: 6 }}>Your appointment</div>
                <div style={{ fontSize: 16 }}>{prettyDate(appointment)}</div>
              </div>
            )}
            {status === "pending" && (
              <div style={{ marginTop: 26, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, animation: "sv-pulse 1.8s ease-in-out infinite" }}>Waiting for confirmation…</div>
            )}
            <div>
              <button onClick={startAgain} style={{ marginTop: 26, padding: "12px 24px", cursor: "pointer", background: "transparent", border: `1px solid ${T.ruleStrong}`, fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink }}>New request</button>
            </div>
          </section>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 34 }}>
              <div style={{ ...eyebrow, marginBottom: 14 }}>Secure viewing</div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(32px,6vw,48px)", lineHeight: 1.08, margin: "0 0 16px" }}>Before we open the cabinet</h1>
              <p style={{ margin: "0 auto", maxWidth: "46ch", fontSize: 15, lineHeight: 1.7, color: T.body }}>For the security of our collection, we ask every guest for photo ID before a piece is brought out. It takes a minute, and your details are kept private.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 22 }}>
                <label style={fieldLabel} htmlFor="sv-name">Full name (as on your ID)</label>
                <input id="sv-name" className="sv-input" style={input} value={form.full_name} onChange={e => set("full_name", e.target.value)} autoComplete="name" required />
              </div>
              <div className="sv-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                <div style={{ marginBottom: 22 }}>
                  <label style={fieldLabel} htmlFor="sv-email">Email</label>
                  <input id="sv-email" className="sv-input" style={input} type="email" inputMode="email" value={form.email} onChange={e => set("email", e.target.value)} autoComplete="email" required />
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label style={fieldLabel} htmlFor="sv-phone">Phone</label>
                  <input id="sv-phone" className="sv-input" style={input} type="tel" inputMode="tel" value={form.phone} onChange={e => set("phone", e.target.value)} autoComplete="tel" required />
                </div>
              </div>
              <div className="sv-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
                <div style={{ marginBottom: 22 }}>
                  <label style={fieldLabel} htmlFor="sv-type">Type of ID</label>
                  <select id="sv-type" className="sv-input" style={{ ...input, appearance: "none", cursor: "pointer" }} value={form.id_type} onChange={e => set("id_type", e.target.value)} required>
                    <option value="" disabled>Choose…</option>
                    {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label style={fieldLabel} htmlFor="sv-number">ID number</label>
                  <input id="sv-number" className="sv-input" style={input} value={form.id_number} onChange={e => set("id_number", e.target.value)} autoCapitalize="characters" autoComplete="off" required />
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={fieldLabel} htmlFor="sv-date">Appointment date</label>
                <input id="sv-date" className="sv-input" style={input} type="date" min={minDate} max={maxDate} value={form.appointment_date} onChange={e => set("appointment_date", e.target.value)} required />
                {dateUnavailable
                  ? <div role="alert" style={{ marginTop: 8, fontSize: 13.5, color: "#7A2E22" }}>This date is not available. Appointments start from {prettyDate(minDate)}.</div>
                  : <div style={{ marginTop: 8, fontSize: 12.5, color: T.muted }}>Appointments available from {prettyDate(minDate)}.</div>}
              </div>

              <div style={{ ...fieldLabel, marginTop: 8, marginBottom: 10 }}>Photos of your ID</div>
              <div className="sv-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 26 }}>
                <PhotoPicker label="Front" file={front} onChange={setFront} />
                <PhotoPicker label="Back" file={back} onChange={setBack} />
              </div>

              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 13.5, lineHeight: 1.6, color: T.body, marginBottom: 26, cursor: "pointer" }}>
                <input type="checkbox" checked={form.consent} onChange={e => set("consent", e.target.checked)} style={{ marginTop: 4, accentColor: T.ink, width: 16, height: 16, flexShrink: 0 }} />
                <span>I agree to McCulloch checking my ID before viewing. My ID number and photos are deleted automatically 30 days after my appointment. McCulloch keeps my name, contact details and the result of this check on record for future visits.</span>
              </label>

              {error && <div role="alert" style={{ background: "#F4E4E0", color: "#7A2E22", padding: "12px 16px", fontSize: 14, marginBottom: 18 }}>{error}</div>}

              <button type="submit" disabled={submitting} className="sv-btn" style={{ width: "100%", padding: "17px", background: T.ink, color: T.paper, border: 0, cursor: submitting ? "wait" : "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase", opacity: submitting ? 0.7 : 1 }}>
                {submitting ? "Sending…" : "Submit for confirmation"}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default SecureViewingV2;
