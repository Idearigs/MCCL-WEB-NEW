const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  createChat,
  getAllChats,
  getChatById,
  getChatByIdPublic,
  sendMessage,
  updateChatStatus,
  closeChat,
  markMessagesAsRead,
  getCustomerChats,
  getUnreadCount,
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
  getAllLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  assignLabel,
  removeLabel,
  deleteMessage,
  deleteChat,
  resumeChat
} = require('../controllers/chatController');
const { chatStartLimit, chatMessageLimit } = require('../middleware/security');
const { adminAuth, optionalAdminAuth } = require('../middleware/adminAuth');
const { authMiddleware } = require('../middleware/auth');

// Configure multer for image uploads only
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Extension from the accepted type, never from the sender's file name
    cb(null, 'chat-' + uniqueSuffix + CHAT_IMAGE_TYPES[file.mimetype]);
  }
});

// Raster images only (no SVG, which can carry script)
const CHAT_IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };

const fileFilter = (req, file, cb) => {
  const isImage = Object.prototype.hasOwnProperty.call(CHAT_IMAGE_TYPES, file.mimetype);

  if (isImage) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// A refused or oversized photo is the sender's mistake: answer 400, not 500.
const uploadAttachment = (req, res, next) => upload.single('attachment')(req, res, (err) => {
  if (!err) return next();
  const tooBig = err.code === 'LIMIT_FILE_SIZE';
  return res.status(400).json({
    success: false,
    message: tooBig ? 'Photos can be up to 5 MB.' : 'Only JPEG, PNG, GIF or WebP photos can be attached.'
  });
});

// Push notification routes
router.get('/push/vapid-key', getVapidPublicKey);
// Staff devices only: subscriptions receive every customer's name and message text.
router.post('/push/subscribe', adminAuth, subscribePush);
router.post('/push/unsubscribe', adminAuth, unsubscribePush);

// Label CRUD routes (admin auth) - must come before parameterized routes
router.get('/labels', adminAuth, getAllLabels);
router.post('/labels', adminAuth, createLabel);
router.put('/labels/:id', adminAuth, updateLabel);
router.delete('/labels/:id', adminAuth, deleteLabel);

// Delete message route (admin auth)
router.delete('/messages/:messageId', adminAuth, deleteMessage);

// Public POST routes
router.post('/', chatStartLimit, createChat);
// Staff identify themselves with their admin token (checked before the upload is stored);
// anonymous senders are always recorded as the customer and need the chat's visitor token.
router.post('/message/send', chatMessageLimit, optionalAdminAuth, uploadAttachment, sendMessage);
// "Continue the conversation" email links
router.post('/resume', chatStartLimit, resumeChat);

// PUBLIC GET routes (before admin routes)
router.get('/view/:id', getChatByIdPublic);

// Specific GET routes (must come before parameterized routes)
router.get('/customer/:customer_user_id', authMiddleware, getCustomerChats);
router.get('/unread/count', adminAuth, getUnreadCount);

// Parameterized routes (auth required)
router.get('/:id', adminAuth, getChatById);
router.put('/:id/status', adminAuth, updateChatStatus);
router.put('/:id/close', adminAuth, closeChat);
router.put('/:chat_id/messages/read', adminAuth, markMessagesAsRead);

// Label assignment routes (admin auth)
router.post('/:id/labels', adminAuth, assignLabel);
router.delete('/:id/labels/:labelId', adminAuth, removeLabel);

// Delete entire chat (admin auth)
router.delete('/:id', adminAuth, deleteChat);

// Catch-all GET for listing all chats (auth required) - MUST come last
router.get('/', adminAuth, getAllChats);

module.exports = router;
