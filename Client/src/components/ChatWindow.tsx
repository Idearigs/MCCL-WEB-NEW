import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { io } from 'socket.io-client';
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
  // If user is logged in (has name and email), skip the form
  const isUserLoggedIn = !!(user?.name && user?.email);
  const [showForm, setShowForm] = useState(!chatId && !isUserLoggedIn);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    message: ''
  });
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-create chat for logged-in users
  useEffect(() => {
    if (isUserLoggedIn && !chatId && user?.name && user?.email) {
      const createAutoChat = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/chats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customer_name: user.name,
              customer_email: user.email,
              customer_user_id: user.id || null,
              subject: 'Customer Inquiry'
            })
          });

          const data = await response.json();
          if (data.success) {
            setChatId(data.data.chat.id);
            setShowForm(false);
            onChatCreated(data.data.chat.id);
          }
        } catch (error) {
          console.error('Error creating auto-chat:', error);
        }
      };

      createAutoChat();
    }
  }, [isUserLoggedIn, user?.id, user?.name, user?.email, chatId, onChatCreated]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // WebSocket connection and chat setup
  useEffect(() => {
    if (!chatId) return;

    // Connect to WebSocket
    const socket = io(API_BASE_URL.replace('/api/v1', ''), {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Fetch initial messages
    const fetchInitialMessages = async () => {
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

    fetchInitialMessages();

    // Join chat room
    socket.emit('join_chat', {
      chat_id: chatId,
      user_type: 'customer',
      user_id: user?.id || null
    });

    // Listen for new messages
    socket.on('receive_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing status
    socket.on('typing_status', (data: any) => {
      if (data.is_typing && data.user_type !== 'customer') {
        setOtherUserTyping(true);
        setTypingUser(data.user_type === 'admin' ? 'Admin' : 'Agent');
      } else if (!data.is_typing && data.user_type !== 'customer') {
        setOtherUserTyping(false);
        setTypingUser('');
      }
    });

    return () => {
      socket.emit('leave_chat', { chat_id: chatId });
      socket.disconnect();
    };
  }, [chatId, user?.id]);

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

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (targetChatId: string = chatId!, messageText: string = messageInput) => {
    if (!messageText.trim() && !selectedImage) return;

    setSending(true);
    setError(null);
    setIsTyping(false);

    try {
      // Use FormData if there's an image, otherwise use JSON
      const messageBody = new FormData();
      messageBody.append('chat_id', targetChatId);
      messageBody.append('sender_type', 'customer');
      messageBody.append('sender_id', user?.id || '');
      messageBody.append('message', messageText || '');

      if (selectedImage) {
        messageBody.append('attachment', selectedImage);
      }

      const response = await fetch(`${API_BASE_URL}/chats/message/send`, {
        method: 'POST',
        body: messageBody
      });

      const data = await response.json();

      if (data.success) {
        setMessageInput('');
        clearImage();

        // Emit message via WebSocket for real-time delivery
        if (socketRef.current) {
          socketRef.current.emit('send_message', {
            chat_id: targetChatId,
            message: data.data.message
          });
        }

        // Stop typing
        if (socketRef.current) {
          socketRef.current.emit('user_typing', {
            chat_id: targetChatId,
            user_type: 'customer',
            user_id: user?.id || null,
            is_typing: false
          });
        }
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

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      if (socketRef.current && chatId) {
        socketRef.current.emit('user_typing', {
          chat_id: chatId,
          user_type: 'customer',
          user_id: user?.id || null,
          is_typing: true
        });
      }
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketRef.current && chatId) {
        socketRef.current.emit('user_typing', {
          chat_id: chatId,
          user_type: 'customer',
          user_id: user?.id || null,
          is_typing: false
        });
      }
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatId) {
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-50 max-h-[85dvh] sm:max-h-[600px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header - Luxury Minimal */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex justify-between items-center border-b border-gray-700 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-gray-700 to-transparent opacity-30 rounded-full -translate-y-1/2 translate-x-1/2"></div>

        <div className="relative z-10">
          <h3 className="font-light text-lg tracking-wide">McCulloch</h3>
          <p className="text-xs text-gray-400 font-light">Jewelry & Support</p>
        </div>
        <button
          onClick={onClose}
          className="relative z-10 text-gray-400 hover:text-white transition-colors duration-200 p-2 hover:bg-white/10 rounded-lg"
        >
          <X size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* Form for new chat */}
        {showForm && !chatId ? (
          <form onSubmit={handleCreateChat} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                Your Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-900/20 bg-white hover:border-gray-300 transition-all duration-200"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-900/20 bg-white hover:border-gray-300 transition-all duration-200"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 tracking-wide">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-900/20 bg-white hover:border-gray-300 transition-all duration-200 resize-none"
                rows={4}
                placeholder="How can we help you?"
              />
            </div>

            {error && (
              <div className="text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200 animate-in fade-in duration-300">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-700 text-sm bg-green-50 p-3 rounded-lg flex items-center gap-2 border border-green-200 animate-in fade-in duration-300">
                <CheckCircle size={16} className="flex-shrink-0" />
                Chat connected successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 font-medium tracking-wide hover:shadow-lg"
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
          <div className="space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-sm font-light">No messages yet</p>
                <p className="text-xs text-gray-500 mt-1 font-light">Start typing to begin</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={`${msg.id}-${index}`}
                  className={`flex ${
                    msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'
                  } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={`max-w-xs transition-all duration-300 backdrop-blur-sm ${
                      msg.message?.startsWith('[PRODUCT:')
                        ? 'bg-transparent border-0 shadow-none p-0'
                        : msg.sender_type === 'customer'
                          ? 'px-4 py-2.5 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg hover:shadow-xl border border-gray-700/50'
                          : 'px-4 py-2.5 rounded-2xl bg-white/80 border border-gray-200 text-gray-900 shadow-md hover:shadow-lg'
                    }`}
                  >
                    {/* Display image if attachment exists */}
                    {msg.attachment_url && (
                      <div className="mb-2">
                        <img
                          src={`${API_BASE_URL.replace('/api/v1', '')}${msg.attachment_url}`}
                          alt="Attachment"
                          className="max-w-xs rounded-lg border border-gray-400/30 shadow-sm"
                        />
                      </div>
                    )}

                    {/* Display message text — detect product cards */}
                    {msg.message && (() => {
                      const productMatch = msg.message.match(/^\[PRODUCT:([^:]+):([^:]+):([^:]+):([^:]+):([^\]]+)\]$/);
                      if (productMatch) {
                        const [, slug, name, price, imageUrl, category] = productMatch;
                        const productPath = `/${category}/${slug}`;
                        const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL.replace('/api/v1', '')}${imageUrl}`;
                        return (
                          <a
                            href={productPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-48 rounded-xl overflow-hidden border border-gray-100 bg-white shadow-md hover:shadow-lg transition-shadow duration-200 no-underline"
                          >
                            <div className="w-full aspect-square bg-gray-50 overflow-hidden">
                              <img
                                src={fullImageUrl}
                                alt={name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            </div>
                            <div className="px-3 py-2.5">
                              <p className="text-sm font-cormorant font-medium text-gray-900 leading-snug">{name}</p>
                              <p className="text-sm font-cormorant text-amber-700 mt-0.5">{price}</p>
                              <p className="text-[10px] font-inter font-light tracking-widest uppercase text-amber-600 mt-1.5">View Product</p>
                            </div>
                          </a>
                        );
                      }
                      return <p className="text-sm leading-relaxed font-light">{msg.message}</p>;
                    })()}

                    <p className={`text-xs mt-2 font-light opacity-70 ${
                      msg.message?.startsWith('[PRODUCT:') ? 'hidden' : ''
                    } ${msg.sender_type === 'customer' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {(() => {
                        try {
                          const date = new Date(msg.created_at);
                          const timestamp = date.getTime();

                          // Check if date is valid
                          if (isNaN(timestamp)) {
                            return 'just now';
                          }

                          // Show time for all valid dates
                          return date.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          });
                        } catch (e) {
                          return 'just now';
                        }
                      })()}
                    </p>
                  </div>
                </div>
              ))
            )}
            {otherUserTyping && (
              <div className="flex gap-2 items-center animate-in fade-in duration-300">
                <span className="text-xs text-gray-500 font-light">{typingUser} is typing</span>
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : null}
      </div>

      {/* Message Input */}
      {chatId && !showForm ? (
        <div className="border-t border-gray-200 p-4 bg-gradient-to-br from-white to-gray-50 shadow-inner rounded-b-2xl">
          {/* Image Preview */}
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-20 rounded-lg border border-gray-200 shadow-sm"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="flex gap-3"
          >
            <input
              type="text"
              value={messageInput}
              onChange={handleTyping}
              placeholder="Type your message..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 bg-white hover:bg-white/95 transition-all duration-200 text-sm font-light shadow-sm hover:shadow-md"
              disabled={sending}
            />

            {/* Image Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 hover:shadow-lg active:scale-95 flex items-center justify-center"
              title="Upload image"
              disabled={sending}
            >
              <ImageIcon size={18} strokeWidth={1.5} />
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={sending || (!messageInput.trim() && !selectedImage)}
              className="bg-gradient-to-br from-gray-900 to-gray-800 text-white px-4 py-3 rounded-xl hover:from-gray-800 hover:to-gray-700 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 font-medium"
            >
              {sending ? (
                <Loader size={18} className="animate-spin" />
              ) : (
                <>
                  <Send size={18} strokeWidth={1.5} />
                  <span className="text-xs font-light">Send</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
