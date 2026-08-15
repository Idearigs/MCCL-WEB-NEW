import React, { useState, useEffect, useRef, useMemo } from "react";
import { io } from "socket.io-client";
import API_BASE_URL from "../config/api";
import { useIsMobile } from "../hooks/use-mobile";
import { T, FONT_DISPLAY, FONT_BODY } from "./home-v2/tokens";

/**
 * ChatWidgetV2 — the "Ask the workshop" chat.
 * VISUAL design: design_handoff_mcculloch_signin_chat_watches (Live chat). Ink launcher
 * pill, panel with a pre-chat form (topic chips set the message placeholder) and a live
 * conversation (ink/champagne bubbles, typing indicator).
 *
 * WIRED to the real chat backend, unchanged: POST /chats (create, topic → subject),
 * GET /chats/view/:id (history), POST /chats/message/send (FormData, optional attachment),
 * and Socket.io (receive_message / typing_status). Presence is derived from opening hours
 * (Mon–Sat 9–18) rather than always implying someone is online — the README requires that.
 */

const M2 = "#8A8377";
const SOCKET_URL = API_BASE_URL.replace("/api/v1", "");

const TOPICS = ["A commission", "An order", "Sizing", "A stone", "Repairs"];
const PLACEHOLDERS: Record<string, string> = {
  "A commission": "Roughly what you have in mind, and whether there is a date to meet.",
  "An order": "Your order number if you have it to hand.",
  Sizing: "Which piece, and whether you know the size already.",
  "A stone": "Carat, cut or certificate number — whatever you have.",
  Repairs: "What the piece is and what has happened to it.",
};

interface ChatUser { id: string; email: string; name?: string }
interface Message { id: string; chat_id: string; sender_type: "customer" | "admin"; message: string; created_at: string; attachment_url?: string }

const isOpenNow = () => {
  const n = new Date();
  const day = n.getDay(); // 0 Sun … 6 Sat
  const hr = n.getHours();
  return day >= 1 && day <= 6 && hr >= 9 && hr < 18;
};

const fmtTime = (iso?: string) => {
  try {
    const d = new Date(iso || "");
    if (isNaN(d.getTime())) return "just now";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch { return "just now"; }
};

export default function ChatWidgetV2({ user }: { user?: ChatUser | null }): JSX.Element {
  const isMobile = useIsMobile();
  const [state, setState] = useState<"closed" | "form" | "live">("closed");
  const [topic, setTopic] = useState<string>("A commission");
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", message: "" });
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theyTyping, setTheyTyping] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const socketRef = useRef<any>(null);
  const typingTimer = useRef<any>(null);
  const isTypingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const open = isOpenNow();

  useEffect(() => { setForm((f) => ({ ...f, name: user?.name || f.name, email: user?.email || f.email })); }, [user]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, theyTyping]);

  // Socket + history once a chat exists
  useEffect(() => {
    if (!chatId) return;
    const socket = io(SOCKET_URL, { reconnection: true, reconnectionDelay: 1000, reconnectionAttempts: 5 });
    socketRef.current = socket;

    fetch(`${API_BASE_URL}/chats/view/${chatId}`).then((r) => r.json()).then((d) => {
      if (d?.success) setMessages(d.data.chat.messages || []);
    }).catch(() => {});

    socket.emit("join_chat", { chat_id: chatId, user_type: "customer", user_id: user?.id || null });
    socket.on("receive_message", (m: Message) => setMessages((prev) => [...prev, m]));
    socket.on("typing_status", (d: any) => {
      if (d.user_type && d.user_type !== "customer") setTheyTyping(!!d.is_typing);
    });

    return () => { socket.emit("leave_chat", { chat_id: chatId }); socket.disconnect(); };
  }, [chatId, user?.id]);

  const createChat = async (): Promise<string | null> => {
    const res = await fetch(`${API_BASE_URL}/chats`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_name: form.name || "Guest", customer_email: form.email, customer_user_id: user?.id || null, subject: topic }),
    }).then((r) => r.json());
    if (res?.success) return res.data.chat.id;
    throw new Error(res?.message || "Could not start the conversation.");
  };

  const sendRaw = async (targetId: string, text: string, file?: File | null) => {
    const body = new FormData();
    body.append("chat_id", targetId);
    body.append("sender_type", "customer");
    body.append("sender_id", user?.id || "");
    body.append("message", text || "");
    if (file) body.append("attachment", file);
    const res = await fetch(`${API_BASE_URL}/chats/message/send`, { method: "POST", body }).then((r) => r.json());
    if (res?.success && socketRef.current) socketRef.current.emit("send_message", { chat_id: targetId, message: res.data.message });
    return res;
  };

  const startConversation = async () => {
    if (!form.email.trim() || !form.message.trim()) { setError("Please add your email and a message."); return; }
    setStarting(true); setError(null);
    try {
      const id = await createChat();
      if (!id) throw new Error("Could not start the conversation.");
      setChatId(id);
      setState("live");
      // give the socket a beat to join, then send the opening message
      setTimeout(() => { sendRaw(id, form.message).catch(() => {}); }, 400);
      setForm((f) => ({ ...f, message: "" }));
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  const emitTyping = (typing: boolean) => {
    if (!socketRef.current || !chatId) return;
    socketRef.current.emit("user_typing", { chat_id: chatId, user_type: "customer", user_id: user?.id || null, is_typing: typing });
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (!isTypingRef.current && e.target.value.trim()) { isTypingRef.current = true; emitTyping(true); }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { isTypingRef.current = false; emitTyping(false); }, 1000);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId || (!input.trim() && !image)) return;
    setSending(true); setError(null);
    const text = input; const file = image;
    setInput(""); clearImage();
    try {
      const res = await sendRaw(chatId, text, file);
      if (!res?.success) setError(res?.message || "Message not sent.");
      isTypingRef.current = false; emitTyping(false);
    } catch { setError("Message not sent. Please try again."); }
    finally { setSending(false); }
  };

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type.startsWith("image/")) {
      setImage(f);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(f);
    }
  };
  const clearImage = () => { setImage(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; };

  const presence = state === "live"
    ? (open ? "The workshop, at the bench" : "We're closed — we'll reply when we open")
    : (open ? "Someone is here — we usually reply in minutes" : "Closed now — leave a message and we'll reply");

  const inputStyle: React.CSSProperties = { width: "100%", padding: 14, fontFamily: FONT_BODY, fontSize: 14, color: T.ink, background: "#FFFFFF", border: `1px solid ${T.ruleStrong}`, borderRadius: 0, outline: "none" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 8 };

  const panelWidth = isMobile ? "100vw" : "min(392px, calc(100vw - 40px))";
  const panelStyle: React.CSSProperties = isMobile
    ? { position: "fixed", inset: 0, zIndex: 75, display: "flex", flexDirection: "column", background: T.paper, animation: "cw2In 0.32s cubic-bezier(0.22,1,0.36,1) both" }
    : { position: "fixed", right: 28, bottom: 28, zIndex: 75, display: "flex", flexDirection: "column", width: panelWidth, maxHeight: "min(620px, calc(100vh - 56px))", background: T.paper, border: `1px solid ${T.rule}`, boxShadow: "0 24px 60px rgba(20,18,15,0.28)", animation: "cw2In 0.32s cubic-bezier(0.22,1,0.36,1) both" };

  const dividerAt = messages[0]?.created_at;

  return (
    <>
      <style>{`
        .cw2-nobar::-webkit-scrollbar { display: none; }
        .cw2-launch:hover { background: ${T.gold} !important; }
        .cw2-x:hover { color: #FFFFFF !important; }
        .cw2-send:hover { background: ${T.gold} !important; }
        .cw2-cta:hover { background: ${T.gold} !important; }
        .cw2-mini:hover { color: ${T.ink} !important; }
        @keyframes cw2In { from { opacity: 0; transform: translateY(18px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes cw2Msg { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes cw2Blink { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .cw2-panel, .cw2-panel * { animation: none !important; } }
      `}</style>

      {/* Launcher */}
      {state === "closed" && (
        <button type="button" onClick={() => setState("form")} className="cw2-launch"
          style={{ position: "fixed", right: isMobile ? 18 : 28, bottom: isMobile ? "calc(18px + env(safe-area-inset-bottom))" : 28, zIndex: 70, display: "flex", alignItems: "center", gap: 12, padding: "15px 22px", cursor: "pointer", background: T.ink, border: 0, boxShadow: "0 12px 32px rgba(20,18,15,0.24)", fontFamily: FONT_BODY, transition: "background 0.25s ease" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: open ? T.gold : M2 }} />
          <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: T.paper }}>{isMobile ? "Ask us" : "Ask the workshop"}</span>
        </button>
      )}

      {/* Panel */}
      {state !== "closed" && (
        <aside className="cw2-panel" style={panelStyle}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", alignItems: "start", gap: 14, padding: "20px 22px", background: T.ink, flex: "none" }}>
            <div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 21, letterSpacing: "0.2em", textTransform: "uppercase", color: "#FFFFFF", lineHeight: 1 }}>McCulloch</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: open ? T.gold : M2 }} />
                <span style={{ fontSize: 11, color: T.onDarkBody }}>{presence}</span>
              </div>
            </div>
            <button type="button" onClick={() => setState("closed")} aria-label="Close" className="cw2-x" style={{ width: 32, height: 32, margin: "-4px -6px 0 0", cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 19, color: T.onDarkMuted }}>×</button>
          </div>

          {/* Pre-chat form */}
          {state === "form" && (
            <div className="cw2-nobar" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "24px 22px" }}>
              <p style={{ margin: "0 0 22px", fontSize: 14, lineHeight: 1.7, color: T.body }}>A jeweller answers these, not a robot. Tell us what you are after and we will pick it up{open ? " — usually within a few minutes during opening hours." : ". We're closed now, so we'll reply when we next open."}</p>

              <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: M2, marginBottom: 11 }}>What is it about?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 22 }}>
                {TOPICS.map((tp) => {
                  const on = tp === topic;
                  return (
                    <button key={tp} type="button" onClick={() => setTopic(tp)} style={{ padding: "10px 13px", cursor: "pointer", fontFamily: FONT_BODY, fontSize: 12, color: on ? T.paper : T.body, background: on ? T.ink : "transparent", border: `1px solid ${on ? T.ink : T.ruleSoft}`, transition: "all 0.2s ease" }}>{tp}</button>
                  );
                })}
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <label style={{ display: "block" }}><span style={labelStyle}>Your name</span><input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Hannah Ward" style={inputStyle} /></label>
                <label style={{ display: "block" }}><span style={labelStyle}>Email address</span><input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.co.uk" style={inputStyle} /></label>
                <label style={{ display: "block" }}><span style={labelStyle}>Message</span><textarea rows={4} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder={PLACEHOLDERS[topic]} style={{ ...inputStyle, lineHeight: 1.6, resize: "vertical" }} /></label>
              </div>

              {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: "#C4A46A" }}>{error}</p>}

              <button type="button" onClick={startConversation} disabled={starting} className="cw2-cta" style={{ width: "100%", marginTop: 16, padding: 16, cursor: starting ? "default" : "pointer", fontFamily: FONT_BODY, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0, opacity: starting ? 0.7 : 1, transition: "background 0.25s ease" }}>{starting ? "Starting…" : "Start the conversation"}</button>
              <p style={{ margin: "14px 0 0", fontSize: 11.5, lineHeight: 1.6, color: M2 }}>We keep a transcript so you do not have to explain twice. Nothing is shared outside the workshop.</p>
            </div>
          )}

          {/* Live conversation */}
          {state === "live" && (
            <>
              <div className="cw2-nobar" style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: 22 }}>
                <div style={{ textAlign: "center", fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A9A196", marginBottom: 22 }}>Today, {fmtTime(dividerAt)}</div>
                {messages.map((m, i) => {
                  const mine = m.sender_type === "customer";
                  return (
                    <div key={`${m.id}-${i}`} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", marginBottom: 18, animation: "cw2Msg 0.3s cubic-bezier(0.22,1,0.36,1) both", animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}>
                      <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A09889", marginBottom: 7 }}>{mine ? "You" : "McCulloch"}</span>
                      <span style={{ maxWidth: "84%", padding: "13px 15px", fontSize: 13.5, lineHeight: 1.65, color: mine ? "#F1EDE4" : T.heading, background: mine ? T.ink : T.tint, border: `1px solid ${mine ? T.ink : T.rule}` }}>
                        {m.attachment_url && <img src={`${SOCKET_URL}${m.attachment_url}`} alt="" style={{ display: "block", maxWidth: "100%", marginBottom: m.message ? 8 : 0 }} />}
                        {m.message}
                      </span>
                    </div>
                  );
                })}
                {theyTyping && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#A09889", marginBottom: 7 }}>McCulloch</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, padding: 15, background: T.tint, border: `1px solid ${T.rule}` }}>
                      {[0, 0.2, 0.4].map((d) => <span key={d} style={{ width: 5, height: 5, borderRadius: "50%", background: M2, animation: `cw2Blink 1.4s ease-in-out ${d}s infinite` }} />)}
                    </span>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Composer */}
              <div style={{ padding: "14px 22px 18px", borderTop: `1px solid ${T.rule}`, background: "#FFFFFF", flex: "none" }}>
                {imagePreview && (
                  <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
                    <img src={imagePreview} alt="" style={{ maxHeight: 64, border: `1px solid ${T.rule}` }} />
                    <button type="button" onClick={clearImage} aria-label="Remove image" style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: T.ink, color: T.paper, border: 0, cursor: "pointer", fontSize: 12, lineHeight: 1 }}>×</button>
                  </div>
                )}
                <form onSubmit={send} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", alignItems: "center", gap: 12 }}>
                  <input type="text" value={input} onChange={onInput} placeholder="Write a message" disabled={sending} style={{ width: "100%", padding: "13px 0", fontFamily: FONT_BODY, fontSize: isMobile ? 15 : 14, color: T.ink, background: "transparent", border: 0, outline: "none" }} />
                  <button type="submit" disabled={sending || (!input.trim() && !image)} className="cw2-send" style={{ padding: "12px 18px", cursor: sending ? "default" : "pointer", fontFamily: FONT_BODY, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: T.paper, background: T.ink, border: 0, opacity: sending || (!input.trim() && !image) ? 0.5 : 1, transition: "background 0.25s ease" }}>{sending ? "…" : "Send"}</button>
                </form>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginTop: 12, fontSize: 11, color: "#A9A196" }}>
                  <button type="button" onClick={() => fileRef.current?.click()} className="cw2-mini" style={{ padding: 0, cursor: "pointer", background: "transparent", border: 0, fontFamily: FONT_BODY, fontSize: 11, color: M2 }}>Attach a photograph</button>
                  <a href="/contact" style={{ color: M2, textDecoration: "none" }}>Book a call instead</a>
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
}
