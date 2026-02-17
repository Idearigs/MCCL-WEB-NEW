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
  deleteChat
} = require('../controllers/chatController');
const { adminAuth } = require('../middleware/adminAuth');

// Configure multer for image uploads only
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'chat-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Only accept image files
  // Check MIME type or file extension as fallback
  const isImage = file.mimetype.startsWith('image/') ||
                  /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.originalname);

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

// Push notification routes
router.get('/push/vapid-key', getVapidPublicKey);
router.post('/push/subscribe', subscribePush);
router.post('/push/unsubscribe', unsubscribePush);

// Label CRUD routes (admin auth) - must come before parameterized routes
router.get('/labels', adminAuth, getAllLabels);
router.post('/labels', adminAuth, createLabel);
router.put('/labels/:id', adminAuth, updateLabel);
router.delete('/labels/:id', adminAuth, deleteLabel);

// Delete message route (admin auth)
router.delete('/messages/:messageId', adminAuth, deleteMessage);

// Public POST routes
router.post('/', createChat);
router.post('/message/send', upload.single('attachment'), sendMessage);

// PUBLIC GET routes (before admin routes)
router.get('/view/:id', getChatByIdPublic);

// Specific GET routes (must come before parameterized routes)
router.get('/customer/:customer_user_id', getCustomerChats);
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
