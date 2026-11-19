// Website rows ⇄ contract records, against the contract fixtures (WEBSITE_INTEGRATION.md §8).
// Run: node --test tests/truedesk/   (no database needed for this file)
const test = require('node:test');
const assert = require('node:assert/strict');
const chatsFixture = require('./fixtures/chats.json');
const messagesFixture = require('./fixtures/chat_messages.json');
const m = require('../../services/truedesk/mapping');

const fixtureChat = chatsFixture.records[0];

test('a fixture chat maps to website rows and back to the same fields', () => {
  const row = m.chatRowFromRecord(fixtureChat.id, fixtureChat.fields);
  const back = m.chatFields(row, fixtureChat.fields.labels);
  assert.deepEqual(back, fixtureChat.fields);
});

test('fixture messages map to website rows and back to the same fields', () => {
  for (const rec of messagesFixture.records) {
    const row = m.messageRowFromRecord(rec.id, rec.fields);
    const websiteRow = {
      id: row.id,
      chat_id: row.chat_id,
      sender_type: row.sender_type,
      message: row.message,
      created_at: row.created_at,
      attachment_url: row.attachmentSha ? '/uploads/chat-1-1.jpg' : null,
    };
    const fields = m.messageFields(websiteRow, { visitorName: fixtureChat.fields.visitorName, staffName: rec.fields.senderName });
    // The worker fills in the attachment once the photo is uploaded as a blob.
    if (row.attachmentSha) fields.attachment = { $blob: row.attachmentSha };
    assert.deepEqual(fields, rec.fields, rec.id);
  }
});

test('a chat with a non-standard status maps to active', () => {
  const f = m.chatFields({ id: 'x', customer_name: 'A', customer_email: 'a@b.c', status: 'pending', created_at: new Date() });
  assert.equal(f.status, 'active');
  for (const s of ['waiting', 'active', 'closed']) assert.equal(m.contractStatus(s), s);
});

test('website chats always carry the required fields and source "website"', () => {
  const f = m.chatFields({ customer_name: '', customer_email: 'a@b.c', status: 'waiting', created_at: '2026-11-19T10:00:00Z' });
  assert.equal(f.source, 'website');
  assert.equal(f.visitorName, 'Guest');
  assert.equal(f.createdAt, '2026-11-19T10:00:00.000Z');
  assert.equal(f.websiteUserID, null);
});

test('labels the contract cannot hold are dropped or trimmed', () => {
  const labels = m.contractLabels([
    { name: 'Hot lead', color: '#EF4444' },
    { name: 'Bad colour', color: 'red' },
    { name: 'x'.repeat(80), color: '#000000' },
  ]);
  assert.deepEqual(labels.map((l) => l.color), ['#ef4444', '#000000']);
  assert.equal(labels[1].name.length, 50);
});

test('times go out as ISO 8601 UTC with milliseconds', () => {
  assert.equal(m.iso(new Date(Date.UTC(2026, 10, 19, 10, 0, 5))), '2026-11-19T10:00:05.000Z');
  assert.equal(m.iso(null), null);
});

test('pulled chat records change only status and staff read time', () => {
  const u = m.chatUpdatesFromRecord({ ...fixtureChat.fields, status: 'closed' });
  assert.deepEqual(Object.keys(u).sort(), ['staff_read_at', 'status']);
  assert.equal(u.status, 'closed');
  assert.deepEqual(m.chatUpdatesFromRecord({ status: 'nonsense' }), {});
});
