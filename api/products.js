// iFrank — Products API (Vercel Serverless Function)
//
// GET  /api/products                      → public: menu data
// POST /api/products  {action:"verify"}   → admin: check password
// POST /api/products  {data:{...}}        → admin: save menu data
//
// Env vars (Vercel → Project → Settings → Environment Variables):
//   ADMIN_PASSWORD                         → admin login password (required)
//   KV_REST_API_URL / KV_REST_API_TOKEN    → auto-added by Upstash Redis integration
//   (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN)

const crypto = require('crypto');
const SEED = require('../data/products.json');

const KEY = 'ifrank:data:v1';
const HISTORY_KEY = 'ifrank:history:v1';
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

function validate(d) {
  if (!d || typeof d !== 'object') return 'ข้อมูลไม่ถูกต้อง';
  if (!Array.isArray(d.products) || !Array.isArray(d.categories)) return 'ต้องมี products และ categories';
  if (d.products.length > 300) return 'สินค้าเยอะเกิน 300 รายการ';
  if (JSON.stringify(d).length > 500000) return 'ข้อมูลใหญ่เกินไป';
  const catIds = new Set(d.categories.map((c) => c && c.id));
  const ids = new Set();
  for (const p of d.products) {
    if (!p || !p.id || !p.name) return 'สินค้าทุกตัวต้องมี id และชื่อ';
    if (ids.has(p.id)) return `id ซ้ำ: ${p.id}`;
    ids.add(p.id);
    if (!catIds.has(p.category)) return `${p.name}: ไม่พบหมวดหมู่ "${p.category}"`;
    if (!Array.isArray(p.prices) || !p.prices.length) return `${p.name}: ต้องมีราคาอย่างน้อย 1 ตัวเลือก`;
    for (const t of p.prices) {
      if (!t || !String(t.label || '').trim() || !(Number(t.price) >= 0)) return `${p.name}: ราคาไม่ถูกต้อง`;
    }
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const storage = HAS_KV ? 'kv' : 'static';

  try {
    if (req.method === 'GET') {
      let saved = null;
      if (HAS_KV) {
        const raw = await kv(['GET', KEY]);
        if (raw) saved = JSON.parse(raw);
      }
      return res.status(200).json({
        storage,
        updatedAt: saved ? saved.updatedAt : null,
        data: saved ? saved.data : SEED,
      });
    }

    if (req.method === 'POST') {
      if (!ADMIN_PASSWORD) {
        return res.status(500).json({ error: 'ยังไม่ได้ตั้ง ADMIN_PASSWORD ใน Vercel Environment Variables' });
      }
      if (!passwordOk(req.headers['x-admin-password'])) {
        return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

      if (body.action === 'verify') return res.status(200).json({ ok: true, storage });

      if (!HAS_KV) {
        return res.status(400).json({ error: 'ยังไม่ได้เชื่อม Upstash Redis — บันทึกออนไลน์ไม่ได้ (ใช้ดาวน์โหลด products.json แทน)' });
      }

      const err = validate(body.data);
      if (err) return res.status(400).json({ error: err });

      // keep the previous 10 versions as a safety net
      const prev = await kv(['GET', KEY]);
      if (prev) {
        await kv(['LPUSH', HISTORY_KEY, prev]);
        await kv(['LTRIM', HISTORY_KEY, 0, 9]);
      }

      const updatedAt = new Date().toISOString();
      await kv(['SET', KEY, JSON.stringify({ data: body.data, updatedAt })]);
      return res.status(200).json({ ok: true, updatedAt });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
