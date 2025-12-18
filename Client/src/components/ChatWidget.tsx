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
          <button
            onClick={handleOpenChat}
            className="group flex items-center gap-3 cursor-pointer transition-all duration-300"
          >
            {/* Main Button Container */}
            <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all duration-300 border border-gray-100 hover:border-gray-200 group-hover:pr-6">
              {/* Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full blur-md opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 text-white p-2.5 rounded-full">
                  <MessageCircle size={20} strokeWidth={2} />
                </div>
              </div>

              {/* Text */}
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold text-gray-900 leading-none">Welcome to</span>
                <span className="text-xs text-gray-600 font-medium leading-none">McCulloch</span>
              </div>

              {/* Pulse Animation */}
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </div>

            {/* Floating Animation Indicator */}
            <style>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-4px); }
              }
              .animate-float {
                animation: float 3s ease-in-out infinite;
              }
            `}</style>
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
