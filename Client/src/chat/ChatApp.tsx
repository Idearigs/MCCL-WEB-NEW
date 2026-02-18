import { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import ChatLogin from './ChatLogin';
import ChatList from './ChatList';
import ChatConversation from './ChatConversation';
import OrderList from './OrderList';
import OrderDetail from './OrderDetail';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export default function ChatApp() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState('');
  const [activeChatStatus, setActiveChatStatus] = useState<'active' | 'closed' | 'waiting'>('active');
  const [appView, setAppView] = useState<'chats' | 'orders'>('chats');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/admin/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setAdmin(data.data);
      } else {
        localStorage.removeItem('admin_token');
      }
    } catch {
      localStorage.removeItem('admin_token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user: AdminUser, token: string) => {
    localStorage.setItem('admin_token', token);
    setAdmin(user);
  };

  const handleLogout = () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      fetch(`${API_BASE_URL}/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('admin_token');
    setAdmin(null);
    setActiveChatId(null);
    setActiveOrderId(null);
    setAppView('chats');
  };

  const handleOpenChat = (chatId: string, customerName: string, status: 'active' | 'closed' | 'waiting') => {
    setActiveChatId(chatId);
    setActiveChatName(customerName);
    setActiveChatStatus(status);
  };

  const handleBack = () => {
    setActiveChatId(null);
  };

  if (isLoading) {
    return (
      <div className="chat-app" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!admin) {
    return <ChatLogin onLogin={handleLogin} />;
  }

  // Chat conversation view
  if (activeChatId) {
    return (
      <ChatConversation
        chatId={activeChatId}
        customerName={activeChatName}
        chatStatus={activeChatStatus}
        onBack={handleBack}
        onStatusChange={setActiveChatStatus}
        onChatDeleted={handleBack}
      />
    );
  }

  // Order detail view
  if (appView === 'orders' && activeOrderId) {
    return (
      <OrderDetail
        orderId={activeOrderId}
        onBack={() => setActiveOrderId(null)}
      />
    );
  }

  // Order list view
  if (appView === 'orders') {
    return (
      <OrderList
        onSwitchToChats={() => setAppView('chats')}
        onOpenOrder={(id) => setActiveOrderId(id)}
      />
    );
  }

  // Chat list view (default)
  return (
    <ChatList
      admin={admin}
      onOpenChat={handleOpenChat}
      onLogout={handleLogout}
      onSwitchToOrders={() => { setAppView('orders'); setActiveOrderId(null); }}
    />
  );
}
