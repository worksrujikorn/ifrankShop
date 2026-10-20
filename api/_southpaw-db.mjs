// Shared helpers for the Southpaw functions (files starting with "_" are not exposed as routes).
//   MONGODB_URI   added automatically when MongoDB Atlas is connected to the project
//   MONGODB_DB    optional database name (default "southpaw")
import { MongoClient } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';
import webpush from 'web-push';

const URI = process.env.MONGODB_URI || '';
const DB_NAME = process.env.MONGODB_DB || 'southpaw';
export const HAS_DB = Boolean(URI);

// One client per function instance; attachDatabasePool lets Vercel close idle connections cleanly.
let client = null;
export function col(name) {
  if (!client) {
    client = new MongoClient(URI, { maxIdleTimeMS: 5000 });
    attachDatabasePool(client);
  }
  return client.db(DB_NAME).collection(name);
}

/* ---------- week records ----------
   Field-level merge (same rules as merge() in southpaw/index.html): each set tick (st), note (notes),
   per-set weight/reps (log) and the body weight keeps its own edit time in ts, and the newer edit wins,
   so two devices never wipe each other's work. */
const MAPS = { st: 'st:', notes: 'note:', log: 'log:' };
const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o : {});
const cleanLog = (v) => { v = obj(v); return { kg: String(v.kg ?? '').slice(0, 12), reps: String(v.reps ?? '').slice(0, 12) }; };
const CLEAN = { st: (v) => !!v, notes: (v) => String(v ?? '').slice(0, 4000), log: cleanLog };

export function normWeek(x) {
  x = obj(x);
  const out = { st: obj(x.st), notes: obj(x.notes), log: obj(x.log), bw: String(x.bw || ''), ts: { ...obj(x.ts) }, updatedAt: +x.updatedAt || 0 };
  // records saved before per-field times existed: pin each field to the record's time once, so a later
  // edit elsewhere in the week (which moves updatedAt) can't make stale fields look new
  const pin = (f) => { if (!(+out.ts[f] > 0)) out.ts[f] = out.updatedAt; };
  for (const m in MAPS) Object.keys(out[m]).forEach((k) => pin(MAPS[m] + k));
  if (out.bw !== '') pin('bw');
  return out;
}

export function mergeWeek(a, b) {
  a = normWeek(a); b = normWeek(b);
  const out = { st: {}, notes: {}, log: {}, bw: '', ts: {}, updatedAt: Math.max(a.updatedAt, b.updatedAt) };
  const t = (x, f) => +x.ts[f] || 0;
  const take = (f, inA, inB, va, vb, set) => {
    if (!inA && !inB) return;
    const ta = inA ? t(a, f) : -1, tb = inB ? t(b, f) : -1;
    set(tb > ta ? vb : va); out.ts[f] = Math.max(ta, tb);
  };
  for (const m in MAPS) {
    const keys = new Set([...Object.keys(a[m]), ...Object.keys(b[m])]);
    for (const k of keys) take(MAPS[m] + k, k in a[m], k in b[m], a[m][k], b[m][k], (v) => { out[m][k] = CLEAN[m](v); });
  }
  take('bw', a.bw !== '' || 'bw' in a.ts, b.bw !== '' || 'bw' in b.ts, a.bw, b.bw, (v) => { out.bw = String(v || '').slice(0, 12); });
  return out;
}

/* ---------- push notifications ----------
   VAPID keys are created on first use and kept in the database, so there is nothing extra to set up. */
let vapid = null;
export async function getVapid() {
  if (vapid) return vapid;
  const meta = col('meta');
  let doc = await meta.findOne({ _id: 'vapid' });
  if (!doc) {
    const keys = webpush.generateVAPIDKeys();
    try { await meta.insertOne({ _id: 'vapid', publicKey: keys.publicKey, privateKey: keys.privateKey }); }
    catch (e) { if (e.code !== 11000) throw e; }
    doc = await meta.findOne({ _id: 'vapid' });
  }
  vapid = doc;
  return doc;
}

// Sends one notification; returns false when the subscription is gone (and removes it).
export async function sendPush(sub, payload) {
  const v = await getVapid();
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload), {
      vapidDetails: { subject: 'https://www.ifrank.club/southpaw/', publicKey: v.publicKey, privateKey: v.privateKey },
      TTL: 6 * 3600,
    });
    return true;
  } catch (e) {
    if (e.statusCode === 404 || e.statusCode === 410) { await col('push').deleteOne({ _id: sub.endpoint }); return false; }
    throw e;
  }
}

/* ---------- today's plan as a notification ---------- */
const DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
export function bangkokNow() { return new Date(Date.now() + 7 * 3600 * 1000); } // read with getUTC*()

export async function todayMessage() {
  const wd = bangkokNow().getUTCDay();
  const prog = await col('meta').findOne({ _id: 'program' });
  const day = prog && Array.isArray(prog.program?.days) ? prog.program.days.find((d) => d && d.d === wd) : null;
  const title = `วันนี้ · ${DAY_NAMES[wd]}`;
  if (!day) return { title, body: 'ถึงเวลาซ้อมแล้ว เปิดตารางดูกันเลย 🥊' };
  if (day.rest) return { title, body: 'วันพัก 🛌 พักให้สุด พรุ่งนี้ลุยใหม่' };
  const part = (label, s) => (s ? `${label} ${s.title}${s.time ? ` (${s.time})` : ''}${s.opt ? ' · ไม่บังคับ' : ''}` : '');
  const body = [part('☀️ เช้า', day.am), part('🌙 เย็น', day.pm)].filter(Boolean).join('\n');
  return { title, body: (day.motto ? day.motto + '\n' : '') + body };
}
