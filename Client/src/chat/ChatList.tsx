import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../config/api';

interface Message {
  id: string;
  chat_id: string;
  sender_type: 'customer' | 'admin';
  message: string;
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
  const socketRef = useRef<any>(null);
  const searchTimeout = useRef<any>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Touch-based pull-to-refresh state
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  const token = localStorage.getItem('admin_token');

  const fetchChats = useCallback(async (search?: string) => {
    try {
      const s = search ?? debouncedSearch;
      const res = await fetch(
        `${API_BASE_URL}/chats?status=${statusFilter}&search=${s}&limit=50`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const data = await res.json();
      if (data.success) {
        setChats(data.data.chats);
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  // Global socket for real-time updates
  useEffect(() => {
    const socket = io(API_BASE_URL.replace('/api/v1', ''), {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on('admin_chat_update', (message: Message) => {
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
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Chats</h1>
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
