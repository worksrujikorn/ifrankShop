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

// Field-level merge (same rules as merge() in southpaw/index.html): each set tick, note and body weight
// keeps its own edit time in ts, and the newer edit wins, so two devices never wipe each other's work.
function norm(x) {
  x = x && typeof x === 'object' && !Array.isArray(x) ? x : {};
  const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
  const out = { st: obj(x.st), notes: obj(x.notes), bw: String(x.bw || ''), ts: { ...obj(x.ts) }, updatedAt: +x.updatedAt || 0 };
  // records saved before per-field times existed: pin each field to the record's time once, so a later
  // edit elsewhere in the week (which moves updatedAt) can't make stale fields look new
  const pin = (f) => { if (!(+out.ts[f] > 0)) out.ts[f] = out.updatedAt; };
  Object.keys(out.st).forEach((k) => pin('st:' + k));
  Object.keys(out.notes).forEach((k) => pin('note:' + k));
  if (out.bw !== '') pin('bw');
  return out;
}
function mergeWeek(a, b) {
  a = norm(a); b = norm(b);
  const out = { st: {}, notes: {}, bw: '', ts: {}, updatedAt: Math.max(a.updatedAt, b.updatedAt) };
  const t = (x, f) => +x.ts[f] || 0;
  const take = (f, inA, inB, va, vb, set) => {
    if (!inA && !inB) return;
    const ta = inA ? t(a, f) : -1, tb = inB ? t(b, f) : -1;
    set(tb > ta ? vb : va); out.ts[f] = Math.max(ta, tb);
  };
  const keys = (x, y) => [...new Set([...Object.keys(x), ...Object.keys(y)])];
  for (const k of keys(a.st, b.st)) take('st:' + k, k in a.st, k in b.st, a.st[k], b.st[k], (v) => { out.st[k] = !!v; });
  for (const k of keys(a.notes, b.notes)) take('note:' + k, k in a.notes, k in b.notes, a.notes[k], b.notes[k], (v) => { out.notes[k] = String(v || ''); });
  take('bw', a.bw !== '' || 'bw' in a.ts, b.bw !== '' || 'bw' in b.ts, a.bw, b.bw, (v) => { out.bw = String(v || ''); });
  return out;
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
      if (JSON.stringify(data).length > 100000) return res.status(413).json({ error: 'too large' });
      // read → merge → write only if nobody else wrote in between (version v), retry otherwise
      for (let i = 0; i < 5; i++) {
        const cur = await weeks().findOne({ _id: week });
        const merged = mergeWeek(cur && cur.data, data);
        if (!cur) {
          try { await weeks().insertOne({ _id: week, data: merged, v: 1, savedAt: new Date() }); }
          catch (e) { if (e.code === 11000) continue; throw e; }
          return res.status(200).json({ ok: true, data: merged });
        }
        const r = await weeks().updateOne({ _id: week, v: cur.v ?? null }, { $set: { data: merged, v: (cur.v || 0) + 1, savedAt: new Date() } });
        if (r.matchedCount) return res.status(200).json({ ok: true, data: merged });
      }
      return res.status(409).json({ error: 'busy, try again' });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('southpaw storage error', e);
    return res.status(502).json({ error: 'storage error' });
  }
}
