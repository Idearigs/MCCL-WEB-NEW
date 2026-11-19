// Website chat rows ⇄ Truedesk contract records (contract/CONTRACT.md §3, WEBSITE_INTEGRATION.md §3).
// Pure functions, no database access, so they are tested against the contract fixtures.

const STATUSES = ['waiting', 'active', 'closed'];
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const clip = (v, max) => (v == null ? '' : String(v)).slice(0, max);

/** ISO 8601 UTC with milliseconds, or null. */
const iso = (v) => {
  if (v == null || v === '') return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

/** The chats.status column is VARCHAR in production; anything unexpected maps to active. */
const contractStatus = (s) => (STATUSES.includes(s) ? s : 'active');

/** Label rows ({name, color}) → contract labels, dropping colours the contract can't hold. */
const contractLabels = (labels) =>
  (labels || [])
    .filter((l) => l && l.name && HEX_COLOR.test(String(l.color || '')))
    .slice(0, 20)
    .map((l) => ({ name: clip(l.name, 50), color: String(l.color).toLowerCase() }));

const pick = (row, snake, camel) => (row[snake] !== undefined ? row[snake] : row[camel]);

/** Every field of a website chat, as first pushed (base_version 0). */
const chatFields = (chat, labels = []) => ({
  visitorName: clip(chat.customer_name || 'Guest', 200) || 'Guest',
  visitorEmail: clip(chat.customer_email, 255),
  subject: clip(chat.subject, 255),
  status: contractStatus(chat.status),
  source: 'website',
  websiteUserID: chat.customer_user_id || null,
  labels: contractLabels(labels),
  lastMessageAt: iso(chat.last_message_at),
  staffReadAt: iso(chat.staff_read_at),
  createdAt: iso(pick(chat, 'created_at', 'createdAt')) || new Date().toISOString(),
});

/**
 * Every field of a website message. `senderName` is the chat's visitor name for visitor
 * messages and the admin's first name for staff ones. The attachment is filled in by the
 * worker once the file is uploaded as a blob ({"$blob": sha}); null when there is none.
 */
const messageFields = (msg, { visitorName, staffName } = {}) => {
  const staff = msg.sender_type === 'admin';
  return {
    chatID: msg.chat_id,
    sender: staff ? 'staff' : 'visitor',
    senderName: clip(staff ? staffName || 'McCulloch' : visitorName || 'Guest', 100),
    text: clip(msg.message, 5000),
    ...(msg.attachment_url ? {} : { attachment: null }),
    sentAt: iso(pick(msg, 'created_at', 'createdAt')) || new Date().toISOString(),
  };
};

/** A pulled chat record → the website columns it may change (labels stay website-managed). */
const chatUpdatesFromRecord = (fields) => {
  const out = {};
  if (fields && STATUSES.includes(fields.status)) out.status = fields.status;
  if (fields && 'staffReadAt' in fields) out.staff_read_at = fields.staffReadAt ? new Date(fields.staffReadAt) : null;
  return out;
};

/** A pulled chat_messages record → website row values (staff replies from the app). */
const messageRowFromRecord = (id, fields) => ({
  id,
  chat_id: fields.chatID,
  sender_type: fields.sender === 'visitor' ? 'customer' : 'admin',
  message: typeof fields.text === 'string' ? fields.text : '',
  created_at: fields.sentAt ? new Date(fields.sentAt) : new Date(),
  attachmentSha: fields.attachment && fields.attachment.$blob ? fields.attachment.$blob : null,
});

/** Website row values → the record fields they came from (for round-trip tests). */
const chatRowFromRecord = (id, fields) => ({
  id,
  customer_name: fields.visitorName,
  customer_email: fields.visitorEmail,
  subject: fields.subject,
  status: fields.status,
  customer_user_id: fields.websiteUserID,
  last_message_at: fields.lastMessageAt,
  staff_read_at: fields.staffReadAt,
  created_at: fields.createdAt,
});

module.exports = {
  STATUSES, iso, contractStatus, contractLabels, chatFields, messageFields,
  chatUpdatesFromRecord, messageRowFromRecord, chatRowFromRecord,
};
