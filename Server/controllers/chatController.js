const { getModels } = require('../models');
const { sendPushToAllAdmins, saveSubscription, removeSubscription, VAPID_PUBLIC_KEY } = require('../utils/pushNotifications');

const getModelInstance = () => {
  try {
    return getModels();
  } catch (error) {
    console.error('Error getting models:', error);
    throw error;
  }
};

// Create a new chat session
exports.createChat = async (req, res) => {
  try {
    const { Chat } = getModelInstance();
    const { customer_name, customer_email, customer_user_id, subject } = req.body;

    if (!customer_name || !customer_email) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and email are required'
      });
    }

    const chat = await Chat.create({
      customer_name,
      customer_email,
      customer_user_id: customer_user_id || null,
      subject: subject || null,
      status: 'waiting',
      last_message_at: new Date()
    });

    // Emit new chat event via WebSocket to admin panel
    if (req.io) {
      req.io.emit('new_chat', {
        id: chat.id,
        customer_name: chat.customer_name,
        customer_email: chat.customer_email,
        status: chat.status,
        last_message_at: chat.last_message_at,
        is_archived: chat.is_archived,
        assigned_admin_id: chat.assigned_admin_id,
        messages: []
      });
    }

    // Send push notification to all admin devices
    sendPushToAllAdmins({
      title: 'New Visitor',
      body: `${customer_name} started a chat`,
      chatId: chat.id,
    }).catch(err => console.error('Push notification error:', err));

    return res.status(201).json({
      success: true,
      data: { chat },
      message: 'Chat session created successfully'
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create chat',
      error: error.message
    });
  }
};

// Get all chats (admin view with pagination)
exports.getAllChats = async (req, res) => {
  try {
    const { Chat } = getModelInstance();
    const { status, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { customer_name: { [Op.iLike]: `%${search}%` } },
        { customer_email: { [Op.iLike]: `%${search}%` } },
        { subject: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Chat.findAndCountAll({
      where,
      order: [['last_message_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    return res.json({
      success: true,
      data: {
        chats: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting chats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get chats',
      error: error.message
    });
  }
};

// Get specific chat with messages
exports.getChatById = async (req, res) => {
  try {
    const { Chat, ChatMessage } = getModelInstance();
    const { id } = req.params;

    const chat = await Chat.findByPk(id, {
      include: [{
        model: ChatMessage,
        as: 'messages',
        order: [['created_at', 'ASC']]
      }]
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    return res.json({
      success: true,
      data: { chat }
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get chat',
      error: error.message
    });
  }
};

// Send a message in a chat
exports.sendMessage = async (req, res) => {
  try {
    const { ChatMessage, Chat } = getModelInstance();
    const { chat_id, sender_type, sender_id, message } = req.body;

    if (!chat_id || !sender_type) {
      return res.status(400).json({
        success: false,
        message: 'chat_id and sender_type are required'
      });
    }

    // Either message text or attachment is required
    if (!message && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Either message text or image is required'
      });
    }

    // Validate chat exists
    const chat = await Chat.findByPk(chat_id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Handle file upload
    let attachment_url = null;
    if (req.file) {
      attachment_url = `/uploads/${req.file.filename}`;
    }

    const chatMessage = await ChatMessage.create({
      chat_id,
      sender_type,
      sender_id: sender_id || null,
      message: message || '',
      attachment_url: attachment_url,
      is_read: false
    });

    // Update chat's last_message_at
    await chat.update({
      last_message_at: new Date(),
      status: sender_type === 'admin' ? 'active' : chat.status
    });

    // Send push notification to admins when customer sends a message
    if (sender_type === 'customer') {
      sendPushToAllAdmins({
        title: chat.customer_name || 'Customer',
        body: message || 'Sent an image',
        chatId: chat_id,
      }).catch(err => console.error('Push notification error:', err));
    }

    return res.status(201).json({
      success: true,
      data: { message: chatMessage },
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Update chat status
exports.updateChatStatus = async (req, res) => {
  try {
    const { Chat } = getModelInstance();
    const { id } = req.params;
    const { status, assigned_admin_id } = req.body;

    const chat = await Chat.findByPk(id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (assigned_admin_id) updateData.assigned_admin_id = assigned_admin_id;

    await chat.update(updateData);

    return res.json({
      success: true,
      data: { chat },
      message: 'Chat updated successfully'
    });
  } catch (error) {
    console.error('Error updating chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update chat',
      error: error.message
    });
  }
};

// Close chat
exports.closeChat = async (req, res) => {
  try {
    const { Chat } = getModelInstance();
    const { id } = req.params;

    const chat = await Chat.findByPk(id);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    await chat.update({
      status: 'closed'
    });

    return res.json({
      success: true,
      data: { chat },
      message: 'Chat closed successfully'
    });
  } catch (error) {
    console.error('Error closing chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to close chat',
      error: error.message
    });
  }
};

// Mark messages as read
exports.markMessagesAsRead = async (req, res) => {
  try {
    const { ChatMessage } = getModelInstance();
    const { chat_id } = req.params;

    await ChatMessage.update(
      {
        is_read: true,
        read_at: new Date()
      },
      {
        where: {
          chat_id,
          is_read: false
        }
      }
    );

    return res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};

// Get unread messages count for admin
exports.getUnreadCount = async (req, res) => {
  try {
    const { ChatMessage, Chat } = getModelInstance();
    const { admin_id } = req.query;

    let where = {
      is_read: false,
      sender_type: 'customer'
    };

    // If admin_id provided, only count chats assigned to them
    if (admin_id) {
      const chats = await Chat.findAll({
        where: { assigned_admin_id: admin_id },
        attributes: ['id']
      });
      const chatIds = chats.map(c => c.id);
      where.chat_id = { [require('sequelize').Op.in]: chatIds };
    }

    const count = await ChatMessage.count({ where });

    return res.json({
      success: true,
      data: { unread_count: count }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message
    });
  }
};

// Get customer's previous chats (when logged in)
exports.getCustomerChats = async (req, res) => {
  try {
    const { Chat } = getModelInstance();
    const { customer_user_id } = req.params;

    if (!customer_user_id) {
      return res.status(400).json({
        success: false,
        message: 'customer_user_id is required'
      });
    }

    const chats = await Chat.findAll({
      where: { customer_user_id },
      order: [['last_message_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: { chats }
    });
  } catch (error) {
    console.error('Error getting customer chats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get customer chats',
      error: error.message
    });
  }
};

// Get VAPID public key for push subscription
exports.getVapidPublicKey = (req, res) => {
  res.json({ success: true, data: { publicKey: VAPID_PUBLIC_KEY } });
};

// Subscribe to push notifications
exports.subscribePush = (req, res) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Invalid subscription' });
  }
  saveSubscription(subscription.endpoint, subscription);
  res.json({ success: true, message: 'Subscribed to push notifications' });
};

// Unsubscribe from push notifications
exports.unsubscribePush = (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    removeSubscription(endpoint);
  }
  res.json({ success: true, message: 'Unsubscribed from push notifications' });
};

// Get chat details by ID (PUBLIC - for customers to view their own chat)
exports.getChatByIdPublic = async (req, res) => {
  try {
    const { Chat, ChatMessage } = getModelInstance();
    const { id } = req.params;

    const chat = await Chat.findByPk(id, {
      include: [{
        model: ChatMessage,
        as: 'messages',
        order: [['created_at', 'ASC']]
      }]
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    return res.json({
      success: true,
      data: { chat }
    });
  } catch (error) {
    console.error('Error getting chat:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get chat',
      error: error.message
    });
  }
};
