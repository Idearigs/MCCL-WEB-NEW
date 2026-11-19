// Outbox and inbound behaviour against a real (local, disposable) Postgres.
// Run: TEST_PG_URL=postgres://…@127.0.0.1:55433/… node --test tests/truedesk/
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { boot, fakeIo, rows } = require('./helpers');

let chatService, outbox, worker, inbound, client, getModels, io;

test.before(async () => {
  await boot();
  chatService = require('../../services/chatService');
  outbox = require('../../services/truedesk/outbox');
  worker = require('../../services/truedesk/worker');
  inbound = require('../../services/truedesk/inbound');
  client = require('../../services/truedesk/client');
  ({ getModels } = require('../../models'));
  io = fakeIo();
  chatService.setIo(io);
});

test.after(async () => {
  await require('../../config/database').closeDatabases();
});

const newChat = async (extra = {}) => {
  const { Chat } = getModels();
  const db = require('../../config/database').postgresDB();
  return db.transaction(async (t) => {
    const chat = await Chat.create({ customer_name: 'Sophie', customer_email: 'sophie@example.com', subject: 'Rings', status: 'waiting', last_message_at: new Date(), ...extra }, { transaction: t });
    await outbox.chatCreated(t, chat.get({ plain: true }));
    return chat;
  });
};
const outboxFor = (recordId) => rows('SELECT * FROM truedesk_outbox WHERE record_id = :id ORDER BY id', { id: recordId });
const clearOutbox = () => rows('DELETE FROM truedesk_outbox');

test('a new chat writes one chats upsert with every required field', async () => {
  const chat = await newChat();
  const ob = await outboxFor(chat.id);
  assert.equal(ob.length, 1);
  assert.equal(ob[0].collection, 'chats');
  assert.equal(ob[0].op, 'upsert');
  for (const f of ['status', 'source', 'createdAt']) assert.ok(f in ob[0].fields, f);
  assert.equal(ob[0].fields.source, 'website');
});

test('a visitor message writes exactly one outbox row, in its transaction', async () => {
  const chat = await newChat();
  await clearOutbox();
  const { message } = await chatService.postMessage({ chat, senderType: 'customer', text: 'Hello', origin: 'web' });
  const ob = await rows('SELECT * FROM truedesk_outbox');
  assert.equal(ob.length, 1);
  assert.equal(ob[0].record_id, message.id);
  assert.deepEqual(
    { sender: ob[0].fields.sender, text: ob[0].fields.text, chatID: ob[0].fields.chatID, senderName: ob[0].fields.senderName },
    { sender: 'visitor', text: 'Hello', chatID: chat.id, senderName: 'Sophie' },
  );

  // Rolled back with the transaction: a failed write leaves no outbox row behind.
  await clearOutbox();
  const db = require('../../config/database').postgresDB();
  await assert.rejects(db.transaction(async (t) => {
    await chatService.postMessage({ chat, senderType: 'customer', text: 'Lost', origin: 'web' }, t);
    throw new Error('boom');
  }));
  assert.equal((await rows('SELECT * FROM truedesk_outbox')).length, 0);
  assert.equal((await rows(`SELECT * FROM chat_messages WHERE message = 'Lost'`)).length, 0);
});

test('a web staff reply sends the message and the waiting → active status', async () => {
  const chat = await newChat();
  await clearOutbox();
  await chatService.postMessage({ chat, senderType: 'admin', senderId: null, text: 'Hi Sophie', origin: 'web', staffName: 'Andrew' });
  const ob = await rows('SELECT * FROM truedesk_outbox ORDER BY id');
  assert.deepEqual(ob.map((r) => r.collection), ['chat_messages', 'chats']);
  assert.equal(ob[0].fields.sender, 'staff');
  assert.equal(ob[0].fields.senderName, 'Andrew');
  assert.equal(ob[1].fields.status, 'active');
});

test('an app-origin message writes no outbox row', async () => {
  const chat = await newChat();
  await clearOutbox();
  await chatService.postMessage({ chat, senderType: 'admin', text: 'From the phone', origin: 'truedesk' });
  assert.equal((await rows('SELECT * FROM truedesk_outbox')).length, 0);
});

test('nothing is written to the outbox while Truedesk is switched off', async () => {
  process.env.TRUEDESK_ENABLED = 'false';
  try {
    const chat = await newChat();
    await chatService.postMessage({ chat, senderType: 'customer', text: 'Off', origin: 'web' });
    assert.equal((await outboxFor(chat.id)).length, 0);
  } finally {
    process.env.TRUEDESK_ENABLED = 'true';
  }
});

test('a retry sends the same mutation_id; applied chats store the cloud version', async () => {
  const chat = await newChat();
  const sent = [];
  const realPush = client.push;
  let fail = true;
  client.push = async (mutations) => {
    sent.push(mutations.map((m) => m.mutation_id));
    if (fail) { const e = new Error('offline'); e.kind = 'network'; throw e; }
    return { results: mutations.map((m) => ({ mutation_id: m.mutation_id, status: 'applied', version: m.base_version + 1 })) };
  };
  try {
    await rows(`UPDATE truedesk_outbox SET next_attempt_at = now() - interval '1 second'`);
    assert.equal(await worker.sendBatch(), 'stop');
    const [row] = await rows(`SELECT * FROM truedesk_outbox WHERE record_id = :id`, { id: chat.id });
    assert.equal(row.status, 'pending');
    assert.equal(row.attempts, 1);
    assert.ok(new Date(row.next_attempt_at) > new Date(), 'backed off');

    fail = false;
    await rows(`UPDATE truedesk_outbox SET next_attempt_at = now() - interval '1 second' WHERE status = 'pending'`);
    while ((await worker.sendBatch()) === 'more');
    const ids = sent.map((batch) => batch.find((id) => id === row.mutation_id)).filter(Boolean);
    assert.equal(ids.length, 2, 'the same mutation was sent twice');
    assert.equal((await rows(`SELECT status FROM truedesk_outbox WHERE id = :id`, { id: row.id }))[0].status, 'sent');
    assert.equal((await rows(`SELECT truedesk_version FROM chats WHERE id = :id`, { id: chat.id }))[0].truedesk_version, 1);
  } finally {
    client.push = realPush;
  }
});

test('a contract violation parks only the record the cloud names', async () => {
  await clearOutbox();
  const a = await newChat();
  const b = await newChat();
  const realPush = client.push;
  let calls = 0;
  client.push = async (mutations) => {
    calls += 1;
    if (mutations.some((m) => m.id === a.id)) {
      const e = new Error('bad'); e.kind = 'contract_violation'; e.body = { error: 'contract_violation', collection: 'chats', id: a.id, path: 'fields.visitorEmail' };
      throw e;
    }
    return { results: mutations.map((m) => ({ mutation_id: m.mutation_id, status: 'applied', version: 1 })) };
  };
  try {
    while ((await worker.sendBatch()) === 'more');
    const status = Object.fromEntries((await rows('SELECT record_id, status FROM truedesk_outbox')).map((r) => [r.record_id, r.status]));
    assert.equal(status[a.id], 'dead');
    assert.equal(status[b.id], 'sent');
    assert.ok(calls >= 2);
  } finally {
    client.push = realPush;
  }
});

test('a photo is uploaded as a blob before its message is pushed', async () => {
  const fs = require('fs');
  const path = require('path');
  await clearOutbox();
  const chat = await newChat();
  const name = `chat-test-${Date.now()}.png`;
  const file = path.join(__dirname, '../../uploads', name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const bytes = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  fs.writeFileSync(file, bytes);
  const sha = crypto.createHash('sha256').update(bytes).digest('hex');
  const realPut = client.putBlob;
  const realPush = client.push;
  const puts = [];
  let pushed = [];
  client.putBlob = async (s, type) => { puts.push([s, type]); return {}; };
  client.push = async (mutations) => { pushed = pushed.concat(mutations); return { results: mutations.map((m) => ({ mutation_id: m.mutation_id, status: 'applied', version: 1 })) }; };
  try {
    await chatService.postMessage({ chat, senderType: 'customer', text: '', attachmentUrl: `/uploads/${name}`, origin: 'web' });
    while ((await worker.sendBatch()) === 'more');
    assert.deepEqual(puts, [[sha, 'image/png']]);
    const msg = pushed.find((m) => m.collection === 'chat_messages');
    assert.deepEqual(msg.fields.attachment, { $blob: sha });
    assert.equal(msg.fields.text, '');
  } finally {
    client.putBlob = realPut;
    client.push = realPush;
    fs.unlinkSync(file);
  }
});

// ── Inbound ──────────────────────────────────────────────────────────────────

const page = (changes, next) => ({ changes, next_cursor: next, has_more: false, profile_version: 1 });
const staffReply = (chatId, id = crypto.randomUUID(), text = 'Yes, we have it in size M') => ({
  collection: 'chat_messages', id, version: 1, deleted_at: null, updated_at: new Date().toISOString(), change_seq: 1,
  fields: { chatID: chatId, sender: 'staff', senderName: 'Andrew', text, attachment: null, sentAt: new Date().toISOString() },
});

test('a pulled staff reply inserts once, even if pulled twice, and emits receive_message', async () => {
  const chat = await newChat();
  await clearOutbox();
  io.emitted.length = 0;
  const change = staffReply(chat.id);
  for (let i = 0; i < 2; i += 1) {
    const effects = await inbound.applyPage(page([change], 10 + i));
    effects.forEach((fx) => fx());
  }
  const msgs = await rows('SELECT * FROM chat_messages WHERE id = :id', { id: change.id });
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].sender_type, 'admin');
  assert.equal(msgs[0].origin, 'truedesk');
  assert.equal(msgs[0].sender_id, process.env.TRUEDESK_STAFF_SENDER_ID);
  assert.equal(new Date(msgs[0].created_at).toISOString(), change.fields.sentAt);
  const delivered = io.emitted.filter((e) => e.event === 'receive_message' && e.payload.id === change.id);
  assert.equal(delivered.length, 1);
  assert.equal(delivered[0].room, `chat_${chat.id}`);
  assert.ok(io.emitted.some((e) => e.event === 'admin_chat_update' && e.room === 'staff' && e.payload.id === change.id));
  assert.ok(io.emitted.some((e) => e.event === 'chat_status' && e.payload.status === 'active'), 'waiting → active');
  assert.equal((await rows(`SELECT status FROM chats WHERE id = :id`, { id: chat.id }))[0].status, 'active');
  assert.equal(await inbound.getState('cursor'), '11');
});

test('applying a pulled page writes no outbox rows', async () => {
  const chat = await newChat();
  await clearOutbox();
  const effects = await inbound.applyPage(page([
    staffReply(chat.id),
    { collection: 'chats', id: chat.id, version: 5, deleted_at: null, updated_at: '', change_seq: 3, fields: { status: 'closed', staffReadAt: new Date().toISOString() } },
  ], 20));
  effects.forEach((fx) => fx());
  assert.equal((await rows('SELECT * FROM truedesk_outbox')).length, 0);
});

test('a pulled own message is skipped', async () => {
  const chat = await newChat();
  const { message } = await chatService.postMessage({ chat, senderType: 'customer', text: 'Mine', origin: 'web' });
  io.emitted.length = 0;
  const echo = { ...staffReply(chat.id, message.id, 'Mine'), fields: { chatID: chat.id, sender: 'visitor', senderName: 'Sophie', text: 'Mine', attachment: null, sentAt: new Date().toISOString() } };
  const effects = await inbound.applyPage(page([echo], 30));
  effects.forEach((fx) => fx());
  assert.equal((await rows('SELECT * FROM chat_messages WHERE id = :id', { id: message.id })).length, 1);
  assert.equal(io.emitted.length, 0);
});

test('closing a chat on the phone closes it here and emits chat_status; older versions are ignored', async () => {
  const chat = await newChat();
  await clearOutbox(); // the chat's creation was sent long ago
  io.emitted.length = 0;
  const close = { collection: 'chats', id: chat.id, version: 3, deleted_at: null, updated_at: '', change_seq: 4, fields: { status: 'closed' } };
  (await inbound.applyPage(page([close], 40))).forEach((fx) => fx());
  assert.equal((await rows(`SELECT status, truedesk_version FROM chats WHERE id = :id`, { id: chat.id }))[0].status, 'closed');
  assert.ok(io.emitted.some((e) => e.event === 'chat_status' && e.room === `chat_${chat.id}` && e.payload.status === 'closed'));
  assert.ok(io.emitted.some((e) => e.event === 'chat_status' && e.room === 'staff'));

  const stale = { ...close, version: 2, fields: { status: 'active' } };
  await inbound.applyPage(page([stale], 41));
  assert.equal((await rows(`SELECT status FROM chats WHERE id = :id`, { id: chat.id }))[0].status, 'closed');
});

test('a pulled status does not overwrite an unsent local change', async () => {
  const chat = await newChat();
  await chatService.setStatus(chat, 'closed'); // queued, not yet sent
  const fromCloud = { collection: 'chats', id: chat.id, version: 7, deleted_at: null, updated_at: '', change_seq: 5, fields: { status: 'active' } };
  await inbound.applyPage(page([fromCloud], 50));
  assert.equal((await rows(`SELECT status FROM chats WHERE id = :id`, { id: chat.id }))[0].status, 'closed');
});

test('a message deleted on the phone is removed here', async () => {
  const chat = await newChat();
  const change = staffReply(chat.id);
  await inbound.applyPage(page([change], 60));
  io.emitted.length = 0;
  (await inbound.applyPage(page([{ ...change, version: 2, deleted_at: new Date().toISOString(), fields: {} }], 61))).forEach((fx) => fx());
  assert.equal((await rows('SELECT * FROM chat_messages WHERE id = :id', { id: change.id })).length, 0);
  assert.ok(io.emitted.some((e) => e.event === 'message_deleted' && e.payload.id === change.id));
});

test('a staff reply emails the visitor only when they have left, at most once per 15 minutes', async () => {
  const email = require('../../services/emailService');
  const real = email.sendChatReplyEmail;
  const sentTo = [];
  email.sendChatReplyEmail = async (o) => { sentTo.push(o); };
  try {
    const chat = await newChat({ customer_email: 'gone@example.com' });
    // Present: no email
    io.present.set(`chat_${chat.id}`, [{ data: {} }]);
    await chatService.postMessage({ chat, senderType: 'admin', text: 'One', origin: 'web' });
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(sentTo.length, 0);
    // Left (only a staff socket in the room): one email, then throttled
    io.present.set(`chat_${chat.id}`, [{ data: { staff: { id: 'x' } } }]);
    (await inbound.applyPage(page([staffReply(chat.id)], 70))).forEach((fx) => fx());
    await new Promise((r) => setTimeout(r, 100));
    await chatService.postMessage({ chat, senderType: 'admin', text: 'Three', origin: 'web' });
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(sentTo.length, 1);
    assert.equal(sentTo[0].to, 'gone@example.com');
    assert.ok(chatService.resumeKeyOpens(sentTo[0].resumeKey, chat.id));
    assert.equal(chatService.resumeKeyOpens(sentTo[0].resumeKey, crypto.randomUUID()), false);
  } finally {
    email.sendChatReplyEmail = real;
  }
});

test('first connection queues the last 30 days of chats with their messages, once', async () => {
  await rows('DELETE FROM truedesk_state');
  await clearOutbox();
  const recent = await newChat();
  await chatService.postMessage({ chat: recent, senderType: 'customer', text: 'Recent', origin: 'web' });
  const old = await newChat();
  await rows(`UPDATE chats SET last_message_at = now() - interval '45 days', created_at = now() - interval '45 days' WHERE id = :id`, { id: old.id });
  await clearOutbox();
  const { backfill } = require('../../services/truedesk');
  const n = await backfill();
  const ob = await rows('SELECT * FROM truedesk_outbox');
  assert.ok(n >= 1);
  assert.ok(ob.some((r) => r.record_id === recent.id && r.collection === 'chats'));
  assert.ok(ob.some((r) => r.collection === 'chat_messages' && r.fields.chatID === recent.id && r.fields.text === 'Recent'));
  assert.ok(!ob.some((r) => r.record_id === old.id));
  assert.equal(await backfill(), 0, 'runs once');
});
