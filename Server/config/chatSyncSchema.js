const fs = require('fs');
const path = require('path');

// Applies migrations/021_truedesk_chat_sync.sql at startup. Every statement is idempotent
// (IF NOT EXISTS), so this is safe on every boot and on databases where it was run by hand.
const SQL_FILE = path.join(__dirname, '../migrations/021_truedesk_chat_sync.sql');

const ensureChatSyncSchema = async (sequelize) => {
  const sql = fs.readFileSync(SQL_FILE, 'utf8');
  // One multi-statement query (no bind parameters, so pg runs it as a simple query).
  await sequelize.query(sql);
};

module.exports = { ensureChatSyncSchema };
