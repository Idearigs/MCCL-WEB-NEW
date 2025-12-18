import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader, MessageSquare, Clock, MapPin, AlertCircle, CheckCircle, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { io } from 'socket.io-client';
import API_BASE_URL from '../../config/api';
import AdminLayout from '../components/AdminLayout';

interface Message {
  id: string;
  chat_id: string;
  sender_type: 'customer' | 'admin';
  sender_id?: string;
  message: string;
  attachment_url?: string;
  created_at: string;
}

interface Chat {
  id: string;
  customer_name: string;
  customer_email: string;
  status: 'active' | 'closed' | 'waiting';
  assigned_admin_id?: string;
  last_message_at: string;
  is_archived: boolean;
  messages?: Message[];
}

export default function AdminChats(): JSX.Element {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const listSocketRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem('admin_token');

  // Global WebSocket for chat list updates
  useEffect(() => {
    const socket = io(API_BASE_URL.replace('/api/v1', ''), {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    listSocketRef.current = socket;

    // Listen for new messages across all chats (admin panel update)
    socket.on('admin_chat_update', (message: Message) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === message.chat_id
            ? {
                ...chat,
                last_message_at: new Date().toISOString(),
                messages: [...(chat.messages || []), message]
              }
            : chat
        )
      );
    });

    // Listen for new chats
    socket.on('new_chat', (chat: Chat) => {
      setChats((prevChats) => [chat, ...prevChats]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchChats();
    // Initial chat list fetch
  }, [statusFilter, searchTerm]);

  // WebSocket connection for selected chat
  useEffect(() => {
    if (!selectedChat) return;

    const socket = io(API_BASE_URL.replace('/api/v1', ''), {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current = socket;

    // Join chat room
    socket.emit('join_chat', {
      chat_id: selectedChat.id,
      user_type: 'admin',
      user_id: localStorage.getItem('admin_id')
    });

    // Listen for new messages
    socket.on('receive_message', (message: Message) => {
      setSelectedChat((prev) => {
        if (prev) {
          return {
            ...prev,
            messages: [...(prev.messages || []), message]
          };
        }
        return prev;
      });
    });

    // Listen for typing status
    socket.on('typing_status', (data: any) => {
      if (data.user_type === 'customer' && data.is_typing) {
        setCustomerTyping(true);
      } else if (data.user_type === 'customer' && !data.is_typing) {
        setCustomerTyping(false);
      }
    });

    return () => {
      socket.emit('leave_chat', { chat_id: selectedChat.id });
      socket.disconnect();
    };
  }, [selectedChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/chats?status=${statusFilter}&search=${searchTerm}&limit=50`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      const data = await response.json();

      if (data.success) {
        setChats(data.data.chats);
        setAlert(null);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setAlert({ type: 'error', message: 'Failed to load chats' });
    } finally {
      setLoading(false);
    }
  };

  const fetchChatDetail = async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await response.json();

      if (data.success) {
        setSelectedChat(data.data.chat);
        // Mark messages as read
        await markMessagesAsRead(chatId);
      }
    } catch (error) {
      console.error('Error fetching chat detail:', error);
      setAlert({ type: 'error', message: 'Failed to load chat messages' });
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    try {
      await fetch(`${API_BASE_URL}/chats/${chatId}/messages/read`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAlert({ type: 'error', message: 'Please select a valid image file' });
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || (!messageInput.trim() && !selectedImage)) return;

    setSending(true);
    setIsTyping(false);

    try {
      // Use FormData if there's an image, otherwise use JSON
      const messageBody = new FormData();
      messageBody.append('chat_id', selectedChat.id);
      messageBody.append('sender_type', 'admin');
      messageBody.append('sender_id', localStorage.getItem('admin_id') || '');
      messageBody.append('message', messageInput || '');

      if (selectedImage) {
        messageBody.append('attachment', selectedImage);
      }

      const response = await fetch(`${API_BASE_URL}/chats/message/send`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: messageBody
      });

      const data = await response.json();

      if (data.success) {
        setMessageInput('');
        clearImage();

        // Emit message via WebSocket for real-time delivery
        if (socketRef.current) {
          socketRef.current.emit('send_message', {
            chat_id: selectedChat.id,
            message: data.data.message
          });
        }

        // Stop typing
        if (socketRef.current) {
          socketRef.current.emit('user_typing', {
            chat_id: selectedChat.id,
            user_type: 'admin',
            user_id: localStorage.getItem('admin_id'),
            is_typing: false
          });
        }

        setAlert({ type: 'success', message: 'Message sent' });
        setTimeout(() => setAlert(null), 2000);
      } else {
        setAlert({ type: 'error', message: 'Failed to send message' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Error sending message' });
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);

    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      if (socketRef.current && selectedChat) {
        socketRef.current.emit('user_typing', {
          chat_id: selectedChat.id,
          user_type: 'admin',
          user_id: localStorage.getItem('admin_id'),
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
      if (socketRef.current && selectedChat) {
        socketRef.current.emit('user_typing', {
          chat_id: selectedChat.id,
          user_type: 'admin',
          user_id: localStorage.getItem('admin_id'),
          is_typing: false
        });
      }
    }, 1000);
  };

  const handleUpdateChatStatus = async (chatId: string, newStatus: 'active' | 'closed' | 'waiting') => {
    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ type: 'success', message: 'Chat status updated' });
        fetchChats();
        if (selectedChat?.id === chatId) {
          setSelectedChat({ ...selectedChat, status: newStatus });
        }
        setTimeout(() => setAlert(null), 2000);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update chat status' });
      console.error('Error updating chat status:', error);
    }
  };

  const handleCloseChat = async (chatId: string) => {
    if (!window.confirm('Are you sure you want to close this chat?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chats/${chatId}/close`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = await response.json();

      if (data.success) {
        setAlert({ type: 'success', message: 'Chat closed' });
        fetchChats();
        if (selectedChat?.id === chatId) {
          setSelectedChat(null);
        }
        setTimeout(() => setAlert(null), 2000);
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to close chat' });
      console.error('Error closing chat:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={32} />
            Customer Chats
          </h1>
        </div>

        {alert && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              alert.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {alert.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={alert.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {alert.message}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Chat List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 space-y-4">
              <input
                type="text"
                placeholder="Search chats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
              />

              <div className="flex gap-2">
                {(['all', 'active', 'waiting', 'closed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-8 flex-1">
                <Loader className="animate-spin text-gray-900" size={24} />
              </div>
            ) : (
              <div className="overflow-y-auto flex-1">
                {chats.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No chats found</div>
                ) : (
                  chats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => fetchChatDetail(chat.id)}
                      className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedChat?.id === chat.id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {chat.customer_name}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {chat.customer_email}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {chat.messages && chat.messages.length > 0
                              ? chat.messages[chat.messages.length - 1].message
                              : 'No messages yet'}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(
                            chat.status
                          )}`}
                        >
                          {chat.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock size={12} />
                        {new Date(chat.last_message_at).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Chat Detail */}
          {selectedChat ? (
            <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedChat.customer_name}</h3>
                  <p className="text-sm text-gray-500">{selectedChat.customer_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedChat.status}
                    onChange={(e) =>
                      handleUpdateChatStatus(
                        selectedChat.id,
                        e.target.value as 'active' | 'closed' | 'waiting'
                      )
                    }
                    className={`px-3 py-1 rounded text-sm font-medium border ${getStatusColor(
                      selectedChat.status
                    )}`}
                  >
                    <option value="waiting">Waiting</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                  {selectedChat.status !== 'closed' && (
                    <button
                      onClick={() => handleCloseChat(selectedChat.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                {selectedChat.messages && selectedChat.messages.length > 0 ? (
                  selectedChat.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs px-4 py-3 rounded-lg ${
                          msg.sender_type === 'admin'
                            ? 'bg-gray-900 text-white rounded-br-none'
                            : 'bg-white border border-gray-300 text-gray-900 rounded-bl-none'
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

                        {/* Display message text if it exists */}
                        {msg.message && (
                          <p className="text-sm">{msg.message}</p>
                        )}

                        <p className="text-xs mt-2 opacity-70">
                          {(() => {
                            try {
                              const date = new Date(msg.created_at);
                              const time = date.getTime();

                              if (isNaN(time)) {
                                return 'just now';
                              }

                              return date.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              });
                            } catch (e) {
                              return 'just now';
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">No messages yet</div>
                )}
                {customerTyping && (
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-500">Customer is typing</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              {selectedChat.status !== 'closed' ? (
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-gray-200 p-4 bg-white space-y-3"
                >
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative inline-block">
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

                  {/* Input and Buttons */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={handleTyping}
                      placeholder="Type your response..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                      disabled={sending}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                      disabled={sending}
                      title="Upload image"
                    >
                      <ImageIcon size={18} />
                    </button>
                    <button
                      type="submit"
                      disabled={sending || (!messageInput.trim() && !selectedImage)}
                      className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {sending ? (
                        <Loader size={18} className="animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          Send
                        </>
                      )}
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </form>
              ) : (
                <div className="p-4 bg-gray-50 text-center text-gray-500 text-sm border-t border-gray-200">
                  This chat is closed
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-2 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a chat to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
