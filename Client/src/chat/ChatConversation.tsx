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

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelAssignment {
  id: string;
  label_id: string;
  label: Label;
}

interface ChatConversationProps {
  chatId: string;
  customerName: string;
  chatStatus: 'active' | 'closed' | 'waiting';
  onBack: () => void;
  onStatusChange: (status: 'active' | 'closed' | 'waiting') => void;
  onChatDeleted?: () => void;
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
  onChatDeleted,
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

  // New state for lightbox, delete, labels
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [longPressMessageId, setLongPressMessageId] = useState<string | null>(null);
  const [labels, setLabels] = useState<LabelAssignment[]>([]);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [showDeleteChatConfirm, setShowDeleteChatConfirm] = useState(false);
  const [showDeleteMsgConfirm, setShowDeleteMsgConfirm] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<any>(null);
  const messageIdsRef = useRef<Set<string>>(new Set());
  const longPressTimerRef = useRef<any>(null);

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
        if (data.data.chat.labelAssignments) {
          setLabels(data.data.chat.labelAssignments);
        }
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

  // Long press handlers for message delete
  const handleMsgTouchStart = (msgId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setShowDeleteMsgConfirm(msgId);
    }, 600);
  };

  const handleMsgTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/chats/messages/${msgId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== msgId));
        messageIdsRef.current.delete(msgId);
      }
    } catch (err) {
      console.error('Delete message failed:', err);
    }
    setShowDeleteMsgConfirm(null);
  };

  const handleDeleteChat = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        onChatDeleted?.();
        onBack();
      }
    } catch (err) {
      console.error('Delete chat failed:', err);
    }
    setShowDeleteChatConfirm(false);
  };

  // Label management
  const fetchAllLabels = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/chats/labels`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) setAllLabels(data.data.labels);
    } catch (err) {
      console.error('Fetch labels failed:', err);
    }
  };

  const handleToggleLabel = async (labelId: string) => {
    const isAssigned = labels.some(la => la.label_id === labelId || la.label?.id === labelId);
    try {
      if (isAssigned) {
        await fetch(`${API_BASE_URL}/chats/${chatId}/labels/${labelId}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setLabels(prev => prev.filter(la => la.label_id !== labelId && la.label?.id !== labelId));
      } else {
        const res = await fetch(`${API_BASE_URL}/chats/${chatId}/labels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ labelId }),
        });
        const data = await res.json();
        if (data.success) {
          const label = allLabels.find(l => l.id === labelId);
          if (label) {
            setLabels(prev => [...prev, { id: data.data.assignment.id, label_id: labelId, label }]);
          }
        }
      }
    } catch (err) {
      console.error('Toggle label failed:', err);
    }
  };

  const openLabelModal = () => {
    setShowMenu(false);
    fetchAllLabels();
    setShowLabelModal(true);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
            <span className={`status-badge ${chatStatus}`}>{chatStatus}</span>
            {labels.map(la => (
              <span
                key={la.id}
                className="label-pill"
                style={{ background: la.label?.color || '#666' }}
              >
                {la.label?.name}
              </span>
            ))}
          </div>
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
              <button onClick={openLabelModal}>Manage Labels</button>
              <button
                onClick={() => { setShowMenu(false); setShowDeleteChatConfirm(true); }}
                style={{ color: '#ef4444' }}
              >
                Delete Chat
              </button>
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
                <div
                  className={`msg-row ${msg.sender_type === 'admin' ? 'admin' : 'customer'}`}
                  onTouchStart={() => handleMsgTouchStart(msg.id)}
                  onTouchEnd={handleMsgTouchEnd}
                  onTouchMove={handleMsgTouchEnd}
                  onContextMenu={(e) => { e.preventDefault(); setShowDeleteMsgConfirm(msg.id); }}
                >
                  <div className={`msg-bubble ${msg.sender_type === 'admin' ? 'msg-admin' : 'msg-customer'}`}>
                    {msg.attachment_url && (
                      <img
                        src={`${mediaBase}${msg.attachment_url}`}
                        alt="Attachment"
                        className="msg-image"
                        onClick={() => setLightboxUrl(`${mediaBase}${msg.attachment_url}`)}
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

      {/* Image preview (pre-send) */}
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

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Full size" className="lightbox-image" />
          <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>&times;</button>
        </div>
      )}

      {/* Delete Message Confirmation */}
      {showDeleteMsgConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteMsgConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 15, marginBottom: 16 }}>Delete this message?</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="modal-btn" onClick={() => setShowDeleteMsgConfirm(null)}>Cancel</button>
              <button className="modal-btn danger" onClick={() => handleDeleteMessage(showDeleteMsgConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation */}
      {showDeleteChatConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteChatConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 15, marginBottom: 4, fontWeight: 600 }}>Delete entire chat?</p>
            <p style={{ fontSize: 13, color: 'var(--chat-text-muted)', marginBottom: 16 }}>
              This will permanently delete all messages. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="modal-btn" onClick={() => setShowDeleteChatConfirm(false)}>Cancel</button>
              <button className="modal-btn danger" onClick={handleDeleteChat}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Label Management Modal */}
      {showLabelModal && (
        <div className="modal-overlay" onClick={() => setShowLabelModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxHeight: '60vh' }}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Manage Labels</p>
            {allLabels.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--chat-text-muted)' }}>No labels created yet. Create labels from the chat list.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allLabels.map(label => {
                  const isAssigned = labels.some(la => la.label_id === label.id || la.label?.id === label.id);
                  return (
                    <button
                      key={label.id}
                      className={`label-toggle-btn ${isAssigned ? 'active' : ''}`}
                      onClick={() => handleToggleLabel(label.id)}
                    >
                      <span className="label-dot" style={{ background: label.color }} />
                      <span style={{ flex: 1, textAlign: 'left' }}>{label.name}</span>
                      {isAssigned && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              className="modal-btn"
              style={{ marginTop: 16, width: '100%' }}
              onClick={() => setShowLabelModal(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
