import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
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
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

function shouldShowDateSeparator(msgs: Message[], index: number): boolean {
  if (index === 0) return true;
  const curr = new Date(msgs[index].created_at).toDateString();
  const prev = new Date(msgs[index - 1].created_at).toDateString();
  return curr !== prev;
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

  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('admin_token');
  const adminId = localStorage.getItem('admin_id') || '';
  const mediaBase = API_BASE_URL.replace('/api/v1', '');

  // Fetch chat messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success && data.data.chat) {
          setMessages(data.data.chat.messages || []);
        }
      } catch (err) {
        console.error('Failed to load chat:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // Mark as read
    fetch(`${API_BASE_URL}/chats/${chatId}/messages/read`, {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).catch(() => {});
  }, [chatId]);

  // Socket connection for this chat
  useEffect(() => {
    const socket = io(mediaBase, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.emit('join_chat', {
      chat_id: chatId,
      user_type: 'admin',
      user_id: adminId,
    });

    socket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, customerTyping]);

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
        chat_id: chatId,
        user_type: 'admin',
        user_id: adminId,
        is_typing: true,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('user_typing', {
        chat_id: chatId,
        user_type: 'admin',
        user_id: adminId,
        is_typing: false,
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

    setSending(true);
    setIsTyping(false);

    try {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('sender_type', 'admin');
      formData.append('sender_id', adminId);
      formData.append('message', input || '');
      if (selectedImage) {
        formData.append('attachment', selectedImage);
      }

      const res = await fetch(`${API_BASE_URL}/chats/message/send`, {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setInput('');
        clearImage();

        socketRef.current?.emit('send_message', {
          chat_id: chatId,
          message: data.data.message,
        });

        socketRef.current?.emit('user_typing', {
          chat_id: chatId,
          user_type: 'admin',
          user_id: adminId,
          is_typing: false,
        });
      }
    } catch (err) {
      console.error('Send failed:', err);
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
    <div className="chat-app slide-in">
      {/* Top bar */}
      <div className="conv-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>{customerName}</div>
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
                <div className={`msg-bubble ${msg.sender_type === 'admin' ? 'msg-admin' : 'msg-customer'}`}>
                  {msg.attachment_url && (
                    <img
                      src={`${mediaBase}${msg.attachment_url}`}
                      alt="Attachment"
                      className="msg-image"
                      onClick={() => window.open(`${mediaBase}${msg.attachment_url}`, '_blank')}
                    />
                  )}
                  {msg.message && <p>{msg.message}</p>}
                  <div className="msg-time">{formatTime(msg.created_at)}</div>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            placeholder="Message..."
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
        }}>
          This chat is closed
        </div>
      )}
    </div>
  );
}
