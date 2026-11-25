import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import NavigationV2 from "../components/home-v2/NavigationV2";
import FooterV2 from "../components/home-v2/FooterV2";
import GoogleReviewsV2 from "../components/home-v2/GoogleReviewsV2";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import API_BASE_URL from "../config/api";

/**
 * Bespoke Design — light redesign (Nov 2026).
 * Split opening (words beside the workshop film, with the design sketch laid over
 * its corner), a centred "your vision" statement, a four-step process where each
 * step carries a six-week meter, the commissioned pieces as one large and two
 * small, a single-column FAQ and the enquiry form on the page's one sand band.
 * Original preserved at pages/BespokeDesign.original.tsx.
 */

const pageX = "clamp(20px, 4vw, 64px)";
const eyebrow: React.CSSProperties = { fontSize: 11.5, letterSpacing: "0.2em", textTransform: "uppercase", color: T.text };
const h2: React.CSSProperties = { fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(26px, 2.6vw, 38px)", lineHeight: 1.18, margin: 0, color: T.text };
const para: React.CSSProperties = { fontSize: 15.5, lineHeight: 1.75, color: T.text, margin: 0 };

const STAT_ROW = [
  { big: "6 weeks", small: "Typical lead time" },
  { big: "Free", small: "First consultation" },
  { big: "100%", small: "Made on site in Beeston" },
];

// weeks: which of the six weeks each step occupies (drives the meter above it)
const PROCESS = [
  { title: "Consultation", note: "We talk through the idea, the stone and the budget, in person or by video.", when: "Week one", weeks: [1] },
  { title: "Drawings", note: "Hand sketches then a CAD render you approve before anything is cut.", when: "Weeks one to two", weeks: [1, 2] },
  { title: "The stone", note: "We source and show you certified options to sign off in person.", when: "Week two", weeks: [2] },
  { title: "Making", note: "Cast, set and finished at our bench, with photos along the way.", when: "Weeks three to six", weeks: [3, 4, 5, 6] },
];

const PORTFOLIO = [
  { kind: "Engagement", title: "The hidden halo", story: "A 1928 old European cut, kept from a grandmother’s ring, reset into a hidden-halo band.", image: "/images/commission-hidden-halo.jpeg" },
  { kind: "Eternity", title: "Three sapphires", story: "Three Ceylon sapphires marking three decades, set between brilliant-cut diamonds.", image: "/images/commission-three-sapphires.jpeg" },
  { kind: "Remodel", title: "Two into one", story: "Two inherited rings that were never worn, remade as a single eternity band.", image: "/images/commission-two-into-one.jpeg" },
];

const FAQS = [
  { id: "time", q: "How long does a commission take?", a: "Most commissions take about six weeks from approved design to finished piece. Simpler bands can be quicker; intricate settings or sourced stones can take longer. We give you a firm timeline at consultation." },
  { id: "cost", q: "What does a bespoke piece cost?", a: "Most commissions fall between £2,000 and £8,000, driven mostly by the centre stone. We agree a firm price before any making begins, so there are no surprises later." },
  { id: "stone", q: "Can I use my own stone or an heirloom?", a: "Yes. Inherited stones and old pieces are welcome. We assess them with you, advise on what will and won’t work, and reset or remodel accordingly." },
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
  "No obligation. The first consultation is free",
  "A firm price agreed before we make anything",
  "Your own stones and heirlooms are welcome",
  "Certification and lifetime servicing included",
];

const Tick = () => (
  <span className="bsp-tick" aria-hidden="true"><svg width="12" height="9" viewBox="0 0 12 9" fill="none"><path d="M1 4.5l3.2 3.2L11 1" stroke="currentColor" strokeWidth="1.1" /></svg></span>
);

const BespokeDesignV2 = (): JSX.Element => {
  const [faq, setFaq] = useState<string | null>("time");
  const [kind, setKind] = useState("engagement");
  const [budget, setBudget] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [website, setWebsite] = useState(""); // hidden spam trap, as on the contact page
  const [playing, setPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const placeholder = KINDS.find((k) => k.id === kind)?.ph || "Tell us what you have in mind.";
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Section entrances, same behaviour as the home page.
  useEffect(() => {
    const targets = Array.from(rootRef.current?.querySelectorAll(".v2-reveal, .v2-stagger") ?? []);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { targets.forEach((t) => t.classList.add("is-in")); return; }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const toggleFilm = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const goTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id); if (!el) return;
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--v2nav-h")) || 113;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - navH + 1, behavior: "smooth" });
  };

  // Sent through the same endpoint as the contact form, so it reaches the shop's inbox.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true); setError("");
    const label = KINDS.find((k) => k.id === kind)?.label || kind;
    const message = [`Commission type: ${label}`, budget ? `Budget guide: ${budget}` : "", "", form.message].filter((l, i) => l || i === 2).join("\n");
    try {
      const r = await fetch(`${API_BASE_URL}/contact`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, phone: form.phone, email: form.email, subject: "bespoke", message, newsletter: false, website }),
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

  return (
    <div ref={rootRef} className="bsp" style={{ background: T.cream, minHeight: "100vh", fontFamily: FONT_BODY, color: T.text, overflowX: "clip", paddingTop: "var(--v2nav-h, 113px)" }}>
      <style>{`
        .bsp a { color: inherit; text-decoration: none; }
        .bsp-wrap { max-width: 1320px; margin: 0 auto; padding-left: ${pageX}; padding-right: ${pageX}; }

        /* entrances */
        @keyframes bspRise { from { opacity: 0; transform: translateY(20px); } }
        @keyframes bspUnveil { from { clip-path: inset(0 0 100% 0); } to { clip-path: inset(0 0 0 0); } }
        @keyframes bspSettle { from { transform: scale(1.1); } }
        .bsp .v2-reveal:not(.is-in), .bsp .v2-stagger:not(.is-in) > * { opacity: 0; }
        .bsp .v2-reveal.is-in, .bsp .v2-stagger.is-in > * { animation: bspRise 1.1s cubic-bezier(0.22,1,0.36,1) backwards; }
        .bsp .v2-rv-mask.is-in { animation: bspUnveil 1.5s cubic-bezier(0.7,0,0.2,1) backwards; }
        .bsp .v2-rv-mask.is-in > img, .bsp .v2-rv-mask.is-in > video { animation: bspSettle 2.4s cubic-bezier(0.22,1,0.36,1) backwards; }
        .bsp .v2-reveal-d1.is-in { animation-delay: 0.14s; }
        .bsp .v2-reveal-d2.is-in { animation-delay: 0.5s; }
        .bsp .v2-stagger.is-in > :nth-child(2) { animation-delay: 0.12s; }
        .bsp .v2-stagger.is-in > :nth-child(3) { animation-delay: 0.24s; }
        .bsp .v2-stagger.is-in > :nth-child(4) { animation-delay: 0.36s; }
        .bsp .v2-stagger.is-in > :nth-child(n+5) { animation-delay: 0.48s; }

        /* links and buttons */
        .bsp-btn { display: inline-block; padding: 16px 30px; background: ${T.ink}; color: ${T.cream} !important; border: 0; cursor: pointer; font-family: ${FONT_BODY}; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; transition: background 0.3s ease; }
        .bsp-btn:hover { background: ${T.text}; }
        .bsp-btn[disabled] { opacity: 0.6; cursor: default; }
        .bsp-textlink { display: inline-block; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.text}; border-bottom: 1px solid ${T.ruleStrong}; padding: 14px 0 5px; transition: border-color 0.2s ease; }
        .bsp-textlink:hover { border-bottom-color: ${T.gold}; }
        .bsp-route { border-bottom: 1px solid transparent; transition: border-color 0.2s ease; }
        .bsp-route:hover { border-bottom-color: ${T.gold}; }

        /* 1 — opening */
        .bsp-hero { display: grid; grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); gap: clamp(32px, 5vw, 88px); align-items: center; padding-top: clamp(30px, 3.4vw, 52px); padding-bottom: clamp(64px, 7vw, 112px); }
        .bsp-crumb { display: flex; gap: 10px; font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: clamp(28px, 4vw, 60px); }
        .bsp-kicker { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: ${T.gold}; margin: 0 0 18px; }
        .bsp-assure { list-style: none; margin: 30px 0 0; padding: 22px 0 0; border-top: 1px solid ${T.rule}; display: grid; grid-template-columns: repeat(2, minmax(0, max-content)); gap: 12px 36px; font-size: 13.5px; line-height: 1.4; color: ${T.text}; }
        .bsp-assure li { position: relative; padding-left: 15px; }
        .bsp-assure li::before { content: ""; position: absolute; left: 0; top: 0.5em; width: 5px; height: 5px; border-radius: 50%; background: ${T.gold}; }
        .bsp-h1 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(34px, 3.9vw, 56px); line-height: 1.1; margin: 0; color: ${T.text}; text-wrap: balance; }
        .bsp-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 14px 30px; margin-top: 30px; }
        .bsp-stage { position: relative; padding: 0 0 9% 13%; }
        .bsp-film { position: relative; aspect-ratio: 5 / 4; overflow: hidden; background: ${T.sand}; }
        .bsp-film video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 38% 50%; }
        .bsp-pause { position: absolute; right: 14px; bottom: 14px; width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(248,246,240,0.7); background: rgba(28,26,23,0.28); color: ${T.cream}; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: background 0.2s ease; }
        .bsp-pause:hover { background: rgba(28,26,23,0.5); }
        .bsp-sketch { position: absolute; left: 0; bottom: 0; width: 33%; padding: 8px; background: ${T.cream}; border: 1px solid ${T.line}; box-shadow: 0 22px 44px -26px rgba(28,26,23,0.42); }
        .bsp-sketch div { aspect-ratio: 4 / 5; overflow: hidden; background: ${T.sand}; }
        .bsp-sketch img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .bsp-filmnote { position: absolute; right: 0; bottom: calc(9% - 30px); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }

        /* 2 — your vision */
        .bsp-vision { text-align: center; padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(64px, 7vw, 112px); border-top: 1px solid ${T.line}; }
        .bsp-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); max-width: 780px; margin: clamp(36px, 4vw, 56px) auto 0; }
        .bsp-stat { padding: 4px 16px; border-left: 1px solid ${T.line}; }
        .bsp-stat:first-child { border-left: 0; }

        /* 3 — process */
        .bsp-process { padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(64px, 7vw, 112px); border-top: 1px solid ${T.line}; }
        .bsp-proctop { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(24px, 5vw, 88px); align-items: end; }
        .bsp-steps { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: clamp(40px, 4.5vw, 68px); }
        .bsp-step { padding: 0 clamp(18px, 2.2vw, 36px); border-left: 1px solid ${T.line}; }
        .bsp-step:first-child { padding-left: 0; border-left: 0; }
        .bsp-step:last-child { padding-right: 0; }
        .bsp-meter { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
        .bsp-meter i { height: 3px; background: ${T.line}; position: relative; overflow: hidden; }
        .bsp-meter i.on::after { content: ""; position: absolute; inset: 0; background: ${T.gold}; transform: scaleX(0); transform-origin: left; transition: transform 0.5s cubic-bezier(0.22,1,0.36,1); transition-delay: calc(0.5s + var(--w) * 0.16s); }
        .bsp-steps.is-in .bsp-meter i.on::after { transform: scaleX(1); }
        .bsp-when { display: flex; justify-content: space-between; gap: 12px; margin-top: 12px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.text}; }
        .bsp-when span:last-child { color: ${T.textMuted}; }
        .bsp-step h3 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: clamp(21px, 1.8vw, 25px); line-height: 1.2; margin: clamp(26px, 3vw, 40px) 0 10px; color: ${T.text}; }

        /* 4 — commissioned */
        .bsp-work { padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(64px, 7vw, 112px); border-top: 1px solid ${T.line}; }
        .bsp-pieces { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); column-gap: clamp(32px, 5vw, 88px); row-gap: clamp(24px, 3vw, 44px); margin-top: clamp(32px, 3.6vw, 52px); }
        .bsp-piece figure { margin: 0; aspect-ratio: 4 / 5; overflow: hidden; background: ${T.sand}; }
        .bsp-piece img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 1.2s cubic-bezier(0.22,1,0.36,1); }
        .bsp-piece:hover img { transform: scale(1.035); }
        .bsp-piece h3 { font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 23px; line-height: 1.2; margin: 8px 0 8px; color: ${T.text}; }
        .bsp-kind { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.textMuted}; }
        .bsp-piece:first-child { grid-row: 1 / span 2; }
        .bsp-piece:first-child .bsp-ptext { margin-top: 20px; max-width: 46ch; }
        .bsp-piece:not(:first-child) { display: grid; grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr); gap: clamp(20px, 2.4vw, 36px); align-items: center; }
        .bsp-piece:nth-child(2) { align-self: start; }
        .bsp-piece:nth-child(3) { align-self: end; }

        /* 5 — questions */
        .bsp-faq { padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(64px, 7vw, 112px); border-top: 1px solid ${T.line}; }
        .bsp-faqlist { max-width: 820px; margin: clamp(30px, 3.4vw, 48px) auto 0; }
        .bsp-q { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 0; background: transparent; border: 0; cursor: pointer; text-align: left; font-family: ${FONT_DISPLAY}; font-size: clamp(18px, 1.5vw, 21px); line-height: 1.3; color: ${T.text}; }
        .bsp-plus { position: relative; width: 13px; height: 13px; flex: none; color: ${T.gold}; }
        .bsp-plus::before, .bsp-plus::after { content: ""; position: absolute; left: 0; top: 6px; width: 13px; height: 1px; background: currentColor; transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); }
        .bsp-plus::after { transform: rotate(90deg); }
        .bsp-q[aria-expanded="true"] .bsp-plus::after { transform: rotate(0deg); }
        .bsp-a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.36s cubic-bezier(0.22,1,0.36,1); }
        .bsp-a.is-open { grid-template-rows: 1fr; }
        .bsp-a > div { overflow: hidden; }

        /* 6 — enquiry */
        .bsp-enq { background: ${T.sand}; }
        .bsp-enqgrid { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); gap: clamp(36px, 5vw, 88px); align-items: center; padding-top: clamp(56px, 6vw, 96px); padding-bottom: clamp(56px, 6vw, 96px); }
        .bsp-sure { display: grid; grid-template-columns: 26px 1fr; align-items: baseline; padding: 14px 0; border-top: 1px solid ${T.ruleStrong}; font-size: 14.5px; line-height: 1.5; color: ${T.text}; }
        .bsp-sure svg { color: ${T.gold}; }
        .bsp-card { background: ${T.cream}; padding: clamp(24px, 3vw, 44px); border: 1px solid ${T.line}; }
        .bsp-label { display: block; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; margin-bottom: 6px; }
        .bsp-input { width: 100%; padding: 11px 0 12px; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; border-radius: 0; outline: none; color: ${T.text}; font-family: ${FONT_BODY}; font-size: 16px; transition: border-color 0.2s ease; }
        .bsp-input:focus { border-bottom-color: ${T.text}; }
        .bsp-input::placeholder { color: ${T.textMuted}; opacity: 0.75; }
        .bsp-chips { display: grid; gap: 8px; }
        .bsp-chip { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 6px 8px; cursor: pointer; background: transparent; border: 1px solid ${T.line}; font-family: ${FONT_BODY}; font-size: 14px; color: ${T.text}; transition: border-color 0.2s ease, background 0.2s ease; }
        .bsp-chip:hover { border-color: ${T.ruleStrong}; }
        .bsp-chip[aria-pressed="true"] { border-color: ${T.text}; background: #FBFAF6; }
        .bsp-tick { display: inline-flex; width: 0; overflow: hidden; opacity: 0; transition: width 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease; }
        .bsp-chip[aria-pressed="true"] .bsp-tick { width: 19px; opacity: 1; }

        @media (max-width: 1023px) {
          .bsp-hero { grid-template-columns: 1fr; gap: 40px; }
          .bsp-crumb { margin-bottom: 26px; }
          .bsp-herotext { max-width: 620px; }
          .bsp-proctop { grid-template-columns: 1fr; gap: 16px; }
          .bsp-steps { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: 48px; }
          .bsp-step:nth-child(odd) { padding-left: 0; border-left: 0; }
          .bsp-step:nth-child(even) { padding-right: 0; }
          /* commissioned: one swipe row */
          .bsp-pieces { display: grid; grid-auto-flow: column; grid-template-columns: none; grid-auto-columns: min(78%, 420px); column-gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; margin-right: calc(-1 * ${pageX}); padding-right: ${pageX}; }
          .bsp-pieces::-webkit-scrollbar { display: none; }
          .bsp-piece, .bsp-piece:first-child, .bsp-piece:not(:first-child), .bsp-piece:nth-child(3) { display: block; grid-row: 1; scroll-snap-align: start; align-self: start; }
          .bsp-piece .bsp-ptext, .bsp-piece:first-child .bsp-ptext { margin-top: 18px; }
          .bsp-enqgrid { grid-template-columns: 1fr; align-items: start; }
        }
        @media (max-width: 640px) {
          .bsp-stage { padding: 0 0 13% 0; margin-right: calc(-1 * ${pageX}); }
          .bsp-sketch { left: 0; width: 36%; padding: 6px; }
          .bsp-filmnote { right: ${pageX}; bottom: calc(13% - 28px); }
          .bsp-actions .bsp-btn { width: 100%; }
          .bsp-assure { grid-template-columns: 1fr; gap: 10px; }
          .bsp-stats { grid-template-columns: 1fr; max-width: 300px; }
          .bsp-stat { border-left: 0; border-top: 1px solid ${T.line}; padding: 20px 0; }
          .bsp-stat:first-child { border-top: 0; padding-top: 0; }
          .bsp-steps { grid-template-columns: 1fr; row-gap: 0; }
          .bsp-step, .bsp-step:nth-child(even) { padding: 30px 0 0; margin-top: 30px; border-left: 0; }
          .bsp-step:first-child { margin-top: 0; padding-top: 0; }
          .bsp-step h3 { margin-top: 22px; }
          .bsp-kinds { grid-template-columns: 1fr 1fr !important; }
          .bsp-budgets { grid-template-columns: 1fr 1fr !important; }
          .bsp-namephone { grid-template-columns: 1fr !important; }
          .bsp-card { margin: 0 calc(-1 * ${pageX} + 12px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bsp .v2-reveal, .bsp .v2-stagger > * { opacity: 1 !important; animation: none !important; }
          .bsp .v2-rv-mask > * { animation: none !important; }
          .bsp-meter i.on::after { transition: none; transform: scaleX(1); }
          .bsp-a, .bsp-piece img, .bsp-tick { transition: none; }
        }
      `}</style>

      <NavigationV2 solid />

      {/* 1 — Opening: the words beside the film, the drawing laid over its corner */}
      <section className="bsp-wrap bsp-hero">
        <div className="bsp-herotext v2-stagger">
          <div className="bsp-crumb"><Link to="/">Home</Link><span>/</span><span style={{ color: T.text }}>Bespoke</span></div>
          <div className="bsp-kicker">Bespoke jewellery</div>
          <h1 className="bsp-h1">The Art of Creating Something Truly Yours.</h1>
          <p style={{ ...para, maxWidth: "52ch", marginTop: 22 }}>
            Discover the exceptional craftsmanship of a fifth-generation jeweller. From your initial inspiration to the finest finishing details, work directly with our expert jeweller to create a truly personal piece of jewellery, individually designed and crafted in our Beeston workshop.
          </p>
          <div className="bsp-actions">
            <a href="#enquiry" onClick={goTo("enquiry")} data-goto="enquiry" className="bsp-btn">Book a private consultation</a>
            <a href="#process" onClick={goTo("process")} data-goto="process" className="bsp-textlink">Explore our bespoke process</a>
          </div>
          <ul className="bsp-assure">
            <li>Five Generations of Expertise</li>
            <li>Exceptional Gemstones</li>
            <li>Personal Design Consultations</li>
            <li>In-House Craftsmanship</li>
          </ul>
        </div>
        <div className="bsp-stage">
          <div className="bsp-film v2-reveal v2-rv-mask v2-reveal-d1">
            <video ref={videoRef} autoPlay muted loop playsInline preload="auto" poster="/videos/workshop-poster.jpg" aria-label="A jeweller at work at the bench">
              <source src="/videos/workshop.webm" type="video/webm" />
              <source src="/videos/workshop.mp4" type="video/mp4" />
            </video>
            <button type="button" className="bsp-pause" data-film onClick={toggleFilm} aria-label={playing ? "Pause the film" : "Play the film"}>
              {playing
                ? <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M2 1v10M8 1v10" stroke="currentColor" strokeWidth="1.4" /></svg>
                : <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden="true"><path d="M1.500 1l8 5-8 5z" fill="currentColor" /></svg>}
            </button>
          </div>
          <div className="bsp-sketch v2-reveal v2-reveal-d2">
            <div><img src="/images/bespoke-design-sketch.jpeg" alt="Hand-drawn design for a solitaire ring, with measurements" /></div>
          </div>
          <div className="bsp-filmnote">At the bench, Beeston</div>
        </div>
      </section>

      {/* 2 — Your vision */}
      <section className="bsp-wrap">
        <div className="bsp-vision">
          <div className="v2-stagger" style={{ maxWidth: 660, margin: "0 auto" }}>
            <div style={{ ...eyebrow, marginBottom: 18 }}>Your vision</div>
            <h2 style={h2}>It begins with a conversation.</h2>
            <p style={{ ...para, marginTop: 22 }}>
              Bring a stone you already own, a photograph, a rough budget, or nothing but an idea. We listen first, then draw. Nothing is cast until you have approved a design you love.
            </p>
            <p style={{ ...para, marginTop: 14 }}>
              Every commission is made by hand on our own bench, by the same jewellers who will look after it for its lifetime.
            </p>
          </div>
          <div className="bsp-stats v2-stagger">
            {STAT_ROW.map((s) => (
              <div key={s.big} className="bsp-stat">
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(27px, 2.5vw, 35px)", lineHeight: 1.1, color: T.text }}>{s.big}</div>
                <div style={{ fontSize: 13, color: T.textMuted, marginTop: 9, lineHeight: 1.4 }}>{s.small}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — The process: each step carries its share of the six weeks */}
      <section id="process" className="bsp-wrap">
        <div className="bsp-process">
          <div className="bsp-proctop v2-stagger">
            <div>
              <div style={{ ...eyebrow, marginBottom: 18 }}>The process</div>
              <h2 style={h2}>Four steps, about six weeks.</h2>
            </div>
            <p style={{ ...para, maxWidth: "52ch" }}>
              From the first conversation to the finished piece, you see and sign off every stage. Nothing is a surprise: not the design, not the stone, and not the price.
            </p>
          </div>
          <div className="bsp-steps v2-stagger">
            {PROCESS.map((s, i) => (
              <div key={s.title} className="bsp-step">
                <div className="bsp-meter" role="img" aria-label={s.when}>
                  {[1, 2, 3, 4, 5, 6].map((w) => <i key={w} className={s.weeks.includes(w) ? "on" : ""} style={{ ["--w" as string]: w } as React.CSSProperties} />)}
                </div>
                <div className="bsp-when"><span>{s.when}</span><span>{`0${i + 1}`}</span></div>
                <h3>{s.title}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: T.text, margin: 0, maxWidth: "34ch" }}>{s.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Commissioned: one large, two small */}
      <section className="bsp-wrap">
        <div className="bsp-work">
          <div className="v2-stagger" style={{ textAlign: "center" }}>
            <div style={{ ...eyebrow, marginBottom: 18 }}>Commissioned</div>
            <h2 style={h2}>Recently, at the bench.</h2>
          </div>
          <div className="bsp-pieces">
            {PORTFOLIO.map((p, i) => (
              <article key={p.title} className={`bsp-piece v2-reveal${i ? " v2-reveal-d1" : ""}`}>
                <figure><img src={p.image} alt={`${p.title}, ${p.kind.toLowerCase()} commission`} loading="lazy" /></figure>
                <div className="bsp-ptext">
                  <div className="bsp-kind">{p.kind}</div>
                  <h3>{p.title}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.65, color: T.text, margin: 0 }}>{p.story}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — Questions */}
      <section className="bsp-wrap">
        <div className="bsp-faq">
          <div className="v2-stagger" style={{ textAlign: "center" }}>
            <div style={{ ...eyebrow, marginBottom: 18 }}>Questions</div>
            <h2 style={h2}>Before you begin.</h2>
            <p style={{ ...para, marginTop: 16 }}>What people most want to know before making a bespoke enquiry.</p>
          </div>
          <div className="bsp-faqlist v2-reveal">
            {FAQS.map((f, i) => {
              const open = faq === f.id;
              return (
                <div key={f.id} style={{ borderTop: i === 0 ? `1px solid ${T.line}` : undefined, borderBottom: `1px solid ${T.line}` }}>
                  <button type="button" className="bsp-q" data-faq onClick={() => setFaq(open ? null : f.id)} aria-expanded={open}>
                    <span>{f.q}</span>
                    <span className="bsp-plus" aria-hidden="true" />
                  </button>
                  <div className={`bsp-a${open ? " is-open" : ""}`}>
                    <div><p style={{ fontSize: 15, lineHeight: 1.75, color: T.text, margin: 0, paddingBottom: 24, maxWidth: "64ch" }}>{f.a}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6 — Enquiry: the page's one sand band */}
      <section id="enquiry" className="bsp-enq">
        <div className="bsp-wrap bsp-enqgrid">
          <div className="v2-stagger">
            <div style={{ ...eyebrow, marginBottom: 18 }}>Enquiry</div>
            <h2 style={h2}>Create something extraordinary.</h2>
            <p style={{ ...para, marginTop: 18, maxWidth: "46ch" }}>
              Tell us a little about what you have in mind. We’ll reply within one working day to arrange your free consultation.
            </p>
            <div style={{ marginTop: 28, borderBottom: `1px solid ${T.ruleStrong}` }}>
              {REASSURANCES.map((r) => (
                <div key={r} className="bsp-sure">
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none" aria-hidden="true"><path d="M1 4.5l3.2 3.2L11 1" stroke="currentColor" strokeWidth="1.2" /></svg>
                  <span>{r}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 26, display: "grid", gridTemplateColumns: "58px 1fr", rowGap: 9, fontSize: 14.5, color: T.text }}>
              <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", alignSelf: "center" }}>Call</span>
              <span><a href="tel:01159257552" className="bsp-route">0115 925 7552</a></span>
              <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", alignSelf: "center" }}>Email</span>
              <span><a href="mailto:has@mccullochjewellers.co.uk" className="bsp-route">has@mccullochjewellers.co.uk</a></span>
              <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", alignSelf: "center" }}>Visit</span>
              <span><Link to="/visit-us" className="bsp-route">7 The Square, Beeston</Link></span>
            </div>
          </div>

          <div className="bsp-card v2-reveal v2-reveal-d1">
            {sent ? (
              <div data-thanks style={{ padding: "48px 0", textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, color: T.text, marginBottom: 12 }}>Thank you.</div>
                <p style={{ ...para, fontSize: 15, maxWidth: 380, margin: "0 auto" }}>
                  Your enquiry is with our bespoke team. We’ll be in touch within one working day to arrange your consultation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} data-enqform>
                <div className="bsp-label" style={{ marginBottom: 10 }}>Commission type</div>
                <div className="bsp-chips bsp-kinds" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  {KINDS.map((k) => (
                    <button type="button" key={k.id} className="bsp-chip" data-kind={k.ph} aria-pressed={kind === k.id} onClick={() => setKind(k.id)}><Tick />{k.label}</button>
                  ))}
                </div>

                <div className="bsp-label" style={{ margin: "24px 0 10px" }}>Budget guide <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
                <div className="bsp-chips bsp-budgets" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
                  {BUDGETS.map((b) => (
                    <button type="button" key={b} className="bsp-chip" data-budget aria-pressed={budget === b} onClick={() => setBudget(budget === b ? "" : b)}><Tick />{b}</button>
                  ))}
                </div>

                <div className="bsp-namephone" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 28 }}>
                  <div><label className="bsp-label" htmlFor="bsp-name">Name</label><input id="bsp-name" className="bsp-input" autoComplete="name" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
                  <div><label className="bsp-label" htmlFor="bsp-phone">Telephone <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></label><input id="bsp-phone" className="bsp-input" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                </div>
                <div style={{ marginTop: 22 }}><label className="bsp-label" htmlFor="bsp-email">Email</label><input id="bsp-email" className="bsp-input" type="email" autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
                <div style={{ marginTop: 22 }}>
                  <label className="bsp-label" htmlFor="bsp-idea">Your idea</label>
                  <textarea id="bsp-idea" className="bsp-input" style={{ resize: "vertical", minHeight: 104, lineHeight: 1.55 }} value={form.message} onChange={(e) => set("message", e.target.value)} placeholder={placeholder} rows={4} />
                </div>
                <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} />

                <p style={{ fontSize: 13.5, lineHeight: 1.6, color: T.textMuted, margin: "16px 0 0" }}>
                  Have a sketch or a photograph? Bring it to your consultation, or send it when we reply.
                </p>
                {error && <p role="alert" style={{ fontSize: 14, lineHeight: 1.6, color: "#8C2F1F", margin: "14px 0 0" }}>{error}</p>}

                <button type="submit" className="bsp-btn" disabled={sending} style={{ width: "100%", marginTop: 22 }}>{sending ? "Sending…" : "Book a consultation"}</button>
              </form>
            )}
          </div>
        </div>
      </section>

      <GoogleReviewsV2 />
      <FooterV2 />
    </div>
  );
};

export default BespokeDesignV2;
