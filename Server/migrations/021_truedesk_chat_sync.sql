-- 021: live chat ↔ Truedesk Cloud sync, and the visitor token that lets a chat survive a reload.
-- Idempotent. The server also applies this at startup (config/chatSyncSchema.js), so running
-- it by hand is optional. Nothing here changes how the chat behaves while TRUEDESK_ENABLED is off.

-- Who wrote a message: 'web' (widget, staff PWA, admin) or 'truedesk' (a reply from the app).
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS origin VARCHAR(20) NOT NULL DEFAULT 'web';
-- The Truedesk Cloud version of the chat record this website last saw.
ALTER TABLE chats ADD COLUMN IF NOT EXISTS truedesk_version INTEGER NOT NULL DEFAULT 0;
-- When any member of staff last opened the chat (website or app).
ALTER TABLE chats ADD COLUMN IF NOT EXISTS staff_read_at TIMESTAMPTZ;
-- SHA-256 hashes (hex, comma-separated, newest last) of the visitor's chat tokens. The tokens
-- themselves are never stored. NULL for chats started before tokens existed.
ALTER TABLE chats ADD COLUMN IF NOT EXISTS visitor_token_hashes TEXT;
-- Last "we replied" email to the visitor, to send at most one every 15 minutes.
ALTER TABLE chats ADD COLUMN IF NOT EXISTS visitor_emailed_at TIMESTAMPTZ;

-- Messages are always read in time order within a chat.
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_created ON chat_messages (chat_id, created_at);

-- Changes waiting to be sent to Truedesk Cloud. Written in the same transaction as the change.
CREATE TABLE IF NOT EXISTS truedesk_outbox (
  id              BIGSERIAL PRIMARY KEY,
  mutation_id     UUID NOT NULL UNIQUE,            -- idempotency key, sent as is on every retry
  collection      TEXT NOT NULL,                   -- 'chats' | 'chat_messages'
  record_id       UUID NOT NULL,
  op              TEXT NOT NULL,                   -- 'upsert' | 'delete'
  fields          JSONB NOT NULL DEFAULT '{}',
  attachment_path TEXT,                            -- local upload to send as a blob first
  status          TEXT NOT NULL DEFAULT 'pending', -- pending | sent | dead
  attempts        INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS truedesk_outbox_ready ON truedesk_outbox (next_attempt_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS truedesk_outbox_record ON truedesk_outbox (record_id) WHERE status = 'pending';

-- Small key/value store: 'cursor' (last pulled change_seq), 'backfilled'.
CREATE TABLE IF NOT EXISTS truedesk_state (key TEXT PRIMARY KEY, value TEXT NOT NULL);
