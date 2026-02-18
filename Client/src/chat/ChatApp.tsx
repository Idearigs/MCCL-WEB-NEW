import { useState, useEffect } from 'react';
import API_BASE_URL from '../config/api';
import { getToken, setTokens, clearTokens, setOnLogout, fetchWithAuth, getDeviceId } from './authHelper';
import ChatLogin from './ChatLogin';
import ChatList from './ChatList';
import ChatConversation from './ChatConversation';
import OrderList from './OrderList';
import OrderDetail from './OrderDetail';
import DeviceManager from './DeviceManager';
import InstallPage from './InstallPrompt';

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
  const [appView, setAppView] = useState<'chats' | 'orders' | 'devices' | 'install'>('chats');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Set up logout callback for auth helper
    setOnLogout(() => {
      setAdmin(null);
      setActiveChatId(null);
      setActiveOrderId(null);
      setAppView('chats');
    });

    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/admin/profile`);
      const data = await res.json();
      if (res.ok && data.data) {
        setAdmin(data.data);
      } else {
        clearTokens();
      }
    } catch {
      clearTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (user: AdminUser, token: string, refreshToken?: string, deviceId?: string) => {
    setTokens(token, refreshToken || '', deviceId);
    setAdmin(user);
  };

  const handleLogout = () => {
    const token = getToken();
    if (token) {
      fetch(`${API_BASE_URL}/admin/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    clearTokens();
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

  // Device manager view
  if (appView === 'devices') {
    return (
      <DeviceManager
        onBack={() => setAppView('chats')}
      />
    );
  }

  // Install page view
  if (appView === 'install') {
    return (
      <InstallPage
        onBack={() => setAppView('chats')}
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
      onSwitchToDevices={() => setAppView('devices')}
      onSwitchToInstall={() => setAppView('install')}
    />
  );
}
