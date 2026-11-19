// Test database and fakes for the Truedesk chat tests.
//
// Needs a disposable Postgres (never production). Set TEST_PG_URL, e.g.
//   postgres://mccl_test:test-only@127.0.0.1:55433/mccl_test
// The schema is dropped and rebuilt with the production chat DDL (VARCHAR status, as live).

// The chat tables use TIMESTAMP without a time zone and the live container runs in UTC;
// run the tests the same way whatever this machine's zone is.
process.env.TZ = 'UTC';
const { Client } = require('pg');

const url = new URL(process.env.TEST_PG_URL || 'postgres://mccl_test:test-only@127.0.0.1:55433/mccl_test');
if (!/^(127\.0\.0\.1|localhost)$/.test(url.hostname)) throw new Error('Tests only run against a local database');

Object.assign(process.env, {
  NODE_ENV: 'test',
  PG_HOST: url.hostname,
  PG_PORT: url.port,
  PG_DATABASE: url.pathname.slice(1),
  PG_USERNAME: decodeURIComponent(url.username),
  PG_PASSWORD: decodeURIComponent(url.password),
  JWT_SECRET: process.env.JWT_SECRET || 'test-secret-not-for-production',
  TRUEDESK_ENABLED: 'true',
  TRUEDESK_URL: process.env.TRUEDESK_URL || 'http://127.0.0.1:9',
  TRUEDESK_TOKEN: process.env.TRUEDESK_TOKEN || 'tdk_test',
  TRUEDESK_STAFF_SENDER_ID: process.env.TRUEDESK_STAFF_SENDER_ID || '0192f1a0-0000-7000-8000-0000000000aa',
  CHAT_REPLY_EMAIL_DELAY_MS: '0',
});

const PROD_DDL = `
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL, last_name VARCHAR(100) NOT NULL, role VARCHAR(20) DEFAULT 'editor', avatar VARCHAR(500),
  is_active BOOLEAN DEFAULT true, last_login_at TIMESTAMPTZ, login_count INTEGER DEFAULT 0, password_changed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), customer_name VARCHAR(100) NOT NULL, customer_email VARCHAR(255) NOT NULL,
  customer_user_id UUID, assigned_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL, status VARCHAR(50) DEFAULT 'waiting',
  subject VARCHAR(255), last_message_at TIMESTAMP, is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL, sender_id UUID, message TEXT NOT NULL, attachment_url VARCHAR(500),
  is_read BOOLEAN DEFAULT false, read_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE chat_labels (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(50) NOT NULL UNIQUE, color VARCHAR(7) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE chat_label_assignments (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES chat_labels(id) ON DELETE CASCADE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (chat_id, label_id));
`;

let booted = false;
/** Fresh schema, then the app's own startup (models + migration 021). */
const boot = async () => {
  const c = new Client({ connectionString: url.toString() });
  await c.connect();
  await c.query(PROD_DDL);
  await c.end();
  if (!booted) {
    const { connectDatabases, logger } = require('../../config/database');
    logger.silent = true;
    if (!(await connectDatabases(1, 0))) throw new Error('test database not reachable');
    booted = true;
  } else {
    await require('../../config/chatSyncSchema').ensureChatSyncSchema(require('../../config/database').postgresDB());
  }
  return require('../../config/database').postgresDB();
};

/** Records Socket.io emits; `present` lists sockets per room for presence checks. */
const fakeIo = () => {
  const emitted = [];
  const present = new Map();
  return {
    emitted,
    present,
    to: (room) => ({ emit: (event, payload) => emitted.push({ room, event, payload }) }),
    in: (room) => ({ fetchSockets: async () => present.get(room) || [] }),
  };
};

const rows = async (sql, replacements = {}) => {
  const [r] = await require('../../config/database').postgresDB().query(sql, { replacements });
  return r;
};

module.exports = { boot, fakeIo, rows };
