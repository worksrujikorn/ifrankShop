// Vercel serverless function: Southpaw training data in MongoDB Atlas.
// Env vars needed in Vercel:
//   MONGODB_URI     (added automatically when you connect MongoDB Atlas to the project)
//   SOUTHPAW_KEY    (your own secret; signs edit tokens, and also works as a full-access key in x-southpaw-key)
//   SOUTHPAW_PIN    (optional; the edit PIN, default "69")
//
// Reading is open to every browser, so the owner's data shows up wherever the app is opened.
// Writing needs an edit token from POST ?doc=unlock { pin } (valid 5 minutes, sent in x-southpaw-token)
// or the SOUTHPAW_KEY. Wrong PINs are rate limited, since a 2-digit PIN has only 100 options.
//
// POST   ?doc=unlock             { pin }                   → { token, expiresAt }
// GET    ?list=1                 every saved week, newest first (max 52)
// GET    ?week=YYYY-MM-DD        one week + the program's updatedAt
// PUT    ?week=YYYY-MM-DD        { data }                  merge into the week, returns the merged week
// GET    ?doc=program            the shared training program
// PUT    ?doc=program            { program, updatedAt }    kept only if newer
// GET    ?doc=vapid              public key for push notifications
// PUT    ?doc=push               { subscription }          remember this device for reminders
// DELETE ?doc=push               { endpoint }
// POST   ?doc=pushtest           { endpoint }              send a test notification now
import { timingSafeEqual, createHmac } from 'node:crypto';
import { HAS_DB, col, mergeWeek, getVapid, sendPush, todayMessage } from './_southpaw-db.mjs';

const SECRET = process.env.SOUTHPAW_KEY || '';
const PIN = process.env.SOUTHPAW_PIN || '69';
const WEEK_RE = /^\d{4}-\d{2}-\d{2}$/;
const TOKEN_MS = 5 * 60 * 1000;
const MAX_FAILS = 8, FAIL_WINDOW_MS = 15 * 60 * 1000;

function same(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
const sign = (payload) => createHmac('sha256', SECRET).update('southpaw-edit:' + payload).digest('base64url');
function makeToken() {
  const expiresAt = Date.now() + TOKEN_MS;
  return { token: expiresAt + '.' + sign(String(expiresAt)), expiresAt };
}
function canWrite(req) {
  if (SECRET && same(req.headers['x-southpaw-key'] || '', SECRET)) return true;
  const [exp, sig] = String(req.headers['x-southpaw-token'] || '').split('.');
  return +exp > Date.now() && !!sig && same(sig, sign(exp));
}

async function unlock(req, res) {
  const meta = col('meta'), now = Date.now();
  const doc = (await meta.findOne({ _id: 'pinfails' })) || { count: 0, since: now };
  if (now - doc.since > FAIL_WINDOW_MS) { doc.count = 0; doc.since = now; }
  if (doc.count >= MAX_FAILS) {
    return res.status(429).json({ error: 'too many tries', retryInMin: Math.ceil((doc.since + FAIL_WINDOW_MS - now) / 60000) });
  }
  if (!same(readBody(req).pin || '', PIN)) {
    await meta.updateOne({ _id: 'pinfails' }, { $set: { count: doc.count + 1, since: doc.since } }, { upsert: true });
    return res.status(401).json({ error: 'wrong pin', triesLeft: MAX_FAILS - doc.count - 1 });
  }
  if (doc.count) await meta.deleteOne({ _id: 'pinfails' });
  return res.status(200).json(makeToken());
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

  try {
    const doc = String(req.query.doc || '');
    if (doc === 'unlock' && req.method === 'POST') return await unlock(req, res);
    if (req.method !== 'GET' && !canWrite(req)) return res.status(401).json({ error: 'locked' });
    const r = doc === 'program' ? await programDoc(req, res) : doc ? await pushDoc(req, res, doc) : await weekDoc(req, res);
    if (r !== null) return r;
    res.setHeader('Allow', 'GET, PUT, POST, DELETE');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('southpaw storage error', e);
    return res.status(502).json({ error: 'storage error' });
  }
}
