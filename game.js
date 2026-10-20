// =====================================================
// COSMO RANCH — Telegram Mini App
// Космическая ферма с существами, фермами, заданиями
// =====================================================

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0b0b14');
  tg.setBackgroundColor('#0b0b14');
}

// ---------- ДАННЫЕ ----------
const CREATURES_SHOP = [
  { id: 'cosmo_chick', name: 'Космо-Цып', emoji: '🐣', rarity: 'COMMON', price: 0, income: 1, passive: 0.2 },
  { id: 'space_fox', name: 'Космо-Лис', emoji: '🦊', rarity: 'COMMON', price: 120, income: 2, passive: 0.5 },
  { id: 'nebula_cat', name: 'Туманный Кот', emoji: '😺', rarity: 'RARE', price: 400, income: 5, passive: 1.2 },
  { id: 'astro_wolf', name: 'Астро-Волк', emoji: '🐺', rarity: 'RARE', price: 800, income: 8, passive: 2 },
  { id: 'void_dragon', name: 'Дракон Пустоты', emoji: '🐲', rarity: 'EPIC', price: 2500, income: 20, passive: 5 },
  { id: 'star_phoenix', name: 'Звёздный Феникс', emoji: '🔥', rarity: 'LEGENDARY', price: 8000, income: 50, passive: 15 }
];

const FARM_UNITS = [
  { id: 'probe', name: 'Зонд-сборщик', emoji: '📡', basePrice: 50, income: 2, desc: 'Самый маленький' },
  { id: 'rover', name: 'Лунный ровер', emoji: '🛰️', basePrice: 200, income: 8, desc: 'Средняя добыча' },
  { id: 'station', name: 'Орбитальная станция', emoji: '🏭', basePrice: 800, income: 25, desc: 'Серьёзная ферма' },
  { id: 'colony', name: 'Колония', emoji: '🌌', basePrice: 3000, income: 80, desc: 'Большая колония' },
  { id: 'megastructure', name: 'Мегаструктура', emoji: '🪐', basePrice: 12000, income: 300, desc: 'Максимум добычи' }
];

const QUESTS = [
  { id: 'feed10', title: 'Покормить 10 раз', target: 10, reward: 'feed', reward: { crystals: 30 } },
  { id: 'feed50', title: 'Покормить 50 раз', target: 50, reward: 'feed', reward: { crystals: 150, energy: 20 } },
  { id: 'buy_creature', title: 'Купить существо', target: 1, key: 'buyCreature', reward: { crystals: 100 } },
  { id: 'upgrade_farm', title: 'Улучшить ферму', target: 1, key: 'upgradeFarm', reward: { energy: 30 } },
  { id: 'mini_score', title: 'Набрать 30 очков в мини-игре', target: 30, key: 'miniScore', reward: { crystals: 80, stars: 1 } }
];

const STARS_PACKS = [
  { id: 'pack1', title: 'Горсть кристаллов', desc: '+500 💎', stars: 15, give: { crystals: 500 } },
  { id: 'pack2', title: 'Энергетический набор', desc: '+200 ⚡ +300 💎', stars: 25, give: { energy: 200, crystals: 300 } },
  { id: 'pack3', title: 'Редкое существо', desc: 'Случайный RARE+', stars: 50, give: { randomRare: true } },
  { id: 'pack4', title: 'Легендарный сундук', desc: 'Гарантия LEGENDARY', stars: 150, give: { legendary: true } },
  { id: 'vip', title: 'VIP на 7 дней', desc: 'x1.5 ко всем наградам', stars: 80, give: { vip: 7 } }
];

const DEFAULT = {
  crystals: 50,
  energy: 30,
  stars: 0,
  level: 1,
  xp: 0,
  satiety: 100,
  activeCreature: 'cosmo_chick',
  creatures: { cosmo_chick: { level: 1, count: 1 } },
  farms: { probe: 0, rover: 0, station: 0, colony: 0, megastructure: 0 },
  quests: {},
  stats: { feed: 0, buyCreature: 0, upgradeFarm: 0, miniScore: 0 },
  lastDaily: null,
  lastPassive: Date.now(),
  vipUntil: 0
};

let state = load();

// ---------- STORAGE ----------
function load() {
  try {
    const raw = localStorage.getItem('cosmo_ranch_v1');
    if (raw) {
      const data = { ...DEFAULT, ...JSON.parse(raw) };
      // пассив
      const hours = (Date.now() - (data.lastPassive || Date.now())) / 3600000;
      const inc = calcPassive(data);
      if (hours > 0.01 && inc > 0) data.crystals += Math.floor(hours * inc);
      data.lastPassive = Date.now();
      return data;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT));
}

function save() {
  state.lastPassive = Date.now();
  localStorage.setItem('cosmo_ranch_v1', JSON.stringify(state));
}

// ---------- CALCULATIONS ----------
function getCreature(id) {
  return CREATURES_SHOP.find(c => c.id === id) || CREATURES_SHOP[0];
}

function calcTapIncome() {
  const c = getCreature(state.activeCreature);
  const lvl = state.creatures[state.activeCreature]?.level || 1;
  let inc = c.income * lvl;
  if (Date.now() < state.vipUntil) inc = Math.floor(inc * 1.5);
  return inc;
}

function calcPassive(s = state) {
  let p = 0;
  // от существ
  for (const [id, data] of Object.entries(s.creatures || {})) {
    const c = getCreature(id);
    p += (c.passive || 0) * (data.level || 1) * (data.count || 1);
  }
  // от ферм
  for (const f of FARM_UNITS) {
    const lvl = s.farms[f.id] || 0;
    if (lvl > 0) p += f.income * lvl;
  }
  if (Date.now() < s.vipUntil) p *= 1.5;
  return Math.round(p * 10) / 10;
}

function farmPrice(id) {
  const f = FARM_UNITS.find(x => x.id === id);
  const lvl = state.farms[id] || 0;
  return Math.floor(f.basePrice * Math.pow(1.6, lvl));
}

function xpNeeded(lvl) {
  return 40 + lvl * 25;
}

function addXp(amount) {
  state.xp += amount;
  let leveled = false;
  while (state.xp >= xpNeeded(state.level)) {
    state.xp -= xpNeeded(state.level);
    state.level++;
    state.crystals += 40 * state.level;
    leveled = true;
  }
  if (leveled && tg) {
    tg.showPopup({ title: 'Новый уровень!', message: `Теперь ${state.level} уровень!`, buttons: [{ type: 'ok' }] });
  }
}

// ---------- UI UPDATE ----------
function updateUI() {
  const c = getCreature(state.activeCreature);
  const cData = state.creatures[state.activeCreature] || { level: 1 };

  document.getElementById('crystals').textContent = format(state.crystals);
  document.getElementById('energy').textContent = format(state.energy);
  document.getElementById('stars').textContent = format(state.stars);
  document.getElementById('playerLevel').textContent = state.level;
  document.getElementById('xpText').textContent = `${state.xp}/${xpNeeded(state.level)}`;
  document.getElementById('xpFill').style.width = Math.min(100, (state.xp / xpNeeded(state.level)) * 100) + '%';

  document.getElementById('heroVisual').textContent = c.emoji;
  document.getElementById('heroName').textContent = c.name;
  document.getElementById('heroLvl').textContent = cData.level;
  document.getElementById('heroRarity').textContent = c.rarity;
  document.getElementById('heroRarity').className = 'hero-rarity ' + c.rarity;

  document.getElementById('satietyFill').style.width = state.satiety + '%';
  document.getElementById('satietyText').textContent = Math.floor(state.satiety);

  document.getElementById('incomePerTap').textContent = calcTapIncome();
  document.getElementById('passiveIncome').textContent = calcPassive();
  document.getElementById('ownedCreatures').textContent = Object.values(state.creatures).reduce((a, b) => a + (b.count || 0), 0);

  if (tg?.initDataUnsafe?.user) {
    document.getElementById('playerName').textContent = tg.initDataUnsafe.user.first_name || 'Космонавт';
  }

  renderFarms();
  renderCreatures();
  renderQuests();
  renderStarsShop();
  updateDailyBtn();
}

function format(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

// ---------- FEED ----------
function feed() {
  if (state.satiety < 5) {
    showFloat('Слишком голоден! Подожди', false);
    return;
  }
  const income = calcTapIncome();
  const crit = Math.random() < 0.12;
  const mult = crit ? [2, 2, 3, 3, 4][Math.floor(Math.random() * 5)] : 1;
  const gained = income * mult;

  state.crystals += gained;
  state.satiety = Math.max(0, state.satiety - 4);
  state.stats.feed = (state.stats.feed || 0) + 1;
  addXp(1);

  // visual
  const vis = document.getElementById('heroVisual');
  vis.classList.remove('pulse');
  void vis.offsetWidth;
  vis.classList.add('pulse');

  showFloat((crit ? '💥 ' : '+') + format(gained) + ' 💎', crit);
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(crit ? 'medium' : 'light');

  save();
  updateUI();
}

function showFloat(text, isCrit) {
  const el = document.getElementById('floatText');
  el.textContent = text;
  el.className = 'float-text show' + (isCrit ? ' crit' : '');
  setTimeout(() => el.className = 'float-text', 900);
}

// ---------- FARMS ----------
function renderFarms() {
  const list = document.getElementById('farmList');
  list.innerHTML = '';
  FARM_UNITS.forEach(f => {
    const lvl = state.farms[f.id] || 0;
    const price = farmPrice(f.id);
    const can = state.crystals >= price;
    const div = document.createElement('div');
    div.className = 'farm-card';
    div.innerHTML = `
      <div class="farm-icon">${f.emoji}</div>
      <div class="farm-info">
        <div class="farm-name">${f.name}</div>
        <div class="farm-desc">${f.desc} · +${f.income}/ч за уровень</div>
        <div class="farm-lvl">Уровень: ${lvl}</div>
      </div>
      <button class="farm-btn" ${can ? '' : 'disabled'} data-id="${f.id}">
        ${lvl === 0 ? 'Купить' : 'Улучшить'} ${format(price)}💎
      </button>
    `;
    list.appendChild(div);
  });
  list.querySelectorAll('.farm-btn').forEach(btn => {
    btn.onclick = () => buyFarm(btn.dataset.id);
  });
}

function buyFarm(id) {
  const price = farmPrice(id);
  if (state.crystals < price) return;
  state.crystals -= price;
  state.farms[id] = (state.farms[id] || 0) + 1;
  state.stats.upgradeFarm = (state.stats.upgradeFarm || 0) + 1;
  addXp(3);
  save();
  updateUI();
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// ---------- CREATURES ----------
function renderCreatures() {
  const box = document.getElementById('creaturesContent');
  const tab = document.querySelector('.tab.active')?.dataset.tab || 'my';

  if (tab === 'my') {
    let html = '<div class="creature-grid">';
    for (const [id, data] of Object.entries(state.creatures)) {
      if (!data.count) continue;
      const c = getCreature(id);
      html += `
        <div class="creature-card">
          <div class="emoji">${c.emoji}</div>
          <div class="cname">${c.name}</div>
          <div class="crarity ${c.rarity}">${c.rarity} · LVL ${data.level}</div>
          <button class="cbtn" data-set="${id}">Выбрать</button>
          <button class="cbtn sell" data-sell="${id}">Продать 50%</button>
        </div>`;
    }
    html += '</div>';
    box.innerHTML = html || '<p style="text-align:center;color:#8b8ba7">Пока нет существ</p>';
  } else {
    let html = '<div class="creature-grid">';
    CREATURES_SHOP.forEach(c => {
      if (c.price === 0) return;
      const can = state.crystals >= c.price;
      html += `
        <div class="creature-card">
          <div class="emoji">${c.emoji}</div>
          <div class="cname">${c.name}</div>
          <div class="crarity ${c.rarity}">${c.rarity}</div>
          <button class="cbtn" ${can ? '' : 'disabled'} data-buy="${c.id}">${format(c.price)} 💎</button>
        </div>`;
    });
    html += '</div>';
    box.innerHTML = html;
  }

  box.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    state.activeCreature = b.dataset.set;
    save(); updateUI();
  });
  box.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => sellCreature(b.dataset.sell));
  box.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => buyCreature(b.dataset.buy));
}

function buyCreature(id) {
  const c = getCreature(id);
  if (state.crystals < c.price) return;
  state.crystals -= c.price;
  if (!state.creatures[id]) state.creatures[id] = { level: 1, count: 0 };
  state.creatures[id].count++;
  state.stats.buyCreature = (state.stats.buyCreature || 0) + 1;
  addXp(5);
  save();
  updateUI();
}

function sellCreature(id) {
  const data = state.creatures[id];
  if (!data || data.count <= 0) return;
  if (id === 'cosmo_chick' && data.count <= 1) {
    showFloat('Нельзя продать последнего стартового', false);
    return;
  }
  const c = getCreature(id);
  const refund = Math.floor(c.price * 0.5) || 20;
  state.crystals += refund;
  data.count--;
  if (data.count <= 0) {
    delete state.creatures[id];
    if (state.activeCreature === id) state.activeCreature = 'cosmo_chick';
  }
  save();
  updateUI();
  showFloat('+' + format(refund) + ' 💎', false);
}

// ---------- QUESTS & DAILY ----------
function canClaimDaily() {
  if (!state.lastDaily) return true;
  return Date.now() - state.lastDaily > 20 * 3600 * 1000;
}

function updateDailyBtn() {
  const btn = document.getElementById('claimDaily');
  if (canClaimDaily()) {
    btn.disabled = false;
    btn.textContent = 'Забрать';
  } else {
    btn.disabled = true;
    btn.textContent = 'Уже получено';
  }
}

function claimDaily() {
  if (!canClaimDaily()) return;
  let cr = 50 + state.level * 10;
  let en = 15;
  if (Date.now() < state.vipUntil) { cr = Math.floor(cr * 1.5); en = Math.floor(en * 1.5); }
  state.crystals += cr;
  state.energy += en;
  state.lastDaily = Date.now();
  save();
  updateUI();
  showFloat(`+${cr} 💎 +${en} ⚡`, false);
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function renderQuests() {
  const list = document.getElementById('questList');
  list.innerHTML = '';
  QUESTS.forEach(q => {
    const progress = state.stats[q.key] || 0;
    const done = state.quests[q.id];
    const canClaim = !done && progress >= q.target;
    const div = document.createElement('div');
    div.className = 'quest-card';
    div.innerHTML = `
      <div class="quest-info">
        <b>${q.title}</b>
        <span>${Math.min(progress, q.target)} / ${q.target}</span>
      </div>
      <button class="quest-btn" ${canClaim ? '' : 'disabled'} data-q="${q.id}">
        ${done ? '✓' : canClaim ? 'Забрать' : '...'}
      </button>
    `;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-q]').forEach(b => {
    b.onclick = () => claimQuest(b.dataset.q);
  });
}

function claimQuest(id) {
  const q = QUESTS.find(x => x.id === id);
  if (!q || state.quests[id]) return;
  if ((state.stats[q.key] || 0) < q.target) return;
  state.quests[id] = true;
  if (q.reward.crystals) state.crystals += q.reward.crystals;
  if (q.reward.energy) state.energy += q.reward.energy;
  if (q.reward.stars) state.stars += q.reward.stars;
  save();
  updateUI();
  showFloat('Награда получена!', false);
}

// ---------- STARS SHOP ----------
function renderStarsShop() {
  const box = document.getElementById('starsShop');
  box.innerHTML = '';
  STARS_PACKS.forEach(p => {
    const div = document.createElement('div');
    div.className = 'star-item';
    div.innerHTML = `
      <div class="left">
        <b>${p.title}</b>
        <span>${p.desc}</span>
      </div>
      <button class="star-buy" data-pack="${p.id}">${p.stars} ⭐</button>
    `;
    box.appendChild(div);
  });
  box.querySelectorAll('[data-pack]').forEach(b => {
    b.onclick = () => buyStarsPack(b.dataset.pack);
  });
}

function buyStarsPack(id) {
  // В реальном проекте здесь вызов Telegram Payments / Stars
  // Пока эмуляция для теста
  const pack = STARS_PACKS.find(p => p.id === id);
  if (!pack) return;

  if (tg) {
    tg.showPopup({
      title: 'Покупка за Stars',
      message: `Для реальных покупок нужно подключить Telegram Stars в боте.\n\nСейчас это демо: получить «${pack.title}» бесплатно?`,
      buttons: [
        { id: 'demo', type: 'default', text: 'Демо-получить' },
        { type: 'cancel' }
      ]
    }, (btn) => {
      if (btn === 'demo') {
        applyPack(pack);
      }
    });
  } else {
    applyPack(pack);
  }
}

function applyPack(pack) {
  if (pack.give.crystals) state.crystals += pack.give.crystals;
  if (pack.give.energy) state.energy += pack.give.energy;
  if (pack.give.vip) state.vipUntil = Date.now() + pack.give.vip * 86400000;
  if (pack.give.randomRare) {
    const rares = CREATURES_SHOP.filter(c => c.rarity === 'RARE' || c.rarity === 'EPIC');
    const c = rares[Math.floor(Math.random() * rares.length)];
    if (!state.creatures[c.id]) state.creatures[c.id] = { level: 1, count: 0 };
    state.creatures[c.id].count++;
  }
  if (pack.give.legendary) {
    const c = CREATURES_SHOP.find(x => x.rarity === 'LEGENDARY');
    if (!state.creatures[c.id]) state.creatures[c.id] = { level: 1, count: 0 };
    state.creatures[c.id].count++;
  }
  save();
  updateUI();
  showFloat('Пакет получен!', false);
}

// ---------- MINI-GAME (simple asteroid tap) ----------
let miniRunning = false;
let miniScore = 0;
let miniTimer = null;
let asteroids = [];

function startMini() {
  if (miniRunning) return;
  miniRunning = true;
  miniScore = 0;
  asteroids = [];
  document.getElementById('miniScore').textContent = '0';
  document.getElementById('startMini').style.display = 'none';

  const canvas = document.getElementById('miniCanvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  function spawn() {
    asteroids.push({
      x: 30 + Math.random() * (W - 60),
      y: -20,
      r: 18 + Math.random() * 16,
      speed: 1.5 + Math.random() * 2.5,
      alive: true
    });
  }

  let lastSpawn = 0;
  function loop(t) {
    if (!miniRunning) return;
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    // stars bg
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 30; i++) {
      ctx.fillRect((i * 47) % W, (i * 73) % H, 1.5, 1.5);
    }

    if (t - lastSpawn > 600) {
      spawn();
      lastSpawn = t;
    }

    asteroids.forEach(a => {
      if (!a.alive) return;
      a.y += a.speed;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fillStyle = '#7b5cff';
      ctx.fill();
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2;
      ctx.stroke();
      if (a.y > H + 30) a.alive = false;
    });

    asteroids = asteroids.filter(a => a.alive);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // end after 20 sec
  setTimeout(() => {
    miniRunning = false;
    document.getElementById('startMini').style.display = 'block';
    state.stats.miniScore = Math.max(state.stats.miniScore || 0, miniScore);
    const reward = Math.floor(miniScore * 1.5);
    state.crystals += reward;
    save();
    updateUI();
    showFloat(`+${reward} 💎 за игру`, false);
  }, 20000);
}

document.getElementById('miniCanvas').addEventListener('click', (e) => {
  if (!miniRunning) return;
  const rect = e.target.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (e.target.width / rect.width);
  const y = (e.clientY - rect.top) * (e.target.height / rect.height);

  asteroids.forEach(a => {
    if (!a.alive) return;
    const dx = a.x - x;
    const dy = a.y - y;
    if (dx * dx + dy * dy < a.r * a.r * 1.4) {
      a.alive = false;
      miniScore += 1;
      document.getElementById('miniScore').textContent = miniScore;
      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    }
  });
});

// ---------- NAVIGATION ----------
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + btn.dataset.screen).classList.add('active');
  });
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderCreatures();
  });
});

document.getElementById('feedBtn').addEventListener('click', feed);
document.getElementById('claimDaily').addEventListener('click', claimDaily);
document.getElementById('startMini').addEventListener('click', startMini);

// satiety recovery
setInterval(() => {
  if (state.satiety < 100) {
    state.satiety = Math.min(100, state.satiety + 1.5);
    save();
    updateUI();
  }
}, 8000);

// init
updateUI();
