import React, { useState } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { GROUND, TILE } from "../components/home-v2/listingShared";
import API_BASE_URL from "../config/api";

/**
 * Contact, light redesign (Nov 2026). A centred title, the three ways to reach the shop on one
 * hairline row, the enquiry form with boxed fields and outlined subject chips (the same form
 * language as the bespoke page and the checkout), the showroom beside it, and the departments
 * on the page's one sand band (it was a black band).
 * The form posts to the same place as before: POST /contact, emailed to the shop by the API.
 * Real contact details for the Beeston showroom. Original at pages/Contact.original.tsx.
 */

const pageX = "clamp(20px, 4vw, 64px)";

// Subject chips drive the message placeholder.
const SUBJECTS: { value: string; label: string; placeholder: string }[] = [
  { value: "bespoke", label: "Bespoke", placeholder: "Describe what you have in mind: a stone you already own, a photograph, a rough budget." },
  { value: "order", label: "An order", placeholder: "Which piece is it, and is your question about delivery, sizing or something else?" },
  { value: "repairs", label: "Repairs", placeholder: "Tell us what needs attention: a resize, a re-tip, a restring, or a clean and check." },
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

const EMPTY = { name: "", phone: "", email: "", subject: "bespoke", message: "", newsletter: false };

const ContactV2 = (): JSX.Element => {
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState(""); // hidden spam trap

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));
  const placeholder = SUBJECTS.find(s => s.value === form.subject)?.placeholder || "How can we help?";

  // Emailed to the shop by the API; "sent" is only shown once that has worked.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true); setError("");
    try {
      const r = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, website }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.success) throw new Error(d.message || "");
      setSent(true);
    } catch (err) {
      setError(`${(err as Error).message || "We could not send your enquiry just now."} Please try again, or call us on 0115 925 7552.`);
    } finally {
      setSending(false);
    }
  };

  const channels = [
    { label: "Telephone", value: "0115 925 7552", note: "Mon to Sat, 9 to 5:30", href: "tel:01159257552" },
    { label: "Email", value: "has@mccullochjewellers.co.uk", note: "We reply within one working day", href: "mailto:has@mccullochjewellers.co.uk" },
    { label: "In person", value: "7 The Square, Beeston", note: "Nottingham NG9 2JG", href: "/visit-us" },
  ];

  return (
    <div className="ct" style={{ background: GROUND, color: T.text, fontFamily: FONT_BODY, minHeight: "100vh", paddingTop: "var(--v2nav-h, 113px)", overflowX: "clip" }}>
      <style>{`
        .ct a { color: inherit; text-decoration: none; }
        .ct-wrap { max-width: 1240px; margin: 0 auto; padding-left: ${pageX}; padding-right: ${pageX}; }
        .ct-eyebrow { font-size: 11.5px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.text}; }
        @keyframes ctRise { from { opacity: 0; transform: translateY(16px); } }
        .ct-open { text-align: center; padding-top: clamp(26px, 3vw, 44px); }
        .ct-open > * { animation: ctRise 0.9s cubic-bezier(0.22,1,0.36,1) backwards; }
        .ct-open > :nth-child(2) { animation-delay: 0.08s; } .ct-open > :nth-child(3) { animation-delay: 0.16s; } .ct-open > :nth-child(4) { animation-delay: 0.26s; }
        .ct-crumb { display: flex; justify-content: center; gap: 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: clamp(26px, 3.4vw, 48px); }
        .ct-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(40px, 5.4vw, 80px); line-height: 1.04; margin: 0; color: ${T.text}; }
        .ct-h2 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(26px, 2.6vw, 38px); line-height: 1.18; margin: 0; color: ${T.text}; }
        .ct-p { font-size: 15.5px; line-height: 1.8; color: ${T.text}; margin: 0; }

        .ct-ways { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: clamp(34px, 4vw, 56px); border-top: 1px solid ${T.line}; border-bottom: 1px solid ${T.line}; }
        .ct-way { display: block; padding: clamp(24px, 2.8vw, 38px) 14px; border-left: 1px solid ${T.line}; transition: background 0.25s ease; }
        .ct-way:first-child { border-left: 0; }
        .ct-way:hover { background: ${TILE}; }
        .ct-way span { display: block; }
        .ct-way .v { margin-top: 12px; font-family: ${FONT_DISPLAY}; font-size: clamp(19px, 1.9vw, 25px); line-height: 1.2; color: ${T.text}; overflow-wrap: anywhere; }
        .ct-way .n { margin-top: 9px; font-size: 13.5px; color: ${T.textMuted}; }

        .ct-main { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: clamp(36px, 6vw, 104px); align-items: start; padding-top: clamp(48px, 6vw, 96px); padding-bottom: clamp(56px, 6vw, 96px); }
        .ct-label { display: block; font-size: 13px; color: ${T.text}; margin-bottom: 7px; }
        .ct-label em { font-style: normal; color: ${T.textMuted}; }
        .ct-input { display: block; width: 100%; height: 52px; padding: 0 15px; background: #FFFFFF; border: 1px solid ${T.ruleStrong}; border-radius: 0; outline: none; color: ${T.text}; font-family: ${FONT_BODY}; font-size: 16px; transition: border-color 0.2s ease; }
        textarea.ct-input { height: auto; min-height: 160px; padding: 14px 15px; line-height: 1.6; resize: vertical; }
        .ct-input::placeholder { color: #8E897E; }
        .ct-input:hover { border-color: #B5A990; }
        .ct-input:focus { border-color: ${T.text}; }
        .ct-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .ct-chip { display: inline-flex; align-items: center; height: 42px; padding: 0 17px; cursor: pointer; background: transparent; border: 1px solid ${T.line}; font-family: ${FONT_BODY}; font-size: 14px; color: ${T.text}; transition: border-color 0.2s ease; }
        .ct-chip:hover { border-color: ${T.ruleStrong}; }
        .ct-chip svg { width: 0; margin-right: 0; opacity: 0; transition: width 0.2s ease, margin 0.2s ease, opacity 0.2s ease; }
        .ct-chip[aria-pressed="true"] { border-color: ${T.text}; }
        .ct-chip[aria-pressed="true"] svg { width: 12px; margin-right: 9px; opacity: 1; }
        .ct-two { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .ct-check { display: flex; align-items: flex-start; gap: 11px; cursor: pointer; font-size: 14.5px; line-height: 1.5; color: ${T.text}; }
        .ct-check input { margin-top: 3px; width: 16px; height: 16px; accent-color: ${T.ink}; flex: none; }
        .ct-btn { display: inline-block; padding: 17px 34px; background: ${T.ink}; color: ${T.cream} !important; border: 0; cursor: pointer; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
        .ct-btn:hover { background: ${T.text}; }
        .ct-btn[disabled] { opacity: 0.65; cursor: default; }
        .ct-link { display: inline-block; cursor: pointer; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; padding: 0 0 4px; font-family: ${FONT_BODY}; font-size: 11.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; transition: border-color 0.2s ease; }
        .ct-link:hover { border-bottom-color: ${T.gold}; }
        .ct-error { margin: 0 0 18px; padding: 14px 16px; background: #FBEDEA; border: 1px solid #E4C4BD; font-size: 14px; line-height: 1.6; color: #8F3222; }
        .ct-sent { padding: clamp(32px, 4vw, 52px) clamp(20px, 3vw, 36px); border: 1px solid ${T.line}; text-align: center; }

        .ct-photo { position: relative; aspect-ratio: 16 / 10; overflow: hidden; background: ${TILE}; }
        .ct-photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .ct-block { padding: 26px 0; border-bottom: 1px solid ${T.line}; }
        .ct-block:last-child { border-bottom: 0; padding-bottom: 0; }
        .ct-hours { display: flex; justify-content: space-between; gap: 16px; font-size: 15px; line-height: 1.9; }

        .ct-depts { background: ${T.sand}; }
        .ct-depts-in { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(32px, 6vw, 104px); align-items: center; padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(56px, 6vw, 96px); }
        .ct-dept { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) auto; gap: 20px; align-items: baseline; padding: 20px 0; border-bottom: 1px solid ${T.ruleStrong}; font-size: 15px; color: ${T.text}; }
        .ct-dept:first-child { border-top: 1px solid ${T.ruleStrong}; }
        .ct-dept span:nth-child(2) { font-size: 14px; opacity: 0.82; }
        .ct-dept span:last-child { font-size: 11.5px; letter-spacing: 0.14em; text-transform: uppercase; white-space: nowrap; }

        @media (max-width: 900px) {
          .ct-ways { grid-template-columns: 1fr; }
          .ct-way { border-left: 0; border-top: 1px solid ${T.line}; }
          .ct-way:first-child { border-top: 0; }
          .ct-main, .ct-depts-in { grid-template-columns: minmax(0, 1fr); }
          .ct-dept { grid-template-columns: minmax(0, 1fr) auto; }
          .ct-dept span:nth-child(2) { display: none; }
        }
        @media (max-width: 560px) {
          .ct-two { grid-template-columns: 1fr; }
          .ct-btn { width: 100%; }
          .ct-photo { margin: 0 calc(-1 * ${pageX}); }
        }
        @media (prefers-reduced-motion: reduce) { .ct-open > * { animation: none !important; } }
      `}</style>

      <NavigationV2 solid />

      <section className="ct-wrap ct-open">
        <div className="ct-crumb"><Link to="/">Home</Link><span>/</span><span>Contact</span></div>
        <h1 className="ct-h1">Contact</h1>
        <p className="ct-p" style={{ maxWidth: "52ch", margin: "22px auto 0" }}>Questions about a piece, a commission or a repair? Speak to the people who make and mend our jewellery: by phone, by email, or across the counter in Beeston.</p>
        <div className="ct-ways">
          {channels.map((c) => {
            const inner = <><span className="ct-eyebrow">{c.label}</span><span className="v">{c.value}</span><span className="n">{c.note}</span></>;
            return c.href.startsWith("/")
              ? <Link key={c.label} to={c.href} className="ct-way">{inner}</Link>
              : <a key={c.label} href={c.href} className="ct-way">{inner}</a>;
          })}
        </div>
      </section>

      <main className="ct-wrap ct-main">
        {/* Enquiry form */}
        <div>
          <div className="ct-eyebrow">Send an enquiry</div>
          <h2 className="ct-h2" style={{ marginTop: 16 }}>Tell us what you’re after.</h2>
          <p className="ct-p" style={{ maxWidth: "50ch", margin: "16px 0 32px" }}>Choose a subject and we’ll route your message to the right bench. The more detail you give, the better we can help.</p>

          {sent ? (
            <div className="ct-sent" role="status">
              <h3 className="ct-h2" style={{ fontSize: 26 }}>Thank you. Your enquiry is on its way.</h3>
              <p className="ct-p" style={{ margin: "14px 0 24px" }}>We reply within one working day. For anything urgent, call 0115 925 7552.</p>
              <button type="button" className="ct-link" onClick={() => { setSent(false); setForm(EMPTY); }}>Send another</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} data-enqform>
              <div className="ct-label" id="ct-subject">Subject</div>
              <div className="ct-chips" role="group" aria-labelledby="ct-subject" style={{ marginBottom: 26 }}>
                {SUBJECTS.map(s => (
                  <button type="button" key={s.value} className="ct-chip" data-kind={s.placeholder} aria-pressed={form.subject === s.value} onClick={() => set("subject", s.value)}>
                    <svg height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true"><path d="M1 5.2l3.2 3.2L11 1.4" stroke={T.gold} strokeWidth="1.4" /></svg>{s.label}
                  </button>
                ))}
              </div>

              <div className="ct-two" style={{ marginBottom: 18 }}>
                <div>
                  <label className="ct-label" htmlFor="ct-name">Name</label>
                  <input id="ct-name" className="ct-input" required autoComplete="name" value={form.name} onChange={e => set("name", e.target.value)} />
                </div>
                <div>
                  <label className="ct-label" htmlFor="ct-tel">Telephone <em>(optional)</em></label>
                  <input id="ct-tel" className="ct-input" type="tel" autoComplete="tel" value={form.phone} onChange={e => set("phone", e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label className="ct-label" htmlFor="ct-email">Email</label>
                <input id="ct-email" className="ct-input" type="email" required autoComplete="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="ct-label" htmlFor="ct-message">Message</label>
                <textarea id="ct-message" className="ct-input" required rows={6} value={form.message} onChange={e => set("message", e.target.value)} placeholder={placeholder} />
              </div>

              <label className="ct-check" style={{ marginBottom: 28 }}>
                <input type="checkbox" checked={form.newsletter} onChange={e => set("newsletter", e.target.checked)} />
                Keep me posted on new pieces and events.
              </label>

              {/* Spam trap: hidden from people, often filled in by bots */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={website} onChange={e => setWebsite(e.target.value)}
                style={{ position: "absolute", left: "-10000px", width: 1, height: 1, opacity: 0 }} />

              {error && <p role="alert" className="ct-error">{error}</p>}

              <button type="submit" disabled={sending} className="ct-btn">{sending ? "Sending…" : "Send enquiry"}</button>
            </form>
          )}
        </div>

        {/* The showroom */}
        <aside>
          <div className="ct-photo"><img src="/images/shopfront-2-upscaled.webp" alt="McCulloch showroom, Beeston" /></div>
          <div className="ct-block">
            <div className="ct-eyebrow">Address</div>
            <p className="ct-p" style={{ margin: "12px 0 14px" }}>McCulloch Jewellers<br />7 The Square, Beeston<br />Nottingham NG9 2JG</p>
            <a href="https://maps.google.com/?q=7+The+Square+Beeston+Nottingham+NG9+2JG" target="_blank" rel="noreferrer" className="ct-link">Directions</a>
          </div>
          <div className="ct-block">
            <div className="ct-eyebrow" style={{ marginBottom: 10 }}>Opening hours</div>
            <div className="ct-hours"><span>Monday to Saturday</span><span>9:00 to 5:30</span></div>
            <div className="ct-hours" style={{ color: T.textMuted }}><span>Sunday</span><span>Closed</span></div>
          </div>
          <div className="ct-block">
            <div className="ct-eyebrow">Appointments</div>
            <p className="ct-p" style={{ margin: "12px 0 16px" }}>Free, and about an hour. Bring a stone, a sketch or just an idea.</p>
            <Link to="/book-appointment" className="ct-link">Book an appointment</Link>
          </div>
        </aside>
      </main>

      {/* Departments: the page's one sand band */}
      <section className="ct-depts">
        <div className="ct-wrap ct-depts-in">
          <div>
            <div className="ct-eyebrow">Departments</div>
            <h2 className="ct-h2" style={{ margin: "18px 0 16px", maxWidth: "14ch" }}>Straight to the right bench.</h2>
            <p className="ct-p" style={{ maxWidth: "36ch", marginBottom: 26 }}>Every enquiry reaches the person who does the work. No call centre, no queue.</p>
            <a href="tel:01159257552" className="ct-link" style={{ fontSize: 13 }}>0115 925 7552</a>
          </div>
          <div>
            {DEPARTMENTS.map(d => (
              <div key={d.name} className="ct-dept"><span>{d.name}</span><span>{d.note}</span><span>Ext. {d.ext}</span></div>
            ))}
          </div>
        </div>
      </section>

      <FooterV2 />
    </div>
  );
};

export default ContactV2;
