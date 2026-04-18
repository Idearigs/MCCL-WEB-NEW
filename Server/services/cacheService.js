const { createClient } = require('redis');
const { logger } = require('../config/database');

let client = null;
let connected = false;

const connect = async () => {
  if (connected) return client;
  try {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: { connectTimeout: 5000, reconnectStrategy: (retries) => Math.min(retries * 500, 5000) }
    });
    client.on('error', (err) => logger.warn('Redis error:', err.message));
    await client.connect();
    connected = true;
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis unavailable — caching disabled:', err.message);
    client = null;
  }
  return client;
};

const get = async (key) => {
  try {
    const c = await connect();
    if (!c) return null;
    const val = await c.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
};

const set = async (key, value, ttlSeconds) => {
  try {
    const c = await connect();
    if (!c) return;
    await c.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch { /* non-fatal */ }
};

const del = async (key) => {
  try {
    const c = await connect();
    if (!c) return;
    await c.del(key);
  } catch { /* non-fatal */ }
};

const delPattern = async (pattern) => {
  try {
    const c = await connect();
    if (!c) return;
    const keys = await c.keys(pattern);
    if (keys.length) await c.del(keys);
  } catch { /* non-fatal */ }
};

module.exports = { get, set, del, delPattern };
