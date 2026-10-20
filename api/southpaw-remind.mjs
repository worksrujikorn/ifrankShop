// Vercel Cron (see vercel.json): every morning sends today's plan to every device that turned on reminders.
// Vercel calls this with "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set in the project;
// without CRON_SECRET only requests from Vercel's cron runner are accepted.
import { HAS_DB, col, sendPush, todayMessage } from './_southpaw-db.mjs';

function fromCron(req) {
  const secret = process.env.CRON_SECRET;
  if (secret) return req.headers.authorization === `Bearer ${secret}`;
  return String(req.headers['user-agent'] || '').startsWith('vercel-cron');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!fromCron(req)) return res.status(401).json({ error: 'unauthorized' });
  if (!HAS_DB) return res.status(500).json({ error: 'server not configured' });
  try {
    const msg = await todayMessage();
    const subs = await col('push').find({}).toArray();
    let sent = 0;
    for (const s of subs) { try { if (await sendPush(s, msg)) sent++; } catch (e) { console.error('push failed', e.statusCode || e); } }
    return res.status(200).json({ ok: true, sent, total: subs.length });
  } catch (e) {
    console.error('southpaw remind error', e);
    return res.status(502).json({ error: 'storage error' });
  }
}
