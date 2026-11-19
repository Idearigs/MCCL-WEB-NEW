#!/usr/bin/env node
// Creates (once) the "Truedesk App" admin_users row whose id is stored as sender_id on replies
// that staff send from the Truedesk iPhone app, and prints that id for TRUEDESK_STAFF_SENDER_ID.
//
//   node scripts/truedesk-staff-user.js        (uses the PG_* settings of this server)
//
// The row can never sign in: it is inactive and its password is random and discarded.

const crypto = require('crypto');
const { connectDatabases, closeDatabases } = require('../config/database');

const EMAIL = 'truedesk-app@mccullochjewellers.invalid'; // reserved TLD: can never receive mail

(async () => {
  const ok = await connectDatabases(1, 0);
  if (!ok) { console.error('Could not connect to the database.'); process.exit(1); }
  try {
    const { AdminUser } = require('../models/adminModels').getAdminModels();
    const [user, created] = await AdminUser.findOrCreate({
      where: { email: EMAIL },
      defaults: {
        email: EMAIL,
        password: crypto.randomBytes(48).toString('base64url'),
        first_name: 'Truedesk',
        last_name: 'App',
        role: 'editor',
        is_active: false,
      },
    });
    console.log(`${created ? 'Created' : 'Found'} the Truedesk App staff row.`);
    console.log(`TRUEDESK_STAFF_SENDER_ID=${user.id}`);
  } catch (err) {
    console.error(`Failed: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await closeDatabases();
  }
})();
