const webpush = require('web-push');

// VAPID keys for Web Push
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BKe2zzjEkwEv55S70OqvJ7gpIRjc4075hv0IMQUPLg_BNb02qBk0-Qz9FWQeDuImr8y9NOPqiJ2G055EvBQdVZc';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'DpUDZzcQoSUEIyNKVFB8Vt0Md0U3IKlTBfFT5uwtr8g';

webpush.setVapidDetails(
  'mailto:admin@buymediamonds.co.uk',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

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
