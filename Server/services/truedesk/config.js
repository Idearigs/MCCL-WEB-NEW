// Truedesk Cloud connection settings (Coolify env on MCCL-BACKEND).
//
//   TRUEDESK_ENABLED          'true' to sync. Unset or anything else: nothing in services/truedesk
//                             runs, no outbox rows are written and the chat works as before.
//   TRUEDESK_URL              e.g. https://cloud.truedesk.co.uk
//   TRUEDESK_TOKEN            the website's device token from scripts/truedesk-pair.js (secret)
//   TRUEDESK_STAFF_SENDER_ID  UUID stored as sender_id on replies from the app (the
//                             "Truedesk App" admin_users row, which never logs in)
//
// The token is read here only and is never logged.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Set when the cloud answers 401: the website was unpaired. Syncing stops until a restart
// with a new token; the chat itself keeps working.
let disconnected = false;

const settings = () => {
  const staff = (process.env.TRUEDESK_STAFF_SENDER_ID || '').trim();
  return {
    url: (process.env.TRUEDESK_URL || '').trim().replace(/\/+$/, ''),
    token: (process.env.TRUEDESK_TOKEN || '').trim(),
    staffSenderId: UUID_RE.test(staff) ? staff.toLowerCase() : null,
  };
};

/** Sync is configured and switched on (it may still be stopped by a 401). */
const isEnabled = () => {
  if (String(process.env.TRUEDESK_ENABLED || '').trim().toLowerCase() !== 'true') return false;
  const s = settings();
  return Boolean(s.url && s.token);
};

/** True while syncing should run: enabled and not disconnected by the cloud. */
const isActive = () => isEnabled() && !disconnected;

const markDisconnected = () => { disconnected = true; };
const resetForTests = () => { disconnected = false; };

/**
 * "We replied" emails to visitors who have left the page. On with Truedesk (replies from the
 * phone are otherwise never seen); CHAT_REPLY_EMAILS=true/false turns them on or off on its own.
 */
const replyEmailsEnabled = () => {
  const v = String(process.env.CHAT_REPLY_EMAILS || '').trim().toLowerCase();
  if (v === 'true') return true;
  if (v === 'false') return false;
  return isEnabled();
};

module.exports = { settings, isEnabled, isActive, markDisconnected, replyEmailsEnabled, resetForTests, UUID_RE };
