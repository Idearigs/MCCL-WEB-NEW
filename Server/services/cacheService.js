const { createClient } = require('redis');
const { logger } = require('../config/database');

let client = null;
let connected = false;
let unavailableUntil = 0; // circuit breaker timestamp

const connect = async () => {
  if (connected) return client;
  // Circuit breaker: if Redis failed recently, skip for 60s
  if (Date.now() < unavailableUntil) return null;
  try {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: { connectTimeout: 3000, reconnectStrategy: false }
    });
    client.on('error', (err) => logger.warn('Redis error:', err.message));
    await client.connect();
    connected = true;
    unavailableUntil = 0;
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis unavailable — caching disabled for 60s:', err.message);
    client = null;
    unavailableUntil = Date.now() + 60000;
  }
  return client;
};

// In-memory L1 fallback so caching still works when Redis is unavailable
// (single-container deploy with no Redis). Without this, every call is a cache
// miss and slow upstreams (metal-price feeds ~12s, Nivoda) run on every request.
// Entries carry an expiry; expired ones are dropped on read. Bounded to avoid growth.
const mem = new Map(); // key -> { value, expiresAt }
const memGet = (key) => {
  const e = mem.get(key);
  if (!e) return undefined;
  if (e.expiresAt && Date.now() > e.expiresAt) { mem.delete(key); return undefined; }
  return e.value;
};
const memSet = (key, value, ttlSeconds) => {
  mem.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0 });
  if (mem.size > 5000) { const now = Date.now(); for (const [k, v] of mem) if (v.expiresAt && now > v.expiresAt) mem.delete(k); }
};

const get = async (key) => {
  try {
    const c = await connect();
    if (c) { const val = await c.get(key); return val ? JSON.parse(val) : null; }
  } catch { /* fall through to in-memory */ }
  const m = memGet(key);
  return m === undefined ? null : m;
};

const set = async (key, value, ttlSeconds) => {
  try {
    const c = await connect();
    if (c) { await c.set(key, JSON.stringify(value), { EX: ttlSeconds }); return; }
  } catch { /* fall through to in-memory */ }
  memSet(key, value, ttlSeconds);
};

const del = async (key) => {
  mem.delete(key);
  try { const c = await connect(); if (c) await c.del(key); } catch { /* non-fatal */ }
};

const delPattern = async (pattern) => {
  const prefix = pattern.replace(/\*.*$/, '');
  for (const k of [...mem.keys()]) if (k.startsWith(prefix)) mem.delete(k);
  try { const c = await connect(); if (c) { const keys = await c.keys(pattern); if (keys.length) await c.del(keys); } } catch { /* non-fatal */ }
};

// Health probe: is the Redis backend reachable? Returns 'connected' when Redis
// answers PING, 'unavailable' when we're running on the in-memory fallback.
const ping = async () => {
  try {
    const c = await connect();
    if (!c) return 'unavailable';
    const r = await c.ping();
    return r === 'PONG' ? 'connected' : 'unavailable';
  } catch { return 'unavailable'; }
};

module.exports = { get, set, del, delPattern, ping };
