import React, { useState } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";

/**
 * Bespoke Design — v2 redesign (design_handoff_mcculloch_bespoke_story_thankyou).
 * Hero film, "your vision", ink process timeline, commissioned portfolio, FAQ
 * and a working enquiry form whose message placeholder follows the commission
 * type. Original preserved at pages/BespokeDesign.original.tsx.
 */

const NAV_H = 96;
const pageX = "clamp(24px, 4vw, 64px)";
const eyebrow: React.CSSProperties = { fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold };

const STAT_ROW = [
  { big: "6 weeks", small: "Typical lead time" },
  { big: "Free", small: "First consultation" },
  { big: "100%", small: "Made on site in Beeston" },
];

const PROCESS = [
  { title: "Consultation", note: "We talk through the idea, the stone and the budget — in person or by video.", when: "Week one" },
  { title: "Drawings", note: "Hand sketches then a CAD render you approve before anything is cut.", when: "Weeks one to two" },
  { title: "The stone", note: "We source and show you certified options to sign off in person.", when: "Week two" },
  { title: "Making", note: "Cast, set and finished at our bench, with photos along the way.", when: "Weeks three to six" },
];

const PORTFOLIO = [
  { kind: "Engagement", title: "The hidden halo", story: "A 1928 old European cut, kept from a grandmother’s ring, reset into a hidden-halo band.", image: "/images/commission-hidden-halo.jpeg" },
  { kind: "Eternity", title: "Three sapphires", story: "Three Ceylon sapphires marking three decades, set between brilliant-cut diamonds.", image: "/images/commission-three-sapphires.jpeg" },
  { kind: "Remodel", title: "Two into one", story: "Two inherited rings that were never worn, remade as a single eternity band.", image: "/images/commission-two-into-one.jpeg" },
];

const FAQS = [
  { id: "time", q: "How long does a commission take?", a: "Most commissions take about six weeks from approved design to finished piece. Simpler bands can be quicker; intricate settings or sourced stones can take longer. We give you a firm timeline at consultation." },
  { id: "cost", q: "What does a bespoke piece cost?", a: "Most commissions fall between £2,000 and £8,000, driven mostly by the centre stone. We agree a firm price before any making begins — there are no surprises later." },
  { id: "stone", q: "Can I use my own stone or an heirloom?", a: "Yes — inherited stones and old pieces are welcome. We assess them with you, advise on what will and won’t work, and reset or remodel accordingly." },
  { id: "commit", q: "Does the consultation commit me to anything?", a: "No. The first consultation is free and without obligation. You only commit once you’ve approved a design and a firm price." },
  { id: "remodel", q: "Can you remodel an existing piece?", a: "Often, yes. We can remodel or combine existing jewellery into something you’ll actually wear, keeping the stones and the story." },
];

const KINDS = [
  { id: "engagement", label: "Engagement ring", ph: "Cut and setting you have in mind, ring size if you know it, and whether there is a date to meet." },
  { id: "wedding", label: "Wedding band", ph: "Metal, width and finish you like, and whether it needs to match an existing ring." },
  { id: "remodel", label: "Remodelling", ph: "What the piece is now, roughly when it was made, and what you would like it to become." },
  { id: "anniversary", label: "Anniversary", ph: "The occasion, any stones you already own, and what you have in mind." },
  { id: "gift", label: "A gift", ph: "Who it’s for, the occasion and date, and anything you know about their taste." },
  { id: "other", label: "Something else", ph: "Tell us what you have in mind and we’ll take it from there." },
];

const BUDGETS = ["Under £2k", "£2–5k", "£5–10k", "£10k+"];

const REASSURANCES = [
  "No obligation — the first consultation is free",
  "A firm price agreed before we make anything",
  "Your own stones and heirlooms are welcome",
  "Certification and lifetime servicing included",
];

const BespokeDesignV2 = (): JSX.Element => {
  const [faq, setFaq] = useState<string | null>("time");
  const [kind, setKind] = useState("engagement");
  const [budget, setBudget] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const placeholder = KINDS.find((k) => k.id === kind)?.ph || "Tell us what you have in mind.";
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Bespoke enquiry:", { kind, budget, ...form });
    setSent(true);
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "13px 0", background: "transparent", border: 0, borderBottom: `1px solid ${T.ruleStrong}`,
    outline: "none", color: T.ink, fontFamily: FONT_BODY, fontSize: 15,
  };
  const fieldLabel: React.CSSProperties = { display: "block", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 4 };

  const chip = (active: boolean): React.CSSProperties => ({
    padding: "11px 8px", textAlign: "center", fontSize: 13, cursor: "pointer",
    background: active ? T.ink : "transparent", color: active ? T.paper : T.body,
    border: `1px solid ${active ? T.ink : T.ruleStrong}`, transition: "background 0.2s, color 0.2s, border-color 0.2s",
  });

  return (
    <div style={{ background: T.paper, minHeight: "100vh", fontFamily: FONT_BODY, color: T.body }}>
      <style>{`
        .bsp-fill:hover { background: #E9E2D2 !important; }
        .bsp-outline:hover { background: rgba(255,255,255,0.08) !important; }
        .bsp-cta:hover { background: ${T.inkDeep} !important; }
        .bsp-link:hover { color: ${T.gold} !important; }
        .bsp-faq-icon { transition: transform 0.28s cubic-bezier(0.22,1,0.36,1); }
        .bsp-faq-open .bsp-faq-icon { transform: rotate(45deg); }
        .bsp-port img { transition: transform 0.7s cubic-bezier(0.22,1,0.36,1); }
        .bsp-port:hover img { transform: scale(1.04); }
        @media (max-width: 900px) {
          .bsp-vision, .bsp-proctop, .bsp-faq, .bsp-enquiry { grid-template-columns: 1fr !important; }
          .bsp-procgrid { grid-template-columns: 1fr !important; }
          .bsp-proc-stage { flex-direction: row !important; align-items: baseline; gap: 16px; border-right: none !important; border-top: 1px solid ${T.ruleDark}; padding: 20px 0 !important; }
          .bsp-proc-when { margin-top: 0 !important; }
          .bsp-proc-body { flex: 1; }
          .bsp-portgrid { grid-auto-flow: column; grid-template-columns: none; grid-auto-columns: 78%; overflow-x: auto; scroll-snap-type: x mandatory; }
          .bsp-portgrid > * { scroll-snap-align: start; }
          .bsp-kinds { grid-template-columns: 1fr 1fr !important; }
          .bsp-namephone { grid-template-columns: 1fr !important; }
          .bsp-contactroutes { order: 3; margin-top: 28px; }
          .bsp-herobtns { flex-direction: column !important; align-items: stretch !important; }
        }
      `}</style>

      <NavigationV2 solid />

      {/* 1 — Hero */}
      <section style={{ position: "relative", height: "clamp(520px, 72vh, 760px)", minHeight: 520, background: T.inkDeep, overflow: "hidden", marginTop: 0 }}>
        <video autoPlay muted loop playsInline preload="auto" poster="/videos/workshop-poster.jpg" aria-label="Bespoke commissions at the bench"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}>
          <source src="/videos/workshop.webm" type="video/webm" />
          <source src="/videos/workshop.mp4" type="video/mp4" />
        </video>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(18,16,13,0.82), rgba(18,16,13,0) 52%, rgba(18,16,13,0.3))" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: `0 ${pageX} clamp(40px, 5vw, 72px)` }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ ...eyebrow, color: "#C9A24B", marginBottom: 18 }}>Bespoke</div>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(42px, 5vw, 78px)", lineHeight: 1.03, color: "#F6F1E7", fontWeight: 400, margin: 0 }}>
              Nothing here yet. That is the point.
            </h1>
            <p style={{ fontSize: 15.5, color: "#D9D1C4", lineHeight: 1.7, maxWidth: "42ch", marginTop: 20 }}>
              A bespoke commission starts as a conversation and ends as the one piece no one else owns — designed with you and made on our bench in Beeston.
            </p>
            <div className="bsp-herobtns" style={{ display: "flex", gap: 14, marginTop: 28 }}>
              <a href="#enquiry" className="bsp-fill" style={{ padding: "15px 32px", background: "#F3EEE4", color: T.ink, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.25s", textAlign: "center" }}>Start a commission</a>
              <a href="#process" className="bsp-outline" style={{ padding: "15px 32px", background: "transparent", color: "#F3EEE4", border: "1px solid rgba(243,238,228,0.5)", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", textDecoration: "none", transition: "background 0.25s", textAlign: "center" }}>See how it works</a>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Your vision */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: `clamp(56px, 7vw, 104px) ${pageX}` }}>
        <div className="bsp-vision" style={{ display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: "clamp(32px, 5vw, 80px)", alignItems: "center" }}>
          <div style={{ aspectRatio: "4 / 5", background: T.tint, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: T.muted, fontSize: 15 }}>
            <img src="/images/bespoke-design-sketch.jpeg" alt="Hand-drawn ring design sketch" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div>
            <div style={{ ...eyebrow, marginBottom: 20 }}>Your vision</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(30px, 3.4vw, 52px)", lineHeight: 1.08, color: T.ink, fontWeight: 400, margin: 0 }}>
              It begins with a conversation.
            </h2>
            <p style={{ fontSize: 15.5, color: T.body, lineHeight: 1.75, marginTop: 22 }}>
              Bring a stone you already own, a photograph, a rough budget, or nothing but an idea. We listen first, then draw — nothing is cast until you have approved a design you love.
            </p>
            <p style={{ fontSize: 15.5, color: T.body, lineHeight: 1.75, marginTop: 14 }}>
              Every commission is made by hand on our own bench, by the same jewellers who will look after it for its lifetime.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginTop: 32, paddingTop: 28, borderTop: `1px solid ${T.rule}` }}>
              {STAT_ROW.map((s) => (
                <div key={s.big}>
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(24px, 2.4vw, 34px)", color: T.ink, lineHeight: 1 }}>{s.big}</div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 8, lineHeight: 1.4 }}>{s.small}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3 — The process */}
      <section id="process" style={{ background: T.ink, color: T.onDarkSoft }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: `clamp(56px, 7vw, 104px) ${pageX}` }}>
          <div className="bsp-proctop" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "clamp(24px, 4vw, 72px)", alignItems: "center", paddingBottom: 40, borderBottom: `1px solid ${T.ruleDark}` }}>
            <div>
              <div style={{ ...eyebrow, marginBottom: 16 }}>The process</div>
              <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 3vw, 46px)", lineHeight: 1.08, color: "#F4EFE6", fontWeight: 400, margin: 0 }}>
                Four steps, about six weeks.
              </h2>
            </div>
            <p style={{ fontSize: 15.5, color: T.onDarkBody, lineHeight: 1.75, margin: 0 }}>
              From the first conversation to the finished piece, you see and sign off every stage. Nothing is a surprise — not the design, not the stone, and not the price.
            </p>
          </div>

          <div className="bsp-procgrid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginTop: 40 }}>
            {PROCESS.map((s, i) => (
              <div key={s.title} className="bsp-proc-stage" style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0 clamp(20px, 2vw, 36px)", paddingLeft: i === 0 ? 0 : undefined, borderRight: i < PROCESS.length - 1 ? `1px solid ${T.ruleDark}` : "none" }}>
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 3vw, 46px)", color: T.gold, lineHeight: 1 }}>{["I", "II", "III", "IV"][i]}</span>
                <div className="bsp-proc-body">
                  <div style={{ fontSize: 15.5, color: "#F4EFE6", marginTop: 16 }}>{s.title}</div>
                  <p style={{ fontSize: 13.5, color: T.onDarkMuted, lineHeight: 1.6, marginTop: 8 }}>{s.note}</p>
                </div>
                <div className="bsp-proc-when" style={{ marginTop: "auto", paddingTop: 20, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.gold }}>{s.when}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Commissioned */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: `clamp(56px, 7vw, 104px) ${pageX}` }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, paddingBottom: 22, borderBottom: `1px solid ${T.rule}` }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: 14 }}>Commissioned</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(26px, 2.8vw, 42px)", lineHeight: 1.08, color: T.ink, fontWeight: 400, margin: 0 }}>Recently, at the bench.</h2>
          </div>
        </div>
        <div className="bsp-portgrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(20px, 2.5vw, 40px)", marginTop: 40 }}>
          {PORTFOLIO.map((p) => (
            <div key={p.title} className="bsp-port">
              <div style={{ aspectRatio: "4 / 5", background: T.tint, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_DISPLAY, color: T.muted, fontSize: 14 }}>
                {(p as { image?: string }).image
                  ? <img src={(p as { image?: string }).image} alt={p.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : p.title}
              </div>
              <div style={{ fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: T.gold, marginTop: 16 }}>{p.kind}</div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: T.ink, marginTop: 6 }}>{p.title}</div>
              <p style={{ fontSize: 14, color: T.body, lineHeight: 1.65, marginTop: 8 }}>{p.story}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 — FAQ */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: `0 ${pageX} clamp(56px, 7vw, 104px)` }}>
        <div className="bsp-faq" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "clamp(32px, 5vw, 80px)", alignItems: "start" }}>
          <div>
            <div style={{ ...eyebrow, marginBottom: 16 }}>Questions</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 3vw, 46px)", lineHeight: 1.08, color: T.ink, fontWeight: 400, margin: 0 }}>Before you begin.</h2>
            <p style={{ fontSize: 15, color: T.body, lineHeight: 1.7, marginTop: 18 }}>The four things people most want to know before making a bespoke enquiry.</p>
          </div>
          <div>
            {FAQS.map((f, i) => {
              const open = faq === f.id;
              return (
                <div key={f.id} className={open ? "bsp-faq-open" : ""} style={{ borderTop: i === 0 ? `1px solid ${T.rule}` : undefined, borderBottom: `1px solid ${T.rule}` }}>
                  <button
                    onClick={() => setFaq(open ? null : f.id)}
                    aria-expanded={open}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "20px 0", background: "transparent", border: 0, cursor: "pointer", textAlign: "left" }}
                  >
                    <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: T.ink }}>{f.q}</span>
                    <span className="bsp-faq-icon" style={{ fontSize: 22, color: T.gold, lineHeight: 1, flexShrink: 0 }}>+</span>
                  </button>
                  <div style={{ maxHeight: open ? 240 : 0, overflow: "hidden", transition: "max-height 0.34s cubic-bezier(0.22,1,0.36,1)" }}>
                    <p style={{ fontSize: 14.5, color: T.body, lineHeight: 1.7, paddingBottom: 22, maxWidth: "60ch" }}>{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6 — Enquiry */}
      <section id="enquiry" style={{ background: T.tint }}>
        <div className="bsp-enquiry" style={{ maxWidth: 1240, margin: "0 auto", padding: `clamp(56px, 7vw, 104px) ${pageX}`, display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "clamp(36px, 5vw, 88px)", alignItems: "start" }}>
          {/* Left */}
          <div style={{ alignSelf: "center" }}>
            <div style={{ ...eyebrow, marginBottom: 16 }}>Enquiry</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(28px, 3.2vw, 50px)", lineHeight: 1.06, color: T.ink, fontWeight: 400, margin: 0 }}>Create something extraordinary.</h2>
            <p style={{ fontSize: 15.5, color: T.body, lineHeight: 1.75, marginTop: 20 }}>
              Tell us a little about what you have in mind. We’ll reply within one working day to arrange your free consultation.
            </p>

            <div style={{ marginTop: 28 }}>
              {REASSURANCES.map((r, i) => (
                <div key={r} style={{ display: "grid", gridTemplateColumns: "28px 1fr", alignItems: "baseline", gap: 8, padding: "14px 0", borderTop: `1px solid ${T.ruleSoft}` }}>
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: T.gold }}>{["I", "II", "III", "IV"][i]}</span>
                  <span style={{ fontSize: 14, color: T.body, lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>

            <div className="bsp-contactroutes" style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 6 }}>
              <a href="tel:01159257552" className="bsp-link" style={{ fontSize: 14, color: T.ink, textDecoration: "none", transition: "color 0.2s" }}>Call · 0115 925 7552</a>
              <a href="mailto:has@mccullochjewellers.co.uk" className="bsp-link" style={{ fontSize: 14, color: T.ink, textDecoration: "none", transition: "color 0.2s" }}>Email · has@mccullochjewellers.co.uk</a>
              <Link to="/visit-us" className="bsp-link" style={{ fontSize: 14, color: T.ink, textDecoration: "none", transition: "color 0.2s" }}>Visit · 7 The Square, Beeston</Link>
            </div>
          </div>

          {/* Right — form */}
          <div style={{ background: T.paper, padding: "clamp(28px, 3vw, 44px)", border: `1px solid ${T.rule}` }}>
            {sent ? (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: T.ink, marginBottom: 12 }}>Thank you.</div>
                <p style={{ fontSize: 14.5, color: T.body, lineHeight: 1.7, maxWidth: 380, margin: "0 auto" }}>
                  Your enquiry is with our bespoke team. We’ll be in touch within one working day to arrange your consultation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Commission type */}
                <div style={{ ...fieldLabel, marginBottom: 10 }}>Commission type</div>
                <div className="bsp-kinds" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {KINDS.map((k) => (
                    <button type="button" key={k.id} onClick={() => setKind(k.id)} style={chip(kind === k.id)}>{k.label}</button>
                  ))}
                </div>

                {/* Budget */}
                <div style={{ ...fieldLabel, margin: "22px 0 10px" }}>Budget guide</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {BUDGETS.map((b) => (
                    <button type="button" key={b} onClick={() => setBudget(budget === b ? "" : b)} style={chip(budget === b)}>{b}</button>
                  ))}
                </div>

                {/* Name + telephone */}
                <div className="bsp-namephone" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 24 }}>
                  <div><label style={fieldLabel}>Name</label><input style={input} value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
                  <div><label style={fieldLabel}>Telephone</label><input style={input} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                </div>
                <div style={{ marginTop: 18 }}><label style={fieldLabel}>Email</label><input style={input} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
                <div style={{ marginTop: 18 }}>
                  <label style={fieldLabel}>Your idea</label>
                  <textarea style={{ ...input, resize: "vertical", minHeight: 110 }} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder={placeholder} rows={5} />
                </div>

                {/* Attachment slot */}
                <label style={{ display: "block", marginTop: 18, padding: "18px", border: `1px dashed ${T.ruleStrong}`, textAlign: "center", cursor: "pointer" }}>
                  <input type="file" style={{ display: "none" }} onChange={() => {}} accept="image/*,.pdf" />
                  <span style={{ fontSize: 13, color: T.muted }}>Attach a sketch, a photograph, or an inspiration image</span>
                </label>

                <button type="submit" className="bsp-cta" style={{ width: "100%", marginTop: 22, padding: "16px", background: T.ink, color: T.paper, border: 0, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.25s" }}>
                  Book a consultation
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <FooterV2 />
    </div>
  );
};

export default BespokeDesignV2;
