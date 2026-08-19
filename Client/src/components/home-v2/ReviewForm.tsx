import React, { useState } from "react";
import API_BASE_URL from "../../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "./tokens";

/**
 * ReviewForm — lets site visitors submit a review. Posts to POST /reviews, which
 * stores it as source=visitor, status=pending (awaiting admin approval). Nothing
 * submitted here appears on the site until an admin publishes it.
 */

const CATEGORIES = ["Bespoke", "Engagement", "Wedding", "Servicing", "Watches", "Other"];

const ReviewForm = (): JSX.Element => {
  const [form, setForm] = useState({ author_name: "", location: "", category: "", body: "", email: "" });
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.author_name.trim() || !form.body.trim()) {
      setError("Please add your name and a few words.");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, rating }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setState("done");
      } else {
        setState("error");
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setError("Could not reach the server. Please try again.");
    }
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "12px 0", background: "transparent", border: 0, borderBottom: `1px solid ${T.ruleStrong}`,
    outline: "none", color: T.ink, fontFamily: FONT_BODY, fontSize: 15,
  };
  const label: React.CSSProperties = { display: "block", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, marginBottom: 4 };

  if (state === "done") {
    return (
      <div style={{ background: "#FFFFFF", border: `1px solid ${T.rule}`, boxShadow: "0 24px 48px -34px rgba(28,26,23,0.28)", padding: "clamp(28px, 4vw, 44px)", textAlign: "center" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: T.ink, marginBottom: 10 }}>Thank you.</div>
        <p style={{ fontSize: 14.5, color: T.body, lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
          Your review has been submitted and will appear once our team has approved it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ background: "#FFFFFF", border: `1px solid ${T.rule}`, boxShadow: "0 24px 48px -34px rgba(28,26,23,0.28)", padding: "clamp(24px, 3vw, 40px)", fontFamily: FONT_BODY }}>
      <style>{`
        .rvf-star:hover{transform:scale(1.1)} .rvf-cta:hover{background:${T.inkDeep}}
        .rvf-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}
        @media (max-width:640px){ .rvf-grid{grid-template-columns:1fr;gap:16px} }
      `}</style>

      {/* Rating */}
      <div style={label}>Your rating</div>
      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className="rvf-star"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            style={{ background: "transparent", border: 0, cursor: "pointer", fontSize: 26, lineHeight: 1, color: (hover || rating) >= n ? T.gold : T.ruleStrong, transition: "transform 0.15s, color 0.15s", padding: 0 }}
          >
            ★
          </button>
        ))}
      </div>

      <div className="rvf-grid">
        <div><label style={label}>Name</label><input style={input} value={form.author_name} onChange={(e) => set("author_name", e.target.value)} required /></div>
        <div><label style={label}>Location (optional)</label><input style={input} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Nottingham" /></div>
      </div>

      <div className="rvf-grid" style={{ marginTop: 16 }}>
        <div>
          <label style={label}>About (optional)</label>
          <select style={{ ...input, appearance: "none", cursor: "pointer" }} value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Choose…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label style={label}>Email (optional, private)</label><input style={input} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label style={label}>Your review</label>
        <textarea style={{ ...input, resize: "vertical", minHeight: 96 }} value={form.body} onChange={(e) => set("body", e.target.value)} rows={4} placeholder="Tell us about your experience with McCulloch." required />
      </div>

      {error && <p style={{ color: "#b23b2e", fontSize: 13, marginTop: 12 }}>{error}</p>}

      <button
        type="submit"
        disabled={state === "sending"}
        className="rvf-cta"
        style={{ marginTop: 20, padding: "14px 30px", background: T.ink, color: T.paper, border: 0, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", transition: "background 0.25s", opacity: state === "sending" ? 0.7 : 1 }}
      >
        {state === "sending" ? "Sending…" : "Submit review"}
      </button>
      <p style={{ fontSize: 11.5, color: T.muted, marginTop: 12, lineHeight: 1.5 }}>
        Reviews are checked before they appear. Your email is never published.
      </p>
    </form>
  );
};

export default ReviewForm;
