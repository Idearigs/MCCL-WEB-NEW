import React, { useState } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * Contact — v2 redesign (design_handoff_mcculloch_bag_checkout_contact).
 * Title block, channel row, enquiry form with subject-driven placeholder, info
 * aside and a departments band. Real contact details for the Beeston showroom.
 * Original preserved at pages/Contact.original.tsx.
 */

const NAV_H = 96;

const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };
const pageX = "clamp(24px, 3vw, 52px)";

// Subject chips drive the message placeholder — the one real behaviour in the form.
const SUBJECTS: { value: string; label: string; placeholder: string }[] = [
  { value: "bespoke", label: "Bespoke", placeholder: "Describe what you have in mind — a stone you already own, a photograph, a rough budget." },
  { value: "order", label: "An order", placeholder: "Which piece is it, and is your question about delivery, sizing or something else?" },
  { value: "repairs", label: "Repairs", placeholder: "Tell us what needs attention — a resize, a re-tip, a restring, or a clean and check." },
  { value: "valuations", label: "Valuations", placeholder: "What is the piece, and is the valuation for insurance or probate?" },
  { value: "watches", label: "Watches", placeholder: "Which brand and model, and are you buying, selling or servicing?" },
  { value: "other", label: "Something else", placeholder: "How can we help?" },
];

const DEPARTMENTS: { name: string; note: string; ext: string }[] = [
  { name: "Bespoke commissions", note: "New designs and remodels", ext: "201" },
  { name: "Workshop & repairs", note: "Sizing, restoration, servicing", ext: "202" },
  { name: "Valuations & insurance", note: "Insurance and probate", ext: "203" },
  { name: "Watches", note: "Sales and servicing", ext: "204" },
];

const ContactV2 = (): JSX.Element => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "bespoke", message: "", newsletter: false });
  const [sent, setSent] = useState(false);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const placeholder = SUBJECTS.find(s => s.value === form.subject)?.placeholder || "How can we help?";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No enquiry endpoint yet — surface a confirmation and log the payload.
    console.log("Contact enquiry:", form);
    setSent(true);
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "13px 0", background: "transparent", border: 0, borderBottom: `1px solid ${T.ruleStrong}`,
    outline: "none", color: T.ink, fontFamily: FONT_BODY, fontSize: 15,
  };
  const fieldLabel: React.CSSProperties = { display: "block", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 4 };

  const channels = [
    { eyebrow: "Telephone", value: "0115 925 7552", note: "Mon – Sat, 9 – 5:30", href: "tel:01159257552" },
    { eyebrow: "Email", value: "has@mccullochjewellers.co.uk", note: "We reply within one working day", href: "mailto:has@mccullochjewellers.co.uk" },
    { eyebrow: "In person", value: "7 The Square, Beeston", note: "Nottingham NG9 2JG", href: "/visit-us" },
  ];

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        .cv2 a { color: inherit; text-decoration: none; }
        .cv2-channel { transition: background 0.25s ease; }
        .cv2-channel:hover { background: ${T.tint}; }
        .cv2-chip { transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease; }
        .cv2-input:focus { border-bottom-color: ${T.ink} !important; }
        .cv2-dept { transition: background 0.25s ease; }
        .cv2-dept:hover { background: rgba(168,129,60,0.06); }
        .cv2-btn-ink { transition: background 0.3s ease; }
        .cv2-btn-ink:hover { background: ${T.gold}; }
        .cv2-textlink { display: inline-block; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; border-bottom: 1px solid ${T.ruleStrong}; padding-bottom: 4px; transition: color 0.2s ease; }
        .cv2-textlink:hover { color: ${T.gold}; }
        @media (max-width: 900px) {
          .cv2-title { grid-template-columns: 1fr !important; gap: 18px !important; }
          .cv2-channels { grid-template-columns: 1fr !important; }
          .cv2-channel { border-right: none !important; border-bottom: 1px solid ${T.rule}; }
          .cv2-main { grid-template-columns: 1fr !important; }
          .cv2-aside { order: -1; }
          .cv2-chips { grid-template-columns: 1fr 1fr !important; }
          .cv2-namephone { grid-template-columns: 1fr !important; }
          .cv2-dept-band { grid-template-columns: 1fr !important; gap: 32px !important; }
          .cv2-dept-row { grid-template-columns: 1fr auto !important; }
          .cv2-dept-note { display: none; }
        }
      `}</style>

      <NavigationV2 solid />

      <div className="cv2" style={{ paddingTop: NAV_H }}>
        {/* Breadcrumb */}
        <div style={{ display: "flex", gap: 10, padding: "18px " + pageX, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8A8377" }}>
          <Link to="/">Home</Link><span>/</span><span style={{ color: T.ink }}>Contact</span>
        </div>

        {/* Title block */}
        <section className="cv2-title" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "end", gap: "clamp(24px,4vw,72px)", padding: `clamp(16px,2vw,32px) ${pageX} clamp(32px,4vw,52px)`, borderBottom: `1px solid ${T.rule}` }}>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(44px, 5.2vw, 84px)", lineHeight: 1, letterSpacing: "0.005em", margin: 0 }}>Contact</h1>
          <p style={{ margin: 0, maxWidth: "46ch", fontSize: 15.5, lineHeight: 1.75, color: T.body }}>Questions about a piece, a commission or a repair? Speak to the people who make and mend our jewellery — by phone, by email, or across the counter in Beeston.</p>
        </section>

        {/* Channel row */}
        <section className="cv2-channels" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderBottom: `1px solid ${T.rule}` }}>
          {channels.map((c, i) => (
            (c.href.startsWith("/")
              ? <Link key={c.eyebrow} to={c.href} className="cv2-channel" style={{ padding: "clamp(28px,3vw,44px)", borderRight: i < 2 ? `1px solid ${T.rule}` : undefined, display: "block" }}>
                  <div style={{ ...eyebrow, marginBottom: 14 }}>{c.eyebrow}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px,2vw,30px)", lineHeight: 1.1, marginBottom: 10 }}>{c.value}</div>
                  <div style={{ fontSize: 13, color: T.muted }}>{c.note}</div>
                </Link>
              : <a key={c.eyebrow} href={c.href} className="cv2-channel" style={{ padding: "clamp(28px,3vw,44px)", borderRight: i < 2 ? `1px solid ${T.rule}` : undefined, display: "block" }}>
                  <div style={{ ...eyebrow, marginBottom: 14 }}>{c.eyebrow}</div>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(22px,2vw,30px)", lineHeight: 1.1, marginBottom: 10, wordBreak: "break-word" }}>{c.value}</div>
                  <div style={{ fontSize: 13, color: T.muted }}>{c.note}</div>
                </a>)
          ))}
        </section>

        {/* Main: enquiry form + aside */}
        <main className="cv2-main" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: "clamp(36px, 5vw, 96px)", padding: `clamp(40px,5vw,80px) ${pageX} clamp(56px,6vw,96px)`, alignItems: "start" }}>
          {/* Enquiry form */}
          <div>
            <div style={{ ...eyebrow, marginBottom: 18 }}>Send an enquiry</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(28px,3vw,44px)", lineHeight: 1.06, margin: "0 0 16px" }}>Tell us what you're after.</h2>
            <p style={{ margin: "0 0 30px", maxWidth: "48ch", fontSize: 15, lineHeight: 1.7, color: T.body }}>Choose a subject and we'll route your message to the right bench. The more detail you give, the better we can help.</p>

            {sent ? (
              <div style={{ background: T.tint, padding: "36px 28px", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, marginBottom: 10 }}>Thank you — your enquiry is on its way.</div>
                <p style={{ margin: "0 0 20px", fontSize: 14.5, color: T.body }}>We reply within one working day. For anything urgent, call 0115 925 7552.</p>
                <button onClick={() => { setSent(false); setForm({ name: "", phone: "", email: "", subject: "bespoke", message: "", newsletter: false }); }}
                  style={{ padding: "12px 24px", cursor: "pointer", background: "transparent", border: `1px solid ${T.ruleStrong}`, fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.ink }}>Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Subject chips */}
                <div style={fieldLabel}>Subject</div>
                <div className="cv2-chips" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 26 }}>
                  {SUBJECTS.map(s => {
                    const on = form.subject === s.value;
                    return (
                      <button type="button" key={s.value} onClick={() => set("subject", s.value)} className="cv2-chip"
                        style={{ padding: "12px 10px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12.5, border: `1px solid ${on ? T.ink : T.ruleSoft}`, background: on ? T.ink : T.paper, color: on ? T.paper : T.body }}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                <div className="cv2-namephone" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 22 }}>
                  <div>
                    <label style={fieldLabel}>Name</label>
                    <input className="cv2-input" style={input} required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <label style={fieldLabel}>Telephone</label>
                    <input className="cv2-input" style={input} type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Optional" />
                  </div>
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={fieldLabel}>Email</label>
                  <input className="cv2-input" style={input} type="email" required value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" />
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={fieldLabel}>Message</label>
                  <textarea className="cv2-input" style={{ ...input, borderBottom: 0, border: `1px solid ${T.ruleStrong}`, padding: 14, resize: "vertical", minHeight: 150, lineHeight: 1.6 }} required rows={6} value={form.message} onChange={e => set("message", e.target.value)} placeholder={placeholder} />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 28, cursor: "pointer", fontSize: 13.5, color: T.body }}>
                  <input type="checkbox" checked={form.newsletter} onChange={e => set("newsletter", e.target.checked)} style={{ width: 16, height: 16, accentColor: T.ink }} />
                  Keep me posted on new pieces and events.
                </label>

                <button type="submit" className="cv2-btn-ink" style={{ width: "100%", padding: 16, cursor: "pointer", background: T.ink, color: T.paper, border: 0, fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>Send enquiry</button>
              </form>
            )}
          </div>

          {/* Aside */}
          <aside className="cv2-aside">
            <div style={{ position: "relative", aspectRatio: "16 / 9", background: T.tint, overflow: "hidden", marginBottom: 24 }}>
              <img src="/images/shopfront-2-upscaled.webp" alt="McCulloch showroom, Beeston" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ background: T.tint }}>
              <div style={{ padding: "24px 26px", borderBottom: `1px solid ${T.ruleSoft}` }}>
                <div style={{ ...eyebrow, marginBottom: 12 }}>Address</div>
                <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.7, color: T.body }}>McCulloch Jewellers<br />7 The Square, Beeston<br />Nottingham NG9 2JG</p>
                <a href="https://maps.google.com/?q=7+The+Square+Beeston+Nottingham+NG9+2JG" target="_blank" rel="noreferrer" className="cv2-textlink">Directions</a>
              </div>
              <div style={{ padding: "24px 26px", borderBottom: `1px solid ${T.ruleSoft}` }}>
                <div style={{ ...eyebrow, marginBottom: 12 }}>Opening hours</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14.5, color: T.body, marginBottom: 6 }}><span>Monday – Saturday</span><span>9:00 – 5:30</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14.5, color: "#8A8377" }}><span>Sunday</span><span>Closed</span></div>
              </div>
              <div style={{ padding: "24px 26px" }}>
                <div style={{ ...eyebrow, marginBottom: 12 }}>Appointments</div>
                <p style={{ margin: "0 0 18px", fontSize: 14.5, lineHeight: 1.7, color: T.body }}>Free, and about an hour. Bring a stone, a sketch or just an idea.</p>
                <Link to="/contact" className="cv2-btn-ink" style={{ display: "inline-block", padding: "13px 26px", background: T.ink, color: T.paper, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>Book an appointment</Link>
              </div>
            </div>
          </aside>
        </main>

        {/* Departments band */}
        <section style={{ background: T.ink, color: T.onDarkSoft, padding: `clamp(56px,6vw,100px) ${pageX}` }}>
          <div className="cv2-dept-band" style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "clamp(40px,5vw,88px)", alignItems: "center", maxWidth: 1400, margin: "0 auto" }}>
            <div>
              <div style={{ ...eyebrow, marginBottom: 22 }}>Departments</div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(30px,3.4vw,50px)", lineHeight: 1.08, margin: "0 0 18px", color: "#FFFFFF" }}>Straight to the right bench.</h2>
              <p style={{ margin: "0 0 28px", maxWidth: "34ch", fontSize: 15, lineHeight: 1.75, color: T.onDarkBody }}>Every enquiry reaches the person who does the work — no call centre, no queue.</p>
              <a href="tel:01159257552" style={{ display: "inline-block", padding: "13px 28px", border: `1px solid ${T.ruleDarkStrong}`, color: "#FFFFFF", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase" }}>0115 925 7552</a>
            </div>
            <div style={{ borderTop: `1px solid ${T.ruleDark}` }}>
              {DEPARTMENTS.map(d => (
                <div key={d.name} className="cv2-dept cv2-dept-row" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr auto", gap: 20, alignItems: "center", padding: "20px 16px", borderBottom: `1px solid ${T.ruleDark}` }}>
                  <div style={{ fontSize: 15, color: "#FFFFFF" }}>{d.name}</div>
                  <div className="cv2-dept-note" style={{ fontSize: 13.5, color: T.onDarkMuted }}>{d.note}</div>
                  <div style={{ fontSize: 12.5, letterSpacing: "0.1em", textTransform: "uppercase", color: T.gold }}>Ext. {d.ext}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <FooterV2 />
    </div>
  );
};

export default ContactV2;
