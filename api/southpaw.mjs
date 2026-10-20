// Vercel serverless function: stores Southpaw training data (one record per week) in Upstash Redis.
// Env vars needed in Vercel:
//   KV_REST_API_URL + KV_REST_API_TOKEN   (added automatically when you connect Upstash Redis / Vercel KV)
//   SOUTHPAW_KEY                          (your own password; every device sends it in x-southpaw-key)
import { timingSafeEqual } from 'node:crypto';

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.SOUTHPAW_KEY || '';
const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;
const PREFIX = 'southpaw:';

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (!r.ok || j.error) throw new Error(j.error || `redis ${r.status}`);
  return j.result;
}

function authorized(req) {
  const got = Buffer.from(String(req.headers['x-southpaw-key'] || ''));
  const want = Buffer.from(SECRET);
  return SECRET && got.length === want.length && timingSafeEqual(got, want);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN || !SECRET) return res.status(500).json({ error: 'server not configured' });
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    // GET /api/southpaw?list=1  → every saved week, newest first (max 52)
    if (req.method === 'GET' && req.query.list) {
      const weeks = ((await redis(['SMEMBERS', PREFIX + 'weeks'])) || [])
        .filter((w) => WEEK_RE.test(w)).sort().reverse().slice(0, 52);
      if (!weeks.length) return res.status(200).json({ weeks: [] });
      const vals = await redis(['MGET', ...weeks.map((w) => PREFIX + 'week:' + w)]);
      return res.status(200).json({
        weeks: weeks.map((w, i) => ({ week: w, data: vals[i] ? JSON.parse(vals[i]) : null })),
      });
    }

    const week = String(req.query.week || '');
    if (!WEEK_RE.test(week)) return res.status(400).json({ error: 'bad week' });

    // GET /api/southpaw?week=2026-10-19
    if (req.method === 'GET') {
      const v = await redis(['GET', PREFIX + 'week:' + week]);
      return res.status(200).json({ data: v ? JSON.parse(v) : null });
    }

    // PUT /api/southpaw?week=2026-10-19   body: { data: {...} }
    if (req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      const data = body && body.data;
      if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'bad body' });
      const json = JSON.stringify(data);
      if (json.length > 50000) return res.status(413).json({ error: 'too large' });
      await redis(['SET', PREFIX + 'week:' + week, json]);
      await redis(['SADD', PREFIX + 'weeks', week]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    return res.status(502).json({ error: 'storage error' });
  }
}
