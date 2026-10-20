// Vercel serverless function: Southpaw training data in MongoDB Atlas.
// Env vars needed in Vercel:
//   MONGODB_URI     (added automatically when you connect MongoDB Atlas to the project)
//   SOUTHPAW_KEY    (your own password; every device sends it in x-southpaw-key)
//
// GET    ?list=1                 every saved week, newest first (max 52)
// GET    ?week=YYYY-MM-DD        one week + the program's updatedAt
// PUT    ?week=YYYY-MM-DD        { data }                  merge into the week, returns the merged week
// GET    ?doc=program            the shared training program
// PUT    ?doc=program            { program, updatedAt }    kept only if newer
// GET    ?doc=vapid              public key for push notifications
// PUT    ?doc=push               { subscription }          remember this device for reminders
// DELETE ?doc=push               { endpoint }
// POST   ?doc=pushtest           { endpoint }              send a test notification now
import { timingSafeEqual } from 'node:crypto';
import { HAS_DB, col, mergeWeek, getVapid, sendPush, todayMessage } from './_southpaw-db.mjs';

const SECRET = process.env.SOUTHPAW_KEY || '';
const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;

function authorized(req) {
  const got = Buffer.from(String(req.headers['x-southpaw-key'] || ''));
  const want = Buffer.from(SECRET);
  return SECRET && got.length === want.length && timingSafeEqual(got, want);
}
function readBody(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (_) { body = {}; } }
  return body && typeof body === 'object' ? body : {};
}

async function programDoc(req, res) {
  const meta = col('meta');
  if (req.method === 'GET') {
    const doc = await meta.findOne({ _id: 'program' });
    return res.status(200).json({ program: doc ? doc.program : null, updatedAt: doc ? doc.updatedAt : 0 });
  }
  if (req.method === 'PUT') {
    const { program, updatedAt } = readBody(req);
    const at = +updatedAt;
    if (!program || !Array.isArray(program.days) || !(at > 0)) return res.status(400).json({ error: 'bad body' });
    if (JSON.stringify(program).length > 200000) return res.status(413).json({ error: 'too large' });
    // last write wins, but an older copy never replaces a newer one
    const r = await meta.updateOne({ _id: 'program', updatedAt: { $lt: at } }, { $set: { program, updatedAt: at } });
    if (!r.matchedCount) {
      try { await meta.insertOne({ _id: 'program', program, updatedAt: at }); } catch (e) { if (e.code !== 11000) throw e; }
    }
    const doc = await meta.findOne({ _id: 'program' });
    return res.status(200).json({ program: doc.program, updatedAt: doc.updatedAt });
  }
  return null;
}

async function pushDoc(req, res, doc) {
  if (doc === 'vapid' && req.method === 'GET') return res.status(200).json({ publicKey: (await getVapid()).publicKey });
  if (doc === 'push' && req.method === 'PUT') {
    const sub = readBody(req).subscription;
    if (!sub || typeof sub.endpoint !== 'string' || !sub.keys) return res.status(400).json({ error: 'bad subscription' });
    await col('push').replaceOne({ _id: sub.endpoint }, { endpoint: sub.endpoint, keys: sub.keys, savedAt: new Date() }, { upsert: true });
    return res.status(200).json({ ok: true });
  }
  if (doc === 'push' && req.method === 'DELETE') {
    const { endpoint } = readBody(req);
    if (typeof endpoint === 'string') await col('push').deleteOne({ _id: endpoint });
    return res.status(200).json({ ok: true });
  }
  if (doc === 'pushtest' && req.method === 'POST') {
    const { endpoint } = readBody(req);
    const sub = typeof endpoint === 'string' ? await col('push').findOne({ _id: endpoint }) : null;
    if (!sub) return res.status(404).json({ error: 'not subscribed' });
    const msg = await todayMessage();
    const ok = await sendPush(sub, { ...msg, title: '🔔 ทดสอบ · ' + msg.title });
    return res.status(ok ? 200 : 410).json({ ok });
  }
  return null;
}

async function weekDoc(req, res) {
  const weeks = col('weeks');
  if (req.method === 'GET' && req.query.list) {
    const docs = await weeks.find({}, { projection: { data: 1 } }).sort({ _id: -1 }).limit(52).toArray();
    return res.status(200).json({ weeks: docs.map((d) => ({ week: d._id, data: d.data || null })) });
  }

  const week = String(req.query.week || '');
  if (!WEEK_RE.test(week)) return res.status(400).json({ error: 'bad week' });

  if (req.method === 'GET') {
    const [w, p] = await Promise.all([
      weeks.findOne({ _id: week }),
      col('meta').findOne({ _id: 'program' }, { projection: { updatedAt: 1 } }),
    ]);
    return res.status(200).json({ data: w ? w.data : null, programAt: p ? p.updatedAt : 0 });
  }

  if (req.method === 'PUT') {
    const data = readBody(req).data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'bad body' });
    if (JSON.stringify(data).length > 150000) return res.status(413).json({ error: 'too large' });
    // read → merge → write only if nobody else wrote in between (version v), retry otherwise
    for (let i = 0; i < 5; i++) {
      const cur = await weeks.findOne({ _id: week });
      const merged = mergeWeek(cur && cur.data, data);
      if (!cur) {
        try { await weeks.insertOne({ _id: week, data: merged, v: 1, savedAt: new Date() }); }
        catch (e) { if (e.code === 11000) continue; throw e; }
        return res.status(200).json({ ok: true, data: merged });
      }
      const r = await weeks.updateOne({ _id: week, v: cur.v ?? null }, { $set: { data: merged, v: (cur.v || 0) + 1, savedAt: new Date() } });
      if (r.matchedCount) return res.status(200).json({ ok: true, data: merged });
    }
    return res.status(409).json({ error: 'busy, try again' });
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!HAS_DB || !SECRET) return res.status(500).json({ error: 'server not configured' });
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });

  try {
    const doc = String(req.query.doc || '');
    const r = doc === 'program' ? await programDoc(req, res) : doc ? await pushDoc(req, res, doc) : await weekDoc(req, res);
    if (r !== null) return r;
    res.setHeader('Allow', 'GET, PUT, POST, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('southpaw storage error', e);
    return res.status(502).json({ error: 'storage error' });
  }
}
