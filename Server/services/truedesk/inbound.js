// Truedesk Cloud → website: replies, closes and "staff read it" from the Truedesk app.
//
// Keeps GET /v1/sync/events open and pulls on `ready` / `change`, plus every 60 s in case the
// stream silently drops. Each pulled page is applied in ONE transaction together with the new
// cursor; Socket.io events go out only after the commit; nothing here writes outbox rows.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getModels } = require('../../models');
const { postgresDB, logger } = require('../../config/database');
const client = require('./client');
const { isActive, settings } = require('./config');
const { messageRowFromRecord, chatUpdatesFromRecord } = require('./mapping');
const chatService = require('../chatService');

const PAGE = 200;
const PULL_EVERY_MS = 60_000;
const STREAM_IDLE_MS = 90_000; // the cloud pings every 25 s
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp' };

const q = (sql, replacements = {}, extra = {}) => postgresDB().query(sql, { replacements, ...extra });

const getState = async (key) => {
  const [rows] = await q('SELECT value FROM truedesk_state WHERE key = :key', { key });
  return rows[0] ? rows[0].value : null;
};
const setState = (key, value, t) =>
  q(`INSERT INTO truedesk_state (key, value) VALUES (:key, :value)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`, { key, value: String(value) }, t ? { transaction: t } : {});

/** Downloads a photo from the cloud, checks its hash and saves it like a chat upload. */
const downloadAttachment = async (sha) => {
  let blob;
  try {
    blob = await client.getBlob(sha);
  } catch (err) {
    if (err.kind === 'http' && err.status === 404) return { url: null, file: null }; // gone: keep the text
    throw err;
  }
  const actual = crypto.createHash('sha256').update(blob.bytes).digest('hex');
  if (actual !== sha) throw new Error('downloaded photo does not match its hash');
  const ext = EXT[blob.contentType] || '.jpg';
  const name = `chat-${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`;
  const file = path.join(UPLOADS_DIR, name);
  await fs.promises.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.promises.writeFile(file, blob.bytes);
  return { url: `/uploads/${name}`, file };
};

/** Field names with unsent local edits for a chat (keep the local value for those). */
const pendingChatFields = async (chatId, t) => {
  const [rows] = await q(
    `SELECT fields FROM truedesk_outbox WHERE status = 'pending' AND collection = 'chats' AND record_id = :id`,
    { id: chatId }, { transaction: t },
  );
  return new Set(rows.flatMap((r) => Object.keys(r.fields || {})));
};

const applyMessage = async (change, t, ctx) => {
  const { Chat, ChatMessage } = getModels();
  const existing = await ChatMessage.findByPk(change.id, { transaction: t });

  if (change.deleted_at) {
    if (existing) {
      await existing.destroy({ transaction: t });
      ctx.after.push(() => chatService.emitMessageDeleted(existing.chat_id, existing.id));
    }
    return;
  }
  if (existing) return; // our own message coming back
  const fields = change.fields || {};
  if (fields.sender !== 'staff') return; // visitor messages only ever start on the website
  const row = messageRowFromRecord(change.id, fields);
  const chat = await Chat.findByPk(row.chat_id, { transaction: t });
  if (!chat) return; // not a chat this website knows

  const attachmentUrl = row.attachmentSha ? (ctx.files.get(row.attachmentSha) || null) : null;
  const { after } = await chatService.postMessage({
    chat,
    senderType: 'admin',
    senderId: settings().staffSenderId,
    text: row.message,
    attachmentUrl,
    origin: 'truedesk',
    id: change.id,
    createdAt: row.created_at,
    staffName: fields.senderName,
  }, t);
  ctx.after.push(after);
};

const applyChat = async (change, t, ctx) => {
  const { Chat, ChatMessage } = getModels();
  if (change.deleted_at) return; // chats are owned by the website; a deleted record is ignored here
  const chat = await Chat.findByPk(change.id, { transaction: t });
  if (!chat || change.version <= (chat.truedesk_version || 0)) return;

  const updates = chatUpdatesFromRecord(change.fields);
  const pending = await pendingChatFields(chat.id, t);
  if (pending.has('status')) delete updates.status;
  if (pending.has('staffReadAt')) delete updates.staff_read_at;

  const before = chat.status;
  await chat.update({ ...updates, truedesk_version: change.version }, { transaction: t });
  if (updates.staff_read_at) {
    // Staff read it on a phone: the visitor's messages up to then are read everywhere.
    const { Op } = require('sequelize');
    await ChatMessage.update(
      { is_read: true, read_at: new Date() },
      { where: { chat_id: chat.id, sender_type: 'customer', is_read: false, createdAt: { [Op.lte]: updates.staff_read_at } }, transaction: t },
    );
  }
  if (updates.status && updates.status !== before) ctx.after.push(() => chatService.emitStatus(chat.id, updates.status));
};

/** Applies one pulled page and its cursor in one transaction; returns the effects to run after. */
const applyPage = async (page) => {
  const { ChatMessage } = getModels();
  const ctx = { after: [], files: new Map() };

  // Photos first, outside the transaction (network inside a DB transaction would hold locks).
  const wanted = page.changes.filter((c) => c.collection === 'chat_messages' && !c.deleted_at && c.fields && c.fields.sender === 'staff' && c.fields.attachment && c.fields.attachment.$blob);
  if (wanted.length) {
    const known = new Set((await ChatMessage.findAll({ where: { id: wanted.map((c) => c.id) }, attributes: ['id'] })).map((m) => m.id));
    for (const c of wanted) {
      const sha = c.fields.attachment.$blob;
      if (known.has(c.id) || ctx.files.has(sha)) continue;
      const saved = await downloadAttachment(sha);
      ctx.files.set(sha, saved.url);
      if (saved.file) (ctx.saved = ctx.saved || []).push(saved.file);
    }
  }

  try {
    await postgresDB().transaction(async (t) => {
      for (const change of page.changes) {
        if (change.collection === 'chat_messages') await applyMessage(change, t, ctx);
        else if (change.collection === 'chats') await applyChat(change, t, ctx);
      }
      await setState('cursor', page.next_cursor, t);
    });
  } catch (err) {
    for (const f of ctx.saved || []) fs.unlink(f, () => {});
    throw err;
  }
  return ctx.after;
};

let pulling = false;
let pullAgain = false;

/** Pulls and applies every page since the saved cursor. One pass at a time. */
const pullNow = async () => {
  if (!isActive()) return;
  if (pulling) { pullAgain = true; return; }
  pulling = true;
  try {
    do {
      pullAgain = false;
      let cursor = Number(await getState('cursor')) || 0;
      for (let n = 0; n < 100 && isActive(); n += 1) {
        const page = await client.pull(cursor, PAGE);
        if (!page || !Array.isArray(page.changes)) break;
        const effects = page.changes.length || page.next_cursor !== cursor ? await applyPage(page) : [];
        for (const fx of effects) { try { fx(); } catch (err) { logger.warn(`Truedesk: after-apply step failed (${err.message})`); } }
        cursor = page.next_cursor;
        if (!page.has_more) break;
      }
    } while (pullAgain && isActive());
  } catch (err) {
    if (err.kind !== 'unauthorized') logger.warn(`Truedesk pull failed, will retry (${err.message})`);
  } finally {
    pulling = false;
  }
};

// ── Live event stream ────────────────────────────────────────────────────────

let stopped = true;
let streamCtrl = null;
let pullTimer = null;
const sleep = (ms) => new Promise((r) => { const t = setTimeout(r, ms); if (t.unref) t.unref(); });

/** Reads the SSE stream until it ends; calls onEvent(name) for each event. */
const readEvents = async (res, onEvent, ctrl) => {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let idle = setTimeout(() => ctrl.abort(), STREAM_IDLE_MS);
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return;
      clearTimeout(idle);
      idle = setTimeout(() => ctrl.abort(), STREAM_IDLE_MS);
      buffer += decoder.decode(value, { stream: true });
      let i;
      while ((i = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, i);
        buffer = buffer.slice(i + 2);
        const line = block.split('\n').find((l) => l.startsWith('event:'));
        if (line) onEvent(line.slice(6).trim());
      }
    }
  } finally {
    clearTimeout(idle);
  }
};

const listen = async () => {
  let delay = 5_000;
  while (!stopped && isActive()) {
    streamCtrl = new AbortController();
    try {
      const res = await client.openEvents(streamCtrl.signal);
      delay = 5_000;
      await readEvents(res, (name) => { if (name === 'ready' || name === 'change') pullNow(); }, streamCtrl);
    } catch (err) {
      if (err.kind === 'unauthorized') return;
      if (!stopped && err.name !== 'AbortError') logger.warn(`Truedesk event stream dropped (${err.message})`);
    }
    if (stopped) return;
    await sleep(delay);
    delay = Math.min(delay * 2, 60_000);
  }
};

const start = () => {
  if (!stopped) return;
  stopped = false;
  pullTimer = setInterval(pullNow, PULL_EVERY_MS);
  pullTimer.unref();
  listen();
};

const stop = () => {
  stopped = true;
  if (pullTimer) clearInterval(pullTimer);
  pullTimer = null;
  if (streamCtrl) streamCtrl.abort();
};

module.exports = { start, stop, pullNow, applyPage, readEvents, getState, setState };
