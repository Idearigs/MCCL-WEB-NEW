// HTTP calls to Truedesk Cloud (docs/PROTOCOL.md in truedesk-cloud). Uses Node's built-in fetch.
// The token is sent only in the Authorization header and never logged.

const { settings, markDisconnected } = require('./config');
const { logger } = require('../../config/database');

class CloudError extends Error {
  constructor(kind, status, body, message) {
    super(message || `Truedesk Cloud ${kind}${status ? ` (${status})` : ''}`);
    this.kind = kind; // 'unauthorized' | 'contract_violation' | 'http' | 'network'
    this.status = status;
    this.body = body;
  }
}

const TIMEOUT_MS = 30_000;

/** Called on any 401: the website was unpaired, so syncing stops (the chat keeps working). */
const unauthorized = () => {
  markDisconnected();
  logger.error('Truedesk Cloud rejected the website token (401). Syncing has stopped; the chat still works. Pair again and set a new TRUEDESK_TOKEN.');
};

const request = async (method, pathname, { json, body, headers = {}, timeoutMs = TIMEOUT_MS, raw = false } = {}) => {
  const { url, token } = settings();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${url}${pathname}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(json !== undefined ? { 'content-type': 'application/json' } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : body,
      signal: ctrl.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new CloudError('network', 0, null, `Truedesk Cloud unreachable: ${err.name === 'AbortError' ? 'timed out' : err.message}`);
  }
  clearTimeout(timer);
  if (res.status === 401) {
    unauthorized();
    throw new CloudError('unauthorized', 401, null);
  }
  if (raw && res.ok) return res;
  const text = await res.text().catch(() => '');
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!res.ok) {
    if (res.status === 400 && data && data.error === 'contract_violation') throw new CloudError('contract_violation', 400, data);
    throw new CloudError('http', res.status, data);
  }
  return data;
};

const push = (mutations) => request('POST', '/v1/sync/push', { json: { mutations } });
const pull = (since, limit = 200) => request('GET', `/v1/sync/pull?since=${encodeURIComponent(since)}&limit=${limit}`);

const putBlob = (sha256, contentType, bytes) =>
  request('PUT', `/v1/blobs/${sha256}`, { body: bytes, headers: { 'content-type': contentType }, timeoutMs: 120_000 });

/** The blob's bytes and content type. */
const getBlob = async (sha256) => {
  const res = await request('GET', `/v1/blobs/${sha256}`, { raw: true, timeoutMs: 120_000 });
  const buf = Buffer.from(await res.arrayBuffer());
  return { bytes: buf, contentType: (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase() };
};

/** Opens the live event stream; resolves to the fetch Response (body is the SSE stream). */
const openEvents = async (signal) => {
  const { url, token } = settings();
  let res;
  try {
    res = await fetch(`${url}/v1/sync/events`, { headers: { authorization: `Bearer ${token}`, accept: 'text/event-stream' }, signal });
  } catch (err) {
    throw new CloudError('network', 0, null, `Truedesk event stream unreachable: ${err.message}`);
  }
  if (res.status === 401) {
    unauthorized();
    throw new CloudError('unauthorized', 401, null);
  }
  if (!res.ok || !res.body) throw new CloudError('http', res.status, null, `Truedesk event stream refused (${res.status})`);
  return res;
};

/** Pairing (no token yet): POST /v1/devices/activate. */
const activate = async (baseUrl, body) => {
  const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/v1/devices/activate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new CloudError('http', res.status, data, (data && data.message) || `Pairing failed (${res.status})`);
  return data;
};

module.exports = { CloudError, push, pull, putBlob, getBlob, openEvents, activate };
