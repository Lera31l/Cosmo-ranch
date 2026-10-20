// =====================================================
// COSMO FARM — стиль близкий к MyDuck / Hamster
// Сытость РАСТЁТ при кормлении
// Локации меняют фон
// Роботы + снаряжение
// =====================================================

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready(); tg.expand();
  tg.setHeaderColor('#07070f');
  tg.setBackgroundColor('#07070f');
}

const ROBOTS = [
  { id:'bot1', name:'Робот-помощник', emoji:'🤖', rarity:'COMMON',    price:0,    income:2,  passive:0.3 },
  { id:'bot2', name:'Дрон-сборщик',   emoji:'🛸', rarity:'COMMON',    price:180,  income:3,  passive:0.6 },
  { id:'bot3', name:'Майнер X',       emoji:'⛏️', rarity:'RARE',      price:500,  income:6,  passive:1.5 },
  { id:'bot4', name:'Страж орбиты',   emoji:'🛡️', rarity:'RARE',      price:900,  income:8,  passive:2.0 },
  { id:'bot5', name:'Кибер-лис',      emoji:'🦊', rarity:'RARE',      price:1100, income:7,  passive:2.2 },
  { id:'bot6', name:'Пустотный танк', emoji:'Panzer', rarity:'EPIC',  price:2800, income:16, passive:5 },
  { id:'bot7', name:'Звёздный страж', emoji:'⭐', rarity:'EPIC',      price:3500, income:18, passive:6 },
  { id:'bot8', name:'Феникс-бот',     emoji:'🔥', rarity:'LEGENDARY', price:9000, income:45, passive:14 },
  { id:'bot9', name:'Альфа-юнит',     emoji:'👾', rarity:'LEGENDARY', price:12000,income:55, passive:18 }
];
// fix panzer emoji
ROBOTS[5].emoji = '🛡️';

const LOCS = [
  { id:0, name:'🚀 Стартовая площадка',  cost:0,     bonus:1.0,  cls:'loc1', desc:'Базовая локация' },
  { id:1, name:'🌑 Лунная база',         cost:400,   bonus:1.25, cls:'loc2', desc:'+25% ко всей добыче' },
  { id:2, name:'🔴 Марсианский купол',   cost:1500,  bonus:1.5,  cls:'loc3', desc:'+50% добыча' },
  { id:3, name:'💫 Пояс астероидов',     cost:5000,  bonus:2.0,  cls:'loc4', desc:'x2 добыча' },
  { id:4, name:'🌌 Туманность',          cost:15000, bonus:3.0,  cls:'loc5', desc:'x3 добыча' }
];

const GEAR = [
  { id:'chip',  name:'Чип ИИ',     emoji:'💾', slot:'head',  bonus:0.15, cost:{cr:200, mt:50} },
  { id:'armor', name:'Броня',      emoji:'🛡️', slot:'body',  bonus:0.20, cost:{cr:350, mt:80} },
  { id:'laser', name:'Лазер',      emoji:'🔫', slot:'weapon',bonus:0.25, cost:{cr:500, mt:100} },
  { id:'boots', name:'Ускорители', emoji:'👟', slot:'legs',  bonus:0.10, cost:{cr:150, mt:40} },
  { id:'core',  name:'Ядро',       emoji:'⚛️', slot:'core',  bonus:0.35, cost:{cr:1200,mt:200} }
];

const SUPPLIES = [
  { id:'food',  name:'Космический корм',  desc:'+40 сытости',           cost:{cr:30},   give:{sat:40} },
  { id:'batt',  name:'Батарея',           desc:'+25 энергии',           cost:{mt:20},   give:{en:25} },
  { id:'kit',   name:'Ремкомплект',       desc:'+15% пассив на 1ч',     cost:{cr:100},  give:{boost:1} },
  { id:'dust',  name:'Звёздная пыль',     desc:'+50 🔩',                cost:{cr:80},   give:{mt:50} },
  { id:'xp',    name:'Модуль опыта',      desc:'+30 XP',                cost:{cr:60,mt:10}, give:{xp:30} }
];

const QUESTS = [
  { id:'f20', title:'Покормить 20 раз', key:'feeds', target:20, rew:{cr:60} },
  { id:'f100',title:'Покормить 100 раз',key:'feeds', target:100,rew:{cr:300,mt:40} },
  { id:'buy', title:'Купить робота',    key:'buys',  target:1,  rew:{cr:150} },
  { id:'loc', title:'Сменить локацию',  key:'locs',  target:1,  rew:{en:40} },
  { id:'eq',  title:'Надеть снаряжение',key:'gear',  target:1,  rew:{cr:100,mt:30} }
];

const STAR_PACKS = [
  { id:'s1', title:'Пак кристаллов', desc:'+700 💎', cost:15, give:{cr:700} },
  { id:'s2', title:'Металлы + энергия', desc:'+100 🔩 +80 ⚡', cost:20, give:{mt:100,en:80} },
  { id:'s3', title:'Редкий робот', desc:'Случайный RARE+', cost:50, give:{rare:true} },
  { id:'s4', title:'Легендарный', desc:'LEGENDARY робот', cost:130, give:{legend:true} }
];

const DEF = {
  cr:100, mt:30, en:50, st:0,
  lvl:1, xp:0,
  sat:20,               // сытость растёт при кормлении
  active:'bot1',
  robots:{ bot1:{ lvl:1, cnt:1, gear:{} } },
  loc:0,
  ownedLocs:[0],
  quests:{},
  stats:{ feeds:0, buys:0, locs:0, gear:0 },
  lastDaily:null,
  lastTick:Date.now(),
  boostUntil:0
};

let S = load();

function load() {
  try {
    const r = localStorage.getItem('cosmo_final');
    if (r) {
      const d = { ...DEF, ...JSON.parse(r) };
      const h = (Date.now() - (d.lastTick||Date.now())) / 3600000;
      if (h > 0.02) {
        const p = calcPassive(d) * h;
        d.cr += Math.floor(p * 0.7);
        d.mt += Math.floor(p * 0.3);
      }
      d.lastTick = Date.now();
      // энергия реген
      const mins = (Date.now() - (d.lastEn||Date.now())) / 60000;
      d.en = Math.min(100, (d.en||0) + Math.floor(mins / 1.5));
      d.lastEn = Date.now();
      return d;
    }
  } catch(e){}
  return JSON.parse(JSON.stringify(DEF));
}
function save(){ S.lastTick=Date.now(); S.lastEn=Date.now(); localStorage.setItem('cosmo_final', JSON.stringify(S)); }

function getR(id){ return ROBOTS.find(r=>r.id===id) || ROBOTS[0]; }

function calcPassive(st=S) {
  let p = 0;
  for (const [id,d] of Object.entries(st.robots||{})) {
    const r = getR(id);
    let mult = 1;
    if (d.gear) Object.values(d.gear).forEach(g => { const gg=GEAR.find(x=>x.id===g); if(gg) mult += gg.bonus; });
    p += (r.passive||0) * (d.lvl||1) * (d.cnt||1) * mult;
  }
  const loc = LOCS[st.loc||0];
  p *= (loc?.bonus||1);
  if (Date.now() < (st.boostUntil||0)) p *= 1.15;
  return Math.round(p*10)/10;
}

function tapIncome() {
  const r = getR(S.active);
  const d = S.robots[S.active] || {lvl:1, gear:{}};
  let mult = 1;
  if (d.gear) Object.values(d.gear).forEach(g => { const gg=GEAR.find(x=>x.id===g); if(gg) mult += gg.bonus; });
  const loc = LOCS[S.loc];
  return Math.floor(r.income * d.lvl * mult * (loc?.bonus||1));
}

function xpNeed(l){ return 30 + l*18; }
function addXp(n){
  S.xp += n;
  while (S.xp >= xpNeed(S.lvl)) {
    S.xp -= xpNeed(S.lvl); S.lvl++;
    S.cr += 25*S.lvl;
    if (tg) tg.showPopup({title:'Уровень '+S.lvl, message:'Награда!', buttons:[{type:'ok'}]});
  }
}

// ---------- UI ----------
function ui() {
  document.getElementById('cr').textContent = fmt(S.cr);
  document.getElementById('mt').textContent = fmt(S.mt);
  document.getElementById('en').textContent = fmt(S.en);
  document.getElementById('st').textContent = fmt(S.st);
  document.getElementById('ulvl').textContent = S.lvl;
  document.getElementById('xpfill').style.width = Math.min(100, S.xp/xpNeed(S.lvl)*100)+'%';

  const r = getR(S.active);
  const d = S.robots[S.active] || {lvl:1};
  document.getElementById('hero').textContent = r.emoji;
  document.getElementById('hname').textContent = r.name;
  document.getElementById('hlvl').textContent = d.lvl;
  document.getElementById('hincome').textContent = '+'+tapIncome();
  document.getElementById('rarity').textContent = r.rarity;
  document.getElementById('rarity').className = 'rarity '+r.rarity;

  document.getElementById('sat').style.width = S.sat+'%';
  document.getElementById('satv').textContent = Math.floor(S.sat)+'%';
  document.getElementById('enbar').style.width = Math.min(100,S.en)+'%';
  document.getElementById('env').textContent = Math.floor(S.en);

  document.getElementById('pass').textContent = calcPassive();
  document.getElementById('bots').textContent = Object.values(S.robots).reduce((a,b)=>a+(b.cnt||0),0);
  document.getElementById('locLvl').textContent = (S.loc||0)+1;
  document.getElementById('locName').textContent = LOCS[S.loc].name;

  // location bg
  const bg = document.getElementById('locBg');
  bg.className = 'loc-bg ' + (LOCS[S.loc]?.cls || 'loc1');

  if (tg?.initDataUnsafe?.user) document.getElementById('uname').textContent = tg.initDataUnsafe.user.first_name || 'Пилот';

  renderRobots();
  renderLocs();
  renderSup();
  renderQuests();
  renderStars();
  updateDaily();
}

function fmt(n){
  if(n>=1e6) return (n/1e6).toFixed(1)+'M';
  if(n>=1e3) return (n/1e3).toFixed(1)+'K';
  return Math.floor(n)+'';
}

// ---------- FEED (сытость РАСТЁТ) ----------
function feed() {
  if (S.en < 1) { float('Нет энергии ⚡'); return; }
  if (S.sat >= 100) { float('Уже сыт!'); return; }

  const gain = tapIncome();
  const crit = Math.random() < 0.14;
  const mult = crit ? [2,2,3,3,4][Math.floor(Math.random()*5)] : 1;
  const got = gain * mult;

  S.cr += got;
  S.en -= 1;
  S.sat = Math.min(100, S.sat + 8 + Math.random()*4);  // СЫТОСТЬ РАСТЁТ
  S.stats.feeds = (S.stats.feeds||0)+1;
  addXp(1);

  // visual
  const h = document.getElementById('hero');
  h.classList.remove('pulse'); void h.offsetWidth; h.classList.add('pulse');
  particles(getR(S.active).emoji);
  float((crit?'💥 ':'')+'+'+fmt(got)+' 💎', crit);
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred(crit?'medium':'light');

  save(); ui();
}

function particles(em) {
  const box = document.getElementById('parts');
  for (let i=0;i<5;i++) {
    const p = document.createElement('div');
    p.className = 'pt'; p.textContent = em;
    p.style.left = (35+Math.random()*30)+'%';
    p.style.top = (30+Math.random()*15)+'%';
    p.style.setProperty('--x', (Math.random()*100-50)+'px');
    p.style.setProperty('--y', (-70-Math.random()*50)+'px');
    box.appendChild(p);
    setTimeout(()=>p.remove(), 650);
  }
}

function float(t, crit) {
  const el = document.getElementById('float');
  el.textContent = t;
  el.className = 'show'+(crit?' crit':'');
  setTimeout(()=>el.className='', 800);
}

// ---------- ROBOTS + EQUIP ----------
function renderRobots() {
  const box = document.getElementById('robotsBox');
  const tab = document.querySelector('#s-robots .tab.on')?.dataset.t || 'list';

  if (tab === 'list') {
    let h = '<div class="grid">';
    for (const [id,d] of Object.entries(S.robots)) {
      if (!d.cnt) continue;
      const r = getR(id);
      h += `<div class="card">
        <div class="em">${r.emoji}</div>
        <div class="nm">${r.name}</div>
        <div class="mt">${r.rarity} · LVL ${d.lvl} · x${d.cnt}</div>
        <button class="p" data-set="${id}">Выбрать</button>
        <button class="p" data-up="${id}">Прокачать ${40*d.lvl}💎</button>
        <button class="s" data-sell="${id}">Продать</button>
      </div>`;
    }
    h += '</div>';
    box.innerHTML = h;
  } else if (tab === 'equip') {
    const d = S.robots[S.active] || {gear:{}};
    const gear = d.gear || {};
    let h = `<div class="equip-panel"><h3>Снаряжение: ${getR(S.active).name}</h3><div class="slots">`;
    ['head','body','weapon','legs','core'].forEach(slot=>{
      const gid = gear[slot];
      const g = GEAR.find(x=>x.id===gid);
      h += `<div class="slot ${g?'filled':''}">${g?g.emoji:'+' }<span>${slot}</span></div>`;
    });
    h += `</div></div><div class="grid">`;
    GEAR.forEach(g=>{
      const owned = gear[g.slot] === g.id;
      const can = S.cr>=(g.cost.cr||0) && S.mt>=(g.cost.mt||0);
      h += `<div class="card">
        <div class="em">${g.emoji}</div>
        <div class="nm">${g.name}</div>
        <div class="mt">+${Math.round(g.bonus*100)}% · ${g.slot}</div>
        <button class="p" ${owned||!can?'disabled':''} data-eq="${g.id}">
          ${owned?'Надето':`${g.cost.cr||0}💎 ${g.cost.mt||0}🔩`}
        </button>
      </div>`;
    });
    h += '</div>';
    box.innerHTML = h;
  } else { // shop
    let h = '<div class="grid">';
    ROBOTS.filter(r=>r.price>0).forEach(r=>{
      const can = S.cr >= r.price;
      h += `<div class="card">
        <div class="em">${r.emoji}</div>
        <div class="nm">${r.name}</div>
        <div class="mt">${r.rarity} · +${r.income}/корм</div>
        <button class="p" ${can?'':'disabled'} data-buy="${r.id}">${fmt(r.price)} 💎</button>
      </div>`;
    });
    h += '</div>';
    box.innerHTML = h;
  }

  box.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{S.active=b.dataset.set;save();ui();});
  box.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>upBot(b.dataset.up));
  box.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>sellBot(b.dataset.sell));
  box.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buyBot(b.dataset.buy));
  box.querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>equip(b.dataset.eq));
}

function buyBot(id){
  const r=getR(id); if(S.cr<r.price)return;
  S.cr-=r.price;
  if(!S.robots[id]) S.robots[id]={lvl:1,cnt:0,gear:{}};
  S.robots[id].cnt++;
  S.stats.buys=(S.stats.buys||0)+1;
  addXp(4); save(); ui(); float('Робот получен!');
}
function upBot(id){
  const d=S.robots[id]; if(!d)return;
  const c=40*d.lvl; if(S.cr<c){float('Мало 💎');return;}
  S.cr-=c; d.lvl++; addXp(3); save(); ui(); float('LVL '+d.lvl);
}
function sellBot(id){
  const d=S.robots[id]; if(!d||d.cnt<=0)return;
  if(id==='bot1'&&d.cnt<=1){float('Нельзя');return;}
  const r=getR(id); const ref=Math.floor((r.price||50)*0.4);
  S.cr+=ref; d.cnt--;
  if(d.cnt<=0){delete S.robots[id]; if(S.active===id)S.active='bot1';}
  save(); ui(); float('+'+fmt(ref)+' 💎');
}
function equip(gid){
  const g=GEAR.find(x=>x.id===gid); if(!g)return;
  if(S.cr<(g.cost.cr||0)||S.mt<(g.cost.mt||0)){float('Не хватает');return;}
  S.cr-=(g.cost.cr||0); S.mt-=(g.cost.mt||0);
  if(!S.robots[S.active].gear) S.robots[S.active].gear={};
  S.robots[S.active].gear[g.slot]=g.id;
  S.stats.gear=(S.stats.gear||0)+1;
  save(); ui(); float(g.name+' надет!');
}

// ---------- LOCATIONS ----------
function renderLocs(){
  const box=document.getElementById('locsBox');
  box.innerHTML='<div class="llist"></div>';
  const list=box.querySelector('.llist');
  LOCS.forEach(l=>{
    const owned=S.ownedLocs.includes(l.id);
    const active=S.loc===l.id;
    const can=S.cr>=l.cost;
    const div=document.createElement('div');
    div.className='lcard'+(active?' active':'');
    div.innerHTML=`
      <div class="ico">${l.name.split(' ')[0]}</div>
      <div class="inf">
        <div class="ln">${l.name}</div>
        <div class="ld">${l.desc}</div>
      </div>
      <button ${owned&&!active?'':can||owned?'':'disabled'} data-loc="${l.id}">
        ${active?'✓ Активна':owned?'Перейти':fmt(l.cost)+' 💎'}
      </button>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-loc]').forEach(b=>b.onclick=()=>setLoc(+b.dataset.loc));
}

function setLoc(id){
  const l=LOCS[id];
  if(S.ownedLocs.includes(id)){
    S.loc=id; save(); ui(); float('Локация: '+l.name);
    return;
  }
  if(S.cr<l.cost)return;
  S.cr-=l.cost;
  S.ownedLocs.push(id);
  S.loc=id;
  S.stats.locs=(S.stats.locs||0)+1;
  addXp(5); save(); ui();
  float('Новая локация!');
  if(tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// ---------- SUPPLIES ----------
function renderSup(){
  const box=document.getElementById('supBox');
  box.innerHTML='<div class="slist"></div>';
  const list=box.querySelector('.slist');
  SUPPLIES.forEach(s=>{
    const can=(S.cr>=(s.cost.cr||0))&&(S.mt>=(s.cost.mt||0));
    const div=document.createElement('div');
    div.className='scard';
    const costStr=[s.cost.cr?s.cost.cr+'💎':'',s.cost.mt?s.cost.mt+'🔩':''].filter(Boolean).join(' ');
    div.innerHTML=`<div><b>${s.name}</b><span>${s.desc}</span></div>
      <button ${can?'':'disabled'} data-sup="${s.id}">${costStr}</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-sup]').forEach(b=>b.onclick=()=>buySup(b.dataset.sup));
}

function buySup(id){
  const s=SUPPLIES.find(x=>x.id===id); if(!s)return;
  if(S.cr<(s.cost.cr||0)||S.mt<(s.cost.mt||0))return;
  S.cr-=(s.cost.cr||0); S.mt-=(s.cost.mt||0);
  if(s.give.sat) S.sat=Math.min(100,S.sat+s.give.sat);
  if(s.give.en) S.en=Math.min(100,S.en+s.give.en);
  if(s.give.mt) S.mt+=s.give.mt;
  if(s.give.xp) addXp(s.give.xp);
  if(s.give.boost) S.boostUntil=Date.now()+3600000;
  save(); ui(); float('Куплено!');
}

// ---------- QUESTS ----------
function canDaily(){return !S.lastDaily||Date.now()-S.lastDaily>20*3600*1000;}
function updateDaily(){
  const b=document.getElementById('claimDaily');
  b.disabled=!canDaily();
  b.textContent=canDaily()?'Забрать':'Уже получено';
}
function claimDaily(){
  if(!canDaily())return;
  S.cr+=100+S.lvl*10; S.en+=30; S.mt+=20;
  S.lastDaily=Date.now(); save(); ui(); float('Ежедневка!');
}

function renderQuests(){
  const box=document.getElementById('qBox');
  box.innerHTML='<div class="qlist"></div>';
  const list=box.querySelector('.qlist');
  QUESTS.forEach(q=>{
    const prog=S.stats[q.key]||0;
    const done=S.quests[q.id];
    const can=!done&&prog>=q.target;
    const div=document.createElement('div');
    div.className='qcard';
    div.innerHTML=`<div><b>${q.title}</b><span>${Math.min(prog,q.target)}/${q.target}</span></div>
      <button ${can?'':'disabled'} data-q="${q.id}">${done?'✓':can?'Забрать':'...'}</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>claimQ(b.dataset.q));
}
function claimQ(id){
  const q=QUESTS.find(x=>x.id===id);
  if(!q||S.quests[id]||(S.stats[q.key]||0)<q.target)return;
  S.quests[id]=true;
  if(q.rew.cr)S.cr+=q.rew.cr;
  if(q.rew.mt)S.mt+=q.rew.mt;
  if(q.rew.en)S.en+=q.rew.en;
  save(); ui(); float('Награда!');
}

// ---------- STARS ----------
function renderStars(){
  const box=document.getElementById('starsBox');
  box.innerHTML='<div class="starlist"></div>';
  const list=box.querySelector('.starlist');
  STAR_PACKS.forEach(p=>{
    const div=document.createElement('div');
    div.className='stcard';
    div.innerHTML=`<div><b>${p.title}</b><span>${p.desc}</span></div>
      <button data-p="${p.id}">${p.cost} ⭐</button>`;
    list.appendChild(div);
  });
  list.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>buyStar(b.dataset.p));
}
function buyStar(id){
  const p=STAR_PACKS.find(x=>x.id===id); if(!p)return;
  if(tg){
    tg.showPopup({title:'Stars',message:'Демо-получить пакет? (реальные Stars — через бота)',buttons:[{id:'ok',type:'default',text:'Демо'},{type:'cancel'}]},
      btn=>{if(btn==='ok')applyStar(p);});
  } else applyStar(p);
}
function applyStar(p){
  if(p.give.cr)S.cr+=p.give.cr;
  if(p.give.mt)S.mt+=p.give.mt;
  if(p.give.en)S.en+=p.give.en;
  if(p.give.rare){
    const r=ROBOTS.filter(x=>x.rarity==='RARE'||x.rarity==='EPIC');
    const c=r[Math.floor(Math.random()*r.length)];
    if(!S.robots[c.id])S.robots[c.id]={lvl:1,cnt:0,gear:{}};
    S.robots[c.id].cnt++;
  }
  if(p.give.legend){
    const c=ROBOTS.find(x=>x.rarity==='LEGENDARY');
    if(!S.robots[c.id])S.robots[c.id]={lvl:1,cnt:0,gear:{}};
    S.robots[c.id].cnt++;
  }
  save(); ui(); float('Пакет получен!',true);
}

// ---------- NAV ----------
document.querySelectorAll('.n').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.n').forEach(x=>x.classList.remove('on'));
    b.classList.add('on');
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
    document.getElementById('s-'+b.dataset.s).classList.add('on');
  };
});
document.querySelectorAll('#s-robots .tab').forEach(t=>{
  t.onclick=()=>{
    document.querySelectorAll('#s-robots .tab').forEach(x=>x.classList.remove('on'));
    t.classList.add('on');
    renderRobots();
  };
});

document.getElementById('feedBtn').onclick=feed;
document.getElementById('claimDaily').onclick=claimDaily;

// сытость медленно падает со временем (нужно кормить)
setInterval(()=>{
  if(S.sat>0){ S.sat=Math.max(0,S.sat-0.8); save(); ui(); }
  // энергия
  S.en=Math.min(100,S.en+0.4); save();
},12000);

ui();
