// Sends truedesk_outbox rows to Truedesk Cloud (POST /v1/sync/push), oldest first.
// Runs every 5 s and right after an enqueue, in this process only. Never touches HTTP requests:
// a slow or unreachable cloud only delays the sync.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { postgresDB, logger } = require('../../config/database');
const client = require('./client');
const outbox = require('./outbox');
const { isActive } = require('./config');

const BATCH = 200;
const INTERVAL_MS = 5_000;
const CONTENT_TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };

/** Back-off after a network error: 5 s, 30 s, 2 min, then every 10 min. */
const backoffMs = (attempts) => [5_000, 30_000, 120_000][attempts - 1] || 600_000;

const db = () => postgresDB();
const q = (sql, replacements = {}, extra = {}) => db().query(sql, { replacements, ...extra });

/** Reads the attachment, uploads it as a blob and stores {"$blob": sha} in the row's fields. */
const ensureBlob = async (row, { force = false } = {}) => {
  const fields = row.fields || {};
  if (!row.attachment_path) return;
  if (!force && Object.prototype.hasOwnProperty.call(fields, 'attachment')) return;

  let bytes;
  try { bytes = await fs.promises.readFile(row.attachment_path); } catch { bytes = null; }
  if (!bytes) {
    // The file is gone (deleted from disk): send the message without its photo.
    fields.attachment = null;
  } else {
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    const type = CONTENT_TYPES[path.extname(row.attachment_path).toLowerCase()] || 'image/jpeg';
    await client.putBlob(sha, type, bytes);
    fields.attachment = { $blob: sha };
  }
  row.fields = fields;
  await q('UPDATE truedesk_outbox SET fields = CAST(:fields AS JSONB) WHERE id = :id', { id: row.id, fields: JSON.stringify(fields) });
};

const markSent = (ids) => ids.length && q(`UPDATE truedesk_outbox SET status = 'sent', last_error = NULL WHERE id IN (:ids)`, { ids });

const backoff = async (rows, message) => {
  for (const r of rows) {
    const attempts = (r.attempts || 0) + 1;
    await q(
      `UPDATE truedesk_outbox SET attempts = :attempts, next_attempt_at = now() + (:ms || ' milliseconds')::interval, last_error = :err WHERE id = :id`,
      { id: r.id, attempts, ms: String(backoffMs(attempts)), err: String(message).slice(0, 500) },
    );
  }
};

/** One batch: at most one row per record (so a record's changes go in order, each with a fresh base). */
const nextBatch = async () => {
  const [rows] = await q(
    `SELECT * FROM truedesk_outbox
      WHERE status = 'pending' AND next_attempt_at <= now()
      ORDER BY id LIMIT :limit`,
    { limit: BATCH * 2 },
  );
  const seen = new Set();
  const batch = [];
  // A record whose older row is still waiting (backing off) must not overtake it.
  const [waiting] = await q(
    `SELECT DISTINCT record_id FROM truedesk_outbox WHERE status = 'pending' AND next_attempt_at > now()`,
  );
  for (const w of waiting) seen.add(w.record_id);
  for (const r of rows) {
    if (seen.has(r.record_id)) continue;
    seen.add(r.record_id);
    batch.push(r);
    if (batch.length === BATCH) break;
  }
  return batch;
};

/** The base version for each chats row: the cloud version this website last saw. */
const baseVersions = async (batch) => {
  const ids = batch.filter((r) => r.collection === 'chats').map((r) => r.record_id);
  if (!ids.length) return new Map();
  const [rows] = await q('SELECT id, truedesk_version FROM chats WHERE id IN (:ids)', { ids });
  return new Map(rows.map((r) => [r.id, r.truedesk_version || 0]));
};

const toMutation = (row, bases) => ({
  mutation_id: row.mutation_id,
  collection: row.collection,
  id: row.record_id,
  op: row.op,
  base_version: row.collection === 'chats' ? bases.get(row.record_id) || 0 : 0,
  fields: row.op === 'delete' ? {} : row.fields || {},
});

/** Sends one batch. Returns 'more' to continue, 'idle' when nothing is ready, 'stop' to wait. */
const sendBatch = async () => {
  const batch = await nextBatch();
  if (!batch.length) return 'idle';

  try {
    for (const row of batch) await ensureBlob(row);
  } catch (err) {
    if (err.kind === 'unauthorized') return 'stop';
    await backoff(batch, `blob upload: ${err.message}`);
    logger.warn(`Truedesk: photo upload failed, will retry (${err.message})`);
    return 'stop';
  }

  const bases = await baseVersions(batch);
  const mutations = batch.map((r) => toMutation(r, bases));

  let response;
  try {
    response = await client.push(mutations);
  } catch (err) {
    if (err.kind === 'unauthorized') return 'stop';
    if (err.kind === 'contract_violation') {
      // Nothing in the batch was applied. Park the record the cloud named and send the rest.
      const b = err.body || {};
      const bad = batch.find((r) => r.collection === b.collection && r.record_id === b.id) || batch[0];
      const why = `contract_violation ${b.collection || ''}/${b.path || ''}`.trim();
      await q(`UPDATE truedesk_outbox SET status = 'dead', last_error = :err WHERE id = :id`, { id: bad.id, err: why.slice(0, 500) });
      // Never log content: only where the problem is.
      logger.error(`Truedesk refused a ${bad.collection} change (${why}); outbox row ${bad.id} set to dead`);
      return 'more';
    }
    await backoff(batch, err.message);
    logger.warn(`Truedesk push failed, will retry (${err.message})`);
    return 'stop';
  }

  const byId = new Map((response && response.results ? response.results : []).map((r) => [r.mutation_id, r]));
  const sent = [];
  for (let i = 0; i < batch.length; i += 1) {
    const row = batch[i];
    const m = mutations[i];
    const result = byId.get(row.mutation_id);
    if (!result) { await backoff([row], 'no result for mutation'); continue; }
    if (result.status === 'missing_blob') {
      try {
        await ensureBlob(row, { force: true });
        // Resend straight away; if the cloud keeps asking, slow down like any other failure.
        if ((row.attempts || 0) >= 2) await backoff([row], 'missing_blob after upload');
        else await q('UPDATE truedesk_outbox SET attempts = attempts + 1 WHERE id = :id', { id: row.id });
      } catch (err) {
        await backoff([row], `blob upload: ${err.message}`);
      }
      continue;
    }
    // applied, duplicate or conflict: done (a conflict's server values arrive with the next pull)
    sent.push(row.id);
    if (row.collection === 'chats' && (result.status === 'applied' || result.status === 'duplicate') && result.version === m.base_version + 1) {
      await q('UPDATE chats SET truedesk_version = :v WHERE id = :id AND truedesk_version < :v', { id: row.record_id, v: result.version });
    }
  }
  await markSent(sent);
  return 'more';
};

let running = false;
let again = false;
let timer = null;

/** Sends everything that is ready. Safe to call at any time; runs one pass at a time. */
const tick = async () => {
  if (!isActive()) return;
  if (running) { again = true; return; }
  running = true;
  try {
    do {
      again = false;
      for (let n = 0; n < 50 && isActive(); n += 1) {
        const r = await sendBatch();
        if (r !== 'more') break;
      }
    } while (again && isActive());
  } catch (err) {
    logger.warn(`Truedesk worker error: ${err.message}`);
  } finally {
    running = false;
  }
};

const start = () => {
  if (timer) return;
  outbox.onEnqueue(() => { tick(); });
  timer = setInterval(tick, INTERVAL_MS);
  timer.unref();
  tick();
};

const stop = () => {
  if (timer) clearInterval(timer);
  timer = null;
  outbox.onEnqueue(() => {});
};

module.exports = { start, stop, tick, sendBatch, backoffMs, ensureBlob, toMutation };
