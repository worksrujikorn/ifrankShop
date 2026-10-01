// iFrank — shared definitions used by index.html (shop), admin.html and themes.html
window.IFRANK = (() => {
  /* ================= BADGES ================= */
  const BADGES = {
    new:      { label: 'NEW',         icon: '✨', bg: '#3a2a12', fg: '#ffd27a' },
    hot:      { label: 'HOT',         icon: '🔥', bg: '#3d1420', fg: '#ff6b8b' },
    best:     { label: 'BEST SELLER', icon: '👑', bg: '#ffb95f', fg: '#2a1700' },
    pick:     { label: 'STAFF PICK',  icon: '⭐', bg: '#2c2a10', fg: '#ffe066' },
    limited:  { label: 'LIMITED',     icon: '⏳', bg: '#2b1840', fg: '#c9a2ff' },
    topshelf: { label: 'TOP SHELF',   icon: '💎', bg: '#10283a', fg: '#7fd4ff' },
    restock:  { label: 'RESTOCK',     icon: '🔄', bg: '#0f2d24', fg: '#01f5a0' },
    low:      { label: 'ใกล้หมด',      icon: '⚠️', bg: '#3a2408', fg: '#ffb95f' },
    sale:     { label: 'SALE',        icon: '🏷️', bg: '#ff4799', fg: '#ffffff' },
  };

  /* ================= FLAVORS (card colour) ================= */
  const FLAVORS = {
    candy:  { label: 'Candy / หวาน',     c1: '#ff4799', c2: '#ff7eb6' },
    fruit:  { label: 'Fruit / Citrus',   c1: '#01f5a0', c2: '#50ffaf' },
    cream:  { label: 'Cream / ของหวาน',  c1: '#ffc23d', c2: '#ffb95f' },
    gas:    { label: 'Gas / Fuel',       c1: '#ff8a3d', c2: '#ffb36b' },
    exotic: { label: 'Exotic / Grape',   c1: '#b48cff', c2: '#d4b8ff' },
    earthy: { label: 'Earthy / Pine',    c1: '#8ee35a', c2: '#b5f28a' },
    berry:  { label: 'Berry / Cherry',   c1: '#ff5c7a', c2: '#ff8ba0' },
    ocean:  { label: 'Cool / Mint',      c1: '#3ec9ff', c2: '#86e0ff' },
  };

  const STRAIN_TYPES = ['Sativa', 'Sativa-Hybrid', 'Hybrid-Sativa', 'Hybrid', 'Hybrid-Indica', 'Indica-Hybrid', 'Indica', 'CBD'];

  const EMOJI_SETS = {
    'ผลไม้':     '🍋 🍊 🍇 🍓 🍒 🍑 🥭 🍍 🍌 🍉 🍈 🫐 🍏 🍎 🍐 🥝 🥥 🍅 🫒',
    'ของหวาน':  '🍰 🎂 🧁 🍪 🍩 🍫 🍬 🍭 🍮 🍦 🍨 🍧 🥧 🍯 🧇 🥞 🥐',
    'เครื่องดื่ม': '🥤 🧋 🍹 🍸 🥂 🍾 ☕ 🫖 🧃 🧊 🫧 🍷 🥛',
    'ธรรมชาติ':  '🌿 🍃 🌱 🌲 🌴 🌵 🍄 🌸 🌺 🌻 🌼 🌷 🌹 🪷 🌾 ☘️ 🍀',
    'ไวบ์':      '⚡ 🔥 💥 ✨ 💫 ⭐ 🌟 🌙 ☀️ 🌅 🌈 ❄️ 💨 🌊 🪐 ☁️ 🌋',
    'หรู':       '💎 👑 💍 🖤 💜 💚 💛 🧡 ❤️ 🤍 🏆 🥇 🔱 🎖️ 🪙',
    'สนุก':      '😈 👽 🤖 🦍 🐉 🦄 🐍 🦋 🐝 🎸 🏎️ 🚀 🎰 🎲 🧪 ⛽ 🔧 💅 🧼 🟢 🟣',
  };

  /* ================= TERPENES / MOODS / FLAVOR PROFILE =================
     Wording describes aroma + commonly reported feel. Not medical claims. */
  const MOODS = {
    all:      { label: 'ทั้งหมด',   icon: '✨' },
    focus:    { label: 'Focus',     icon: '⚡' },
    relax:    { label: 'Relax',     icon: '🧘' },
    creative: { label: 'Creative',  icon: '🎨' },
    rest:     { label: 'Deep Rest', icon: '🌙' },
    social:   { label: 'Social',    icon: '🎉' },
  };

  const TERPENES = {
    limonene:      { name: 'Limonene',      emoji: '🍋', color: '#ffd84d', moods: ['focus', 'social'],    aroma: 'ซิตรัส มะนาว เปลือกส้ม',     desc: 'กลิ่นสดชื่นแบบผิวส้ม-มะนาว มักพบในสาย Sativa ให้ฟีลสดใส กระปรี้กระเปร่า' },
    myrcene:       { name: 'Myrcene',       emoji: '🥭', color: '#01f5a0', moods: ['relax', 'rest'],      aroma: 'มะม่วงสุก ดิน สมุนไพร',     desc: 'เทอร์ปีนที่พบบ่อยที่สุด กลิ่นผลไม้สุกผสมดิน มักอยู่ในสายที่ให้ฟีลผ่อนคลาย ตัวเบา' },
    linalool:      { name: 'Linalool',      emoji: '🌸', color: '#ff7eb6', moods: ['relax', 'creative'],  aroma: 'ลาเวนเดอร์ ดอกไม้หวาน',      desc: 'กลิ่นดอกไม้นุ่มๆ แบบลาเวนเดอร์ ให้ฟีลละมุน อารมณ์ดี' },
    caryophyllene: { name: 'Caryophyllene', emoji: '🌶️', color: '#b48cff', moods: ['rest', 'relax'],      aroma: 'พริกไทยดำ เครื่องเทศ วู้ดดี้', desc: 'กลิ่นเผ็ดอุ่นแบบพริกไทยและไม้ มักพบในสาย gas / cookie ให้ฟีลหนักแน่น' },
    pinene:        { name: 'Pinene',        emoji: '🌲', color: '#8ee35a', moods: ['focus', 'creative'],  aroma: 'สนสด ป่าไม้',               desc: 'กลิ่นสนสดชื่นแบบเดินป่า ให้ฟีลหัวโล่ง ปลอดโปร่ง' },
    terpinolene:   { name: 'Terpinolene',   emoji: '🍏', color: '#7cf5d0', moods: ['creative', 'focus'],  aroma: 'ผลไม้เขียว ดอกไม้ สมุนไพร',  desc: 'กลิ่นซับซ้อน ผลไม้ + ดอกไม้ + สมุนไพร พบไม่บ่อย มักอยู่ในสาย Haze' },
    humulene:      { name: 'Humulene',      emoji: '🍺', color: '#ffb95f', moods: ['relax'],              aroma: 'ฮอปส์ ไม้ ดิน',              desc: 'กลิ่นฮอปส์แบบเบียร์คราฟต์ ดิน ไม้ แห้งๆ' },
    ocimene:       { name: 'Ocimene',       emoji: '🍹', color: '#ff9f6b', moods: ['social', 'creative'], aroma: 'หวานเขตร้อน สมุนไพร',        desc: 'กลิ่นหวานเขตร้อนผสมสมุนไพร ให้ฟีลสดใส สนุก' },
  };

  const PROFILE_AXES = {
    citrus: { label: 'Citrus', emoji: '🍋', color: '#ffd84d' },
    floral: { label: 'Floral', emoji: '🌸', color: '#7cf5d0' },
    earthy: { label: 'Woody',  emoji: '🌲', color: '#8ee35a' },
    gas:    { label: 'Gas',    emoji: '⛽', color: '#ff9f6b' },
    sweet:  { label: 'Sweet',  emoji: '🍬', color: '#ff7eb6' },
    berry:  { label: 'Berry',  emoji: '🫐', color: '#b48cff' },
  };

  const productMoods = (p) => {
    const set = new Set();
    (p.terpenes || []).forEach((t) => (TERPENES[t.key]?.moods || []).forEach((m) => set.add(m)));
    return [...set];
  };
  const hasProfile = (p) => p.profile && Object.keys(PROFILE_AXES).some((k) => Number(p.profile[k]) > 0);

  // Radar chart as inline SVG. values = {citrus:0-5,...}
  function radarSVG(values, { size = 260, labels = true, stroke = 'var(--accent)', id = 'r' } = {}) {
    const keys = Object.keys(PROFILE_AXES);
    const cx = size / 2, cy = size / 2, R = size * (labels ? 0.33 : 0.42);
    const pt = (i, r) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / keys.length;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    };
    const ring = (f) => keys.map((_, i) => pt(i, R * f).map((n) => n.toFixed(1)).join(',')).join(' ');
    const vals = keys.map((k) => Math.max(0, Math.min(5, Number(values?.[k]) || 0)) / 5);
    const shape = keys.map((_, i) => pt(i, R * Math.max(vals[i], 0.04)).map((n) => n.toFixed(1)).join(',')).join(' ');
    const padX = labels ? Math.round(size * 0.2) : 0; // room for side labels
    let s = `<svg viewBox="${-padX} 0 ${size + padX * 2} ${size}" class="radar" role="img" aria-label="flavor radar">`;
    s += `<defs><radialGradient id="${id}g"><stop offset="0" stop-color="${stroke}" stop-opacity=".45"/><stop offset="1" stop-color="${stroke}" stop-opacity=".12"/></radialGradient></defs>`;
    [1, 0.75, 0.5, 0.25].forEach((f) => { s += `<polygon points="${ring(f)}" fill="none" stroke="var(--line2)" stroke-width="1"/>`; });
    keys.forEach((_, i) => { const [x, y] = pt(i, R); s += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line2)" stroke-width="1"/>`; });
    s += `<polygon class="radar-shape" points="${shape}" fill="url(#${id}g)" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>`;
    keys.forEach((k, i) => {
      const [x, y] = pt(i, R * Math.max(vals[i], 0.04));
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${labels ? 4.5 : 3}" fill="${PROFILE_AXES[k].color}" stroke="var(--bg)" stroke-width="1.5"/>`;
    });
    if (labels) {
      keys.forEach((k, i) => {
        const [x, y] = pt(i, R + size * 0.1);
        const anchor = Math.abs(x - cx) < 4 ? 'middle' : x > cx ? 'start' : 'end';
        const a = PROFILE_AXES[k];
        s += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" class="radar-label"><tspan>${a.emoji} </tspan><tspan fill="${a.color}" font-weight="800">${a.label.toUpperCase()}</tspan><tspan class="radar-pct"> ${Math.round(vals[i] * 100)}%</tspan></text>`;
      });
    }
    return s + '</svg>';
  }

  /* ================= DATA ================= */
  async function loadData() {
    try {
      const r = await fetch('/api/products', { cache: 'no-store' });
      if (r.ok) return await r.json();
    } catch (_) { /* fall through to static file */ }
    const r = await fetch('/data/products.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('โหลดเมนูไม่สำเร็จ');
    return { storage: 'static', updatedAt: null, data: await r.json() };
  }

  const fmt = (n) => Number(n || 0).toLocaleString('en-US');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const flavor = (key) => FLAVORS[key] || FLAVORS.candy;

  // dark or light text on top of a colour
  function onColor(hex) {
    const h = String(hex).replace('#', '');
    if (h.length < 6) return '#fff';
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return L > 0.55 ? '#14121a' : '#ffffff';
  }

  function badgeHTML(key, cls = 'badge') {
    const b = BADGES[key];
    if (!b) return '';
    return `<span class="${cls}" style="background:${b.bg};color:${b.fg}">${b.icon} ${esc(b.label)}</span>`;
  }

  function priceSummary(p) {
    const prices = (p.prices || []).map((t) => Number(t.price));
    if (!prices.length) return '';
    if (prices.length === 1) return `${fmt(prices[0])} ฿`;
    return `เริ่ม ${fmt(Math.min(...prices))} ฿`;
  }

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (_) { return fallback; } },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) { /* ignore */ } },
    del(key) { try { localStorage.removeItem(key); } catch (_) { /* ignore */ } },
  };

  const thaiDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }) + ' · ' +
      d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) + ' น.';
  };

  /* ================= THEMES =================
     Every theme is a set of CSS variables. Copy a block to add a new one. */
  const T = (name, desc, vars) => ({ name, desc, vars });
  const THEMES = {
    candy: T('Candy Pop', 'กรมเข้ม ชมพูช็อกกิ้ง ตัดเขียวมิ้นต์ สดใส ทันสมัย', {
      bg: '#11111a', bgfx: 'radial-gradient(circle at 0% 0%, rgba(255,71,153,.16), transparent 38%), radial-gradient(circle at 100% 8%, rgba(1,245,160,.07), transparent 35%), radial-gradient(rgba(255,255,255,.035) 1px, transparent 1.3px) 0 0 / 18px 18px',
      card: '#1a1a24', card2: '#21212d', sheet: '#1f1f2a', line: '#2a2a37', line2: '#3a3a4b', input: '#15151e',
      accent: '#ff4799', accent2: '#ff6fb0', soft: '#ffb0c9', on: '#ffffff', mint: '#01f5a0', amber: '#ffb95f',
      text: '#ecebf3', muted: '#aaa8ba', dim: '#757387', red: '#ff5c7a',
      glow: 'rgba(255,71,153,.35)', barbg: 'rgba(17,17,26,.86)', overlay: 'rgba(6,6,12,.72)', btnoff: '#262633',
      fontd: "'Outfit','Anuphan',sans-serif", radius: '20px', pill: '999px',
      brandgrad: 'linear-gradient(180deg,#ffffff 30%,#ffc6dc)', brandw: '800', brandcase: 'none', brandls: '-1.5px', brandsize: '50px',
    }),
    gold: T('Midnight Gold', 'ดำอุ่น ทองหรู แบบ luxury boutique', {
      bg: '#080604', bgfx: 'radial-gradient(circle at 50% 0%, rgba(196,154,60,.14), transparent 45%)',
      card: '#0f0c08', card2: '#15110b', sheet: '#15110b', line: '#211a0e', line2: '#3a2d14', input: '#0a0806',
      accent: '#c49a3c', accent2: '#f5d07a', soft: '#f5d07a', on: '#080604', mint: '#f5d07a', amber: '#e8875a',
      text: '#f0ead8', muted: '#a08c66', dim: '#6f5d3c', red: '#ef4444',
      glow: 'rgba(196,154,60,.3)', barbg: 'rgba(8,6,4,.9)', overlay: 'rgba(0,0,0,.78)', btnoff: '#2a2418',
      fontd: "'Playfair Display','Anuphan',serif", radius: '14px', pill: '10px',
      brandgrad: 'linear-gradient(135deg,#c49a3c,#f5d07a,#c49a3c)', brandw: '900', brandcase: 'uppercase', brandls: '6px', brandsize: '44px',
    }),
    forest: T('Forest', 'เขียวป่าเข้ม organic ธรรมชาติ', {
      bg: '#030b05', bgfx: 'radial-gradient(circle at 20% 0%, rgba(74,222,128,.14), transparent 45%), radial-gradient(circle at 100% 30%, rgba(22,101,52,.28), transparent 50%)',
      card: '#07120a', card2: '#0b1a0f', sheet: '#0d1f12', line: '#102a17', line2: '#1c4428', input: '#051009',
      accent: '#4ade80', accent2: '#a3e635', soft: '#bbf7d0', on: '#03140a', mint: '#a3e635', amber: '#fbbf24',
      text: '#e3f5e8', muted: '#86b894', dim: '#4d7a5b', red: '#f87171',
      glow: 'rgba(74,222,128,.3)', barbg: 'rgba(3,11,5,.88)', overlay: 'rgba(0,6,2,.8)', btnoff: '#13301c',
      fontd: "'Outfit','Anuphan',sans-serif", radius: '18px', pill: '14px',
      brandgrad: 'linear-gradient(135deg,#bbf7d0,#4ade80,#a3e635)', brandw: '800', brandcase: 'none', brandls: '-1px', brandsize: '50px',
    }),
    neon: T('Neon Street', 'ดำสนิท เขียวนีออน แนว streetwear', {
      bg: '#000000', bgfx: 'linear-gradient(rgba(57,255,20,.07) 1px, transparent 1px) 0 0 / 100% 28px, linear-gradient(90deg, rgba(57,255,20,.07) 1px, transparent 1px) 0 0 / 28px 100%',
      card: '#0a0a0a', card2: '#121212', sheet: '#0d0d0d', line: '#1f1f1f', line2: '#333333', input: '#050505',
      accent: '#39ff14', accent2: '#00e5ff', soft: '#b6ff9e', on: '#000000', mint: '#00e5ff', amber: '#ffe600',
      text: '#ffffff', muted: '#bdbdbd', dim: '#7a7a7a', red: '#ff2e63',
      glow: 'rgba(57,255,20,.35)', barbg: 'rgba(0,0,0,.9)', overlay: 'rgba(0,0,0,.85)', btnoff: '#1a1a1a',
      fontd: "'Space Grotesk','Anuphan',sans-serif", radius: '4px', pill: '4px',
      brandgrad: 'linear-gradient(90deg,#39ff14,#00e5ff)', brandw: '700', brandcase: 'uppercase', brandls: '4px', brandsize: '46px',
    }),
    cream: T('Clean Cream', 'พื้นสว่างสีครีม มินิมอล แบบคาเฟ่', {
      bg: '#f6f1e7', bgfx: 'radial-gradient(rgba(47,93,58,.07) 1px, transparent 1.4px) 0 0 / 20px 20px',
      card: '#ffffff', card2: '#fffdf8', sheet: '#ffffff', line: '#e7dfcf', line2: '#d6cbb4', input: '#faf6ee',
      accent: '#2f5d3a', accent2: '#4d7a45', soft: '#2f5d3a', on: '#ffffff', mint: '#2f8a5b', amber: '#b86b00',
      text: '#1d1a14', muted: '#5c5445', dim: '#8f846e', red: '#c2410c',
      glow: 'rgba(47,93,58,.18)', barbg: 'rgba(246,241,231,.9)', overlay: 'rgba(29,26,20,.45)', btnoff: '#e7dfcf',
      fontd: "'DM Serif Display','Anuphan',serif", radius: '18px', pill: '999px',
      brandgrad: 'linear-gradient(135deg,#1d1a14,#2f5d3a)', brandw: '400', brandcase: 'none', brandls: '0px', brandsize: '52px',
    }),
    ocean: T('Deep Ocean', 'น้ำเงินเข้ม ฟ้าเทอร์ควอยซ์ เย็นสบาย', {
      bg: '#03101c', bgfx: 'radial-gradient(circle at 10% 0%, rgba(56,189,248,.18), transparent 45%), radial-gradient(circle at 90% 20%, rgba(45,212,191,.12), transparent 45%)',
      card: '#071a2b', card2: '#0b2338', sheet: '#0c2640', line: '#0f2e48', line2: '#1b4568', input: '#051525',
      accent: '#38bdf8', accent2: '#2dd4bf', soft: '#bae6fd', on: '#03101c', mint: '#2dd4bf', amber: '#fbbf24',
      text: '#e6f4ff', muted: '#8fb6d4', dim: '#54799a', red: '#fb7185',
      glow: 'rgba(56,189,248,.35)', barbg: 'rgba(3,16,28,.88)', overlay: 'rgba(0,6,14,.8)', btnoff: '#0f2e48',
      fontd: "'Outfit','Anuphan',sans-serif", radius: '20px', pill: '999px',
      brandgrad: 'linear-gradient(135deg,#bae6fd,#38bdf8,#2dd4bf)', brandw: '800', brandcase: 'none', brandls: '-1px', brandsize: '50px',
    }),
    sunset: T('Sunset Tropical', 'ส้ม-ชมพูอบอุ่น ไวบ์ทะเลตอนเย็น', {
      bg: '#1a0b06', bgfx: 'radial-gradient(circle at 50% -10%, rgba(255,138,76,.3), transparent 50%), radial-gradient(circle at 100% 100%, rgba(255,77,109,.15), transparent 50%)',
      card: '#26110a', card2: '#2f160d', sheet: '#33170d', line: '#3d1d10', line2: '#5c2d18', input: '#1f0d07',
      accent: '#ff8a4c', accent2: '#ff4d6d', soft: '#ffd0a8', on: '#ffffff', mint: '#ffd166', amber: '#ffd166',
      text: '#fff1e6', muted: '#d9a888', dim: '#9c6b50', red: '#ff3b3b',
      glow: 'rgba(255,138,76,.35)', barbg: 'rgba(26,11,6,.88)', overlay: 'rgba(12,4,2,.8)', btnoff: '#3d1d10',
      fontd: "'Outfit','Anuphan',sans-serif", radius: '20px', pill: '999px',
      brandgrad: 'linear-gradient(135deg,#ffd166,#ff8a4c,#ff4d6d)', brandw: '800', brandcase: 'none', brandls: '-1px', brandsize: '50px',
    }),
    mono: T('Mono Minimal', 'ขาว-ดำล้วน เรียบ คม ให้สีการ์ดเด่น', {
      bg: '#0b0b0b', bgfx: 'none',
      card: '#141414', card2: '#1a1a1a', sheet: '#161616', line: '#242424', line2: '#3a3a3a', input: '#0f0f0f',
      accent: '#ffffff', accent2: '#d4d4d4', soft: '#ffffff', on: '#000000', mint: '#d4d4d4', amber: '#d4d4d4',
      text: '#fafafa', muted: '#a3a3a3', dim: '#6b6b6b', red: '#ef4444',
      glow: 'rgba(255,255,255,.15)', barbg: 'rgba(11,11,11,.9)', overlay: 'rgba(0,0,0,.8)', btnoff: '#242424',
      fontd: "'Outfit','Anuphan',sans-serif", radius: '12px', pill: '999px',
      brandgrad: 'linear-gradient(135deg,#ffffff,#a3a3a3)', brandw: '800', brandcase: 'lowercase', brandls: '-2px', brandsize: '54px',
    }),
  };
  const DEFAULT_THEME = 'candy';

  const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Anuphan:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&family=Playfair+Display:wght@700;900&family=Space+Grotesk:wght@500;700&family=DM+Serif+Display&display=swap';

  const themeKey = (k) => (THEMES[k] ? k : DEFAULT_THEME);
  const themeStyle = (k) => Object.entries(THEMES[themeKey(k)].vars).map(([n, v]) => `--${n}:${v}`).join(';');

  function applyTheme(k, el = document.documentElement) {
    const t = THEMES[themeKey(k)];
    for (const [n, v] of Object.entries(t.vars)) el.style.setProperty(`--${n}`, v);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && el === document.documentElement) meta.content = t.vars.bg;
  }

  // Mini phone-screen preview of a theme (used by /themes, /admin and the shop settings tab)
  const THEME_PREVIEW_CSS = `
    .tp{background:var(--bgfx),var(--bg);color:var(--text);border-radius:22px;padding:16px 11px 12px;position:relative;overflow:hidden;font-family:'Plus Jakarta Sans','Anuphan',sans-serif;border:1px solid var(--line)}
    .tp-brand{text-align:center;font-family:var(--fontd);font-weight:var(--brandw);text-transform:var(--brandcase);letter-spacing:calc(var(--brandls) * .5);font-size:28px;line-height:1.1;background:var(--brandgrad);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
    .tp-tag{text-align:center;font-size:7px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-top:4px}
    .tp-chips{display:flex;gap:4px;margin:11px 0 9px;overflow:hidden}
    .tp-chip{font-size:8px;font-weight:700;padding:4px 8px;border-radius:var(--pill);border:1px solid var(--line2);color:var(--muted);background:var(--card);white-space:nowrap}
    .tp-chip.on{background:var(--accent);color:var(--on);border-color:transparent}
    .tp-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .tp-card{position:relative;text-align:center;border-radius:calc(var(--radius) * .65);padding:15px 6px 7px;background:var(--card);border:1px solid var(--line);overflow:hidden}
    .tp-card .b{position:absolute;top:4px;left:0;right:0;display:flex;gap:2px;justify-content:center}
    .tp-card .b span{font-size:5.5px;font-weight:900;padding:1px 4px;border-radius:999px}
    .tp-card .e{font-size:18px;line-height:1.3}
    .tp-card .n{font-family:var(--fontd);font-weight:700;font-size:9px;margin-top:1px}
    .tp-card .t{font-size:5.5px;color:var(--c1);letter-spacing:.8px;text-transform:uppercase;margin-top:1px;font-weight:700}
    .tp-card .pr{font-family:var(--fontd);font-size:9px;font-weight:800;margin-top:3px}
    .tp-card .p{margin-top:4px;font-size:7px;font-weight:800;padding:3px;border-radius:var(--pill);background:var(--c1);color:var(--ct)}
    .tp-card.sold>*:not(.s){opacity:.3;filter:grayscale(1)}
    .tp-card .s{position:absolute;top:5px;left:50%;transform:translateX(-50%);background:var(--line2);color:var(--muted);font-size:6px;font-weight:800;padding:1px 6px;border-radius:999px}
    .tp-cart{margin-top:9px;display:flex;align-items:center;gap:6px;background:var(--card);border:1px solid var(--accent);color:var(--text);border-radius:calc(var(--radius) * .7);padding:5px 5px 5px 8px;font-size:8px;font-weight:800}
    .tp-cart b{background:var(--accent);color:var(--on);border-radius:999px;min-width:15px;height:15px;display:grid;place-items:center;font-size:7px}
    .tp-cart span{flex:1}
    .tp-cart i{font-style:normal;background:var(--accent);color:var(--on);padding:4px 8px;border-radius:var(--pill)}
  `;

  function themePreviewHTML(k) {
    const b = (key) => { const x = BADGES[key]; return `<span style="background:${x.bg};color:${x.fg}">${x.icon} ${x.label}</span>`; };
    const card = (f, e, n, t, pr, badges, sold) => `
      <div class="tp-card ${sold ? 'sold' : ''}" style="--c1:${f.c1};--ct:${onColor(f.c1)}">
        <div class="b">${badges.map(b).join('')}</div>
        <div class="e">${e}</div><div class="n">${n}</div><div class="t">${t}</div><div class="pr">${pr}</div>
        <div class="p">+ ใส่ตะกร้า</div>
        ${sold ? '<div class="s">หมดชั่วคราว</div>' : ''}
      </div>`;
    return `
      <div class="tp" style="${themeStyle(k)}">
        <div class="tp-brand">iFrank</div>
        <div class="tp-tag">Artisanal botanical &amp; terpenes</div>
        <div class="tp-chips"><span class="tp-chip on">✨ ทั้งหมด</span><span class="tp-chip">💎 Premium</span><span class="tp-chip">🧪 Resin</span></div>
        <div class="tp-grid">
          ${card(FLAVORS.candy, '🥤🍬', 'Jelly Cola', 'Hybrid-Sativa', '150 ฿', ['new', 'hot'], false)}
          ${card(FLAVORS.fruit, '🍋🫧', 'Lime Soda', 'Hybrid', '150 ฿', ['best'], false)}
          ${card(FLAVORS.cream, '🍓🎂', 'Manzano', 'Hybrid', '150 ฿', ['pick'], false)}
          ${card(FLAVORS.exotic, '🍇🖤', 'Grape Velvet', 'Live Resin', '700 ฿', [], true)}
        </div>
        <div class="tp-cart"><b>2</b><span>300 ฿</span><i>ยืนยันออเดอร์ →</i></div>
      </div>`;
  }

  function injectThemePreviewCSS() {
    if (document.getElementById('tp-css')) return;
    const s = document.createElement('style');
    s.id = 'tp-css';
    s.textContent = THEME_PREVIEW_CSS;
    document.head.appendChild(s);
  }

  return {
    BADGES, FLAVORS, STRAIN_TYPES, EMOJI_SETS, MOODS, TERPENES, PROFILE_AXES, THEMES, DEFAULT_THEME, FONTS_URL,
    loadData, fmt, esc, flavor, onColor, badgeHTML, priceSummary, store, thaiDate,
    productMoods, hasProfile, radarSVG,
    themeKey, themeStyle, applyTheme, themePreviewHTML, injectThemePreviewCSS,
  };
})();
