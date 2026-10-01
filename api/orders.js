// iFrank — Orders API (Vercel Serverless Function)
//
// POST  /api/orders  {items:[{id,label,qty}], note}   → public: create order (prices are re-checked on the server)
// GET   /api/orders                                    → admin: list latest orders
// PATCH /api/orders  {id, status}                      → admin: change status (new | confirmed | shipped | cancelled)
//
// Customers still screenshot the order slip and send it in chat.
// Saving the order here lets the admin see a queue + daily totals.

const SEED = require('../data/products.json');
const { kv, passwordOk, readBody, HAS_KV, ADMIN_PASSWORD } = require('./_lib');

const MENU_KEY = 'ifrank:data:v1';
const ORDERS = 'ifrank:orders:v1';      // hash  id → json
const INDEX = 'ifrank:orders:idx:v1';   // zset  createdAt → id
const MAX_ORDERS = 500;
const STATUSES = ['new', 'confirmed', 'shipped', 'cancelled'];

function bkkParts(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', month: '2-digit', day: '2-digit' })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return { mm: p.month, dd: p.day };
}

function newId() {
  const { mm, dd } = bkkParts();
  return `IF-${mm}${dd}-${String(Math.floor(1000 + Math.random() * 9000))}`;
}

async function loadMenu() {
  if (HAS_KV) {
    const raw = await kv(['GET', MENU_KEY]);
    if (raw) return JSON.parse(raw).data;
  }
  return SEED;
}

function buildOrder(menu, body) {
  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) return { error: 'ตะกร้าว่าง' };
  if (items.length > 30) return { error: 'สินค้าเยอะเกินไป' };
  const lines = [];
  for (const it of items) {
    const p = (menu.products || []).find((x) => x.id === it.id);
    const qty = Math.floor(Number(it.qty));
    if (!p || p.hidden) continue;
    if (p.soldOut) continue;
    const tier = (p.prices || []).find((t) => t.label === it.label);
    if (!tier || !(qty >= 1 && qty <= 99)) continue;
    lines.push({ id: p.id, name: p.name, emoji: p.emoji || '🌿', strain: p.strain || '', label: tier.label, qty, price: Number(tier.price), total: Number(tier.price) * qty });
  }
  if (!lines.length) return { error: 'สินค้าในตะกร้าหมดหรือไม่พบแล้ว ลองรีเฟรชหน้าเว็บ' };
  const note = String(body.note || '').slice(0, 300);
  return {
    order: {
      id: newId(),
      createdAt: new Date().toISOString(),
      status: 'new',
      items: lines,
      total: lines.reduce((a, l) => a + l.total, 0),
      count: lines.reduce((a, l) => a + l.qty, 0),
      note,
    },
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const body = readBody(req);

  try {
    /* ---------- public: create ---------- */
    if (req.method === 'POST') {
      const menu = await loadMenu();
      const { order, error } = buildOrder(menu, body);
      if (error) return res.status(400).json({ error });

      if (!HAS_KV) return res.status(200).json({ ok: true, stored: false, order });

      // light rate limit: 15 orders / 10 min / IP
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
      const rlKey = `ifrank:rl:${ip}`;
      const n = await kv(['INCR', rlKey]);
      if (n === 1) await kv(['EXPIRE', rlKey, 600]);
      if (n > 15) return res.status(429).json({ error: 'ส่งออเดอร์ถี่เกินไป ลองใหม่อีกสักครู่' });

      // avoid id collision
      while (await kv(['HEXISTS', ORDERS, order.id])) order.id = newId();

      await kv(['HSET', ORDERS, order.id, JSON.stringify(order)]);
      await kv(['ZADD', INDEX, Date.now(), order.id]);

      // keep the newest MAX_ORDERS only
      const size = await kv(['ZCARD', INDEX]);
      if (size > MAX_ORDERS) {
        const old = await kv(['ZRANGE', INDEX, 0, size - MAX_ORDERS - 1]);
        if (old && old.length) {
          await kv(['HDEL', ORDERS, ...old]);
          await kv(['ZREM', INDEX, ...old]);
        }
      }
      return res.status(200).json({ ok: true, stored: true, order });
    }

    /* ---------- admin ---------- */
    if (req.method === 'GET' || req.method === 'PATCH') {
      if (!ADMIN_PASSWORD) return res.status(500).json({ error: 'ยังไม่ได้ตั้ง ADMIN_PASSWORD' });
      if (!passwordOk(req.headers['x-admin-password'])) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
      if (!HAS_KV) return res.status(200).json({ storage: 'static', orders: [] });

      if (req.method === 'GET') {
        const ids = await kv(['ZRANGE', INDEX, 0, 199, 'REV']);
        if (!ids || !ids.length) return res.status(200).json({ storage: 'kv', orders: [] });
        const raw = await kv(['HMGET', ORDERS, ...ids]);
        const orders = raw.filter(Boolean).map((s) => JSON.parse(s));
        return res.status(200).json({ storage: 'kv', orders });
      }

      const { id, status } = body;
      if (!id || !STATUSES.includes(status)) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' });
      const raw = await kv(['HGET', ORDERS, id]);
      if (!raw) return res.status(404).json({ error: 'ไม่พบออเดอร์' });
      const order = JSON.parse(raw);
      order.status = status;
      order.updatedAt = new Date().toISOString();
      await kv(['HSET', ORDERS, id, JSON.stringify(order)]);
      return res.status(200).json({ ok: true, order });
    }

    res.setHeader('Allow', 'GET, POST, PATCH');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) });
  }
};
