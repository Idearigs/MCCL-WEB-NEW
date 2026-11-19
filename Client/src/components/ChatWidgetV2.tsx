import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import API_BASE_URL from "../config/api";
import { T, FONT_DISPLAY, FONT_BODY } from "./home-v2/tokens";

/**
 * ChatWidgetV2: the "Ask the workshop" chat ("the note").
 * A cream launcher with a hairline edge, and a cream window: topics as underlined words,
 * fields as single lines, light bubbles. No solid black header.
 *
 * WIRED to the real chat backend, unchanged: POST /chats (create, topic -> subject),
 * GET /chats/view/:id (history), POST /chats/message/send (FormData, optional attachment),
 * and Socket.io (receive_message / typing_status). Presence is derived from opening hours
 * (Mon-Sat 9-18) rather than always implying someone is online.
 */

const GROUND = "#FFFEFD";
const SOCKET_URL = API_BASE_URL.replace("/api/v1", "");

const TOPICS = ["A commission", "An order", "Sizing", "A stone", "Repairs"];
const PLACEHOLDERS: Record<string, string> = {
  "A commission": "Roughly what you have in mind, and whether there is a date to meet.",
  "An order": "Your order number if you have it to hand.",
  Sizing: "Which piece, and whether you know the size already.",
  "A stone": "Carat, cut or certificate number, whatever you have.",
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

  // Escape closes the panel, like search and the bag.
  useEffect(() => {
    if (state === "closed") return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setState("closed"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

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

  const presence = open
    ? "Open now. We usually reply within minutes."
    : state === "live" ? "Closed now. We will reply when we open." : "Closed now. Leave a message and we will reply when we open.";

  return (
    <>
      <style>{`
        .cw-launch, .cw-panel, .cw-panel input, .cw-panel textarea, .cw-panel button { font-family: ${FONT_BODY}; }
        .cw-launch { position: fixed; right: 28px; bottom: 28px; z-index: 70; display: flex; align-items: center; gap: 10px; padding: 13px 20px; cursor: pointer; color: ${T.text}; background: ${T.paper}; border: 1px solid ${T.ruleStrong}; border-radius: 0; box-shadow: 0 10px 28px -14px rgba(28,26,23,0.4); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; transition: border-color .25s ease, box-shadow .25s ease; }
        .cw-launch:hover { border-color: ${T.ink}; box-shadow: 0 14px 32px -14px rgba(28,26,23,0.5); }
        .cw-launch svg { display: none; }
        .cw-dot { flex: none; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${T.gold}; }
        .cw-dot[data-off] { background: ${T.ruleStrong}; }
        /* Hidden while the phone menu is open, where it covered "Book an appointment". */
        body[data-v2-menu] .cw-launch { display: none !important; }

        .cw-panel { position: fixed; right: 28px; bottom: 28px; z-index: 75; display: flex; flex-direction: column; width: min(380px, calc(100vw - 40px)); max-height: min(640px, calc(100vh - var(--v2nav-h, 112px) - 40px)); color: ${T.text}; background: ${T.paper}; border: 1px solid ${T.line}; box-shadow: 0 24px 60px -20px rgba(28,26,23,0.35); font-size: 14px; animation: cwIn .32s cubic-bezier(.22,1,.36,1) both; }
        .cw-head { flex: none; display: flex; justify-content: space-between; gap: 14px; padding: 22px 22px 18px; border-bottom: 1px solid ${T.line}; }
        .cw-head h2 { margin: 0; font-family: ${FONT_DISPLAY}; font-weight: 400; font-size: 23px; line-height: 1.15; color: ${T.text}; }
        .cw-pres { display: flex; align-items: flex-start; gap: 8px; margin: 6px 0 0; font-size: 12.5px; line-height: 1.5; }
        .cw-pres .cw-dot { margin-top: 7px; }
        .cw-x { flex: none; width: 34px; height: 34px; margin: -6px -8px 0 0; padding: 0; cursor: pointer; color: ${T.text}; background: transparent; border: 0; font-size: 22px; font-weight: 300; line-height: 1; }
        .cw-body { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; padding: 20px 22px 22px; }
        .cw-body::-webkit-scrollbar { display: none; }
        .cw-lab { display: block; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: ${T.textMuted}; }
        .cw-words { display: flex; flex-wrap: wrap; gap: 0 18px; margin-top: 4px; }
        .cw-words button { position: relative; padding: 8px 0; cursor: pointer; font-size: 14px; color: ${T.textMuted}; background: transparent; border: 0; white-space: nowrap; transition: color .2s ease; }
        .cw-words button:hover, .cw-words button[aria-pressed="true"] { color: ${T.text}; }
        .cw-words button[aria-pressed="true"]::after { content: ""; position: absolute; left: 0; right: 0; bottom: 4px; height: 1px; background: ${T.gold}; }
        .cw-fld { display: block; margin-top: 18px; }
        .cw-fld input, .cw-fld textarea { display: block; width: 100%; padding: 8px 0 10px; font-size: 15px; line-height: 1.5; color: ${T.text}; background: transparent; border: 0; border-bottom: 1px solid ${T.ruleStrong}; border-radius: 0; outline: none; resize: none; box-shadow: none; }
        .cw-fld input:focus, .cw-fld textarea:focus { border-bottom-color: ${T.ink}; }
        .cw-panel ::placeholder { color: #8E897E; opacity: 1; }
        .cw-err { margin: 14px 0 0; padding-left: 12px; border-left: 1px solid ${T.gold}; font-size: 13px; line-height: 1.5; color: ${T.text}; }
        .cw-cta { display: block; width: 100%; margin-top: 22px; padding: 16px; cursor: pointer; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.paper}; background: ${T.ink}; border: 0; border-radius: 0; transition: background .25s ease; }
        .cw-cta:hover { background: ${T.text}; }
        .cw-cta:disabled { opacity: 0.7; cursor: default; }
        .cw-fine { margin: 12px 0 0; font-size: 12px; line-height: 1.55; color: ${T.textMuted}; }
        .cw-day { margin: 0 0 18px; text-align: center; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.textMuted}; }
        .cw-msg { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 16px; animation: cwMsg .3s cubic-bezier(.22,1,.36,1) both; }
        .cw-msg[data-me] { align-items: flex-end; }
        .cw-msg small { margin-bottom: 6px; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.textMuted}; }
        .cw-msg > span { max-width: 84%; padding: 12px 14px; font-size: 13.5px; line-height: 1.6; color: ${T.text}; background: ${GROUND}; border: 1px solid ${T.line}; overflow-wrap: anywhere; white-space: pre-wrap; }
        .cw-msg[data-me] > span { background: ${T.tint}; border-color: ${T.tint}; }
        .cw-msg img { display: block; max-width: 100%; }
        .cw-typing { display: flex !important; align-items: center; gap: 5px; padding: 15px !important; }
        .cw-typing i { width: 5px; height: 5px; border-radius: 50%; background: ${T.textMuted}; animation: cwBlink 1.4s ease-in-out infinite; }
        .cw-typing i:nth-child(2) { animation-delay: .2s; } .cw-typing i:nth-child(3) { animation-delay: .4s; }
        .cw-foot { flex: none; padding: 8px 22px calc(14px + env(safe-area-inset-bottom, 0px)); border-top: 1px solid ${T.line}; background: ${GROUND}; }
        .cw-comp { display: flex; align-items: center; gap: 12px; }
        .cw-comp input[type="text"] { flex: 1; min-width: 0; padding: 12px 0; font-size: 15px; color: ${T.text}; background: transparent; border: 0; outline: none; box-shadow: none; }
        .cw-clip { flex: none; display: flex; padding: 6px 0; cursor: pointer; color: ${T.text}; background: transparent; border: 0; }
        .cw-send { flex: none; padding: 10px 0; cursor: pointer; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: ${T.text}; background: transparent; border: 0; border-bottom: 1px solid ${T.gold}; }
        .cw-send:disabled { opacity: 0.45; cursor: default; }
        .cw-thumb { position: relative; display: inline-block; margin: 6px 0 2px; }
        .cw-thumb img { display: block; max-height: 64px; border: 1px solid ${T.line}; }
        .cw-thumb button { position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; padding: 0; cursor: pointer; border-radius: 50%; color: ${T.paper}; background: ${T.ink}; border: 0; font-size: 12px; line-height: 1; }
        .cw-launch:focus-visible, .cw-panel button:focus-visible { outline: 1px solid ${T.ink}; outline-offset: 3px; }

        @keyframes cwIn { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        @keyframes cwMsg { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes cwBlink { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .cw-panel, .cw-panel * { animation: none !important; } }

        @media (max-width: 768px) {
          .cw-launch { right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); width: 50px; height: 50px; padding: 0; justify-content: center; border-radius: 50%; }
          .cw-launch svg { display: block; }
          .cw-launch b { display: none; }
          .cw-launch .cw-dot { position: absolute; top: 13px; right: 12px; box-shadow: 0 0 0 2px ${T.paper}; }
          .cw-panel { inset: 0; width: auto; max-height: none; border: 0; box-shadow: none; }
          .cw-head { padding-top: calc(22px + env(safe-area-inset-top, 0px)); }
          .cw-fld input, .cw-fld textarea, .cw-comp input[type="text"] { font-size: 16px; }
        }
      `}</style>

      {/* Launcher */}
      {state === "closed" && (
        <button type="button" onClick={() => setState(chatId ? "live" : "form")} className="cw-launch" data-cw-launch aria-label="Ask the workshop">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M4 5h16v11h-9.5L6 20v-4H4z" /></svg>
          <span className="cw-dot" data-off={open ? undefined : ""} />
          <b style={{ fontWeight: 400 }}>Ask the workshop</b>
        </button>
      )}

      {/* Window */}
      {state !== "closed" && (
        <aside className="cw-panel" role="dialog" aria-label="Ask the workshop">
          <div className="cw-head">
            <div>
              <h2>Ask the workshop</h2>
              <p className="cw-pres"><span className="cw-dot" data-off={open ? undefined : ""} />{presence}</p>
            </div>
            <button type="button" onClick={() => setState("closed")} aria-label="Close" className="cw-x">×</button>
          </div>

          {/* Before the conversation */}
          {state === "form" && (
            <div className="cw-body">
              <span className="cw-lab">What is it about?</span>
              <div className="cw-words">
                {TOPICS.map((tp) => (
                  <button key={tp} type="button" aria-pressed={tp === topic} onClick={() => setTopic(tp)}>{tp}</button>
                ))}
              </div>
              <label className="cw-fld"><span className="cw-lab">Your name</span><input type="text" autoComplete="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="First and last name" /></label>
              <label className="cw-fld"><span className="cw-lab">Email</span><input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.co.uk" /></label>
              <label className="cw-fld"><span className="cw-lab">Message</span><textarea rows={2} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder={PLACEHOLDERS[topic]} /></label>
              {error && <p className="cw-err" role="alert">{error}</p>}
              <button type="button" onClick={startConversation} disabled={starting} className="cw-cta">{starting ? "Sending…" : "Send message"}</button>
              <p className="cw-fine">A jeweller answers, not a robot. Nothing is shared outside the workshop.</p>
            </div>
          )}

          {/* The conversation */}
          {state === "live" && (
            <>
              <div className="cw-body">
                <p className="cw-day">Today</p>
                {messages.map((m, i) => {
                  const mine = m.sender_type === "customer";
                  return (
                    <div key={`${m.id}-${i}`} className="cw-msg" data-me={mine ? "" : undefined}>
                      <small>{mine ? "You" : "McCulloch"} · {fmtTime(m.created_at)}</small>
                      <span>
                        {m.attachment_url && <img src={`${SOCKET_URL}${m.attachment_url}`} alt="Attached photograph" style={{ marginBottom: m.message ? 8 : 0 }} />}
                        {m.message}
                      </span>
                    </div>
                  );
                })}
                {theyTyping && (
                  <div className="cw-msg">
                    <small>McCulloch</small>
                    <span className="cw-typing" aria-label="McCulloch is typing"><i /><i /><i /></span>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              <div className="cw-foot">
                {imagePreview && (
                  <div className="cw-thumb">
                    <img src={imagePreview} alt="" />
                    <button type="button" onClick={clearImage} aria-label="Remove photograph">×</button>
                  </div>
                )}
                {error && <p className="cw-err" role="alert" style={{ margin: "6px 0" }}>{error}</p>}
                <form onSubmit={send} className="cw-comp">
                  <button type="button" onClick={() => fileRef.current?.click()} className="cw-clip" aria-label="Attach a photograph" title="Attach a photograph">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M20 11.5l-8 8a5 5 0 01-7-7l8.500-8.500a3.500 3.500 0 015 5L10 17.500a2 2 0 01-3-3l7.500-7.500" /></svg>
                  </button>
                  <input type="text" value={input} onChange={onInput} placeholder="Write a message" aria-label="Write a message" disabled={sending} />
                  <button type="submit" disabled={sending || (!input.trim() && !image)} className="cw-send">{sending ? "…" : "Send"}</button>
                </form>
                <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
}
