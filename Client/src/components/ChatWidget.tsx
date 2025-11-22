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
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={handleOpenChat}
            className="group flex flex-col items-center gap-2 cursor-pointer"
          >
            {/* Tooltip */}
            <div className="absolute bottom-20 right-0 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              Welcome to McCulloch Jewellers
            </div>

            {/* Button */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 border border-gray-700">
              <MessageCircle size={24} />
            </div>
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
