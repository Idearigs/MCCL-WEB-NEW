// Truedesk Cloud connector: mirrors the website live chat to Truedesk Cloud so staff can answer
// from the Truedesk iPhone app, and delivers replies from the app to the visitor.
//
// Off unless TRUEDESK_ENABLED=true with TRUEDESK_URL and TRUEDESK_TOKEN set (see ./config.js).
// Started once from index.js after the database is connected, in this process only.

const { postgresDB, logger } = require('../../config/database');
const { isEnabled, settings } = require('./config');
const outbox = require('./outbox');
const worker = require('./worker');
const inbound = require('./inbound');

const BACKFILL_DAYS = 30;

/**
 * First connection: queue the chats active in the last 30 days, with their messages, so
 * staff see recent conversations on the phone. Runs once (truedesk_state 'backfilled').
 */
const backfill = async () => {
  if (await inbound.getState('backfilled')) return 0;
  const db = postgresDB();
  let chats = 0;
  await db.transaction(async (t) => {
    const [rows] = await db.query(
      `SELECT * FROM chats
        WHERE COALESCE(last_message_at, created_at) >= now() - interval '${BACKFILL_DAYS} days'
        ORDER BY created_at`,
      { transaction: t },
    );
    for (const chat of rows) {
      await outbox.chatCreated(t, chat);
      const [messages] = await db.query(
        `SELECT m.*, a.first_name AS staff_first_name
           FROM chat_messages m LEFT JOIN admin_users a ON a.id = m.sender_id AND m.sender_type = 'admin'
          WHERE m.chat_id = :id AND m.origin <> 'truedesk'
          ORDER BY m.created_at`,
        { transaction: t, replacements: { id: chat.id } },
      );
      for (const m of messages) {
        await outbox.messageCreated(t, m, { visitorName: chat.customer_name, staffName: m.staff_first_name });
      }
      chats += 1;
    }
    await inbound.setState('backfilled', new Date().toISOString(), t);
  });
  return chats;
};

let started = false;

const start = async () => {
  if (started || !isEnabled()) return false;
  started = true;
  const s = settings();
  if (new Date().getTimezoneOffset() !== 0) {
    logger.warn('Truedesk: this process is not running in UTC. Chat times are stored without a time zone and are read as local time, so times sent to Truedesk would be shifted. Run with TZ=UTC (the Docker image does).');
  }
  if (!s.staffSenderId) logger.warn('Truedesk: TRUEDESK_STAFF_SENDER_ID is not a UUID; replies from the app are stored without a sender id.');
  try {
    const n = await backfill();
    if (n) logger.info(`Truedesk: queued ${n} recent chat(s) for the first sync`);
  } catch (err) {
    logger.error(`Truedesk: first sync could not be queued (${err.message}); will retry on the next start`);
  }
  worker.start();
  inbound.start();
  logger.info(`Truedesk Cloud sync running (${new URL(s.url).host})`);
  return true;
};

const stop = () => {
  worker.stop();
  inbound.stop();
  started = false;
};

module.exports = { start, stop, backfill };
