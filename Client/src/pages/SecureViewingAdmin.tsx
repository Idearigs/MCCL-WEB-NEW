import React, { useCallback, useEffect, useState } from "react";
import { T, FONT_DISPLAY, FONT_BODY } from "../components/home-v2/tokens";
import { api } from "../config/api";

/**
 * Secure viewing — owner panel. PIN login (no admin account needed) so the
 * owner or staff can approve ID checks from a phone or the shop tablet.
 * Requests refresh every 10 seconds; ID photos are fetched with the panel
 * token and never exposed as public URLs.
 */

type Req = {
  id: string; code: string; full_name: string; email: string; phone: string | null;
  id_type: string; id_number: string | null; appointment_date: string | null; status: "pending" | "approved" | "declined";
  decision_note: string | null; decided_at: string | null; approval_expires_at: string | null; reapproved_at: string | null;
  purged_at: string | null; created_at: string; has_front: boolean; has_back: boolean;
};
type Counts = { pending: number; approved: number; declined: number };

const TOKEN_KEY = "secure_viewing_panel";
const TABS: { key: Req["status"]; label: string }[] = [
  { key: "pending", label: "Pending" }, { key: "approved", label: "Approved" }, { key: "declined", label: "Declined" },
];

const loadToken = (): string | null => {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || "null");
    if (t && Date.now() < t.exp) return t.token;
  } catch { /* ignore */ }
  return null;
};

const when = (s: string | null) => s ? new Date(s).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
const ago = (s: string) => {
  const m = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : when(s);
};

const dateOnly = (iso: string | null) => iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";

const btn = (bg: string, fg: string, border = bg): React.CSSProperties => ({
  padding: "14px 22px", background: bg, color: fg, border: `1px solid ${border}`, cursor: "pointer",
  fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
});

// Fetches a private ID photo with the panel token and shows it as a blob URL.
const IdPhoto = ({ id, side, token, onOpen }: { id: string; side: "front" | "back"; token: string; onOpen: (url: string) => void }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let objectUrl: string | null = null;
    setUrl(null); setFailed(false);
    fetch(api(`secure-viewing/admin/requests/${id}/photo/${side}`), { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(b => { objectUrl = URL.createObjectURL(b); setUrl(objectUrl); })
      .catch(() => setFailed(true));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, side, token]);
  return (
    <button onClick={() => url && onOpen(url)} style={{ flex: 1, minHeight: 170, background: "#fff", border: `1px solid ${T.rule}`, padding: 8, cursor: url ? "zoom-in" : "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {url ? <img src={url} alt={`ID ${side}`} style={{ maxWidth: "100%", maxHeight: 220, objectFit: "contain" }} />
        : <span style={{ fontSize: 13, color: T.muted }}>{failed ? "Photo not available" : "Loading…"}</span>}
      <span style={{ fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted }}>{side} · tap to enlarge</span>
    </button>
  );
};

const SecureViewingAdmin = (): JSX.Element => {
  const [token, setToken] = useState<string | null>(loadToken);
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Req["status"]>("pending");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [requests, setRequests] = useState<Req[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, declined: 0 });
  const [selected, setSelected] = useState<Req | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [declineNote, setDeclineNote] = useState("");
  const [confirmDecline, setConfirmDecline] = useState(false);

  useEffect(() => {
    document.title = "Viewing requests | McCulloch";
    const meta = document.createElement("meta");
    meta.name = "robots"; meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const logout = useCallback(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); setSelected(null); }, []);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const params = query ? `q=${encodeURIComponent(query)}` : `status=${tab}`;
      const res = await fetch(api(`secure-viewing/admin/requests?${params}`), { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { logout(); return; }
      const json = await res.json();
      if (!json.success) return;
      setRequests(json.data.requests);
      setCounts(json.data.counts);
      setSelected(s => s ? json.data.requests.find((r: Req) => r.id === s.id) || s : s);
    } catch { /* keep the current list; next refresh will retry */ }
  }, [token, tab, query, logout]);

  // Search as the owner types; under 3 characters goes back to the normal tabs.
  useEffect(() => {
    const t = window.setTimeout(() => { setQuery(search.trim().length >= 3 ? search.trim() : ""); setSelected(null); }, 300);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => { load(); const t = window.setInterval(load, 10000); return () => window.clearInterval(t); }, [load]);
  useEffect(() => { document.title = counts.pending ? `(${counts.pending}) Viewing requests | McCulloch` : "Viewing requests | McCulloch"; }, [counts.pending]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(api("secure-viewing/admin/login"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) { setLoginError(json.message || "Incorrect PIN."); setPin(""); return; }
      localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: json.data.token, exp: Date.now() + 11.5 * 60 * 60 * 1000 }));
      setToken(json.data.token);
      setPin("");
    } catch {
      setLoginError("Could not connect. Please try again.");
    }
  };

  const approvalEnded = (r: Req) => r.status === "approved" && !!r.approval_expires_at && new Date(r.approval_expires_at) < new Date();

  const decide = async (decision: "approve" | "decline" | "approve-today") => {
    if (!selected || !token) return;
    setBusy(true);
    try {
      const res = await fetch(api(`secure-viewing/admin/requests/${selected.id}/${decision}`), {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(decision === "decline" ? { note: declineNote } : {}),
      });
      if (res.status === 401) { logout(); return; }
      setConfirmDecline(false); setDeclineNote(""); setSelected(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  // ── PIN screen ──────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div style={{ background: T.ink, color: T.paper, fontFamily: FONT_BODY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <form onSubmit={login} style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 28, letterSpacing: "0.18em", textTransform: "uppercase" }}>McCulloch</div>
          <div style={{ fontSize: 10.5, letterSpacing: "0.26em", textTransform: "uppercase", color: T.onDarkMuted, margin: "6px 0 40px" }}>Viewing requests</div>
          <input
            value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 12))}
            type="password" inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="Enter PIN"
            style={{ width: "100%", padding: "16px", background: "transparent", border: `1px solid ${T.ruleDarkStrong}`, color: T.paper, fontSize: 24, letterSpacing: "0.5em", textAlign: "center", outline: "none", fontFamily: FONT_BODY }}
          />
          {loginError && <div style={{ color: "#E8A598", fontSize: 13.5, marginTop: 14 }}>{loginError}</div>}
          <button type="submit" disabled={!pin} style={{ ...btn(T.gold, T.inkDeep), width: "100%", marginTop: 18, opacity: pin ? 1 : 0.5 }}>Unlock</button>
        </form>
      </div>
    );
  }

  // ── Panel ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        .sva-row { transition: background 0.2s ease; }
        .sva-row:hover { background: ${T.tint}; }
        @media (max-width: 860px) { .sva-layout { grid-template-columns: 1fr !important; } .sva-list-hidden { display: none; } }
      `}</style>

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "18px clamp(16px,3vw,36px)", background: T.ink, color: T.paper }}>
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, letterSpacing: "0.16em", textTransform: "uppercase" }}>McCulloch</div>
          <div style={{ fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: T.onDarkMuted }}>Viewing requests</div>
        </div>
        <button onClick={logout} style={btn("transparent", T.paper, T.ruleDarkStrong)}>Lock</button>
      </header>

      <div style={{ padding: "14px clamp(16px,3vw,36px)", borderBottom: `1px solid ${T.rule}`, background: T.tint }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)} type="search" inputMode="search"
          placeholder="Returning customer? Search phone, name, email or code"
          aria-label="Search all requests"
          style={{ width: "100%", maxWidth: 520, padding: "12px 14px", background: "#fff", border: `1px solid ${T.ruleStrong}`, outline: "none", fontFamily: FONT_BODY, fontSize: 16, color: T.ink, borderRadius: 0 }}
        />
      </div>

      <nav style={{ display: query ? "none" : "flex", borderBottom: `1px solid ${T.rule}`, padding: "0 clamp(16px,3vw,36px)" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSelected(null); }}
            style={{ padding: "16px 18px", background: "transparent", border: 0, borderBottom: `2px solid ${tab === t.key ? T.gold : "transparent"}`, cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: tab === t.key ? T.ink : T.muted }}>
            {t.label}
            <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 10, fontSize: 11, background: t.key === "pending" && counts.pending ? T.gold : T.tint, color: t.key === "pending" && counts.pending ? "#fff" : T.muted }}>{counts[t.key]}</span>
          </button>
        ))}
      </nav>

      <div className="sva-layout" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", minHeight: "calc(100vh - 130px)" }}>
        {/* List */}
        <aside className={selected ? "sva-list-hidden" : ""} style={{ borderRight: `1px solid ${T.rule}` }}>
          {requests.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: T.muted, fontSize: 14 }}>
              {query ? "No match. This customer has not been verified yet, so please ask them to complete the form." : tab === "pending" ? "No requests waiting. New ones appear here automatically." : "Nothing here yet."}
            </div>
          )}
          {requests.map(r => (
            <button key={r.id} className="sva-row" onClick={() => { setSelected(r); setConfirmDecline(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", padding: "16px clamp(16px,3vw,28px)", background: selected?.id === r.id ? T.tint : "transparent", border: 0, borderBottom: `1px solid ${T.rule}`, cursor: "pointer", fontFamily: FONT_BODY, color: T.ink }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                <span style={{ fontSize: 15.5 }}>{r.full_name}</span>
                <span style={{ fontSize: 12, color: T.muted, whiteSpace: "nowrap" }}>{ago(r.created_at)}</span>
              </div>
              <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4, fontFamily: "'Courier New', monospace", letterSpacing: "0.08em" }}>{r.code} · {r.id_type}</div>
              <div style={{ fontSize: 13, color: T.body, marginTop: 4 }}>Appointment: {dateOnly(r.appointment_date)}</div>
              {query && (
                <div style={{ fontSize: 13, color: T.body, marginTop: 4 }}>
                  {r.phone || "No phone"} · <span style={{ color: r.status === "approved" ? "#2F5D3A" : r.status === "declined" ? "#7A2E22" : T.gold, fontWeight: 600 }}>{r.status === "approved" ? `Verified ${dateOnly(r.decided_at?.slice(0, 10) ?? null)}` : r.status === "declined" ? "Declined" : "Pending"}</span>
                </div>
              )}
            </button>
          ))}
        </aside>

        {/* Detail */}
        <section style={{ padding: "clamp(20px,3vw,40px)" }}>
          {!selected ? (
            <div style={{ color: T.muted, fontSize: 14, paddingTop: 24 }}>Select a request to review it.</div>
          ) : (
            <div style={{ maxWidth: 720 }}>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: 0, padding: 0, marginBottom: 18, cursor: "pointer", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.muted, fontFamily: FONT_BODY }}>← All requests</button>
              <div style={{ fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: T.gold, marginBottom: 8 }}>{selected.status}</div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: "clamp(30px,4vw,44px)", lineHeight: 1.05, margin: "0 0 6px" }}>{selected.full_name}</h1>
              <div style={{ fontFamily: "'Courier New', monospace", fontSize: 20, letterSpacing: "0.14em", marginBottom: 24 }}>{selected.code}</div>

              <dl style={{ display: "grid", gridTemplateColumns: "130px 1fr", rowGap: 10, margin: "0 0 26px", fontSize: 15 }}>
                {[
                  ["Appointment", dateOnly(selected.appointment_date)],
                  ["ID type", selected.id_type], ["ID number", selected.id_number || "Deleted (retention)"],
                  ["Phone", selected.phone || "—"], ["Email", selected.email], ["Submitted", when(selected.created_at)],
                  ...(selected.decided_at ? [["Decided", when(selected.decided_at)]] : []),
                  ...(selected.status === "approved" ? [["Valid until", when(selected.approval_expires_at)]] : []),
                  ...(selected.reapproved_at ? [["Re-approved", when(selected.reapproved_at)]] : []),
                  ...(approvalEnded(selected)
                    ? [["Return visit", selected.has_front || selected.has_back
                      ? "Verified before, approval has ended. Compare them with the ID photos below."
                      : "Verified before, approval has ended and the ID photos have been deleted. Check their ID in person."]] : []),
                  ...(selected.decision_note ? [["Note", selected.decision_note]] : []),
                ].map(([k, v]) => (
                  <React.Fragment key={k}>
                    <dt style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.muted, paddingTop: 3 }}>{k}</dt>
                    <dd style={{ margin: 0, wordBreak: "break-word", fontFamily: k === "ID number" ? "'Courier New', monospace" : undefined, fontSize: k === "ID number" ? 17 : undefined }}>{v}</dd>
                  </React.Fragment>
                ))}
              </dl>

              {selected.has_front || selected.has_back ? (
                <div style={{ display: "flex", gap: 12, marginBottom: 30, flexWrap: "wrap" }}>
                  {selected.has_front && <IdPhoto id={selected.id} side="front" token={token} onOpen={setZoom} />}
                  {selected.has_back && <IdPhoto id={selected.id} side="back" token={token} onOpen={setZoom} />}
                </div>
              ) : (
                <div style={{ padding: 16, background: T.tint, fontSize: 14, color: T.muted, marginBottom: 30 }}>ID photos were deleted automatically after the retention period.</div>
              )}

              {approvalEnded(selected) && (
                <button disabled={busy} onClick={() => decide("approve-today")} style={{ ...btn("#2F5D3A", "#fff"), width: "100%", maxWidth: 360, padding: "18px 22px", fontSize: 13 }}>{busy ? "Saving…" : "Approve for today"}</button>
              )}

              {selected.status === "pending" && (
                confirmDecline ? (
                  <div style={{ background: "#F4E4E0", padding: 18 }}>
                    <label style={{ display: "block", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7A2E22", marginBottom: 8 }}>Reason (internal, not sent to the guest)</label>
                    <input value={declineNote} onChange={e => setDeclineNote(e.target.value)} placeholder="e.g. Photo does not match"
                      style={{ width: "100%", padding: "12px", border: `1px solid ${T.ruleStrong}`, fontFamily: FONT_BODY, fontSize: 15, marginBottom: 12, background: "#fff" }} />
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button disabled={busy} onClick={() => decide("decline")} style={btn("#7A2E22", "#fff")}>Confirm decline</button>
                      <button disabled={busy} onClick={() => setConfirmDecline(false)} style={btn("transparent", T.ink, T.ruleStrong)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button disabled={busy} onClick={() => decide("approve")} style={{ ...btn("#2F5D3A", "#fff"), flex: "1 1 200px", padding: "18px 22px", fontSize: 13 }}>{busy ? "Saving…" : "Approve viewing"}</button>
                    <button disabled={busy} onClick={() => setConfirmDecline(true)} style={{ ...btn("transparent", "#7A2E22", "#C9A39B"), flex: "0 1 160px" }}>Decline</button>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {zoom && (
        <div onClick={() => setZoom(null)} style={{ position: "fixed", inset: 0, background: "rgba(20,18,15,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, cursor: "zoom-out", zIndex: 50 }}>
          <img src={zoom} alt="ID" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
};

export default SecureViewingAdmin;
