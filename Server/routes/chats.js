const express = require('express');
const router = express.Router();
const {
  createChat,
  getAllChats,
  getChatById,
  getChatByIdPublic,
  sendMessage,
  updateChatStatus,
  closeChat,
  markMessagesAsRead,
  getCustomerChats
} = require('../controllers/chatController');
const { adminAuth } = require('../middleware/adminAuth');

// Public POST routes
router.post('/', createChat);
router.post('/message/send', sendMessage);

// PUBLIC GET routes (before admin routes)
router.get('/view/:id', getChatByIdPublic);

// Specific GET routes (must come before parameterized routes)
router.get('/customer/:customer_user_id', getCustomerChats);

// Parameterized routes (auth required)
router.get('/:id', adminAuth, getChatById);
router.put('/:id/status', adminAuth, updateChatStatus);
router.put('/:id/close', adminAuth, closeChat);
router.put('/:chat_id/messages/read', adminAuth, markMessagesAsRead);

// Catch-all GET for listing all chats (auth required) - MUST come last
router.get('/', adminAuth, getAllChats);

module.exports = router;
