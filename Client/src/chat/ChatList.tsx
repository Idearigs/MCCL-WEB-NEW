import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import API_BASE_URL from '../config/api';

interface Message {
  id: string;
  chat_id: string;
  sender_type: 'customer' | 'admin';
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

interface Chat {
  id: string;
  customer_name: string;
  customer_email: string;
  status: 'active' | 'closed' | 'waiting';
  last_message_at: string;
  messages?: Message[];
  labelAssignments?: LabelAssignment[];
}

interface ChatListProps {
  admin: { id: string; full_name: string };
  onOpenChat: (chatId: string, customerName: string, status: 'active' | 'closed' | 'waiting') => void;
  onLogout: () => void;
}

const STATUS_FILTERS = ['all', 'active', 'waiting', 'closed'] as const;
const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');
const POLL_INTERVAL = 5000;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

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

function showBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const n = new Notification(title, {
        body,
        icon: '/mcculloch-logo.png',
        badge: '/mcculloch-logo.png',
        vibrate: [200, 100, 200],
        tag: 'mcculloch-chat',
        renotify: true,
      });
      n.onclick = () => { window.focus(); n.close(); };
    } catch {}
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const DEFAULT_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];

export default function ChatList({ admin, onOpenChat, onLogout }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const searchTimeout = useRef<any>(null);
  const pollRef = useRef<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const knownChatIds = useRef<Set<string>>(new Set());
  const knownMessageIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  // Touch-based pull-to-refresh state
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  // Label management state
  const [showLabelMgmt, setShowLabelMgmt] = useState(false);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_COLORS[0]);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);

  // Long-press delete chat
  const [showDeleteChatConfirm, setShowDeleteChatConfirm] = useState<string | null>(null);
  const longPressTimerRef = useRef<any>(null);

  const token = localStorage.getItem('admin_token');

  const fetchChats = useCallback(async (search?: string, silent = false) => {
    try {
      const s = search ?? debouncedSearch;
      const res = await fetch(
        `${API_BASE_URL}/chats?status=${statusFilter}&search=${s}&limit=50`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = await res.json();
      if (data.success) {
        const newChats: Chat[] = data.data.chats;

        if (!isFirstLoad.current) {
          for (const chat of newChats) {
            if (!knownChatIds.current.has(chat.id)) {
              playNotificationSound();
              showBrowserNotification('New Visitor', `${chat.customer_name} started a chat`);
            }
            if (chat.messages && chat.messages.length > 0) {
              const lastMsg = chat.messages[chat.messages.length - 1];
              if (lastMsg.sender_type === 'customer' && !knownMessageIds.current.has(lastMsg.id)) {
                playNotificationSound();
                showBrowserNotification(chat.customer_name, lastMsg.message || 'Sent an image');
              }
            }
          }
        }

        knownChatIds.current = new Set(newChats.map(c => c.id));
        for (const chat of newChats) {
          if (chat.messages) {
            chat.messages.forEach(m => knownMessageIds.current.add(m.id));
          }
        }
        isFirstLoad.current = false;

        setChats(newChats);
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [statusFilter, debouncedSearch, token]);

  // Debounce search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchTerm]);

  // Fetch on filter/search change
  useEffect(() => {
    setLoading(true);
    fetchChats();
  }, [statusFilter, debouncedSearch]);

  // Polling fallback
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchChats(undefined, true);
    }, POLL_INTERVAL);
    return () => clearInterval(pollRef.current);
  }, [fetchChats]);

  // Socket.IO for instant updates
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      fetchChats(undefined, true);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('admin_chat_update', (message: Message) => {
      if (knownMessageIds.current.has(message.id)) return;
      knownMessageIds.current.add(message.id);

      if (message.sender_type === 'customer') {
        playNotificationSound();
        setChats((prev) => {
          const chat = prev.find(c => c.id === message.chat_id);
          showBrowserNotification(chat?.customer_name || 'Customer', message.message || 'Sent an image');
          return prev;
        });
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === message.chat_id
            ? {
                ...chat,
                last_message_at: new Date().toISOString(),
                messages: [...(chat.messages || []), message],
              }
            : chat
        )
      );
    });

    socket.on('new_chat', (chat: Chat) => {
      if (knownChatIds.current.has(chat.id)) return;
      knownChatIds.current.add(chat.id);

      playNotificationSound();
      showBrowserNotification('New Visitor', `${chat.customer_name} started a chat`);
      setChats((prev) => [chat, ...prev]);
    });

    return () => { socket.disconnect(); };
  }, []);

  // Request notification permission + subscribe to Web Push
  useEffect(() => {
    async function setupPush() {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission !== 'granted') return;

      try {
        const reg = await navigator.serviceWorker.ready;
        const keyRes = await fetch(`${API_BASE_URL}/chats/push/vapid-key`);
        const keyData = await keyRes.json();
        if (!keyData.success) return;

        const applicationServerKey = urlBase64ToUint8Array(keyData.data.publicKey);

        let subscription = await reg.pushManager.getSubscription();
        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          });
        }

        await fetch(`${API_BASE_URL}/chats/push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch (err) {
        console.warn('Push subscription failed:', err);
      }
    }

    setupPush();
  }, []);

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      const dist = e.touches[0].clientY - touchStartY.current;
      if (dist > 0) setPullDistance(Math.min(dist, 80));
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 50) {
      setRefreshing(true);
      fetchChats();
    }
    setPullDistance(0);
  };

  const getLastMessage = (chat: Chat): string => {
    if (!chat.messages || chat.messages.length === 0) return 'No messages yet';
    return chat.messages[chat.messages.length - 1].message || 'Image';
  };

  // Long press handlers for delete
  const handleChatTouchStart = (chatId: string) => {
    longPressTimerRef.current = setTimeout(() => {
      setShowDeleteChatConfirm(chatId);
    }, 600);
  };

  const handleChatTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setChats(prev => prev.filter(c => c.id !== chatId));
        knownChatIds.current.delete(chatId);
      }
    } catch (err) {
      console.error('Delete chat failed:', err);
    }
    setShowDeleteChatConfirm(null);
  };

  // Label management
  const fetchLabels = async () => {
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

  const openLabelMgmt = () => {
    fetchLabels();
    setShowLabelMgmt(true);
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chats/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ name: newLabelName.trim(), color: newLabelColor }),
      });
      const data = await res.json();
      if (data.success) {
        setAllLabels(prev => [...prev, data.data.label]);
        setNewLabelName('');
        setNewLabelColor(DEFAULT_COLORS[(allLabels.length + 1) % DEFAULT_COLORS.length]);
      }
    } catch (err) {
      console.error('Create label failed:', err);
    }
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel) return;
    try {
      const res = await fetch(`${API_BASE_URL}/chats/labels/${editingLabel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ name: editingLabel.name, color: editingLabel.color }),
      });
      const data = await res.json();
      if (data.success) {
        setAllLabels(prev => prev.map(l => l.id === editingLabel.id ? data.data.label : l));
        setEditingLabel(null);
      }
    } catch (err) {
      console.error('Update label failed:', err);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      await fetch(`${API_BASE_URL}/chats/labels/${labelId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAllLabels(prev => prev.filter(l => l.id !== labelId));
      // Refresh chats to update label displays
      fetchChats(undefined, true);
    } catch (err) {
      console.error('Delete label failed:', err);
    }
  };

  return (
    <div className="chat-app">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>
              Chats
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: connected ? '#22c55e' : '#ef4444',
                marginLeft: 8,
                verticalAlign: 'middle',
              }} />
            </h1>
            <p style={{ fontSize: 12, color: 'var(--chat-text-muted)', marginTop: 2 }}>
              {admin.full_name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={openLabelMgmt}
              style={{
                background: 'var(--chat-surface)',
                border: 'none',
                color: 'var(--chat-text-muted)',
                padding: '8px 10px',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Manage Labels"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </button>
            <button
              onClick={onLogout}
              style={{
                background: 'var(--chat-surface)',
                border: 'none',
                color: 'var(--chat-text-muted)',
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-wrapper">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Status filter pills */}
      <div className="filter-pills">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-pill ${statusFilter === f ? 'active' : ''}`}
            onClick={() => setStatusFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Chat list */}
      {loading ? (
        <div className="empty-state">
          <div className="spinner" />
        </div>
      ) : chats.length === 0 ? (
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <p>No chats found</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="chat-list-scroll"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {(refreshing || pullDistance > 0) && (
            <div className="pull-indicator">
              {refreshing ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Pull to refresh'}
            </div>
          )}
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="chat-list-item"
              onClick={() => onOpenChat(chat.id, chat.customer_name, chat.status)}
              onTouchStart={() => handleChatTouchStart(chat.id)}
              onTouchEnd={handleChatTouchEnd}
              onTouchMove={handleChatTouchEnd}
              onContextMenu={(e) => { e.preventDefault(); setShowDeleteChatConfirm(chat.id); }}
            >
              <div className={`status-dot ${chat.status}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--chat-text)' }}>
                    {chat.customer_name}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--chat-text-muted)', flexShrink: 0 }}>
                    {timeAgo(chat.last_message_at)}
                  </span>
                </div>
                <p style={{
                  fontSize: 13,
                  color: 'var(--chat-text-muted)',
                  marginTop: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {getLastMessage(chat)}
                </p>
                {chat.labelAssignments && chat.labelAssignments.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    {chat.labelAssignments.map(la => (
                      <span
                        key={la.id}
                        className="label-pill-sm"
                        style={{ background: la.label?.color || '#666' }}
                      >
                        {la.label?.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Chat Confirmation */}
      {showDeleteChatConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteChatConfirm(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 15, marginBottom: 4, fontWeight: 600 }}>Delete this chat?</p>
            <p style={{ fontSize: 13, color: 'var(--chat-text-muted)', marginBottom: 16 }}>
              All messages will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="modal-btn" onClick={() => setShowDeleteChatConfirm(null)}>Cancel</button>
              <button className="modal-btn danger" onClick={() => handleDeleteChat(showDeleteChatConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Label Management Modal */}
      {showLabelMgmt && (
        <div className="modal-overlay" onClick={() => { setShowLabelMgmt(false); setEditingLabel(null); }}>
          <div className="modal-box label-mgmt-modal" onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Manage Labels</p>

            {/* Create new label */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={e => setNewLabelName(e.target.value)}
                  placeholder="Label name"
                  className="label-input"
                  onKeyDown={e => e.key === 'Enter' && handleCreateLabel()}
                />
                <div className="color-picker-row">
                  {DEFAULT_COLORS.map(c => (
                    <button
                      key={c}
                      className={`color-swatch ${newLabelColor === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setNewLabelColor(c)}
                    />
                  ))}
                </div>
              </div>
              <button className="modal-btn primary" onClick={handleCreateLabel}>Add</button>
            </div>

            {/* Existing labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '40vh', overflowY: 'auto' }}>
              {allLabels.map(label => (
                <div key={label.id} className="label-mgmt-row">
                  {editingLabel?.id === label.id ? (
                    <>
                      <input
                        type="text"
                        value={editingLabel.name}
                        onChange={e => setEditingLabel({ ...editingLabel, name: e.target.value })}
                        className="label-input"
                        style={{ flex: 1 }}
                      />
                      <div className="color-picker-row">
                        {DEFAULT_COLORS.map(c => (
                          <button
                            key={c}
                            className={`color-swatch ${editingLabel.color === c ? 'active' : ''}`}
                            style={{ background: c }}
                            onClick={() => setEditingLabel({ ...editingLabel, color: c })}
                          />
                        ))}
                      </div>
                      <button className="modal-btn primary sm" onClick={handleUpdateLabel}>Save</button>
                      <button className="modal-btn sm" onClick={() => setEditingLabel(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <span className="label-dot" style={{ background: label.color }} />
                      <span style={{ flex: 1, fontSize: 14 }}>{label.name}</span>
                      <button
                        className="label-action-btn"
                        onClick={() => setEditingLabel({ ...label })}
                        title="Edit"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="label-action-btn danger"
                        onClick={() => handleDeleteLabel(label.id)}
                        title="Delete"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              ))}
              {allLabels.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--chat-text-muted)', textAlign: 'center', padding: 12 }}>
                  No labels yet. Create one above.
                </p>
              )}
            </div>

            <button
              className="modal-btn"
              style={{ marginTop: 16, width: '100%' }}
              onClick={() => { setShowLabelMgmt(false); setEditingLabel(null); }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
