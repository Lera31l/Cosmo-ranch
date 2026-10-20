// =====================================================
// COSMO RANCH v2 — улучшенные нажатия, энергия, разведение,
// больше персонажей, разные валюты, фермы, игроки (демо)
// =====================================================

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready(); tg.expand();
  tg.setHeaderColor('#0a0a12');
  tg.setBackgroundColor('#0a0a12');
}

const CREATURES = [
  { id:'chick',   name:'Космо-Цып',   emoji:'🐣', rarity:'COMMON',    price:0,    tap:1,  passive:0.2, farm:'dust' },
  { id:'fox',     name:'Космо-Лис',   emoji:'🦊', rarity:'COMMON',    price:150,  tap:2,  passive:0.5, farm:'dust' },
  { id:'cat',     name:'Туманный Кот',emoji:'😺', rarity:'RARE',      price:450,  tap:4,  passive:1.2, farm:'crystal' },
  { id:'wolf',    name:'Астро-Волк',  emoji:'🐺', rarity:'RARE',      price:900,  tap:7,  passive:2.0, farm:'crystal' },
  { id:'owl',     name:'Звёздная Сова',emoji:'🦉',rarity:'RARE',      price:1100, tap:6,  passive:2.5, farm:'energy' },
  { id:'dragon',  name:'Дракон Пустоты',emoji:'🐲',rarity:'EPIC',     price:2800, tap:15, passive:5,   farm:'crystal' },
  { id:'phoenix', name:'Звёздный Феникс',emoji:'🔥',rarity:'LEGENDARY',price:9000, tap:40, passive:12,  farm:'all' },
  { id:'alien',   name:'Пришелец X',  emoji:'👽', rarity:'EPIC',      price:3200, tap:12, passive:6,   farm:'energy' },
  { id:'robot',   name:'Космо-Бот',   emoji:'🤖', rarity:'RARE',      price:700,  tap:5,  passive:1.8, farm:'dust' },
  { id:'unicorn', name:'Космо-Единорог',emoji:'🦄',rarity:'LEGENDARY',price:12000,tap:55, passive:18,  farm:'all' }
];

const FARMS = [
  { id:'probe',  name:'Зонд-сборщик',   emoji:'📡', price:60,   type:'dust',     income:3,  desc:'Добывает пыль' },
  { id:'drill',  name:'Кристалл-бур',   emoji:'⛏️', price:250,  type:'crystal',  income:6,  desc:'Добывает кристаллы' },
  { id:'solar',  name:'Солнечная панель',emoji:'☀️', price:400,  type:'energy',   income:4,  desc:'Добывает энергию' },
  { id:'station',name:'Орбитальная станция',emoji:'🏭',price:1200, type:'crystal', income:18, desc:'Большая добыча' },
  { id:'reactor',name:'Реактор',        emoji:'⚛️', price:3500, type:'energy',   income:15, desc:'Много энергии' },
  { id:'mega',   name:'Мегаструктура',  emoji:'🪐', price:15000,type:'all',      income:50, desc:'Всё сразу' }
];

const QUESTS = [
  { id:'t10',  title:'Покормить 10 раз',     key:'taps',   target:10,  rew:{c1:40} },
  { id:'t50',  title:'Покормить 50 раз',     key:'taps',   target:50,  rew:{c1:200,c2:30} },
  { id:'buy1', title:'Купить существо',      key:'buys',   target:1,   rew:{c1:120} },
  { id:'up1',  title:'Улучшить ферму',       key:'farms',  target:1,   rew:{c3:25} },
  { id:'br1',  title:'Развести существо',    key:'breeds', target:1,   rew:{c1:250,c2:50} }
];

const STAR_PACKS = [
  { id:'p1', title:'Кристаллы', desc:'+600 💎', cost:15, give:{c1:600} },
  { id:'p2', title:'Энергия+', desc:'+150 ⚡ +200 ✨', cost:20, give:{c3:150,c2:200} },
  { id:'p3', title:'Редкий пак', desc:'Случайный RARE+', cost:45, give:{rare:true} },
  { id:'p4', title:'Легендарный', desc:'Гарантия LEGENDARY', cost:120, give:{legend:true} }
];

// демо-игроки
const FAKE_PLAYERS = [
  { name:'StarLord', score:15420 },
  { name:'NebulaFox', score:12800 },
  { name:'VoidHunter', score:9750 },
  { name:'CosmoKitty', score:8340 },
  { name:'AstroWolf', score:7100 },
  { name:'PixelDuck', score:6200 },
  { name:'GalaxyMiner', score:5400 },
  { name:'Ты', score:0, you:true }
];

const DEF = {
  c1:80, c2:20, c3:40, c4:0, // crystals, dust, energy, stars
  lvl:1, xp:0,
  sat:100,            // сытость 0-100
  active:'chick',
  creatures:{ chick:{lvl:1, cnt:1} },
  farms:{},
  quests:{},
  stats:{ taps:0, buys:0, farms:0, breeds:0 },
  lastDaily:null,
  lastTick:Date.now(),
  lastEnergy:Date.now()
};

let S = load();

function load() {
  try {
    const r = localStorage.getItem('cosmo_v2');
    if (r) {
      const d = { ...DEF, ...JSON.parse(r) };
      // пассив
      const h = (Date.now() - (d.lastTick||Date.now())) / 3600000;
      applyPassive(d, h);
      d.lastTick = Date.now();
      // энергия реген
      regenEnergy(d);
      return d;
    }
  } catch(e){}
  return JSON.parse(JSON.stringify(DEF));
}
function save(){ S.lastTick = Date.now(); localStorage.setItem('cosmo_v2', JSON.stringify(S)); }

function getC(id){ return CREATURES.find(x=>x.id===id) || CREATURES[0]; }

function applyPassive(st, hours) {
  if (hours < 0.01) return;
  let dust=0, crystal=0, energy=0;
  // фермы
  for (const f of FARMS) {
    const lv = st.farms[f.id]||0;
    if (!lv) continue;
    const inc = f.income * lv * hours;
    if (f.type==='dust' || f.type==='all') dust += inc;
    if (f.type==='crystal' || f.type==='all') crystal += inc;
    if (f.type==='energy' || f.type==='all') energy += inc;
  }
  // существа
  for (const [id,d] of Object.entries(st.creatures||{})) {
    const c = getC(id);
    const p = (c.passive||0) * (d.lvl||1) * (d.cnt||1) * hours;
    if (c.farm==='dust' || c.farm==='all') dust += p;
    if (c.farm==='crystal' || c.farm==='all') crystal += p;
    if (c.farm==='energy' || c.farm==='all') energy += p;
  }
  st.c1 += Math.floor(crystal);
  st.c2 += Math.floor(dust);
  st.c3 += Math.floor(energy);
}

function regenEnergy(st) {
  const mins = (Date.now() - (st.lastEnergy||Date.now())) / 60000;
  const add = Math.floor(mins / 2); // +1 энергия каждые 2 мин
  if (add > 0) {
    st.c3 = Math.min(100, st.c3 + add);
    st.lastEnergy = Date.now();
  }
}

function tapIncome() {
  const c = getC(S.active);
  const lv = S.creatures[S.active]?.lvl || 1;
  return c.tap * lv;
}

function farmPrice(id) {
  const f = FARMS.find(x=>x.id===id);
  const lv = S.farms[id]||0;
  return Math.floor(f.price * Math.pow(1.55, lv));
}

function xpNeed(l){ return 35 + l*20; }

function addXp(n) {
  S.xp += n;
  while (S.xp >= xpNeed(S.lvl)) {
    S.xp -= xpNeed(S.lvl);
    S.lvl++;
    S.c1 += 30 * S.lvl;
    if (tg) tg.showPopup({title:'Уровень '+S.lvl+'!', message:'Награда получена', buttons:[{type:'ok'}]});
  }
}

// ---------- UI ----------
function ui() {
  regenEnergy(S);
  document.getElementById('c1').textContent = fmt(S.c1);
  document.getElementById('c2').textContent = fmt(S.c2);
  document.getElementById('c3').textContent = fmt(S.c3);
  document.getElementById('c4').textContent = fmt(S.c4);
  document.getElementById('plvl').textContent = S.lvl;
  document.getElementById('xpbar').style.width = Math.min(100, S.xp/xpNeed(S.lvl)*100)+'%';

  const c = getC(S.active);
  const cd = S.creatures[S.active] || {lvl:1};
  document.getElementById('hemoji').textContent = c.emoji;
  document.getElementById('hname').textContent = c.name;
  document.getElementById('hlvl').textContent = cd.lvl;
  document.getElementById('hincome').textContent = '+'+tapIncome();
  document.getElementById('rtag').textContent = c.rarity;
  document.getElementById('rtag').className = 'rarity-tag '+c.rarity;

  document.getElementById('satFill').style.width = S.sat+'%';
  document.getElementById('satVal').textContent = Math.floor(S.sat)+'%';
  document.getElementById('enFill').style.width = Math.min(100, S.c3)+'%';
  document.getElementById('enVal').textContent = Math.floor(S.c3);

  document.getElementById('pass').textContent = calcPass().toFixed(1);
  document.getElementById('own').textContent = Object.values(S.creatures).reduce((a,b)=>a+(b.cnt||0),0);
  document.getElementById('farmP').textContent = Object.values(S.farms).reduce((a,b)=>a+(b||0),0);

  if (tg?.initDataUnsafe?.user) document.getElementById('nick').textContent = tg.initDataUnsafe.user.first_name||'Космонавт';

  renderCreatures();
  renderFarms();
  renderQuests();
  renderPlayers();
  renderStars();
  updateDaily();
}

function fmt(n) {
  if (n>=1e6) return (n/1e6).toFixed(1)+'M';
  if (n>=1e3) return (n/1e3).toFixed(1)+'K';
  return Math.floor(n)+'';
}

function calcPass() {
  let p=0;
  for (const [id,d] of Object.entries(S.creatures)) {
    const c=getC(id); p += (c.passive||0)*(d.lvl||1)*(d.cnt||1);
  }
  for (const f of FARMS) {
    const lv=S.farms[f.id]||0; if(lv) p += f.income*lv*0.3;
  }
  return p;
}

// ---------- TAP (улучшенный) ----------
function doTap() {
  if (S.c3 < 1) { float('Нет энергии ⚡', false); return; }
  if (S.sat < 8) { float('Существо голодно', false); return; }

  const base = tapIncome();
  const crit = Math.random() < 0.15;
  const mult = crit ? [2,2,3,3,4,5][Math.floor(Math.random()*6)] : 1;
  const gain = base * mult;

  // валюта зависит от типа существа
  const c = getC(S.active);
  if (c.farm==='dust' || c.farm==='all') S.c2 += Math.floor(gain*0.4);
  if (c.farm==='crystal' || c.farm==='all' || c.farm==='dust') S.c1 += gain;
  if (c.farm==='energy') S.c3 += Math.floor(gain*0.3);

  S.c3 -= 1;
  S.sat = Math.max(0, S.sat - 3.5);
  S.stats.taps = (S.stats.taps||0)+1;
  addXp(1);

  // визуал
  const em = document.getElementById('hemoji');
  em.classList.remove('hit'); void em.offsetWidth; em.classList.add('hit');
  spawnParticles(c.emoji);
  float((crit?'💥 ':'') + '+'+fmt(gain)+' 💎', crit);

  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(crit?'medium':'light');

  save(); ui();
}

function spawnParticles(emoji) {
  const box = document.getElementById('particles');
  for (let i=0;i<6;i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emoji;
    const x = 40 + Math.random()*20;
    const y = 35 + Math.random()*10;
    p.style.left = x+'%';
    p.style.top = y+'%';
    p.style.setProperty('--tx', (Math.random()*120-60)+'px');
    p.style.setProperty('--ty', (-80-Math.random()*60)+'px');
    box.appendChild(p);
    setTimeout(()=>p.remove(), 700);
  }
}

function float(t, crit) {
  const el = document.getElementById('float');
  el.textContent = t;
  el.className = 'float show'+(crit?' crit':'');
  setTimeout(()=>el.className='float', 850);
}

// ---------- CREATURES ----------
function renderCreatures() {
  const box = document.getElementById('creaturesBox');
  const tab = document.querySelector('.tab.on')?.dataset.t || 'my';

  if (tab==='my') {
    let h = '<div class="grid">';
    for (const [id,d] of Object.entries(S.creatures)) {
      if (!d.cnt) continue;
      const c = getC(id);
      h += `<div class="card">
        <div class="em">${c.emoji}</div>
        <div class="nm">${c.name}</div>
        <div class="meta">${c.rarity} · LVL ${d.lvl} · x${d.cnt}</div>
        <div class="btns">
          <button class="b1" data-set="${id}">Выбрать</button>
          <button class="b1" data-up="${id}">Прокачать ${50*d.lvl}💎</button>
          <button class="b2" data-sell="${id}">Продать</button>
        </div>
      </div>`;
    }
    h += '</div>';
    box.innerHTML = h || '<p style="text-align:center;color:#8a8aa8">Пусто</p>';
  } else if (tab==='shop') {
    let h = '<div class="grid">';
    CREATURES.filter(c=>c.price>0).forEach(c=>{
      const can = S.c1 >= c.price;
      h += `<div class="card">
        <div class="em">${c.emoji}</div>
        <div class="nm">${c.name}</div>
        <div class="meta">${c.rarity} · +${c.tap}/корм</div>
        <div class="btns"><button class="b1" ${can?'':'disabled'} data-buy="${c.id}">${fmt(c.price)} 💎</button></div>
      </div>`;
    });
    h += '</div>';
    box.innerHTML = h;
  } else { // breed
    box.innerHTML = `<p class="sub">Выбери двух одинаковых существ (минимум 2 шт) чтобы получить более редкое</p>
      <div class="grid" id="breedGrid"></div>`;
    const g = document.getElementById('breedGrid');
    for (const [id,d] of Object.entries(S.creatures)) {
      if ((d.cnt||0) < 2) continue;
      const c = getC(id);
      const btn = document.createElement('div');
      btn.className = 'card';
      btn.innerHTML = `<div class="em">${c.emoji}</div><div class="nm">${c.name}</div>
        <div class="meta">x${d.cnt}</div>
        <div class="btns"><button class="b1" data-breed="${id}">Развести</button></div>`;
      g.appendChild(btn);
    }
    if (!g.children.length) g.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#8a8aa8">Нужно минимум 2 одинаковых существа</p>';
  }

  box.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{ S.active=b.dataset.set; save(); ui(); });
  box.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>upgradeCreature(b.dataset.up));
  box.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>sellCreature(b.dataset.sell));
  box.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyCreature(b.dataset.buy));
  box.querySelectorAll('[data-breed]').forEach(b=>b.onclick=()=>breed(b.dataset.breed));
}

function buyCreature(id) {
  const c = getC(id);
  if (S.c1 < c.price) return;
  S.c1 -= c.price;
  if (!S.creatures[id]) S.creatures[id] = {lvl:1, cnt:0};
  S.creatures[id].cnt++;
  S.stats.buys = (S.stats.buys||0)+1;
  addXp(4); save(); ui();
  float('Новое существо!', false);
}

function upgradeCreature(id) {
  const d = S.creatures[id];
  if (!d) return;
  const cost = 50 * d.lvl;
  if (S.c1 < cost) { float('Мало кристаллов', false); return; }
  S.c1 -= cost;
  d.lvl++;
  addXp(3); save(); ui();
  float('LVL '+d.lvl+'!', false);
}

function sellCreature(id) {
  const d = S.creatures[id];
  if (!d || d.cnt<=0) return;
  if (id==='chick' && d.cnt<=1) { float('Нельзя продать последнего', false); return; }
  const c = getC(id);
  const ref = Math.floor((c.price||40)*0.45);
  S.c1 += ref; d.cnt--;
  if (d.cnt<=0) { delete S.creatures[id]; if(S.active===id) S.active='chick'; }
  save(); ui(); float('+'+fmt(ref)+' 💎', false);
}

function breed(id) {
  const d = S.creatures[id];
  if (!d || d.cnt < 2) return;
  d.cnt -= 2;
  if (d.cnt<=0) delete S.creatures[id];

  // шанс на более редкого
  const pool = CREATURES.filter(c => {
    const order = {COMMON:0,RARE:1,EPIC:2,LEGENDARY:3};
    return order[c.rarity] >= order[getC(id).rarity];
  });
  const neu = pool[Math.floor(Math.random()*pool.length)];
  if (!S.creatures[neu.id]) S.creatures[neu.id] = {lvl:1, cnt:0};
  S.creatures[neu.id].cnt++;
  S.stats.breeds = (S.stats.breeds||0)+1;
  addXp(8); save(); ui();
  float('Получен '+neu.name+'!', true);
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// ---------- FARMS ----------
function renderFarms() {
  const box = document.getElementById('farmBox');
  box.innerHTML = '<div class="flist"></div>';
  const list = box.querySelector('.flist');
  FARMS.forEach(f=>{
    const lv = S.farms[f.id]||0;
    const pr = farmPrice(f.id);
    const can = S.c1 >= pr;
    const div = document.createElement('div');
    div.className = 'fcard';
    div.innerHTML = `
      <div class="ico">${f.emoji}</div>
      <div class="inf">
        <div class="fn">${f.name}</div>
        <div class="fd">${f.desc} · +${f.income}/ч</div>
        <div class="fl">Ур. ${lv}</div>
      </div>
      <button ${can?'':'disabled'} data-f="${f.id}">${lv?'Улучшить':'Купить'} ${fmt(pr)}💎</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>buyFarm(b.dataset.f));
}

function buyFarm(id) {
  const pr = farmPrice(id);
  if (S.c1 < pr) return;
  S.c1 -= pr;
  S.farms[id] = (S.farms[id]||0)+1;
  S.stats.farms = (S.stats.farms||0)+1;
  addXp(3); save(); ui();
}

// ---------- QUESTS + DAILY ----------
function canDaily(){ return !S.lastDaily || Date.now()-S.lastDaily > 20*3600*1000; }
function updateDaily(){
  const b = document.getElementById('claimD');
  b.disabled = !canDaily();
  b.textContent = canDaily() ? 'Забрать' : 'Уже получено';
}
function claimDaily(){
  if (!canDaily()) return;
  S.c1 += 80 + S.lvl*8;
  S.c3 += 25;
  S.c2 += 15;
  S.lastDaily = Date.now();
  save(); ui(); float('Ежедневка получена!', false);
}

function renderQuests(){
  const box = document.getElementById('questBox');
  box.innerHTML = '<div class="qlist"></div>';
  const list = box.querySelector('.qlist');
  QUESTS.forEach(q=>{
    const prog = S.stats[q.key]||0;
    const done = S.quests[q.id];
    const can = !done && prog >= q.target;
    const div = document.createElement('div');
    div.className = 'qcard';
    div.innerHTML = `<div><b>${q.title}</b><span>${Math.min(prog,q.target)}/${q.target}</span></div>
      <button ${can?'':'disabled'} data-q="${q.id}">${done?'✓':can?'Забрать':'...'}</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>claimQuest(b.dataset.q));
}

function claimQuest(id){
  const q = QUESTS.find(x=>x.id===id);
  if (!q || S.quests[id] || (S.stats[q.key]||0) < q.target) return;
  S.quests[id] = true;
  if (q.rew.c1) S.c1 += q.rew.c1;
  if (q.rew.c2) S.c2 += q.rew.c2;
  if (q.rew.c3) S.c3 += q.rew.c3;
  save(); ui(); float('Награда!', false);
}

// ---------- PLAYERS (демо) ----------
function renderPlayers(){
  const box = document.getElementById('playersBox');
  // обновляем "тебя"
  FAKE_PLAYERS.find(p=>p.you).score = Math.floor(S.c1 + S.stats.taps*2);
  const sorted = [...FAKE_PLAYERS].sort((a,b)=>b.score-a.score);
  box.innerHTML = '<div class="plist"></div>';
  const list = box.querySelector('.plist');
  sorted.forEach((p,i)=>{
    const div = document.createElement('div');
    div.className = 'pcard';
    div.innerHTML = `<div class="pn">${i+1}. ${p.name}${p.you?' (ты)':''}</div><div class="ps">${fmt(p.score)}</div>`;
    if (p.you) div.style.border = '1px solid rgba(0,229,255,.35)';
    list.appendChild(div);
  });
}

// ---------- STARS ----------
function renderStars(){
  const box = document.getElementById('starsBox');
  box.innerHTML = '<div class="slist"></div>';
  const list = box.querySelector('.slist');
  STAR_PACKS.forEach(p=>{
    const div = document.createElement('div');
    div.className = 'scard';
    div.innerHTML = `<div><b>${p.title}</b><span>${p.desc}</span></div>
      <button data-p="${p.id}">${p.cost} ⭐</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>buyPack(b.dataset.p));
}

function buyPack(id){
  const p = STAR_PACKS.find(x=>x.id===id);
  if (!p) return;
  if (tg) {
    tg.showPopup({
      title:'Покупка за Stars',
      message:'Для реальных Stars нужна настройка бота.\nДемо-получить пакет?',
      buttons:[{id:'ok',type:'default',text:'Демо'},{type:'cancel'}]
    }, btn=>{ if(btn==='ok') applyPack(p); });
  } else applyPack(p);
}

function applyPack(p){
  if (p.give.c1) S.c1 += p.give.c1;
  if (p.give.c2) S.c2 += p.give.c2;
  if (p.give.c3) S.c3 += p.give.c3;
  if (p.give.rare) {
    const r = CREATURES.filter(c=>c.rarity==='RARE'||c.rarity==='EPIC');
    const c = r[Math.floor(Math.random()*r.length)];
    if (!S.creatures[c.id]) S.creatures[c.id]={lvl:1,cnt:0};
    S.creatures[c.id].cnt++;
  }
  if (p.give.legend) {
    const c = CREATURES.find(x=>x.rarity==='LEGENDARY');
    if (!S.creatures[c.id]) S.creatures[c.id]={lvl:1,cnt:0};
    S.creatures[c.id].cnt++;
  }
  save(); ui(); float('Пакет получен!', true);
}

// ---------- NAV ----------
document.querySelectorAll('.ni').forEach(b=>{
  b.onclick = ()=>{
    document.querySelectorAll('.ni').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    document.querySelectorAll('.sc').forEach(s=>s.classList.remove('active'));
    document.getElementById('sc-'+b.dataset.s).classList.add('active');
  };
});
document.querySelectorAll('.tab').forEach(t=>{
  t.onclick = ()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));
    t.classList.add('on');
    renderCreatures();
  };
});

document.getElementById('tapBtn').onclick = doTap;
document.getElementById('claimD').onclick = claimDaily;

// реген сытости и энергии
setInterval(()=>{
  let ch=false;
  if (S.sat < 100) { S.sat = Math.min(100, S.sat+1.2); ch=true; }
  regenEnergy(S); ch=true;
  if (ch) { save(); ui(); }
}, 10000);

ui();
