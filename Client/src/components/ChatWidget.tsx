import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import API_BASE_URL from '../config/api';
import ChatWindow from './ChatWindow';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface ChatWidgetProps {
  user?: User | null;
}

export default function ChatWidget({ user }: ChatWidgetProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in and has previous chats
  useEffect(() => {
    if (user?.id) {
      checkPreviousChats();
    }
  }, [user]);

  const checkPreviousChats = async () => {
    try {
      if (!user?.id) return;

      const response = await fetch(
        `${API_BASE_URL}/chats/customer/${user.id}`
      );
      const data = await response.json();

      if (data.success && data.data.chats && data.data.chats.length > 0) {
        // Set the most recent chat
        setChatId(data.data.chats[0].id);
      }
    } catch (error) {
      console.error('Error checking previous chats:', error);
    }
  };

  const handleOpenChat = () => {
    if (!chatId && user?.id) {
      checkPreviousChats();
    }
    setIsOpen(true);
  };

  const handleCloseChat = () => {
    setIsOpen(false);
  };

  const handleChatCreated = (newChatId: string) => {
    setChatId(newChatId);
  };

  return (
    <>
      {/* Chat Widget Button - Bottom Right Corner */}
      {!isOpen && (
        <div className="fixed bottom-8 right-8 z-40">
          {/* Mobile: circle icon only */}
          <button
            onClick={handleOpenChat}
            className="flex md:hidden items-center justify-center w-14 h-14 bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-gray-700"
          >
            <MessageCircle size={22} strokeWidth={2} className="text-white" />
          </button>

          {/* Desktop: full pill with text */}
          <button
            onClick={handleOpenChat}
            className="hidden md:flex items-center gap-3 bg-white rounded-full px-5 py-3.5 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
          >
            <div className="bg-gray-800 text-white p-2 rounded-full">
              <MessageCircle size={18} strokeWidth={2} />
            </div>
            <span className="text-sm font-medium text-gray-800 pr-1">Can we help you?</span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <ChatWindow
          user={user}
          chatId={chatId}
          onClose={handleCloseChat}
          onChatCreated={handleChatCreated}
        />
      )}
    </>
  );
}
