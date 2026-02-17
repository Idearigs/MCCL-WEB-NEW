import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import API_BASE_URL from '../config/api';

interface Message {
  id: string;
  chat_id: string;
  sender_type: 'customer' | 'admin';
  sender_id?: string;
  message: string;
  attachment_url?: string;
  created_at: string;
}

interface ChatConversationProps {
  chatId: string;
  customerName: string;
  chatStatus: 'active' | 'closed' | 'waiting';
  onBack: () => void;
  onStatusChange: (status: 'active' | 'closed' | 'waiting') => void;
}

const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');
const POLL_INTERVAL = 3000;

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
}

function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDateSeparator(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function shouldShowDateSeparator(msgs: Message[], index: number): boolean {
  if (index === 0) {
    const d = new Date(msgs[0].created_at);
    return !isNaN(d.getTime());
  }
  const curr = new Date(msgs[index].created_at);
  const prev = new Date(msgs[index - 1].created_at);
  if (isNaN(curr.getTime())) return false;
  if (isNaN(prev.getTime())) return true;
  return curr.toDateString() !== prev.toDateString();
}

export default function ChatConversation({
  chatId,
  customerName,
  chatStatus,
  onBack,
  onStatusChange,
}: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [appHeight, setAppHeight] = useState(window.innerHeight);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());

  const token = localStorage.getItem('admin_token');
  const adminId = localStorage.getItem('admin_id') || '';
  const mediaBase = SOCKET_URL;

  // Handle virtual keyboard - resize app to visible area
  useEffect(() => {
    const updateHeight = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      setAppHeight(vh);
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    };

    updateHeight();

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateHeight);
      window.visualViewport.addEventListener('scroll', updateHeight);
    } else {
      window.addEventListener('resize', updateHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateHeight);
        window.visualViewport.removeEventListener('scroll', updateHeight);
      } else {
        window.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  // Deduplicated message setter
  const addMessages = useCallback((newMsgs: Message[], replace = false) => {
    setMessages((prev) => {
      if (replace) {
        const idSet = new Set<string>();
        const deduped: Message[] = [];
        for (const msg of newMsgs) {
          if (!idSet.has(msg.id)) {
            idSet.add(msg.id);
            deduped.push(msg);
          }
        }
        messageIdsRef.current = idSet;
        return deduped;
      }
      const combined = [...prev];
      for (const msg of newMsgs) {
        if (!messageIdsRef.current.has(msg.id)) {
          messageIdsRef.current.add(msg.id);
          combined.push(msg);
        }
      }
      return combined;
    });
  }, []);

  const fetchMessages = useCallback(async (silent = false) => {
    try {
      const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.data.chat) {
        addMessages(data.data.chat.messages || [], true);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [chatId, token, addMessages]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
    fetch(`${API_BASE_URL}/chats/${chatId}/messages/read`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});
  }, [chatId]);

  // Polling fallback
  useEffect(() => {
    pollRef.current = setInterval(() => fetchMessages(true), POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  // Socket connection
  useEffect(() => {
    const socket = io(mediaBase, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_chat', {
        chat_id: chatId,
        user_type: 'admin',
        user_id: adminId,
      });
      fetchMessages(true);
    });

    socket.on('receive_message', (message: Message) => {
      addMessages([message]);
      if (message.sender_type === 'customer') {
        playNotificationSound();
      }
    });

    socket.on('typing_status', (data: any) => {
      if (data.user_type === 'customer') {
        setCustomerTyping(data.is_typing);
      }
    });

    return () => {
      socket.emit('leave_chat', { chat_id: chatId });
      socket.disconnect();
    };
  }, [chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, [messages, customerTyping, appHeight]);

  // Close menu on outside tap
  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showMenu]);

  const handleTyping = (value: string) => {
    setInput(value);
    if (!isTyping && value.trim()) {
      setIsTyping(true);
      socketRef.current?.emit('user_typing', {
        chat_id: chatId, user_type: 'admin', user_id: adminId, is_typing: true,
      });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('user_typing', {
        chat_id: chatId, user_type: 'admin', user_id: adminId, is_typing: false,
      });
    }, 1000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    const messageText = input;
    setSending(true);
    setIsTyping(false);
    setInput('');

    try {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('sender_type', 'admin');
      formData.append('sender_id', adminId);
      formData.append('message', messageText || '');
      if (selectedImage) formData.append('attachment', selectedImage);

      const res = await fetch(`${API_BASE_URL}/chats/message/send`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        addMessages([data.data.message]);
        clearImage();
        socketRef.current?.emit('send_message', { chat_id: chatId, message: data.data.message });
        socketRef.current?.emit('user_typing', {
          chat_id: chatId, user_type: 'admin', user_id: adminId, is_typing: false,
        });
      }
    } catch (err) {
      console.error('Send failed:', err);
      setInput(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'active' | 'closed' | 'waiting') => {
    setShowMenu(false);
    try {
      const endpoint = newStatus === 'closed'
        ? `${API_BASE_URL}/chats/${chatId}/close`
        : `${API_BASE_URL}/chats/${chatId}/status`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        ...(newStatus !== 'closed' && { body: JSON.stringify({ status: newStatus }) }),
      });
      const data = await res.json();
      if (data.success) {
        onStatusChange(newStatus);
        if (newStatus === 'closed') onBack();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  return (
    <div className="chat-app slide-in" style={{ height: appHeight }}>
      {/* Top bar */}
      <div className="conv-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 16, lineHeight: 1.2 }}>{customerName}</div>
          <span className={`status-badge ${chatStatus}`}>{chatStatus}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            className="back-btn"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {showMenu && (
            <div className="status-menu" onClick={(e) => e.stopPropagation()}>
              {chatStatus !== 'active' && (
                <button onClick={() => handleStatusUpdate('active')}>Set Active</button>
              )}
              {chatStatus !== 'waiting' && (
                <button onClick={() => handleStatusUpdate('waiting')}>Set Waiting</button>
              )}
              {chatStatus !== 'closed' && (
                <button onClick={() => handleStatusUpdate('closed')} style={{ color: '#ef4444' }}>
                  Close Chat
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
        </div>
      ) : (
        <div className="messages-scroll" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <p style={{ fontSize: 14 }}>No messages yet</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id}>
                {shouldShowDateSeparator(messages, i) && (
                  <div className="date-separator">
                    <span>{formatDateSeparator(msg.created_at)}</span>
                  </div>
                )}
                <div className={`msg-row ${msg.sender_type === 'admin' ? 'admin' : 'customer'}`}>
                  <div className={`msg-bubble ${msg.sender_type === 'admin' ? 'msg-admin' : 'msg-customer'}`}>
                    {msg.attachment_url && (
                      <img
                        src={`${mediaBase}${msg.attachment_url}`}
                        alt="Attachment"
                        className="msg-image"
                        onClick={() => window.open(`${mediaBase}${msg.attachment_url}`, '_blank')}
                      />
                    )}
                    {msg.message && <span className="msg-content">{msg.message}</span>}
                    <span className="msg-time">{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
          {customerTyping && (
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="image-preview-bar">
          <img src={imagePreview} alt="Preview" />
          <button onClick={clearImage}>&times;</button>
        </div>
      )}

      {/* Input bar */}
      {chatStatus !== 'closed' ? (
        <form className="input-bar" onSubmit={handleSend}>
          <button
            type="button"
            className="btn-icon btn-attach"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Message"
            disabled={sending}
          />
          <button
            type="submit"
            className="btn-icon btn-send"
            disabled={sending || (!input.trim() && !selectedImage)}
          >
            {sending ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </form>
      ) : (
        <div style={{
          padding: '14px',
          textAlign: 'center',
          color: 'var(--chat-text-muted)',
          fontSize: 14,
          borderTop: '1px solid var(--chat-border)',
          paddingBottom: 'calc(14px + var(--safe-bottom))',
          flexShrink: 0,
        }}>
          This chat is closed
        </div>
      )}
    </div>
  );
}
