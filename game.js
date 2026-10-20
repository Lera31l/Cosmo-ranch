/* ============================================================
   LUMEN ROBOTS — космическая ферма роботов
   Облик меняется с уровнем, UI в духе популярных Mini App
   ============================================================ */

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor("#070910");
    tg.setBackgroundColor("#070910");
  } catch (e) {}
}

/* ---------- AUDIO ---------- */
let actx = null, muted = false;
function ac() {
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  if (actx.state === "suspended") actx.resume();
  return actx;
}
function tone(f, d, type = "triangle", g = 0.05, slide = 0) {
  if (muted) return;
  try {
    const c = ac();
    const o = c.createOscillator();
    const gain = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, c.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), c.currentTime + d);
    gain.gain.setValueAtTime(g, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + d);
    o.connect(gain);
    gain.connect(c.destination);
    o.start();
    o.stop(c.currentTime + d);
  } catch (e) {}
}
const sfx = {
  unlock: () => ac(),
  tap: (crit) => (crit ? (tone(520, 0.12, "square", 0.05, 280), tone(880, 0.16, "triangle", 0.04, 200)) : tone(280, 0.07, "triangle", 0.04, 90)),
  buy: () => (tone(440, 0.08, "sine", 0.05, 120), tone(660, 0.12, "sine", 0.04, 80)),
  deny: () => tone(140, 0.12, "sawtooth", 0.03, -40),
  level: () => (tone(523, 0.1), tone(659, 0.12), tone(784, 0.18)),
};

/* ---------- SVG ROBOTS (стиль «как у уток», но роботы) ---------- */
function robotSVG(species, stage) {
  const st = Math.min(3, Math.max(0, stage));
  const palettes = {
    lumen: [
      { body: "#5eead4", eye: "#0f766e", accent: "#fbbf24", plate: "#99f6e4" },
      { body: "#2dd4bf", eye: "#115e59", accent: "#f59e0b", plate: "#5eead4" },
      { body: "#14b8a6", eye: "#042f2e", accent: "#e8a15a", plate: "#2dd4bf" },
      { body: "#0d9488", eye: "#021c1b", accent: "#fbbf24", plate: "#14b8a6" },
    ],
    scout: [
      { body: "#93c5fd", eye: "#1e3a8a", accent: "#fbbf24", plate: "#bfdbfe" },
      { body: "#60a5fa", eye: "#1e40af", accent: "#f59e0b", plate: "#93c5fd" },
      { body: "#3b82f6", eye: "#172554", accent: "#e8a15a", plate: "#60a5fa" },
      { body: "#2563eb", eye: "#0c1a40", accent: "#fbbf24", plate: "#3b82f6" },
    ],
    tank: [
      { body: "#c4b5fd", eye: "#4c1d95", accent: "#fbbf24", plate: "#ddd6fe" },
      { body: "#a78bfa", eye: "#5b21b6", accent: "#f59e0b", plate: "#c4b5fd" },
      { body: "#8b5cf6", eye: "#2e1065", accent: "#e8a15a", plate: "#a78bfa" },
      { body: "#7c3aed", eye: "#1e0a4a", accent: "#fbbf24", plate: "#8b5cf6" },
    ],
    miner: [
      { body: "#fcd34d", eye: "#78350f", accent: "#2ee6c7", plate: "#fde68a" },
      { body: "#fbbf24", eye: "#92400e", accent: "#14b8a6", plate: "#fcd34d" },
      { body: "#f59e0b", eye: "#451a03", accent: "#0d9488", plate: "#fbbf24" },
      { body: "#d97706", eye: "#1c0a00", accent: "#2ee6c7", plate: "#f59e0b" },
    ],
    guardian: [
      { body: "#fda4af", eye: "#9f1239", accent: "#2ee6c7", plate: "#fecdd3" },
      { body: "#fb7185", eye: "#be123c", accent: "#14b8a6", plate: "#fda4af" },
      { body: "#f43f5e", eye: "#4c0519", accent: "#e8a15a", plate: "#fb7185" },
      { body: "#e11d48", eye: "#2a0610", accent: "#fbbf24", plate: "#f43f5e" },
    ],
    apex: [
      { body: "#fde68a", eye: "#422006", accent: "#2ee6c7", plate: "#fef3c7" },
      { body: "#fcd34d", eye: "#451a03", accent: "#14b8a6", plate: "#fde68a" },
      { body: "#fbbf24", eye: "#1c0a00", accent: "#0d9488", plate: "#fcd34d" },
      { body: "#f59e0b", eye: "#0c0500", accent: "#2ee6c7", plate: "#fbbf24" },
    ],
  };
  const p = (palettes[species] || palettes.lumen)[st];
  const size = 18 + st * 4;
  const antenna = st >= 1;
  const wings = st >= 2;
  const crown = st >= 3;
  const eyeR = 3 + st * 0.5;

  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="g${species}${st}" cx="40%" cy="35%">
        <stop offset="0%" stop-color="${p.plate}"/>
        <stop offset="100%" stop-color="${p.body}"/>
      </radialGradient>
      <filter id="glow${species}${st}"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    ${wings ? `<ellipse cx="22" cy="48" rx="14" ry="8" fill="${p.accent}" opacity="0.55"/><ellipse cx="78" cy="48" rx="14" ry="8" fill="${p.accent}" opacity="0.55"/>` : ""}
    ${antenna ? `<line x1="50" y1="22" x2="50" y2="12" stroke="${p.accent}" stroke-width="2"/><circle cx="50" cy="10" r="3" fill="${p.accent}"/>` : ""}
    ${crown ? `<polygon points="50,6 54,16 46,16" fill="${p.accent}"/><circle cx="50" cy="5" r="2.5" fill="#fff" opacity="0.9"/>` : ""}
    <ellipse cx="50" cy="88" rx="${22 + st * 2}" ry="5" fill="#000" opacity="0.25"/>
    <rect x="${35 - st}" y="${55 - st}" width="${30 + st * 2}" height="${28 + st}" rx="6" fill="url(#g${species}${st})" filter="url(#glow${species}${st})"/>
    <circle cx="50" cy="${38 - st}" r="${size}" fill="url(#g${species}${st})" filter="url(#glow${species}${st})"/>
    <circle cx="${42 - st * 0.5}" cy="${36 - st}" r="${eyeR}" fill="#fff"/>
    <circle cx="${58 + st * 0.5}" cy="${36 - st}" r="${eyeR}" fill="#fff"/>
    <circle cx="${42 - st * 0.5}" cy="${36 - st}" r="${eyeR * 0.55}" fill="${p.eye}"/>
    <circle cx="${58 + st * 0.5}" cy="${36 - st}" r="${eyeR * 0.55}" fill="${p.eye}"/>
    <rect x="${44}" y="${44 - st * 0.3}" width="${12}" height="${3 + st}" rx="1.5" fill="${p.accent}" opacity="0.9"/>
    <rect x="${38 - st}" y="${70}" width="${8 + st}" height="${10 + st}" rx="2" fill="${p.plate}"/>
    <rect x="${54}" y="${70}" width="${8 + st}" height="${10 + st}" rx="2" fill="${p.plate}"/>
    ${st >= 2 ? `<circle cx="50" cy="58" r="4" fill="${p.accent}" opacity="0.8"/>` : ""}
    ${st >= 3 ? `<path d="M30 40 Q20 30 28 22" stroke="${p.accent}" stroke-width="2" fill="none" opacity="0.7"/><path d="M70 40 Q80 30 72 22" stroke="${p.accent}" stroke-width="2" fill="none" opacity="0.7"/>` : ""}
  </svg>`;
}

/* ---------- DATA ---------- */
const SPECIES = [
  { id: "lumen", name: "Люмин", rarity: "COMMON", price: 0, tap: 2, passive: 0.5, blurb: "Стартовый бот. Меняет облик с уровнем." },
  { id: "scout", name: "Скаут", rarity: "COMMON", price: 220, tap: 3, passive: 0.8, blurb: "Быстрый сборщик." },
  { id: "tank", name: "Танк", rarity: "RARE", price: 850, tap: 7, passive: 2.0, blurb: "Тяжёлая броня, сильный удар." },
  { id: "miner", name: "Майнер", rarity: "RARE", price: 1100, tap: 5, passive: 3.2, blurb: "Добывает руду пассивно." },
  { id: "guardian", name: "Страж", rarity: "EPIC", price: 3800, tap: 15, passive: 5.5, blurb: "Элитный юнит орбиты." },
  { id: "apex", name: "Апекс", rarity: "LEGEND", price: 12000, tap: 40, passive: 14, blurb: "Легенда ранчо." },
];

const FARMS = [
  { id: "probe", name: "Зонд", size: "крошечный", cost: 0, income: 2, bonus: 1, loc: 0 },
  { id: "rover", name: "Ровер", size: "малый", cost: 280, income: 6, bonus: 1.2, loc: 1 },
  { id: "dome", name: "Купол", size: "средний", cost: 1100, income: 16, bonus: 1.5, loc: 2 },
  { id: "dock", name: "Док", size: "большой", cost: 3800, income: 40, bonus: 2.0, loc: 3 },
  { id: "mega", name: "Мегаферма", size: "огромный", cost: 12000, income: 110, bonus: 2.8, loc: 4 },
];

const GEAR = [
  { id: "spark", slot: "core", name: "Искра", tap: 1, passive: 0, crit: 2, costL: 120, costO: 10 },
  { id: "heart", slot: "core", name: "Сердце", tap: 3, passive: 0.4, crit: 4, costL: 700, costO: 40 },
  { id: "shell", slot: "plate", name: "Панцирь", tap: 0, passive: 0.8, crit: 0, costL: 200, costO: 30 },
  { id: "mail", slot: "plate", name: "Латы", tap: 1, passive: 2, crit: 0, costL: 1100, costO: 80 },
  { id: "lens", slot: "emitter", name: "Линза", tap: 2, passive: 0, crit: 6, costL: 260, costO: 20 },
  { id: "beam", slot: "emitter", name: "Луч", tap: 5, passive: 0.3, crit: 10, costL: 1500, costO: 60 },
];

const SUPPLIES = [
  { id: "feed", name: "Корм-пакет", desc: "+25 сытости", L: 40, O: 0, sat: 25, nrg: 0, oreG: 0, plasma: 0 },
  { id: "cell", name: "Батарея", desc: "+20 энергии", L: 0, O: 18, sat: 0, nrg: 20, oreG: 0, plasma: 0 },
  { id: "orepack", name: "Ящик руды", desc: "+40 руды", L: 90, O: 0, sat: 0, nrg: 0, oreG: 40, plasma: 0 },
  { id: "plasma", name: "Ампула", desc: "+8 плазмы", L: 220, O: 20, sat: 0, nrg: 0, oreG: 0, plasma: 8 },
];

const QUESTS = [
  { id: "f15", title: "Покормить 15 раз", key: "feeds", need: 15, rew: { L: 120, O: 20 } },
  { id: "up1", title: "Улучшить робота", key: "ups", need: 1, rew: { L: 80, P: 6 } },
  { id: "rv", title: "Открыть ровер", key: "rover", need: 1, rew: { L: 200 } },
  { id: "mini", title: "Сыграть в астероиды", key: "mini", need: 1, rew: { O: 40, S: 1 } },
  { id: "sat", title: "Сытость 80+", key: "sat80", need: 1, rew: { L: 90, N: 15 } },
];

const STAR_PACKS = [
  { id: "p1", title: "Мешок люменов", desc: "+900 люменов", cost: 8, give: { L: 900 } },
  { id: "p2", title: "Плазменный набор", desc: "+20 плазмы · +80 руды", cost: 12, give: { P: 20, O: 80 } },
  { id: "p3", title: "Редкий бот", desc: "Случайный RARE", cost: 25, give: { rare: true } },
  { id: "p4", title: "Апекс", desc: "Легендарный робот", cost: 60, give: { legend: true } },
];

const NEXT_R = { COMMON: "RARE", RARE: "EPIC", EPIC: "LEGEND", LEGEND: null };

function stageOf(lv) {
  if (lv >= 10) return 3;
  if (lv >= 7) return 2;
  if (lv >= 4) return 1;
  return 0;
}
function sp(id) {
  return SPECIES.find((x) => x.id === id) || SPECIES[0];
}
function upCost(lv) {
  return Math.floor(55 * Math.pow(lv, 1.35));
}
function sellVal(sid, lv) {
  const s = sp(sid);
  return Math.max(40, Math.floor(s.price * 0.45)) + lv * 35;
}
function farmPrice(id, lv) {
  const f = FARMS.find((x) => x.id === id);
  if (!f) return 0;
  if (lv <= 0) return f.cost;
  return Math.max(80, Math.floor((f.cost || 80) * Math.pow(1.65, lv)));
}
function xpNeed(l) {
  return 24 + l * 16;
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function todayKey() {
  const d = new Date();
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}
function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n) + "";
}

/* ---------- STATE ---------- */
const KEY = "lumen_robots_v1";
function fresh() {
  const b = { uid: "starter", species: "lumen", level: 1, gear: {} };
  return {
    L: 100, O: 25, N: 40, Nmax: 40, P: 0, S: 3,
    sat: 20, lvl: 1, xp: 0,
    active: "starter",
    herd: [b],
    farms: { probe: 1 },
    loc: "probe",
    feeds: 0, ups: 0, miniBest: 0,
    quests: {},
    daily: "", streak: 0,
  };
}
function load() {
  try {
    const r = localStorage.getItem(KEY);
    if (r) return Object.assign(fresh(), JSON.parse(r));
  } catch (e) {}
  return fresh();
}
let G = load();
function save() {
  localStorage.setItem(KEY, JSON.stringify(G));
}

function beastStats(b) {
  const s = sp(b.species);
  let tap = s.tap * b.level;
  let passive = s.passive * b.level;
  let crit = 8 + b.level;
  Object.values(b.gear || {}).forEach((gid) => {
    const g = GEAR.find((x) => x.id === gid);
    if (!g) return;
    tap += g.tap;
    passive += g.passive;
    crit += g.crit;
  });
  return { tap, passive, crit: Math.min(45, crit) };
}

function locBonus() {
  const f = FARMS.find((x) => x.id === G.loc);
  return f ? f.bonus : 1;
}

function addXp(n) {
  G.xp += n;
  while (G.xp >= xpNeed(G.lvl)) {
    G.xp -= xpNeed(G.lvl);
    G.lvl++;
    G.Nmax += 4;
    G.L += 30 * G.lvl;
    sfx.level();
    float("Уровень " + G.lvl + "!", true);
  }
}

/* ---------- UI HELPERS ---------- */
function float(t, crit) {
  const el = document.getElementById("float");
  el.textContent = t;
  el.className = "show" + (crit ? " crit" : "");
  setTimeout(() => (el.className = ""), 800);
}
function sparks() {
  const box = document.getElementById("fx");
  for (let i = 0; i < 8; i++) {
    const p = document.createElement("div");
    p.className = "spark";
    p.style.left = 40 + Math.random() * 20 + "%";
    p.style.top = 30 + Math.random() * 15 + "%";
    p.style.setProperty("--x", Math.random() * 100 - 50 + "px");
    p.style.setProperty("--y", -60 - Math.random() * 50 + "px");
    p.style.background = Math.random() > 0.5 ? "#2ee6c7" : "#e8a15a";
    box.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

function ui() {
  document.getElementById("lum").textContent = fmt(G.L);
  document.getElementById("ore").textContent = fmt(G.O);
  document.getElementById("nrg").textContent = fmt(G.N);
  document.getElementById("str").textContent = fmt(G.S);
  document.getElementById("plvl").textContent = G.lvl;
  document.getElementById("xpbar").style.width = Math.min(100, (G.xp / xpNeed(G.lvl)) * 100) + "%";

  const b = G.herd.find((x) => x.uid === G.active) || G.herd[0];
  const s = sp(b.species);
  const st = stageOf(b.level);
  const stats = beastStats(b);
  const farm = FARMS.find((f) => f.id === G.loc) || FARMS[0];

  document.getElementById("portrait").innerHTML = robotSVG(b.species, st);
  document.getElementById("hname").textContent = s.name;
  document.getElementById("hlvl").textContent = b.level;
  document.getElementById("hincome").textContent = "+" + Math.floor(stats.tap * locBonus());
  document.getElementById("hstage").textContent = st + 1;
  document.getElementById("rarity").textContent = s.rarity;
  document.getElementById("rarity").className = "rarity " + s.rarity;
  document.getElementById("sat").style.width = G.sat + "%";
  document.getElementById("satv").textContent = Math.floor(G.sat) + "%";
  document.getElementById("en").style.width = Math.min(100, (G.N / G.Nmax) * 100) + "%";
  document.getElementById("env").textContent = Math.floor(G.N);
  document.getElementById("locLabel").textContent = farm.name;
  document.getElementById("bg").className = "bg loc" + farm.loc;

  let pass = 0;
  G.herd.forEach((h) => (pass += beastStats(h).passive));
  FARMS.forEach((f) => {
    const lv = G.farms[f.id] || 0;
    if (lv) pass += f.income * lv;
  });
  pass *= locBonus();
  document.getElementById("pass").textContent = pass.toFixed(1);
  document.getElementById("bots").textContent = G.herd.length;
  document.getElementById("farms").textContent = Object.values(G.farms).filter((v) => v > 0).length;
  document.getElementById("miniBest").textContent = "Рекорд: " + G.miniBest;

  if (tg?.initDataUnsafe?.user) {
    document.getElementById("nick").textContent = tg.initDataUnsafe.user.first_name || "Пилот";
  }

  renderBots();
  renderFarms();
  renderSup();
  renderQuests();
  renderStars();
  updateDaily();
}

/* ---------- FEED ---------- */
function feed() {
  sfx.unlock();
  if (G.N < 1) {
    sfx.deny();
    float("Нет энергии");
    return;
  }
  if (G.sat >= 100) {
    sfx.deny();
    float("Уже сыт");
    return;
  }
  const b = G.herd.find((x) => x.uid === G.active) || G.herd[0];
  const stats = beastStats(b);
  const crit = Math.random() * 100 < stats.crit;
  const mult = crit ? 2 + Math.floor(Math.random() * 3) : 1;
  const gain = Math.floor(stats.tap * locBonus() * mult * (0.7 + G.sat / 180));

  G.N -= 1;
  G.sat = Math.min(100, G.sat + 7 + Math.random() * 3);
  G.L += gain;
  if (crit) G.O += 2;
  G.feeds++;
  addXp(1);
  sfx.tap(crit);
  sparks();
  const port = document.getElementById("portrait");
  port.classList.remove("hit");
  void port.offsetWidth;
  port.classList.add("hit");
  float((crit ? "КРИТ ×" + mult + " " : "") + "+" + fmt(gain), crit);
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(crit ? "medium" : "light");
  save();
  ui();
}

/* ---------- RENDERERS ---------- */
let botsTab = "mine";

function renderBots() {
  const box = document.getElementById("botsBox");
  if (botsTab === "mine") {
    let h = '<div class="grid">';
    G.herd.forEach((b) => {
      const s = sp(b.species);
      const st = stageOf(b.level);
      h += `<div class="card">
        <div class="mini-port">${robotSVG(b.species, st)}</div>
        <div class="nm">${s.name}</div>
        <div class="mt">${s.rarity} · LVL ${b.level} · облик ${st + 1}</div>
        <button class="p" data-act="${b.uid}">${b.uid === G.active ? "На ранчо" : "Выбрать"}</button>
        <button class="p" data-up="${b.uid}">Улучшить ${upCost(b.level)}</button>
        <button class="s" data-sell="${b.uid}">Продать ${sellVal(b.species, b.level)}</button>
        <button class="w" data-trade="${b.uid}">Обмен выше</button>
      </div>`;
    });
    h += "</div>";
    box.innerHTML = h;
  } else if (botsTab === "shop") {
    let h = '<div class="grid">';
    SPECIES.filter((s) => s.price > 0).forEach((s) => {
      h += `<div class="card">
        <div class="mini-port">${robotSVG(s.id, 0)}</div>
        <div class="nm">${s.name}</div>
        <div class="mt">${s.rarity} · ${s.blurb}</div>
        <button class="p" ${G.L >= s.price ? "" : "disabled"} data-buy="${s.id}">${fmt(s.price)} люменов</button>
      </div>`;
    });
    h += "</div>";
    box.innerHTML = h;
  } else {
    const b = G.herd.find((x) => x.uid === G.active) || G.herd[0];
    let h = `<div class="equip-panel"><h3>Снаряжение: ${sp(b.species).name}</h3><div class="slots">`;
    ["core", "plate", "emitter"].forEach((slot) => {
      const gid = b.gear?.[slot];
      const g = GEAR.find((x) => x.id === gid);
      h += `<div class="slot ${g ? "filled" : ""}">${g ? g.name : slot}</div>`;
    });
    h += `</div></div><div class="slist">`;
    GEAR.forEach((g) => {
      h += `<div class="scard"><div><b>${g.name}</b><span>+${g.tap} удар · +${g.passive} пассив · +${g.crit}% крит</span></div>
        <button data-eq="${g.id}">${g.costL}/${g.costO}</button></div>`;
    });
    h += "</div>";
    box.innerHTML = h;
  }

  box.querySelectorAll("[data-act]").forEach((el) => (el.onclick = () => { G.active = el.dataset.act; save(); ui(); }));
  box.querySelectorAll("[data-up]").forEach((el) => (el.onclick = () => upgradeBot(el.dataset.up)));
  box.querySelectorAll("[data-sell]").forEach((el) => (el.onclick = () => sellBot(el.dataset.sell)));
  box.querySelectorAll("[data-trade]").forEach((el) => (el.onclick = () => tradeBot(el.dataset.trade)));
  box.querySelectorAll("[data-buy]").forEach((el) => (el.onclick = () => buyBot(el.dataset.buy)));
  box.querySelectorAll("[data-eq]").forEach((el) => (el.onclick = () => equip(el.dataset.eq)));
}

function upgradeBot(id) {
  const b = G.herd.find((x) => x.uid === id);
  if (!b) return;
  const cost = upCost(b.level);
  const ore = Math.ceil(b.level * 4);
  if (G.L < cost || G.O < ore) {
    sfx.deny();
    float("Нужно " + cost + " люменов и " + ore + " руды");
    return;
  }
  G.L -= cost;
  G.O -= ore;
  b.level++;
  G.ups++;
  addXp(6);
  sfx.buy();
  float(sp(b.species).name + " → LVL " + b.level + " · облик " + (stageOf(b.level) + 1));
  save();
  ui();
}

function buyBot(id) {
  const s = sp(id);
  if (G.L < s.price) {
    sfx.deny();
    float("Мало люменов");
    return;
  }
  G.L -= s.price;
  const b = { uid: uid(), species: id, level: 1, gear: {} };
  G.herd.push(b);
  G.active = b.uid;
  addXp(4);
  sfx.buy();
  float(s.name + " в стаде");
  save();
  ui();
}

function sellBot(id) {
  if (G.herd.length <= 1) {
    sfx.deny();
    float("Нельзя продать последнего");
    return;
  }
  const b = G.herd.find((x) => x.uid === id);
  if (!b) return;
  const v = sellVal(b.species, b.level);
  G.herd = G.herd.filter((x) => x.uid !== id);
  if (G.active === id) G.active = G.herd[0].uid;
  G.L += v;
  sfx.buy();
  float("+" + fmt(v) + " люменов");
  save();
  ui();
}

function tradeBot(id) {
  const b = G.herd.find((x) => x.uid === id);
  if (!b) return;
  const s = sp(b.species);
  const next = NEXT_R[s.rarity];
  if (!next) {
    float("Выше легенды некуда");
    return;
  }
  const cost = s.rarity === "COMMON" ? 180 : s.rarity === "RARE" ? 700 : 2200;
  const plasma = s.rarity === "COMMON" ? 4 : s.rarity === "RARE" ? 12 : 28;
  if (G.L < cost || G.P < plasma) {
    sfx.deny();
    float("Нужно " + cost + " люменов и " + plasma + " плазмы");
    return;
  }
  const pool = SPECIES.filter((x) => x.rarity === next);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  G.L -= cost;
  G.P -= plasma;
  b.species = pick.id;
  b.level = Math.max(1, b.level - 1);
  sfx.level();
  float("Получен " + pick.name + "!");
  save();
  ui();
}

function equip(gid) {
  const g = GEAR.find((x) => x.id === gid);
  const b = G.herd.find((x) => x.uid === G.active);
  if (!g || !b) return;
  if (G.L < g.costL || G.O < g.costO) {
    sfx.deny();
    float("Не хватает ресурсов");
    return;
  }
  G.L -= g.costL;
  G.O -= g.costO;
  if (!b.gear) b.gear = {};
  b.gear[g.slot] = g.id;
  sfx.buy();
  float(g.name + " надето");
  save();
  ui();
}

function renderFarms() {
  const box = document.getElementById("farmsBox");
  box.innerHTML = '<div class="flist"></div>';
  const list = box.querySelector(".flist");
  FARMS.forEach((f) => {
    const lv = G.farms[f.id] || 0;
    const price = farmPrice(f.id, lv);
    const here = G.loc === f.id;
    const div = document.createElement("div");
    div.className = "fcard" + (here ? " active" : "");
    div.innerHTML = `
      <div class="ico">${f.name.slice(0, 2).toUpperCase()}</div>
      <div class="inf">
        <div class="fn">${f.name}</div>
        <div class="fd">${f.size} · ур. ${lv} · ×${f.bonus} · +${f.income}/ч</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${lv > 0 ? `<button data-loc="${f.id}" style="background:transparent;border:1px solid var(--line);color:var(--muted)">${here ? "Здесь" : "Перейти"}</button>` : ""}
        <button data-farm="${f.id}">${lv === 0 ? (price === 0 ? "Открыто" : "Купить " + fmt(price)) : "Улучш. " + fmt(price)}</button>
      </div>`;
    list.appendChild(div);
  });
  list.querySelectorAll("[data-farm]").forEach((el) => (el.onclick = () => buyFarm(el.dataset.farm)));
  list.querySelectorAll("[data-loc]").forEach((el) => (el.onclick = () => {
    if ((G.farms[el.dataset.loc] || 0) < 1) return;
    G.loc = el.dataset.loc;
    save();
    ui();
  }));
}

function buyFarm(id) {
  const f = FARMS.find((x) => x.id === id);
  if (!f) return;
  const lv = G.farms[id] || 0;
  const price = farmPrice(id, lv);
  if (G.L < price || G.O < lv * 8) {
    sfx.deny();
    float(lv === 0 ? "Нужно " + price + " люменов" : "Нужно " + price + " люменов и " + lv * 8 + " руды");
    return;
  }
  G.L -= price;
  G.O -= lv * 8;
  G.farms[id] = lv + 1;
  G.loc = id;
  addXp(5);
  sfx.buy();
  float(lv === 0 ? "Локация: " + f.name : f.name + " ур. " + (lv + 1));
  save();
  ui();
}

function renderSup() {
  const box = document.getElementById("supBox");
  box.innerHTML = '<div class="slist"></div>';
  const list = box.querySelector(".slist");
  SUPPLIES.forEach((s) => {
    const div = document.createElement("div");
    div.className = "scard";
    const cost = [s.L ? s.L + " люм" : "", s.O ? s.O + " руды" : ""].filter(Boolean).join(" · ");
    div.innerHTML = `<div><b>${s.name}</b><span>${s.desc}</span></div><button data-sup="${s.id}">${cost}</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll("[data-sup]").forEach((el) => (el.onclick = () => buySup(el.dataset.sup)));
}

function buySup(id) {
  const s = SUPPLIES.find((x) => x.id === id);
  if (!s) return;
  if (G.L < s.L || G.O < s.O) {
    sfx.deny();
    float("Не хватает");
    return;
  }
  G.L -= s.L;
  G.O = G.O - s.O + s.oreG;
  G.sat = Math.min(100, G.sat + s.sat);
  G.N = Math.min(G.Nmax, G.N + s.nrg);
  G.P += s.plasma;
  sfx.buy();
  float("Куплено");
  save();
  ui();
}

function updateDaily() {
  const btn = document.getElementById("claimDaily");
  const taken = G.daily === todayKey();
  btn.disabled = taken;
  btn.textContent = taken ? "Уже получено" : "Забрать";
  document.getElementById("dRew").textContent = "Серия " + G.streak + " дн. · награда растёт";
}

function claimDaily() {
  const key = todayKey();
  if (G.daily === key) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yKey = y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate();
  G.streak = G.daily === yKey ? G.streak + 1 : 1;
  G.daily = key;
  const bonus = 60 + G.streak * 25;
  G.L += bonus;
  G.O += 10 + G.streak * 2;
  G.N = Math.min(G.Nmax, G.N + 12);
  if (G.streak % 3 === 0) G.S += 1;
  sfx.level();
  float("День " + G.streak + ": +" + bonus);
  save();
  ui();
}

function renderQuests() {
  const box = document.getElementById("qBox");
  box.innerHTML = '<div class="qlist"></div>';
  const list = box.querySelector(".qlist");
  QUESTS.forEach((q) => {
    let prog = 0;
    if (q.key === "feeds") prog = G.feeds;
    if (q.key === "ups") prog = G.ups;
    if (q.key === "rover") prog = G.farms.rover || 0;
    if (q.key === "mini") prog = G.miniBest > 0 ? 1 : 0;
    if (q.key === "sat80") prog = G.sat >= 80 ? 1 : 0;
    const done = !!G.quests[q.id];
    const can = !done && prog >= q.need;
    const div = document.createElement("div");
    div.className = "qcard";
    div.innerHTML = `<div><b>${q.title}</b><span>${Math.min(prog, q.need)}/${q.need}</span></div>
      <button ${can ? "" : "disabled"} data-q="${q.id}">${done ? "✓" : can ? "Забрать" : "..."}</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll("[data-q]").forEach((el) => (el.onclick = () => claimQ(el.dataset.q)));
}

function claimQ(id) {
  const q = QUESTS.find((x) => x.id === id);
  if (!q || G.quests[id]) return;
  let prog = 0;
  if (q.key === "feeds") prog = G.feeds;
  if (q.key === "ups") prog = G.ups;
  if (q.key === "rover") prog = G.farms.rover || 0;
  if (q.key === "mini") prog = G.miniBest > 0 ? 1 : 0;
  if (q.key === "sat80") prog = G.sat >= 80 ? 1 : 0;
  if (prog < q.need) return;
  G.quests[id] = true;
  if (q.rew.L) G.L += q.rew.L;
  if (q.rew.O) G.O += q.rew.O;
  if (q.rew.P) G.P += q.rew.P;
  if (q.rew.S) G.S += q.rew.S;
  if (q.rew.N) G.N = Math.min(G.Nmax, G.N + q.rew.N);
  sfx.level();
  float("Награда!");
  save();
  ui();
}

function renderStars() {
  const box = document.getElementById("starsBox");
  box.innerHTML = '<div class="starlist"></div>';
  const list = box.querySelector(".starlist");
  STAR_PACKS.forEach((p) => {
    const div = document.createElement("div");
    div.className = "stcard";
    div.innerHTML = `<div><b>${p.title}</b><span>${p.desc}</span></div>
      <button data-pack="${p.id}">${p.cost} ⭐</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll("[data-pack]").forEach((el) => (el.onclick = () => buyPack(el.dataset.pack)));
}

function buyPack(id) {
  const p = STAR_PACKS.find((x) => x.id === id);
  if (!p) return;
  if (G.S < p.cost) {
    sfx.deny();
    float("Нужно " + p.cost + " звёзд");
    return;
  }
  G.S -= p.cost;
  if (p.give.L) G.L += p.give.L;
  if (p.give.O) G.O += p.give.O;
  if (p.give.P) G.P += p.give.P;
  if (p.give.rare) {
    const pool = SPECIES.filter((x) => x.rarity === "RARE");
    const pick = pool[Math.floor(Math.random() * pool.length)];
    G.herd.push({ uid: uid(), species: pick.id, level: 2, gear: {} });
  }
  if (p.give.legend) {
    G.herd.push({ uid: uid(), species: "apex", level: 4, gear: { core: "heart" } });
  }
  sfx.level();
  float(p.title);
  save();
  ui();
}

/* ---------- MINI GAME ---------- */
let miniRunning = false;
function startMini() {
  if (miniRunning) return;
  miniRunning = true;
  sfx.unlock();
  const canvas = document.getElementById("miniCanvas");
  const wrap = document.getElementById("miniWrap");
  wrap.classList.add("hidden");
  canvas.classList.remove("hidden");
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const rocks = [];
  let score = 0;
  let spawn = 0;
  let last = performance.now();
  const endAt = last + 18000;

  function loop(now) {
    if (!miniRunning) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    spawn += dt;
    if (spawn > 0.4) {
      spawn = 0;
      rocks.push({
        x: 20 + Math.random() * (w - 40),
        y: -20,
        r: 14 + Math.random() * 16,
        vy: 90 + Math.random() * 120,
        alive: true,
      });
    }
    rocks.forEach((r) => {
      if (!r.alive) return;
      r.y += r.vy * dt;
      if (r.y > h + 30) r.alive = false;
    });
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(7,9,16,0.4)";
    ctx.fillRect(0, 0, w, h);
    rocks.forEach((r) => {
      if (!r.alive) return;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.fillStyle = "#1a2030";
      ctx.fill();
      ctx.strokeStyle = "#2ee6c7";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.fillStyle = "#e8eef6";
    ctx.font = "14px sans-serif";
    ctx.fillText("Очки: " + score + "  ·  " + Math.ceil(Math.max(0, (endAt - now) / 1000)) + "с", 12, 22);

    if (now >= endAt) {
      miniRunning = false;
      const lum = score * 4;
      const ore = Math.floor(score / 2);
      G.L += lum;
      G.O += ore;
      G.miniBest = Math.max(G.miniBest, score);
      if (score >= 25) G.S += 1;
      addXp(Math.floor(score / 4));
      sfx.level();
      float("+" + lum + " люменов");
      canvas.classList.add("hidden");
      wrap.classList.remove("hidden");
      save();
      ui();
      return;
    }
    requestAnimationFrame(loop);
  }

  canvas.onpointerdown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (const r of rocks) {
      if (!r.alive) continue;
      const dx = r.x - x, dy = r.y - y;
      if (dx * dx + dy * dy < r.r * r.r * 1.4) {
        r.alive = false;
        score++;
        sfx.tap(false);
        return;
      }
    }
  };

  requestAnimationFrame(loop);
}

/* ---------- TICK ---------- */
let lastTick = performance.now();
function tick(now) {
  const dt = Math.min(0.2, (now - lastTick) / 1000);
  lastTick = now;
  // passive
  let pass = 0;
  G.herd.forEach((h) => (pass += beastStats(h).passive));
  FARMS.forEach((f) => {
    const lv = G.farms[f.id] || 0;
    if (lv) pass += f.income * lv;
  });
  pass *= locBonus();
  const satF = 0.55 + (G.sat / 100) * 0.9;
  G.L += pass * satF * dt * 0.72;
  G.O += pass * satF * dt * 0.22;
  G.P += pass * satF * dt * 0.02;
  // satiety decay, energy regen
  G.sat = Math.max(0, G.sat - dt * 1.1);
  G.N = Math.min(G.Nmax, G.N + dt * 0.8);
  requestAnimationFrame(tick);
}
// UI refresh every 0.5s
setInterval(() => {
  save();
  ui();
}, 500);

/* ---------- NAV ---------- */
document.querySelectorAll(".ni").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll(".ni").forEach((x) => x.classList.remove("on"));
    b.classList.add("on");
    document.querySelectorAll(".sc").forEach((s) => s.classList.remove("on"));
    document.getElementById("s-" + b.dataset.s).classList.add("on");
  };
});
document.querySelectorAll(".tab").forEach((t) => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"));
    t.classList.add("on");
    botsTab = t.dataset.t;
    renderBots();
  };
});

document.getElementById("feedBtn").onclick = feed;
document.getElementById("claimDaily").onclick = claimDaily;
document.getElementById("miniStart").onclick = startMini;
document.getElementById("topupStars").onclick = () => {
  G.S += 15;
  sfx.buy();
  float("+15 звёзд (демо)");
  save();
  ui();
};

requestAnimationFrame(tick);
ui();
