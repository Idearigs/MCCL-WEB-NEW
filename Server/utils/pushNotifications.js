const webpush = require('web-push');

// VAPID keys for Web Push
// Keys come from the environment (Coolify), never from source. Without them, staff push
// notifications are switched off (the PWA then skips subscribing) instead of crashing.
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || null;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || null;
const PUSH_ENABLED = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (PUSH_ENABLED) {
  webpush.setVapidDetails('mailto:admin@buymediamonds.co.uk', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set: staff push notifications are disabled.');
}

// In-memory store for admin push subscriptions
// (persists across requests, resets on server restart - admin re-subscribes on next app open)
const adminSubscriptions = new Map();

function saveSubscription(endpoint, subscription) {
  adminSubscriptions.set(endpoint, subscription);
}

function removeSubscription(endpoint) {
  adminSubscriptions.delete(endpoint);
}

function getAllSubscriptions() {
  return Array.from(adminSubscriptions.values());
}

async function sendPushToAllAdmins(payload) {
  if (!PUSH_ENABLED) return [];
  const subscriptions = getAllSubscriptions();
  const results = [];

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
      results.push({ success: true, endpoint: sub.endpoint });
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription expired or invalid - remove it
        removeSubscription(sub.endpoint);
      }
      results.push({ success: false, endpoint: sub.endpoint, error: err.message });
    }
  }

  return results;
}

module.exports = {
  VAPID_PUBLIC_KEY,
  saveSubscription,
  removeSubscription,
  sendPushToAllAdmins,
};
