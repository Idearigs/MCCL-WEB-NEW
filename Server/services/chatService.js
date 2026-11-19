// The one path every chat change takes, whoever makes it: a visitor in the widget, staff in the
// PWA or admin pages, or a reply pulled from the Truedesk app. Each change is saved (with its
// Truedesk outbox row, in the same transaction) and only then announced over Socket.io, so
// every screen sees the same thing.

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getModels } = require('../models');
const { postgresDB, logger } = require('../config/database');
const outbox = require('./truedesk/outbox');
const { replyEmailsEnabled } = require('./truedesk/config');
const { iso } = require('./truedesk/mapping');

const STAFF_ROOM = 'staff';
const roomOf = (chatId) => `chat_${chatId}`;

let io = null;
/** index.js hands over the Socket.io server once at startup. */
const setIo = (server) => { io = server; };
const getIo = () => io;

// ── Visitor tokens ────────────────────────────────────────────────────────────
// A chat's visitor token is what lets a browser read and post to that chat. It is returned
// once when the chat starts (or is resumed from an email) and kept in the browser's
// localStorage; only its SHA-256 is stored. Chats started before tokens existed have no
// hashes and stay reachable by their id alone, as before.

const MAX_TOKENS = 5;
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const newVisitorToken = () => {
  const token = crypto.randomBytes(32).toString('base64url');
  return { token, hash: sha256(token) };
};
const hashesOf = (chat) => String((chat && chat.visitor_token_hashes) || '').split(',').filter(Boolean);
const addHash = (chat, hash) => [...hashesOf(chat), hash].slice(-MAX_TOKENS).join(',');

/** Whether this token opens this chat. */
const tokenOpens = (chat, token) => {
  const hashes = hashesOf(chat);
  if (!hashes.length) return true; // a chat from before visitor tokens
  if (typeof token !== 'string' || !token || token.length > 200) return false;
  const h = Buffer.from(sha256(token), 'hex');
  return hashes.some((x) => {
    const b = Buffer.from(x, 'hex');
    return b.length === h.length && crypto.timingSafeEqual(b, h);
  });
};

/** The visitor token sent with a request (header, or a form field for older clients). */
const tokenFrom = (req) => req.get('x-chat-token') || (req.body && req.body.visitor_token) || '';

// "Continue the conversation" links in emails carry a signed resume key, exchanged for a new
// visitor token on that device (POST /chats/resume).
const RESUME_PURPOSE = 'chat_resume';
const resumeKeyFor = (chatId) => jwt.sign({ chat_id: chatId, purpose: RESUME_PURPOSE }, config.jwt.secret, { expiresIn: '30d' });
const resumeKeyOpens = (key, chatId) => {
  try {
    const d = jwt.verify(String(key || ''), config.jwt.secret);
    return d && d.purpose === RESUME_PURPOSE && d.chat_id === chatId;
  } catch { return false; }
};

// ── Real-time ─────────────────────────────────────────────────────────────────

const emitMessage = (message) => {
  if (!io) return;
  const payload = typeof message.toJSON === 'function' ? message.toJSON() : message;
  io.to(roomOf(payload.chat_id)).emit('receive_message', payload);
  io.to(STAFF_ROOM).emit('admin_chat_update', { ...payload, chat_id: payload.chat_id });
};

/** chat_status: the widget shows a closed chat; staff lists update. */
const emitStatus = (chatId, status) => {
  if (!io) return;
  const payload = { chat_id: chatId, status };
  io.to(roomOf(chatId)).emit('chat_status', payload);
  io.to(STAFF_ROOM).emit('chat_status', payload);
};

const emitMessageDeleted = (chatId, messageId) => {
  if (!io) return;
  const payload = { chat_id: chatId, id: messageId };
  io.to(roomOf(chatId)).emit('message_deleted', payload);
  io.to(STAFF_ROOM).emit('message_deleted', payload);
};

/** Whether a visitor (not staff) has the chat open right now. */
const visitorPresent = async (chatId) => {
  if (!io) return false;
  const sockets = await io.in(roomOf(chatId)).fetchSockets();
  return sockets.some((s) => !(s.data && s.data.staff));
};

// ── "We replied" email to a visitor who has left ─────────────────────────────

const EMAIL_EVERY_MIN = 15;
const EMAIL_DELAY_MS = Number(process.env.CHAT_REPLY_EMAIL_DELAY_MS || 10_000); // allow for a reload

const emailIfVisitorLeft = (chatId, replyText) => {
  if (!replyEmailsEnabled()) return;
  const t = setTimeout(async () => {
    try {
      if (await visitorPresent(chatId)) return;
      // Claim the 15-minute slot atomically so two replies can't both send.
      const [rows] = await postgresDB().query(
        `UPDATE chats SET visitor_emailed_at = now()
          WHERE id = :id AND status <> 'closed'
            AND (visitor_emailed_at IS NULL OR visitor_emailed_at < now() - interval '${EMAIL_EVERY_MIN} minutes')
          RETURNING customer_email, customer_name`,
        { replacements: { id: chatId } },
      );
      const row = rows && rows[0];
      if (!row || !row.customer_email) return;
      const { sendChatReplyEmail } = require('./emailService');
      await sendChatReplyEmail({ to: row.customer_email, name: row.customer_name, replyText, chatId, resumeKey: resumeKeyFor(chatId) });
    } catch (err) {
      logger.warn(`Chat reply email not sent: ${err.message}`);
    }
  }, EMAIL_DELAY_MS);
  if (typeof t.unref === 'function') t.unref();
};

// ── Writes ────────────────────────────────────────────────────────────────────

/** Runs fn inside the given transaction, or a new one; `after` effects run once committed. */
const inTransaction = async (t, fn) => {
  if (t) return fn(t);
  return postgresDB().transaction((tx) => fn(tx));
};

const later = (a, b) => (!a ? b : !b ? a : new Date(a) > new Date(b) ? a : b);

/**
 * Saves a message and updates its chat. Returns { message, chat, after }: call after() once
 * the transaction has committed (done for you when no transaction is passed) to deliver it.
 *
 * opts: chat (instance), senderType 'customer'|'admin', senderId, text, attachmentUrl,
 *       origin 'web'|'truedesk', id + createdAt (replies from the app keep their own),
 *       staffName (first name, for Truedesk's senderName)
 */
const postMessage = async (opts, transaction) => {
  const { ChatMessage } = getModels();
  const { chat, senderType, senderId = null, text = '', attachmentUrl = null, origin = 'web', id, createdAt, staffName } = opts;

  const run = async (t) => {
    const message = await ChatMessage.create({
      ...(id ? { id } : {}),
      chat_id: chat.id,
      sender_type: senderType,
      sender_id: senderId,
      message: text || '',
      attachment_url: attachmentUrl,
      is_read: false,
      origin,
      ...(createdAt ? { createdAt } : {}),
    }, { transaction: t });

    const before = chat.status;
    const status = senderType === 'admin' ? 'active' : chat.status;
    const sentAt = message.get('createdAt') || new Date();
    await chat.update({ last_message_at: later(chat.last_message_at, sentAt), status }, { transaction: t });
    const statusChanged = status !== before;

    // One outbox row per message (WEBSITE_INTEGRATION.md §4). A web staff reply that moves the
    // chat from waiting to active also sends the new status. App replies are never echoed.
    await outbox.messageCreated(t, message.get({ plain: true }), { visitorName: chat.customer_name, staffName });
    if (origin !== 'truedesk' && statusChanged) {
      await outbox.chatChanged(t, chat.id, { status, lastMessageAt: iso(chat.last_message_at) });
    }
    return { message, statusChanged };
  };

  const { message, statusChanged } = await inTransaction(transaction, run);

  const after = () => {
    emitMessage(message);
    if (statusChanged) emitStatus(chat.id, chat.status);
    if (senderType === 'customer') {
      const { sendPushToAllAdmins } = require('../utils/pushNotifications');
      sendPushToAllAdmins({ title: chat.customer_name || 'Customer', body: text || 'Sent an image', chatId: chat.id })
        .catch((err) => logger.warn(`Push notification error: ${err.message}`));
    } else {
      emailIfVisitorLeft(chat.id, text);
    }
  };
  if (!transaction) after();
  return { message, chat, after };
};

/** Status change from the website (staff). Pulled changes use applyCloudChat in truedesk/inbound. */
const setStatus = async (chat, status, extra = {}) => {
  const before = chat.status;
  await postgresDB().transaction(async (t) => {
    await chat.update({ status, ...extra }, { transaction: t });
    if (status !== before) await outbox.chatChanged(t, chat.id, { status: require('./truedesk/mapping').contractStatus(status) });
  });
  if (status !== before) emitStatus(chat.id, status);
  return chat;
};

module.exports = {
  STAFF_ROOM, roomOf, setIo, getIo,
  newVisitorToken, addHash, tokenOpens, tokenFrom, sha256, resumeKeyFor, resumeKeyOpens,
  emitMessage, emitStatus, emitMessageDeleted, visitorPresent, emailIfVisitorLeft,
  postMessage, setStatus, inTransaction,
};
