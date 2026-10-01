// Shared helpers for Vercel functions (files starting with "_" are not exposed as routes)
const crypto = require('crypto');

const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const HAS_KV = Boolean(KV_URL && KV_TOKEN);

async function kv(command) {
  const r = await fetch(KV_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || `Database error ${r.status}`);
  return j.result;
}

function passwordOk(input) {
  if (!ADMIN_PASSWORD || typeof input !== 'string') return false;
  const a = Buffer.from(input);
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function readBody(req) {
  if (typeof req.body === 'string') { try { return JSON.parse(req.body || '{}'); } catch (_) { return {}; } }
  return req.body || {};
}

module.exports = { kv, passwordOk, readBody, HAS_KV, ADMIN_PASSWORD };
