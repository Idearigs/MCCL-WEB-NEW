import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../config/api';

interface User {
  id: string;
  email: string;
  name?: string;
}

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
  messages?: Message[];
}

interface ChatWindowProps {
  user?: User | null;
  chatId?: string | null;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export default function ChatWindow({
  user,
  chatId: initialChatId,
  onClose,
  onChatCreated
}: ChatWindowProps): JSX.Element {
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state for new chat
  const [showForm, setShowForm] = useState(!chatId);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    message: ''
  });
  const [messageInput, setMessageInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chat messages if chat exists
  useEffect(() => {
    if (chatId) {
      fetchChatMessages();
      // Poll for new messages every 2 seconds
      const interval = setInterval(fetchChatMessages, 2000);
      return () => clearInterval(interval);
    }
  }, [chatId]);

  const fetchChatMessages = async () => {
    if (!chatId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chats/view/${chatId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.chat.messages || []);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          customer_user_id: user?.id || null,
          subject: 'Customer Inquiry'
        })
      });

      const data = await response.json();

      if (data.success) {
        const newChatId = data.data.chat.id;
        setChatId(newChatId);
        setShowForm(false);
        onChatCreated(newChatId);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);

        // Send initial message if provided
        if (formData.message.trim()) {
          await sendMessage(newChatId, formData.message);
        }

        setFormData({ name: '', email: '', message: '' });
      } else {
        setError(data.message || 'Failed to create chat');
      }
    } catch (error) {
      setError('Error creating chat. Please try again.');
      console.error('Error creating chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (targetChatId: string = chatId!, messageText: string = messageInput) => {
    if (!messageText.trim()) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/chats/message/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          sender_type: 'customer',
          sender_id: user?.id || null,
          message: messageText
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessageInput('');
        // Fetch updated messages
        await new Promise(resolve => setTimeout(resolve, 500));
        fetchChatMessages();
      } else {
        setError(data.message || 'Failed to send message');
      }
    } catch (error) {
      setError('Error sending message. Please try again.');
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatId) {
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-h-96 bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 flex justify-between items-center">
        <h3 className="font-semibold">McCulloch Support</h3>
        <button
          onClick={onClose}
          className="hover:bg-gray-700 p-1 rounded transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* Form for new chat */}
        {showForm && !chatId ? (
          <form onSubmit={handleCreateChat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                rows={4}
                placeholder="How can we help you?"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-2 rounded flex items-center gap-2">
                <CheckCircle size={16} />
                Chat connected successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Connecting...
                </>
              ) : (
                'Start Chat'
              )}
            </button>
          </form>
        ) : null}

        {/* Messages */}
        {chatId && !showForm ? (
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No messages yet. Start typing to begin!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.sender_type === 'customer'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-300 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : null}
      </div>

      {/* Message Input */}
      {chatId && !showForm ? (
        <form
          onSubmit={handleSendMessage}
          className="border-t border-gray-200 p-4 bg-white flex gap-2"
        >
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !messageInput.trim()}
            className="bg-gray-900 text-white p-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {sending ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      ) : null}
    </div>
  );
}
