const { getModels } = require('../models');
const { sendPushToAllAdmins, saveSubscription, removeSubscription, VAPID_PUBLIC_KEY } = require('../utils/pushNotifications');

const jwt = require('jsonwebtoken');
const config = require('../config');
const chatService = require('../services/chatService');
const outbox = require('../services/truedesk/outbox');
const { postgresDB } = require('../config/database');

// The signed-in customer's id from an optional user bearer token, or null.
const optionalUserId = (req) => {
  try {
    const h = req.headers.authorization || '';
    if (!h.startsWith('Bearer ')) return null;
    const d = jwt.verify(h.substring(7), config.jwt.secret);
    return d && d.type !== 'admin' && d.userId ? String(d.userId) : null;
  } catch { return null; }
};

// Delete an uploaded attachment when the message is rejected (multer stores it first).
const discardUpload = (req) => {
  if (req.file && req.file.path) require('fs').unlink(req.file.path, () => {});
};

// Staff-only Socket.io room (sockets authenticated with an admin token join it in index.js).
const STAFF_ROOM = chatService.STAFF_ROOM;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Chats carrying a label, so a renamed, recoloured or deleted label reaches Truedesk too.
const chatsWithLabel = async (labelId, t) => {
  const { ChatLabelAssignment } = getModelInstance();
  const rows = await ChatLabelAssignment.findAll({ where: { label_id: labelId }, attributes: ['chat_id'], transaction: t });
  return [...new Set(rows.map((r) => r.chat_id))];
};

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

    // Only link the chat to an account when the caller proves it is that account.
    const signedIn = optionalUserId(req);
    // The visitor token lets this browser reopen the chat after a reload; only its hash is kept.
    const { token: visitorToken, hash } = chatService.newVisitorToken();
    const chat = await postgresDB().transaction(async (t) => {
      const created = await Chat.create({
        customer_name: String(customer_name).slice(0, 100),
        customer_email: String(customer_email).slice(0, 255),
        customer_user_id: signedIn && customer_user_id && String(customer_user_id) === signedIn ? signedIn : null,
        subject: subject ? String(subject).slice(0, 255) : null,
        status: 'waiting',
        last_message_at: new Date(),
        visitor_token_hashes: hash
      }, { transaction: t });
      await outbox.chatCreated(t, created.get({ plain: true }));
      return created;
    });

    // Tell staff dashboards only (not every connected visitor) about the new chat
    if (req.io) {
      req.io.to(STAFF_ROOM).emit('new_chat', {
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
      data: { chat, visitor_token: visitorToken },
      message: 'Chat session created successfully'
    });
  } catch (error) {
    console.error('Error creating chat:', error.message);
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
    const { Chat, ChatLabelAssignment, ChatLabel } = getModelInstance();
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

    // Try with label includes, fall back without if tables don't exist yet
    let labelInclude = [];
    try {
      // Test if the table exists by checking the model
      if (ChatLabelAssignment && ChatLabel) {
        labelInclude = [{
          model: ChatLabelAssignment,
          as: 'labelAssignments',
          required: false,
          include: [{ model: ChatLabel, as: 'label' }]
        }];
      }
    } catch (e) {
      // Tables not created yet, skip includes
    }

    const { count, rows } = await Chat.findAndCountAll({
      where,
      include: labelInclude,
      distinct: true,
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
    // If label tables cause the error, retry without them
    try {
      const { Chat } = getModelInstance();
      const { status, page = 1, limit = 20, search } = req.query;
      const offset2 = (page - 1) * limit;
      const where2 = {};
      if (status && status !== 'all') where2.status = status;
      if (search) {
        const { Op } = require('sequelize');
        where2[Op.or] = [
          { customer_name: { [Op.iLike]: `%${search}%` } },
          { customer_email: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } }
        ];
      }
      const { count, rows } = await Chat.findAndCountAll({
        where: where2,
        order: [['last_message_at', 'DESC']],
        limit: parseInt(limit),
        offset: offset2
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
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return res.status(500).json({
        success: false,
        message: 'Failed to get chats',
        error: fallbackError.message
      });
    }
  }
};

// Get specific chat with messages
exports.getChatById = async (req, res) => {
  try {
    const { Chat, ChatMessage, ChatLabelAssignment, ChatLabel } = getModelInstance();
    const { id } = req.params;

    // Build includes - label include is optional if tables don't exist yet
    const includes = [
      {
        model: ChatMessage,
        as: 'messages'
      }
    ];
    // Order belongs on the top-level query (inside an include it is ignored).
    const order = [[{ model: ChatMessage, as: 'messages' }, 'createdAt', 'ASC']];

    if (ChatLabelAssignment && ChatLabel) {
      includes.push({
        model: ChatLabelAssignment,
        as: 'labelAssignments',
        required: false,
        include: [{ model: ChatLabel, as: 'label' }]
      });
    }

    let chat;
    try {
      chat = await Chat.findByPk(id, { include: includes, order });
    } catch (includeErr) {
      // Fallback: query without label includes if table doesn't exist
      console.warn('Label include failed, retrying without:', includeErr.message);
      chat = await Chat.findByPk(id, {
        include: [{ model: ChatMessage, as: 'messages' }],
        order
      });
    }

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
    console.error('Error getting chat:', error.message);
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
    const { Chat } = getModelInstance();
    const { chat_id, message } = req.body;
    // The author's role comes from authentication, never from the request body:
    // a valid admin token (optionalAdminAuth) means staff, anything else is the customer.
    const sender_type = req.admin ? 'admin' : 'customer';

    if (!chat_id) {
      discardUpload(req);
      return res.status(400).json({
        success: false,
        message: 'chat_id is required'
      });
    }

    // Either message text or attachment is required
    if (!message && !req.file) {
      discardUpload(req);
      return res.status(400).json({
        success: false,
        message: 'Either message text or image is required'
      });
    }

    // Validate chat exists; a visitor must hold the chat's visitor token.
    const chat = typeof chat_id === 'string' && UUID_RE.test(chat_id) ? await Chat.findByPk(chat_id) : null;
    if (!chat || (!req.admin && !chatService.tokenOpens(chat, chatService.tokenFrom(req)))) {
      discardUpload(req);
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;

    // Saved with its Truedesk outbox row in one transaction, then delivered over Socket.io
    // (chat room + staff dashboards), web push for visitor messages, and the "we replied"
    // email when a staff reply finds the visitor gone.
    const { message: chatMessage } = await chatService.postMessage({
      chat,
      senderType: sender_type,
      // Staff: from their login. Visitors: their account only when their token proves it.
      senderId: req.admin ? req.admin.id : null,
      text: typeof message === 'string' ? message.slice(0, 5000) : '',
      attachmentUrl: attachment_url,
      origin: 'web',
      staffName: req.admin ? req.admin.first_name : undefined
    });

    return res.status(201).json({
      success: true,
      data: { message: chatMessage },
      message: 'Message sent successfully'
    });
  } catch (error) {
    discardUpload(req);
    console.error('Error sending message:', error.message);
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

    if (status && !['waiting', 'active', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Unknown status' });
    }
    const extra = assigned_admin_id ? { assigned_admin_id } : {};
    if (status) await chatService.setStatus(chat, status, extra);
    else if (assigned_admin_id) await chat.update(extra);

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

    await chatService.setStatus(chat, 'closed');

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
    const { ChatMessage, Chat } = getModelInstance();
    const { chat_id } = req.params;

    const now = new Date();
    await postgresDB().transaction(async (t) => {
      await ChatMessage.update(
        { is_read: true, read_at: now },
        { where: { chat_id, is_read: false }, transaction: t }
      );
      // Staff opened the chat: every staff device (and the Truedesk app) counts it as read.
      const [n] = await Chat.update({ staff_read_at: now }, { where: { id: chat_id }, transaction: t });
      if (n) await outbox.chatChanged(t, chat_id, { staffReadAt: now.toISOString() });
    });

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

    // A customer may list only their own chats (authMiddleware sets req.user).
    if (!req.user || !req.user.userId || String(req.user.userId) !== String(customer_user_id)) {
      return res.status(403).json({ success: false, message: 'Not allowed' });
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
  if (!VAPID_PUBLIC_KEY) return res.json({ success: false, message: 'Push notifications are not configured' });
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

// === Label CRUD ===

// Get all labels
exports.getAllLabels = async (req, res) => {
  try {
    const { ChatLabel } = getModelInstance();
    const labels = await ChatLabel.findAll({ order: [['name', 'ASC']] });
    return res.json({ success: true, data: { labels } });
  } catch (error) {
    console.error('Error getting labels:', error);
    return res.status(500).json({ success: false, message: 'Failed to get labels', error: error.message });
  }
};

// Create label
exports.createLabel = async (req, res) => {
  try {
    const { ChatLabel } = getModelInstance();
    const { name, color } = req.body;
    if (!name || !color) {
      return res.status(400).json({ success: false, message: 'Name and color are required' });
    }
    const label = await ChatLabel.create({ name, color });
    return res.status(201).json({ success: true, data: { label } });
  } catch (error) {
    console.error('Error creating label:', error);
    return res.status(500).json({ success: false, message: 'Failed to create label', error: error.message });
  }
};

// Update label
exports.updateLabel = async (req, res) => {
  try {
    const { ChatLabel } = getModelInstance();
    const { id } = req.params;
    const { name, color } = req.body;
    const label = await ChatLabel.findByPk(id);
    if (!label) return res.status(404).json({ success: false, message: 'Label not found' });
    if (name) label.name = name;
    if (color) label.color = color;
    await postgresDB().transaction(async (t) => {
      await label.save({ transaction: t });
      for (const chatId of await chatsWithLabel(id, t)) await outbox.chatLabelsChanged(t, chatId);
    });
    return res.json({ success: true, data: { label } });
  } catch (error) {
    console.error('Error updating label:', error);
    return res.status(500).json({ success: false, message: 'Failed to update label', error: error.message });
  }
};

// Delete label + cascade assignments
exports.deleteLabel = async (req, res) => {
  try {
    const { ChatLabel, ChatLabelAssignment } = getModelInstance();
    const { id } = req.params;
    let deleted = 0;
    await postgresDB().transaction(async (t) => {
      const affected = await chatsWithLabel(id, t);
      await ChatLabelAssignment.destroy({ where: { label_id: id }, transaction: t });
      deleted = await ChatLabel.destroy({ where: { id }, transaction: t });
      for (const chatId of affected) await outbox.chatLabelsChanged(t, chatId);
    });
    if (!deleted) return res.status(404).json({ success: false, message: 'Label not found' });
    return res.json({ success: true, message: 'Label deleted' });
  } catch (error) {
    console.error('Error deleting label:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete label', error: error.message });
  }
};

// === Label Assignment ===

// Assign label to chat
exports.assignLabel = async (req, res) => {
  try {
    const { ChatLabelAssignment } = getModelInstance();
    const { id } = req.params;
    const { labelId } = req.body;
    if (!labelId) return res.status(400).json({ success: false, message: 'labelId is required' });
    const [assignment, created] = await postgresDB().transaction(async (t) => {
      const result = await ChatLabelAssignment.findOrCreate({
        where: { chat_id: id, label_id: labelId },
        defaults: { chat_id: id, label_id: labelId },
        transaction: t
      });
      if (result[1]) await outbox.chatLabelsChanged(t, id);
      return result;
    });
    return res.status(created ? 201 : 200).json({ success: true, data: { assignment } });
  } catch (error) {
    console.error('Error assigning label:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign label', error: error.message });
  }
};

// Remove label from chat
exports.removeLabel = async (req, res) => {
  try {
    const { ChatLabelAssignment } = getModelInstance();
    const { id, labelId } = req.params;
    await postgresDB().transaction(async (t) => {
      const n = await ChatLabelAssignment.destroy({ where: { chat_id: id, label_id: labelId }, transaction: t });
      if (n) await outbox.chatLabelsChanged(t, id);
    });
    return res.json({ success: true, message: 'Label removed from chat' });
  } catch (error) {
    console.error('Error removing label:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove label', error: error.message });
  }
};

// === Delete ===

// Delete single message
exports.deleteMessage = async (req, res) => {
  try {
    const { ChatMessage } = getModelInstance();
    const { messageId } = req.params;
    const msg = UUID_RE.test(String(messageId)) ? await ChatMessage.findByPk(messageId) : null;
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    await postgresDB().transaction(async (t) => {
      await msg.destroy({ transaction: t });
      await outbox.messageDeleted(t, msg.id);
    });
    chatService.emitMessageDeleted(msg.chat_id, msg.id);
    return res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete message', error: error.message });
  }
};

// Delete entire chat + all messages
exports.deleteChat = async (req, res) => {
  try {
    const { Chat, ChatMessage, ChatLabelAssignment } = getModelInstance();
    const { id } = req.params;
    const chat = await Chat.findByPk(id);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    await postgresDB().transaction(async (t) => {
      const messages = await ChatMessage.findAll({ where: { chat_id: id }, attributes: ['id'], transaction: t });
      await ChatMessage.destroy({ where: { chat_id: id }, transaction: t });
      if (ChatLabelAssignment) await ChatLabelAssignment.destroy({ where: { chat_id: id }, transaction: t });
      await chat.destroy({ transaction: t });
      await outbox.chatDeleted(t, id, messages.map((m) => m.id));
    });
    return res.json({ success: true, message: 'Chat deleted' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete chat', error: error.message });
  }
};

// Get chat details by ID (PUBLIC - for customers to view their own chat)
exports.getChatByIdPublic = async (req, res) => {
  try {
    const { Chat, ChatMessage } = getModelInstance();
    const { id } = req.params;

    const chat = UUID_RE.test(String(id)) ? await Chat.findByPk(id, {
      include: [{ model: ChatMessage, as: 'messages' }],
      order: [[{ model: ChatMessage, as: 'messages' }, 'createdAt', 'ASC']]
    }) : null;

    // The chat's visitor token (X-Chat-Token) is required; a wrong one looks like no chat.
    if (!chat || !chatService.tokenOpens(chat, chatService.tokenFrom(req))) {
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
    console.error('Error getting chat:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to get chat',
      error: error.message
    });
  }
};

// Reopen a chat from a "continue the conversation" email link (PUBLIC).
// Body: { chat_id, resume } → { visitor_token } for this browser to keep.
exports.resumeChat = async (req, res) => {
  try {
    const { Chat } = getModelInstance();
    const { chat_id, resume } = req.body || {};
    const chat = typeof chat_id === 'string' && UUID_RE.test(chat_id) ? await Chat.findByPk(chat_id) : null;
    if (!chat || !chatService.resumeKeyOpens(resume, chat.id)) {
      return res.status(404).json({ success: false, message: 'This link has expired. Please start a new conversation.' });
    }
    const { token, hash } = chatService.newVisitorToken();
    await chat.update({ visitor_token_hashes: chatService.addHash(chat, hash) });
    return res.json({ success: true, data: { chat_id: chat.id, visitor_token: token } });
  } catch (error) {
    console.error('Error resuming chat:', error.message);
    return res.status(500).json({ success: false, message: 'Could not reopen the conversation' });
  }
};
