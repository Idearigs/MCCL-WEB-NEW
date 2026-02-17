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

interface Chat {
  id: string;
  customer_name: string;
  customer_email: string;
  status: 'active' | 'closed' | 'waiting';
  last_message_at: string;
  messages?: Message[];
}

interface ChatListProps {
  admin: { id: string; full_name: string };
  onOpenChat: (chatId: string, customerName: string, status: 'active' | 'closed' | 'waiting') => void;
  onLogout: () => void;
}

const STATUS_FILTERS = ['all', 'active', 'waiting', 'closed'] as const;
const SOCKET_URL = API_BASE_URL.replace('/api/v1', '');
const POLL_INTERVAL = 5000;

// Notification sound - short beep using AudioContext
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

        // Detect new chats/messages for notifications (skip first load)
        if (!isFirstLoad.current) {
          for (const chat of newChats) {
            // New chat notification
            if (!knownChatIds.current.has(chat.id)) {
              playNotificationSound();
              showBrowserNotification(
                'New Visitor',
                `${chat.customer_name} started a chat`
              );
            }
            // New message notification
            if (chat.messages && chat.messages.length > 0) {
              const lastMsg = chat.messages[chat.messages.length - 1];
              if (lastMsg.sender_type === 'customer' && !knownMessageIds.current.has(lastMsg.id)) {
                playNotificationSound();
                showBrowserNotification(
                  chat.customer_name,
                  lastMsg.message || 'Sent an image'
                );
              }
            }
          }
        }

        // Update known IDs
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

  // Polling fallback - always poll for fresh data
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
      // Refresh on reconnect to catch missed messages
      fetchChats(undefined, true);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('admin_chat_update', (message: Message) => {
      // Deduplicate by message id
      if (knownMessageIds.current.has(message.id)) return;
      knownMessageIds.current.add(message.id);

      // Notify for customer messages
      if (message.sender_type === 'customer') {
        playNotificationSound();
        setChats((prev) => {
          const chat = prev.find(c => c.id === message.chat_id);
          showBrowserNotification(
            chat?.customer_name || 'Customer',
            message.message || 'Sent an image'
          );
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

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
