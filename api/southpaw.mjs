// Vercel serverless function: stores Southpaw training data (one document per week) in MongoDB Atlas.
// Env vars needed in Vercel:
//   MONGODB_URI     (added automatically when you connect MongoDB Atlas to the project)
//   MONGODB_DB      (optional, database name; default "southpaw")
//   SOUTHPAW_KEY    (your own password; every device sends it in x-southpaw-key)
import { timingSafeEqual } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'southpaw';
const SECRET = process.env.SOUTHPAW_KEY || '';
const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

// One client per function instance; attachDatabasePool lets Vercel close idle connections cleanly.
let client = null;
function weeks() {
  if (!client) {
    client = new MongoClient(URI, { maxIdleTimeMS: 5000 });
    attachDatabasePool(client);
  }
  return client.db(DB_NAME).collection('weeks');
}

function authorized(req) {
  const got = Buffer.from(String(req.headers['x-southpaw-key'] || ''));
  const want = Buffer.from(SECRET);
  return SECRET && got.length === want.length && timingSafeEqual(got, want);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URI || !SECRET) return res.status(500).json({ error: 'server not configured' });
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    // GET /api/southpaw?list=1  → every saved week, newest first (max 52)
    if (req.method === 'GET' && req.query.list) {
      const docs = await weeks().find({}, { projection: { data: 1 } }).sort({ _id: -1 }).limit(52).toArray();
      return res.status(200).json({ weeks: docs.map((d) => ({ week: d._id, data: d.data || null })) });
    }

    const week = String(req.query.week || '');
    if (!WEEK_RE.test(week)) return res.status(400).json({ error: 'bad week' });

    // GET /api/southpaw?week=2026-10-19
    if (req.method === 'GET') {
      const doc = await weeks().findOne({ _id: week });
      return res.status(200).json({ data: doc ? doc.data : null });
    }

    // PUT /api/southpaw?week=2026-10-19   body: { data: {...} }
    if (req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') body = JSON.parse(body || '{}');
      const data = body && body.data;
      if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'bad body' });
      if (JSON.stringify(data).length > 50000) return res.status(413).json({ error: 'too large' });
      await weeks().replaceOne({ _id: week }, { data, savedAt: new Date() }, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('southpaw storage error', e);
    return res.status(502).json({ error: 'storage error' });
  }
}
