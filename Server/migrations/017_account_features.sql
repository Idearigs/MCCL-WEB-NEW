-- Migration: Account features — ring size, appointments, client pieces
-- Created: 2026-08-13
-- Description: Backs the AccountV2 panes the sixth design handoff introduced.
--   • users.ring_size — a jeweller's account should hold it (removes ordering friction)
--   • appointments    — consultations, fittings and services
--   • client_pieces   — the record of everything made for a client, with its documents
-- The user_addresses table already exists (migration 006); no change needed there.
-- Reuses update_updated_at_column() defined in migration 006.

-- ── Ring size on the user ─────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS ring_size VARCHAR(20);

-- ── Appointments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_name  VARCHAR(200),
  customer_email VARCHAR(255),
  scheduled_at TIMESTAMP NOT NULL,
  duration VARCHAR(80),                              -- free text e.g. "about an hour"
  kind VARCHAR(160) NOT NULL,                        -- e.g. "Collection and fitting"
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'confirmed',   -- requested | confirmed | completed | cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON appointments(customer_email);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled ON appointments(scheduled_at);

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Client pieces (everything we have made for a client) ──────────────────────
CREATE TABLE IF NOT EXISTS client_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  customer_email VARCHAR(255),
  name VARCHAR(200) NOT NULL,
  spec TEXT,
  made_on VARCHAR(80),                               -- e.g. "December 2019"
  maker VARCHAR(160),                                -- e.g. "Eleanor McCulloch"
  image_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,               -- [{ "label": "GIA certificate", "meta": "PDF", "url": "..." }]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_client_pieces_user ON client_pieces(user_id);
CREATE INDEX IF NOT EXISTS idx_client_pieces_email ON client_pieces(customer_email);

DROP TRIGGER IF EXISTS update_client_pieces_updated_at ON client_pieces;
CREATE TRIGGER update_client_pieces_updated_at BEFORE UPDATE ON client_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE appointments IS 'Client consultations, fittings and services (AccountV2 Appointments pane)';
COMMENT ON TABLE client_pieces IS 'The record of everything made for a client, with certification/service docs (AccountV2 Your pieces pane)';
COMMENT ON COLUMN users.ring_size IS 'The client''s ring size, held on the account to remove ordering friction';
