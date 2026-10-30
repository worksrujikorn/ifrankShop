// Vercel serverless function: Apple Health data for Southpaw, stored in MongoDB next to the weeks.
// Same env vars as api/southpaw.mjs (MONGODB_URI, SOUTHPAW_KEY).
//
// POST /api/southpaw-health        (needs x-southpaw-key, or an edit token from the PIN)
//   nightly iOS Shortcut: { "date":"2026-10-30", "steps":12345, "km":8.4, "active":420, "basal":1050, "exmin":35, "standh":11,
//                           "flights":18, "daylight":37, "wspeed":4.0, "walkhr":94, "rhr":61, "hrv":44, "spo2":97, "resp":15, "sleep":6.5,
//                           "workouts":[{ "type":"Jump Rope", "start":"06:26", "min":15, "kcal":94 }] }
//   bulk import:          { "days": { "2026-10-30": {...} }, "workouts": [ { "date":"2026-10-30", ... } ] }
//   A workout seen for the first time this week or last week ticks the matching slot in the program
//   (rope / run / weights / boxing), so the app shows it as done on every device.
// GET  /api/southpaw-health?from=YYYY-MM-DD&to=YYYY-MM-DD   → { days, workouts, updatedAt }   (open, like the weeks)
import { timingSafeEqual, createHmac } from 'node:crypto';
import { HAS_DB, col, mergeWeek, bangkokNow } from './_southpaw-db.mjs';

const SECRET = process.env.SOUTHPAW_KEY || '';
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const METRICS = ['steps', 'km', 'active', 'basal', 'exmin', 'standh', 'standmin', 'flights', 'daylight', 'wspeed', 'walkhr', 'rhr', 'hrv', 'spo2', 'resp', 'sleep', 'weight'];
// which program slot a watch workout fills, in order of preference, and the minutes it needs
const SLOT_FOR = {
  JumpRope: { t: ['rope', 'cardio'], min: 8 },
  Running: { t: ['cardio', 'rope'], min: 15 },
  Strength: { t: ['str'], min: 15 },
  Boxing: { t: ['box'], min: 15 },
};

/* ---------- auth: same rules as api/southpaw.mjs ---------- */
function same(a, b) { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); }
const sign = (p) => createHmac('sha256', SECRET).update('southpaw-edit:' + p).digest('base64url');
function canWrite(req) {
  if (SECRET && same(req.headers['x-southpaw-key'] || '', SECRET)) return true;
  const [exp, sig] = String(req.headers['x-southpaw-token'] || '').split('.');
  return +exp > Date.now() && !!sig && same(sig, sign(exp));
}

/* ---------- cleaning what the Shortcut sends ---------- */
// Shortcuts may send "12,345", "12345 ก้าว" or "61 count/min" – keep only the number.
function num(v) {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  const m = String(v).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : undefined;
}
const today = () => bangkokNow().toISOString().slice(0, 10);
// 2026-10-30 · 30/10/2026 · 30/10/2569 · "30 Oct 2026 at 06:26"
function toDay(v) {
  if (!v) return undefined;
  const s = String(v).trim();
  if (DAY_RE.test(s.slice(0, 10))) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) { let y = +m[3]; if (y > 2400) y -= 543; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  const d = new Date(s.replace(/\s+at\s+/i, ' '));
  return isNaN(d) ? undefined : new Date(d.getTime() + 7 * 3600e3).toISOString().slice(0, 10);
}
function toHM(v) { const m = String(v || '').match(/(\d{1,2}):(\d{2})/); return m ? `${m[1].padStart(2, '0')}:${m[2]}` : ''; }
function normType(t) {
  const s = String(t || '').toLowerCase();
  if (/jump|rope|กระโดด/.test(s)) return 'JumpRope';
  if (/run|วิ่ง/.test(s)) return 'Running';
  if (/box|มวย/.test(s)) return 'Boxing';
  if (/strength|weight|functional|core|hiit|เวท|ความแข็งแรง|ยกน้ำหนัก/.test(s)) return 'Strength';
  if (/walk|เดิน/.test(s)) return 'Walking';
  if (/cycl|bike|ปั่น/.test(s)) return 'Cycling';
  return 'Other';
}
function cleanMetrics(o) {
  const out = {};
  for (const k of METRICS) { const v = num(o[k]); if (v !== undefined && v >= 0) out[k] = Math.round(v * 10) / 10; }
  if (out.spo2 !== undefined && out.spo2 <= 1.5) out.spo2 = Math.round(out.spo2 * 1000) / 10; // 0.97 → 97
  return out;
}
function cleanWorkout(w, fallbackDay) {
  const date = toDay(w.date || w.start || w.startDate) || fallbackDay;
  if (!date || !DAY_RE.test(date)) return null;
  const out = { date, start: toHM(w.start || w.startDate), type: normType(w.type || w.name || w.workoutActivityType) };
  const raw = String(w.type || w.name || '').slice(0, 40); if (raw) out.raw = raw;
  for (const k of ['min', 'kcal', 'km', 'hr_avg', 'hr_max']) { const v = num(w[k]); if (v !== undefined && v >= 0) out[k] = Math.round(v * 10) / 10; }
  if (out.min === undefined) { const sec = num(w.duration); if (sec !== undefined) out.min = Math.round(sec / 6) / 10; }
  return out;
}
const wid = (w) => `${w.date}|${w.start}|${w.type}`;
function mondayOf(day) { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
function shiftDay(day, n) { const d = new Date(day + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

/* ---------- tick the program slot a workout covers ---------- */
async function autoTick(workouts) {
  const thisMon = mondayOf(today()), lastMon = shiftDay(thisMon, -7);
  const fresh = workouts.filter((w) => { const m = mondayOf(w.date); return m === thisMon || m === lastMon; });
  if (!fresh.length) return 0;
  const prog = await col('meta').findOne({ _id: 'program' });
  const days = prog && prog.program && Array.isArray(prog.program.days) ? prog.program.days : null;
  if (!days) return 0;
  const now = Date.now(), byWeek = {}, claimed = new Set();
  let n = 0;
  for (const w of fresh) {
    const rule = SLOT_FOR[w.type]; if (!rule || (w.min || 0) < rule.min) continue;
    const wd = new Date(w.date + 'T00:00:00Z').getUTCDay(), day = days.find((x) => x && x.d === wd);
    if (!day || day.rest) continue;
    const week = mondayOf(w.date);
    let hit = null;
    for (const t of rule.t) { hit = ['am', 'pm'].find((sn) => day[sn] && day[sn].type === t && !claimed.has(`${week}|${wd}|${sn}`)); if (hit) break; }
    if (!hit) continue;
    claimed.add(`${week}|${wd}|${hit}`);
    const d = (byWeek[week] = byWeek[week] || { st: {}, ts: {}, updatedAt: now });
    day[hit].groups.forEach((g, gi) => g.items.forEach((it, ii) => {
      const id = it.id || `${gi}-${ii}`;
      for (let s = 0; s < (+it.s || 1); s++) { const k = `${wd}-${hit}-${id}-${s}`; d.st[k] = true; d.ts['st:' + k] = now; }
    }));
    n++;
  }
  const weeks = col('weeks');
  for (const [week, data] of Object.entries(byWeek)) {
    for (let i = 0; i < 5; i++) { // same versioned merge as PUT ?week= in api/southpaw.mjs
      const cur = await weeks.findOne({ _id: week });
      const merged = mergeWeek(cur && cur.data, data);
      if (!cur) {
        try { await weeks.insertOne({ _id: week, data: merged, v: 1, savedAt: new Date() }); break; }
        catch (e) { if (e.code === 11000) continue; throw e; }
      }
      const r = await weeks.updateOne({ _id: week, v: cur.v ?? null }, { $set: { data: merged, v: (cur.v || 0) + 1, savedAt: new Date() } });
      if (r.matchedCount) break;
    }
  }
  return n;
}

function readBody(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body || '{}'); } catch (_) { body = {}; } }
  return body && typeof body === 'object' ? body : {};
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!HAS_DB || !SECRET) return res.status(500).json({ error: 'server not configured' });
  try {
    if (req.method === 'GET') {
      const to = DAY_RE.test(req.query.to || '') ? req.query.to : today();
      let from = DAY_RE.test(req.query.from || '') ? req.query.from : shiftDay(to, -90);
      if (from < shiftDay(to, -400)) from = shiftDay(to, -400);
      const [dDocs, wDocs, meta] = await Promise.all([
        col('health_days').find({ _id: { $gte: from, $lte: to } }).toArray(),
        col('health_workouts').find({ date: { $gte: from, $lte: to } }).toArray(),
        col('meta').findOne({ _id: 'health' }),
      ]);
      const days = {};
      dDocs.forEach((d) => { const { _id, at, ...v } = d; days[_id] = v; });
      const workouts = wDocs.map(({ _id, at, ...w }) => w).sort((a, b) => wid(a).localeCompare(wid(b)));
      return res.status(200).json({ from, to, days, workouts, updatedAt: meta ? meta.updatedAt : 0 });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      if (!canWrite(req)) return res.status(401).json({ error: 'locked' });
      const body = readBody(req);
      const days = {}, workouts = [];
      let fallback;
      if (body.days && typeof body.days === 'object') { // bulk import
        for (const [d, v] of Object.entries(body.days)) if (DAY_RE.test(d) && v && typeof v === 'object') { const c = cleanMetrics(v); if (Object.keys(c).length) days[d] = c; }
      } else { // one day from the Shortcut
        fallback = toDay(body.date) || today();
        const c = cleanMetrics(body); if (Object.keys(c).length) days[fallback] = c;
      }
      let ws = body.workouts;
      if (typeof ws === 'string') { try { ws = JSON.parse(ws); } catch (_) { ws = []; } }
      if (ws && !Array.isArray(ws)) ws = typeof ws === 'object' ? Object.values(ws) : [];
      for (const w of ws || []) if (w && typeof w === 'object') { const c = cleanWorkout(w, fallback); if (c) workouts.push(c); }
      if (!Object.keys(days).length && !workouts.length) return res.status(400).json({ error: 'no data' });
      if (Object.keys(days).length > 800 || workouts.length > 3000) return res.status(413).json({ error: 'too much at once' });

      const now = new Date();
      const dOps = Object.entries(days).map(([d, v]) => ({ updateOne: { filter: { _id: d }, update: { $set: { ...v, at: now } }, upsert: true } }));
      const ids = workouts.map(wid);
      const seen = new Set((ids.length ? await col('health_workouts').find({ _id: { $in: ids } }, { projection: { _id: 1 } }).toArray() : []).map((x) => x._id));
      const fresh = workouts.filter((w) => !seen.has(wid(w)));
      const wOps = workouts.map((w) => ({ updateOne: { filter: { _id: wid(w) }, update: { $set: { ...w, at: now } }, upsert: true } }));
      await Promise.all([
        dOps.length ? col('health_days').bulkWrite(dOps, { ordered: false }) : null,
        wOps.length ? col('health_workouts').bulkWrite(wOps, { ordered: false }) : null,
      ]);
      const ticked = await autoTick(fresh);
      await col('meta').updateOne({ _id: 'health' }, { $set: { updatedAt: Date.now() } }, { upsert: true });
      return res.status(200).json({ ok: true, days: Object.keys(days), workouts: workouts.length, ticked });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error('southpaw health error', e);
    return res.status(502).json({ error: 'storage error' });
  }
}
