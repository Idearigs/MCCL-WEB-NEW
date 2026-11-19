// Website → Truedesk Cloud outbox. Rows are written in the SAME transaction as the chat change
// they describe, so a change is never lost or sent without being saved. The worker sends them.
// Every function is a no-op while Truedesk is switched off.

const crypto = require('crypto');
const path = require('path');
const { isActive } = require('./config');
const { chatFields, messageFields, contractLabels } = require('./mapping');

const UPLOADS_DIR = path.join(__dirname, '../../uploads');

let wakeWorker = () => {};
/** The worker registers itself here so an enqueue sends straight away. */
const onEnqueue = (fn) => { wakeWorker = fn; };

const sequelizeOf = (t) => t.sequelize;

const insert = async (t, { collection, recordId, op, fields = {}, attachmentPath = null }) => {
  await sequelizeOf(t).query(
    `INSERT INTO truedesk_outbox (mutation_id, collection, record_id, op, fields, attachment_path)
     VALUES (:mutationId, :collection, :recordId, :op, CAST(:fields AS JSONB), :attachmentPath)`,
    {
      transaction: t,
      replacements: {
        mutationId: crypto.randomUUID(),
        collection,
        recordId,
        op,
        fields: JSON.stringify(fields),
        attachmentPath,
      },
    },
  );
  // Send once the transaction is committed (never before: the row isn't visible yet).
  if (typeof t.afterCommit === 'function') t.afterCommit(() => wakeWorker());
};

/** The chat's current labels as [{name, color}]. */
const labelsOf = async (t, chatId) => {
  const db = sequelizeOf(t);
  // The label tables are created by a manual script and may be missing. Check first: a failed
  // query would abort the surrounding transaction.
  const [[{ ok }]] = await db.query(
    `SELECT to_regclass('chat_label_assignments') IS NOT NULL AND to_regclass('chat_labels') IS NOT NULL AS ok`,
    { transaction: t },
  );
  if (!ok) return [];
  const [rows] = await db.query(
    `SELECT l.name, l.color FROM chat_label_assignments a JOIN chat_labels l ON l.id = a.label_id
      WHERE a.chat_id = :chatId ORDER BY l.name`,
    { transaction: t, replacements: { chatId } },
  );
  return rows;
};

/** A local upload path from attachment_url ("/uploads/chat-….jpg"), or null. */
const uploadPathOf = (attachmentUrl) => {
  if (!attachmentUrl || !/^\/uploads\/[A-Za-z0-9._-]+$/.test(attachmentUrl)) return null;
  return path.join(UPLOADS_DIR, path.basename(attachmentUrl));
};

/** A new chat: every field, base_version 0. */
const chatCreated = async (t, chat) => {
  if (!isActive()) return;
  await insert(t, { collection: 'chats', recordId: chat.id, op: 'upsert', fields: chatFields(chat, await labelsOf(t, chat.id)) });
};

/** Changed chat fields (contract names), e.g. {status} or {staffReadAt}. */
const chatChanged = async (t, chatId, fields) => {
  if (!isActive() || !fields || !Object.keys(fields).length) return;
  await insert(t, { collection: 'chats', recordId: chatId, op: 'upsert', fields });
};

/** The chat's full current label list (after an assign, remove, rename or recolour). */
const chatLabelsChanged = async (t, chatId) => {
  if (!isActive()) return;
  await insert(t, { collection: 'chats', recordId: chatId, op: 'upsert', fields: { labels: contractLabels(await labelsOf(t, chatId)) } });
};

/** A message written on the website (visitor or web staff). App replies are never echoed. */
const messageCreated = async (t, msg, names) => {
  if (!isActive() || msg.origin === 'truedesk') return;
  await insert(t, {
    collection: 'chat_messages',
    recordId: msg.id,
    op: 'upsert',
    fields: messageFields(msg, names),
    attachmentPath: uploadPathOf(msg.attachment_url),
  });
};

const messageDeleted = async (t, messageId) => {
  if (!isActive()) return;
  await insert(t, { collection: 'chat_messages', recordId: messageId, op: 'delete' });
};

/** A deleted chat: a delete for each of its messages, then for the chat. */
const chatDeleted = async (t, chatId, messageIds) => {
  if (!isActive()) return;
  for (const id of messageIds) await messageDeleted(t, id);
  await insert(t, { collection: 'chats', recordId: chatId, op: 'delete' });
};

module.exports = {
  onEnqueue, insert, labelsOf, uploadPathOf,
  chatCreated, chatChanged, chatLabelsChanged, messageCreated, messageDeleted, chatDeleted,
};
