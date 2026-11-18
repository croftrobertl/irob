/* iRob fun pack (Erica's edition): Puppy Power, Kitten cuddles, Pocket kitten, Catch the kittens,
   Fortune cookie, Croatia memory match, Brag button, and a password-locked date-night game for two.
   Everything runs on her phone; nothing here needs an account or a paid service.
   The date-night game's words live only in us.enc.json (AES-GCM, key from the password via PBKDF2), so the public repo
   never holds them in plain text. */
(() => {
'use strict';
const A = () => window.iRob;
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const rnd = a => a[Math.floor(Math.random() * a.length)];
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';

// ---------- Sheets ----------
function sheet(id, title){
  let s = document.getElementById(id);
  if (!s){
    s = el('section', 'sheet fun-sheet' + (/^fun(More|Secrets)$/.test(id) ? '' : ' full')); s.id = id; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', title);
    s.innerHTML = `<div class="grab"></div><header><h2></h2><button class="icon-btn" data-close aria-label="Close">${X}</button></header><div class="body"></div>`;
    s.querySelector('[data-close]').onclick = () => { stopAll(); A().close(); };
    document.getElementById('scrim').before(s);
  }
  s.querySelector('h2').textContent = title;
  const body = s.querySelector('.body'); body.innerHTML = '';
  return {s, body, show(){ A().open(id); }};
}
let stoppers = [];
function stopAll(){ stoppers.forEach(f => { try { f(); } catch {} }); stoppers = []; }
document.addEventListener('click', e => { if (e.target && e.target.id === 'scrim') stopAll(); });

// ---------- Confetti ----------
function confetti(n = 110, colors = ['#b68235', '#d9a22b', '#e8b4b8', '#8fb8c9', '#f2d16b', '#c46b4e']){
  if (reduced()) return;
  const c = el('canvas', 'fun-confetti'); document.body.appendChild(c);
  const dpr = devicePixelRatio || 1; c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr);
  const ps = Array.from({length:n}, () => ({x:innerWidth / 2 + (Math.random() - .5) * 80, y:innerHeight * .55, vx:(Math.random() - .5) * 11, vy:-Math.random() * 13 - 6, r:Math.random() * 6 + 4, a:Math.random() * 6, va:(Math.random() - .5) * .4, col:rnd(colors)}));
  const t0 = performance.now();
  (function frame(t){
    g.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach(p => { p.vy += .38; p.x += p.vx; p.y += p.vy; p.a += p.va; g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.col; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore(); });
    if (t - t0 < 2200) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

// ---------- Sound ----------
let actx = null;
const ac = () => { if (!actx){ try { actx = new (window.AudioContext || window.webkitAudioContext)(); soundTip(); } catch { return null; } } if (actx.state === 'suspended') actx.resume(); return actx; };
function blip(freq = 660, dur = .09, type = 'sine', vol = .12){
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + dur);
  o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + dur);
}
window.iRobFunPurr = () => purr();
function purr(){
  const a = ac(); if (!a) return {set(){}, stop(){}};
  const len = a.sampleRate * 2, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  let last = 0; for (let i = 0; i < len; i++){ const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
  const am = a.createGain(); am.gain.value = .5;
  const lfo = a.createOscillator(); lfo.frequency.value = 24; const lfoG = a.createGain(); lfoG.gain.value = .5; lfo.connect(lfoG).connect(am.gain);
  const out = a.createGain(); out.gain.value = 0;
  src.connect(lp).connect(am).connect(out).connect(a.destination); src.start(); lfo.start();
  return {set(v){ out.gain.setTargetAtTime(v, a.currentTime, .25); }, stop(){ out.gain.setTargetAtTime(0, a.currentTime, .15); setTimeout(() => { try { src.stop(); lfo.stop(); } catch {} }, 600); }};
}

// ---------- Critter photos (reuses the card system's animal engine when it's loaded) ----------
async function critter(kind){
  const C = window.iRobCards;
  if (C && C.critter) return C.critter(kind);
  return {type:'image', kind, url:kind === 'cat' ? 'https://cataas.com/cat?width=600&t=' + Date.now() : 'https://dog.ceo/api/breed/retriever/golden/images/random'};
}
function media(item, alt){
  const C = window.iRobCards;
  if (C && C.critterEl) return C.critterEl(item);
  const i = el('img', 'kc-media'); i.src = item.url; i.alt = alt; return i;
}

/* ================= A. Puppy Power ================= */
const POWER = ['Tail wag', 'Happy wiggle', 'Zoomies', 'Full golden', 'Maximum floof', 'Legendary good girl energy'];
function puppyPower(){
  const {body, show} = sheet('funPuppy', 'Puppy Power');
  let presses = get('try_pp', 0);
  const meter = el('div', 'pp-meter'); const fill = el('i'); meter.append(fill);
  const level = el('p', 'pp-level');
  const stage = el('div', 'pp-stage'); stage.append(el('p', 'note', 'Press the button. You know you want to.'));
  const btn = el('button', 'pp-btn'); btn.type = 'button'; btn.innerHTML = '<span>PUPPY<br>POWER</span>';
  const paint = () => { const lv = Math.min(POWER.length - 1, Math.floor(presses / 3)); fill.style.width = Math.min(100, (presses % 3 + 1) / 3 * 100) + '%'; level.textContent = `Power level: ${POWER[lv]} · ${presses} ${presses === 1 ? 'press' : 'presses'}`; };
  let busy = false;
  btn.onclick = async () => {
    if (busy) return; busy = true; btn.classList.add('pressed'); blip(520, .08, 'triangle'); setTimeout(() => blip(780, .12, 'triangle'), 90);
    presses++; put('try_pp', presses);
    if (presses % 3 === 0) confetti(); else confetti(40);
    stage.innerHTML = '<p class="note">Fetching a good dog…</p>';
    const item = await critter('golden'); stage.innerHTML = ''; stage.append(media(item, 'A golden retriever'));
    btn.classList.remove('pressed'); busy = false;
  };
  body.append(stage, btn); show();
}

/* ================= B. Kitten cuddles ================= */
const LOAF = ['Purring has begun.', 'Kitten is getting very soft.', 'Kitten has become a loaf.', 'Maximum loaf achieved. You may never move again.'];
function kittenCuddles(){
  const {body, show} = sheet('funKitten', 'Kitten cuddles');
  const pad = el('div', 'kc-pad'); pad.tabIndex = 0; pad.setAttribute('role', 'button'); pad.setAttribute('aria-label', 'Press and hold to cuddle the kitten');
  const pic = el('div', 'kc-pic'); pad.append(pic);
  const hint = el('p', 'kc-hint', 'Press and hold to cuddle');
  const hearts = el('div', 'kc-hearts'); pad.append(hearts);
  const ARM = side => `<svg class="sq-arm ${side}" viewBox="0 0 180 90" aria-hidden="true"><path d="M0 20 h86 v50 h-86z" fill="#f48fb1"/><circle cx="20" cy="32" r="5" fill="#fff"/><circle cx="48" cy="56" r="5" fill="#fff"/><circle cx="70" cy="30" r="5" fill="#fff"/>
    <path d="M84 14 q10 6 0 12 q10 6 0 12 q10 6 0 12 q10 6 0 12 q10 6 0 12 q10 6 0 10" fill="#fff" stroke="#f06292" stroke-width="2"/>
    <path d="M94 32 h40 a14 14 0 0 1 0 28 h-40z" fill="#f2c6a5"/><path d="M134 30 c14 -2 26 4 28 14 c2 10 -6 18 -18 20 c-10 2 -14 -4 -10 -10" fill="#f2c6a5" stroke="#d9a080" stroke-width="2"/>
    <path d="M148 38 q6 4 4 10 M152 48 q4 4 0 9" stroke="#d9a080" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  const squeezer = el('div', 'squeezer'); squeezer.innerHTML = ARM('l') + ARM('r') + '<span class="sq-bow" aria-hidden="true">🎀</span>'; pad.append(squeezer);
  let snd = null, t0 = 0, raf = 0, heartT = 0;
  critter('cat').then(item => { pic.innerHTML = ''; pic.append(media(item, 'A cute kitten')); });
  const tick = () => {
    const s = (performance.now() - t0) / 1000;
    snd && snd.set(Math.min(.9, .15 + s * .08));
    pad.style.setProperty('--melt', Math.min(1, s / 10).toFixed(3));
    hint.textContent = s < 1.2 ? 'SO. MUCH. LOVE.' : LOAF[Math.min(LOAF.length - 1, Math.floor((s - 1.2) / 3))];
    if (Math.random() < .03) blip(1200 + Math.random() * 500, .06, 'sine', .05);
    if (performance.now() - heartT > 450 && !reduced()){ heartT = performance.now(); const h = el('span', '', rnd(['💗', '💕', '🤍', '💞'])); h.style.left = 20 + Math.random() * 60 + '%'; hearts.append(h); setTimeout(() => h.remove(), 1800); }
    raf = requestAnimationFrame(tick);
  };
  const start = e => { e.preventDefault(); if (snd) return; snd = purr(); t0 = performance.now(); pad.classList.add('holding'); raf = requestAnimationFrame(tick); };
  const end = () => { if (!snd) return; snd.stop(); snd = null; cancelAnimationFrame(raf); pad.classList.remove('holding'); pad.style.setProperty('--melt', 0); hint.textContent = 'More cuddles? Press and hold again.'; };
  pad.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => pad.addEventListener(ev, end));
  pad.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); });
  pad.addEventListener('keyup', end);
  pad.addEventListener('contextmenu', e => e.preventDefault());
  stoppers.push(end);
  const another = el('button', 'btn ghost', 'Different kitten'); another.type = 'button';
  another.onclick = () => { pic.innerHTML = '<p class="note">Finding a kitten…</p>'; critter('cat').then(item => { pic.innerHTML = ''; pic.append(media(item, 'A cute kitten')); }); };
  body.append(pad, hint, another); show();
}

/* ================= C. Pocket kitten: a real little cat in a little room ================= */
const PK = 'try_pocketkitten';
const STAGES = [['kitten', 0, .78], ['young cat', 30, .88], ['grown cat', 90, .98], ['royal cat', 200, 1.06]];
const PERSONALITIES = {
  dramatic:{label:'Dramatic', lines:['I have not been fed in MINUTES.', 'Nobody understands me. Except the windowsill.', 'I sneezed. I may not survive.', 'You looked at another cat on your phone. I saw.']},
  snack:{label:'Snack Goblin', lines:['Is that a treat? It sounded like a treat.', 'My bowl is only 90% full. This is a crisis.', 'I would do crimes for a shrimp.', 'Dinner is in 4 hours. I have started screaming early.']},
  velcro:{label:'Velcro Cat', lines:['Where are you going. Can I come. I\'m coming.', 'Your lap is my lap.', 'I followed you to the bathroom. Obviously.', 'Please don\'t leave. Just kidding. Unless?']},
  chaos:{label:'Chaos Gremlin', lines:['The plant looked at me funny.', 'I knocked one (1) thing off the counter. Respectfully.', '3 a.m. zoomies are a lifestyle.', 'I have been to the top of the fridge. I have seen things.']},
  royal:{label:'Royalty', lines:['You may pet me. Twice. Then stop.', 'The sunbeam has been reserved for Her Majesty.', 'Kneel.', 'This box is my throne. Bring snacks.']},
};
const FURNITURE = [
  ['box', '📦', 'Cardboard Box', 15, 'If it fits, I sits.'],
  ['bed', '🛏️', 'Fluffy Bed', 25, 'This bed is mine. All beds are mine.'],
  ['tree', '🌳', 'Cat Tree', 40, 'I can see my whole kingdom from up here.'],
  ['plant', '🪴', 'House Plant', 20, 'I am not eating the plant. (Is eating the plant.)'],
  ['fish', '🐠', 'Fish Bowl', 35, 'Must… not… … okay just one paw.'],
  ['rug', '🧶', 'Yarn Basket', 18, 'I have unraveled everything. You\'re welcome.'],
];
const ACCESSORIES = [['🎀', 'Bow', 'head', 10], ['👑', 'Crown', 'head', 60], ['🎩', 'Top Hat', 'head', 25], ['🕶️', 'Shades', 'face', 20], ['🔔', 'Bell Collar', 'neck', 8], ['🧣', 'Bandana', 'neck', 15]];
const FOODS = [['🐟', 'Fish', {food:35}, 0], ['🥛', 'Milk', {food:20, fun:5}, 0], ['🍤', 'Shrimp Treat', {food:10, fun:18, love:6}, 2]];
// Painted icons for Pocket Kitten (icons/pk-*.webp). Emoji stay as the saved IDs; anything without a painting shows as emoji.
const PIC = {'🍽️':'pk-bowl', '🥣':'pk-bowl', '🎾':'pk-mouse', '🌙':'pk-moon', '🌅':'pk-sunrise', '☀️':'40', '🛍️':'pk-gift', '✏️':'46', '🐟':'pk-fish', 'fun':'pk-paw', '⚡':'pk-bolt', '💗':'pk-heart', '🪙':'pk-coin', '🔥':'pk-star', '🔴':'pk-laser', '🌳':'pk-cattree', '🎀':'pk-bow', '👑':'pk-crown', '🕶️':'pk-shades', '🔔':'pk-bell', '🧣':'pk-bandana', '🐭':'pk-mouse'};
const pic = e => PIC[e] ? `<img class="pic" src="icons/${PIC[e]}.webp" alt="" draggable="false">` : e;
const clamp = v => Math.max(0, Math.min(100, v));
function petLoad(){
  let p = get(PK, null); if (!p) return null;
  if (!p.v){ const h = ms => (Date.now() - ms) / 36e5; p = {v:3, name:p.name, born:p.born, xp:(p.xp || 0) * 2, coins:10, t:Date.now(), food:clamp(100 - h(p.fedAt) * 6), fun:clamp(100 - h(p.playedAt) * 5), love:clamp(100 - h(p.pettedAt) * 4), energy:80, poops:[], poopClock:Date.now(), asleep:false, owned:[], worn:{}, days:p.days || [], streak:1, lastEvent:0}; }
  if (p.v < 3){ p.v = 3; p.coat = p.coat || 'grey'; p.trait = p.trait || rnd(Object.keys(PERSONALITIES)); p.furniture = p.furniture || []; p.owned = (p.owned || []).filter(e => ACCESSORIES.some(a => a[0] === e)); }
  const hrs = Math.min(72, (Date.now() - p.t) / 36e5);
  if (hrs > 0){
    p.food = clamp(p.food - hrs * 6); p.fun = clamp(p.fun - hrs * (p.asleep ? 1 : 5)); p.love = clamp(p.love - hrs * 4);
    p.energy = clamp(p.energy + (p.asleep ? hrs * 14 : -hrs * 3));
    if (p.asleep && p.energy >= 100 && Date.now() - p.sleptAt > 3 * 36e5) p.asleep = false;
    while (!p.asleep && p.poops.length < 3 && Date.now() - p.poopClock > 5 * 36e5){ p.poopClock += 5 * 36e5; p.poops.push({x:62 + Math.random() * 30, id:Math.random().toString(36).slice(2, 7)}); }
    p.t = Date.now();
  }
  p.clean = clamp(100 - p.poops.length * 30);
  p.sick = p.sick || (p.food < 8 && (p.clean < 40 || p.fun < 8));
  p.stage = STAGES.filter(s => p.xp >= s[1]).length - 1;
  return p;
}
const petSave = p => { p.t = Date.now(); const {stage, clean, ...keep} = p; put(PK, keep); };
function petMood(p){
  if (p.sick) return ['sad', `${p.name} isn't feeling great. Time for the vet.`];
  if (p.asleep) return ['sleep', `${p.name} is asleep. Do not disturb the loaf.`];
  if (p.food < 25) return ['sad', rnd([`${p.name} is staring at the bowl. Then at you. Then at the bowl.`, `${p.name} has filed a formal complaint about the bowl.`])];
  if (p.clean < 40) return ['sad', `${p.name} would like the litter box cleaned. Immediately. Or else.`];
  if (p.energy < 20) return ['closed', `${p.name} is doing the slow blink of exhaustion.`];
  if (p.fun < 25) return ['wide', `${p.name} is eyeing your favorite mug. Boredom is dangerous.`];
  if (p.food > 70 && p.fun > 70 && p.love > 70) return ['happy', `${p.name} is the happiest cat in Florida.`];
  return ['open', rnd(PERSONALITIES[p.trait] ? PERSONALITIES[p.trait].lines : ['Mrrp.'])];
}
function petFace(p){ const [m, line] = petMood(p); return [{sleep:'😴', sad:'😿', closed:'😪', wide:'🙀', happy:'😻', open:'😺'}[m], line]; }

function pocketKitten(){
  const {body, show} = sheet('funPet', 'Pocket Kitten');
  if (!petLoad()){
    const f = el('form', 'pet-new');
    let coat = 'grey';
    f.innerHTML = `<div class="pet-adopt-cat"></div><p>A kitten showed up in a basket. Pick a coat and a name.</p><div class="coat-row" role="radiogroup" aria-label="Coat"></div><label class="sr" for="petName">Kitten name</label><input id="petName" maxlength="20" placeholder="Name your kitten" autocomplete="off"><button class="btn">Adopt</button>`;
    const preview = () => { f.querySelector('.pet-adopt-cat').innerHTML = window.iRobCat ? window.iRobCat.sitting(coat, 'happy') : '🐱'; };
    window.iRobCat && window.iRobCat.COATS.forEach(c => { const b = el('button', 'coat' + (c === coat ? ' on' : '')); b.type = 'button'; b.dataset.c = c; b.setAttribute('aria-label', c); b.onclick = () => { coat = c; f.querySelectorAll('.coat').forEach(x => x.classList.toggle('on', x.dataset.c === c)); preview(); }; f.querySelector('.coat-row').append(b); });
    preview();
    f.onsubmit = e => { e.preventDefault(); const n = f.querySelector('input').value.trim(); if (!n) return;
      const now = Date.now(); const trait = rnd(Object.keys(PERSONALITIES));
      put(PK, {v:3, name:n, coat, trait, born:now, xp:0, coins:15, t:now, food:80, fun:80, love:80, energy:90, poops:[], poopClock:now, asleep:false, owned:[], worn:{}, furniture:['box'], days:[], streak:0, lastEvent:now});
      confetti(70); pocketKitten(); setTimeout(() => A().toast(`${n} is a ${PERSONALITIES[trait].label}. Good luck.`), 600); };
    body.append(f); show(); setTimeout(() => f.querySelector('input').focus(), 350); return;
  }
  let p = petLoad(), panel = null, game = null;
  p.bowl = p.bowl || {kind:'fish', amt:0};
  const top = el('div', 'tg-top'); const room = el('div', 'tg-room'); const bubble = el('p', 'tg-say');
  const bars = el('div', 'tg-bars'); const acts = el('div', 'tg-acts'); const tray = el('div', 'tg-panel'); tray.hidden = true;
  body.append(top, room, bubble, bars, acts, tray);
  let saidAt = 0;
  const say = t => { saidAt = Date.now(); bubble.textContent = t; bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop'); };
  const gain = (k, v) => { p[k] = clamp(p[k] + v); };
  const earn = v => { p.coins += v; };
  const careDay = () => { const today = new Date().toDateString(); if ((p.days || []).includes(today)) return; const y = new Date(Date.now() - 864e5).toDateString(); p.streak = (p.days || []).includes(y) ? (p.streak || 0) + 1 : 1; p.days = (p.days || []).concat(today).slice(-120); earn(5); A().toast(`Day ${p.streak} streak! +5 🪙`); };
  const xp = v => { const before = p.stage; p.xp += v; p.stage = STAGES.filter(s => p.xp >= s[1]).length - 1; if (p.stage > before){ confetti(); A().toast(`${p.name} grew into a ${STAGES[p.stage][0]}!`); } };
  const save = () => { p.clean = clamp(100 - p.poops.length * 30); petSave(p); };
  const commit = () => { save(); drawHud(); drawRoom(); };
  const SPOTS = {box:15, bed:58, tree:5, plant:91, fish:76, rug:66};
  const BOWL_X = 30;
  const trait = () => PERSONALITIES[p.trait] || {lines:['Mrrp.']};
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------- the room (built once; parts update in place so the kitten can move smoothly) ---------- */
  room.innerHTML = '<div class="tg-wall"></div><div class="tg-window" aria-hidden="true"><span></span></div><div class="tg-floor"></div><div class="tg-furns"></div><div class="tg-bowl" aria-hidden="true"></div><div class="tg-poops"></div>';
  const cat = el('div', 'tg-cat'); cat.setAttribute('role', 'img'); const catBody = el('div', 'tg-body'); cat.append(catBody); room.append(cat);
  function drawRoom(){
    const h = new Date().getHours(), night = h >= 19 || h < 7;
    room.className = 'tg-room' + (p.asleep ? ' lights-off' : night ? ' night' : '');
    room.querySelector('.tg-window span').innerHTML = pic(night || p.asleep ? '🌙' : '☀️');
    const furns = room.querySelector('.tg-furns'); furns.innerHTML = '';
    (p.furniture || []).forEach(k => { const f = FURNITURE.find(x => x[0] === k); if (!f) return; const it = el('div', 'tg-furn f-' + k); it.innerHTML = pic(f[1]); it.style.left = SPOTS[k] + '%'; it.setAttribute('aria-hidden', 'true'); furns.append(it); });
    const bowl = room.querySelector('.tg-bowl'); bowl.style.left = BOWL_X + '%';
    bowl.className = 'tg-bowl' + (p.bowl.amt > 0 ? '' : ' empty') + (p.bowl.kind === 'milk' ? ' milk' : '');
    bowl.style.setProperty('--amt', p.bowl.amt / 100);
    bowl.innerHTML = `<img class="pic" src="icons/${p.bowl.kind === 'milk' && p.bowl.amt > 0 ? 'pk-water' : 'pk-bowl'}.webp" alt="" draggable="false">`;
    const poops = room.querySelector('.tg-poops'); poops.innerHTML = '';
    p.poops.forEach(pp => { const b = el('button', 'tg-poop'); b.type = 'button'; b.style.left = pp.x + '%'; b.setAttribute('aria-label', 'Scoop this'); b.innerHTML = '<svg viewBox="0 0 24 20"><path d="M4 18c-2-3 1-5 3-5-1-3 2-5 5-4 0-3 4-4 5-1 3 0 4 3 2 5 2 1 2 4-1 5z" fill="#7a5233" stroke="#5a3a20" stroke-width="1"/></svg>';
      b.onclick = e => { e.stopPropagation(); p.poops = p.poops.filter(z => z.id !== pp.id); earn(2); xp(1); careDay(); blip(900, .06); say(rnd(['Scooped. +2 🪙', `${p.name} watched you do it. No thanks given.`, 'Fresh litter. Very luxurious.'])); commit(); };
      poops.append(b); });
    drawCat();
  }

  /* ---------- the kitten: position, facing and pose ---------- */
  const C = {x:p.x || 45, pose:'sit', face:1, busy:false, token:0};
  function drawCat(){
    const [mood] = petMood(p);
    const pose = p.asleep ? 'sleep' : C.pose;
    const faceMood = {eat:'closed', groom:'closed', nap:'closed', purr:'happy', beg:'wide', stalk:'wide', sniff:'open', sit:mood === 'sleep' ? 'closed' : mood}[pose] || mood;
    const key = pose + '|' + faceMood + '|' + p.coat + '|' + JSON.stringify(p.worn || {});
    if (cat.dataset.key !== key){
      cat.dataset.key = key;
      catBody.innerHTML = (pose === 'sleep' || pose === 'nap') ? window.iRobCat.sleeping(p.coat) : window.iRobCat.sitting(p.coat, faceMood);
      if (pose !== 'sleep' && pose !== 'nap') Object.entries(p.worn || {}).forEach(([slot, e]) => { const a = el('span', 'acc ' + slot); a.innerHTML = pic(e); a.setAttribute('aria-hidden', 'true'); catBody.append(a); });
    }
    cat.className = 'tg-cat pose-' + pose + ((pose === 'sleep' || pose === 'nap') ? ' asleep' : '');
    cat.style.setProperty('--s', STAGES[p.stage][2]); cat.style.setProperty('--face', C.face);
    cat.style.left = C.x + '%';
    cat.setAttribute('aria-label', `${p.name}. Stroke to pet.`);
  }
  function pose(name){ C.pose = name; drawCat(); }
  // Walk (or trot) to a spot. Speed is in % of the room per second; returns false if something else took over.
  async function walkTo(x, speed = 22){
    const t = ++C.token; x = Math.max(8, Math.min(90, x));
    const dist = Math.abs(x - C.x); if (dist < 1) return true;
    C.face = x < C.x ? -1 : 1; const dur = dist / speed;
    cat.style.transition = `left ${dur}s linear`; C.pose = speed > 40 ? 'run' : 'walk'; C.x = x; drawCat();
    await sleep(dur * 1000);
    if (t !== C.token) return false;
    cat.style.transition = ''; C.pose = 'sit'; drawCat(); p.x = C.x; return true;
  }
  const interrupt = () => { C.token++; C.busy = false; cat.style.transition = ''; const r = cat.getBoundingClientRect(), rr = room.getBoundingClientRect(); if (rr.width) C.x = ((r.left + r.width / 2 - rr.left) / rr.width) * 100; C.pose = 'sit'; drawCat(); };

  function drawHud(){
    const [, line] = petMood(p);
    top.innerHTML = '';
    const nm = el('div', 'tg-name'); nm.append(el('b', '', p.name), el('span', '', `${PERSONALITIES[p.trait] ? PERSONALITIES[p.trait].label : ''} · ${STAGES[p.stage][0]} · ${(d => d === 1 ? '1 day' : d + ' days')(Math.max(1, Math.ceil((Date.now() - p.born) / 864e5)))} old`));
    const meta = el('div', 'tg-meta'); const m1 = el('span'), m2 = el('span'); m1.innerHTML = `${pic('🪙')} ${p.coins}`; m2.innerHTML = `${pic('🔥')} ${p.streak || 0}`; m1.title = 'Coins'; m2.title = 'Day streak'; meta.append(m1, m2); top.append(nm, meta);
    if (Date.now() - saidAt > 6000) bubble.textContent = line;
    bars.innerHTML = '';
    [['🐟', 'Food', p.food], ['fun', 'Fun', p.fun], ['⚡', 'Energy', p.energy], ['🫧', 'Clean', p.clean], ['💗', 'Love', p.love]].forEach(([e, l, v]) => {
      const b = el('div', 'tg-bar' + (v < 25 ? ' low' : '')); b.innerHTML = `<span aria-hidden="true">${pic(e)}</span><b role="meter" aria-label="${l}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v)}"><i style="width:${Math.round(v)}%"></i></b>`; bars.append(b); });
    acts.innerHTML = '';
    const act = (e, label, fn, on) => { const b = el('button', 'tile' + (on ? ' on' : '')); b.type = 'button'; b.innerHTML = `<span class="e" aria-hidden="true">${pic(e)}</span><span></span>`; b.lastChild.textContent = label; b.onclick = fn; acts.append(b); };
    if (p.sick) act('🩺', 'Vet', vet);
    act('🍽️', 'Feed', () => openPanel('feed'), panel === 'feed');
    act('🎾', 'Play', () => openPanel('play'), panel === 'play');
    act(p.asleep ? '🌅' : '🌙', p.asleep ? 'Wake' : 'Sleep', toggleSleep);
    act('🛍️', 'Shop', () => openPanel('shop'), panel === 'shop');
    act('✏️', 'Rename', rename);
  }

  /* ---------- petting: stroke the cat. Three strokes in, the belly becomes a trap. ---------- */
  let last = null, strokes = 0, purr = null;
  cat.addEventListener('pointerdown', e => { if (game) return; if (p.asleep){ say(`${p.name} is asleep. Gentle pets only. 💤`); return; } interrupt(); C.busy = true; last = e.clientX; cat.setPointerCapture(e.pointerId); purr = window.iRobFunPurr ? window.iRobFunPurr() : null; });
  cat.addEventListener('pointermove', e => { if (last == null) return; if (Math.abs(e.clientX - last) > 28){ last = e.clientX; strokes++; gain('love', 2); purr && purr.set(Math.min(.8, .2 + strokes * .06)); hearts(); if (strokes === 3) pose('purr');
      const r = cat.getBoundingClientRect(); if (strokes > 3 && e.clientY > r.top + r.height * .72 && Math.random() < .35){ endPet(); pose('swat'); blip(180, .12, 'square', .08); say(rnd(['BETRAYAL. The belly was a trap.', 'You touched the belly. You knew the rules.', '*swats* We will not be discussing this.'])); setTimeout(() => { if (C.pose === 'swat') pose('sit'); }, 700); gain('love', -6); save(); drawHud(); } } });
  const endPet = () => { if (last == null) return; last = null; purr && purr.stop(); purr = null; C.busy = false; if (C.pose === 'purr') pose('sit');
    if (strokes){ if (!p.lastPetCoin || Date.now() - p.lastPetCoin > 60000){ earn(1); p.lastPetCoin = Date.now(); } xp(1); careDay();
      say(strokes > 6 ? rnd([`${p.name} is purring so loud the neighbors called.`, `${p.name} has melted into a puddle of cat.`]) : rnd([`${p.name} headbutted your hand.`, `Slow blink from ${p.name}. You are trusted.`])); strokes = 0; save(); drawHud(); } };
  cat.addEventListener('pointerup', endPet); cat.addEventListener('pointercancel', endPet);
  function hearts(){ if (reduced()) return; const h = el('span', 'tg-heart', rnd(['💗', '💕', '🤍'])); h.style.left = (C.x + (Math.random() * 14 - 7)) + '%'; room.append(h); setTimeout(() => h.remove(), 1500); }

  /* ---------- eating: walks to the bowl, eats a bite at a time, and the bowl actually empties ---------- */
  const NOM = {fish:{food:7, fun:0}, milk:{food:5, fun:1.5}};
  async function eat(){
    if (C.busy || p.asleep || p.bowl.amt <= 0) return;
    C.busy = true;
    if (!(await walkTo(BOWL_X + 12, 26))){ C.busy = false; return; }
    C.face = -1; pose('sniff'); await sleep(700);
    if (p.trait === 'royal' && p.bowl.kind === 'milk' && Math.random() < .3){ say(`${p.name} sniffed the milk and walked away. Her Majesty requested fish.`); C.busy = false; pose('sit'); return; }
    pose('eat'); say(rnd([`${p.name} is eating. Crunch crunch crunch.`, `Nom nom nom. ${p.name} is very focused.`, `${p.name} found the good bits first.`]));
    let bites = 0; const t = C.token;
    while (p.bowl.amt > 0 && p.food < 97 && t === C.token && !game){
      await sleep(650); if (t !== C.token) break;
      const n = NOM[p.bowl.kind] || NOM.fish; p.bowl.amt = Math.max(0, p.bowl.amt - 9); gain('food', n.food); gain('fun', n.fun); bites++;
      blip(240 + Math.random() * 90, .04, 'triangle', .05); drawRoom(); drawHud();
    }
    if (t !== C.token){ C.busy = false; return; }
    xp(Math.min(3, 1 + Math.floor(bites / 4))); careDay(); pose('groom');
    say(p.bowl.amt > 0 ? rnd([`${p.name} is full and saving the rest for later. Very responsible.`, `${p.name} ate, licked their lips, and left exactly three bites. Classic.`]) : rnd([`${p.name} licked the bowl clean. Spotless.`, `All gone. ${p.name} is now staring at the empty bowl like it betrayed them.`]));
    save(); drawHud(); await sleep(2400); if (t === C.token){ pose('sit'); C.busy = false; }
  }
  function fillBowl(kind){
    if (p.bowl.amt >= 60 && p.bowl.kind === kind){ say(`The bowl is still pretty full. ${p.name} is not starving, despite what they tell you.`); return; }
    p.bowl = {kind, amt:100}; blip(520, .08, 'triangle'); setTimeout(() => blip(620, .06, 'triangle'), 90);
    say(kind === 'milk' ? `You poured a bowl of milk. ${p.name}'s ears went straight up.` : `Kibble in the bowl. The rattle summoned ${p.name} from another dimension.`);
    save(); drawRoom(); closePanel();
    if (!p.asleep && p.food < 92){ interrupt(); setTimeout(eat, 500); }
    else if (!p.asleep) say(`${p.name} sniffed it, but isn't hungry yet. It'll be there later.`);
  }
  // Treat: drop it on the floor and the kitten trots over and snaps it up
  async function dropTreat(){
    if (p.coins < 2){ say('A treat costs 2 🪙. Pet or play to earn more.'); return; }
    if (p.asleep){ say(`${p.name} is asleep. Treats work better when cats are awake.`); return; }
    p.coins -= 2; closePanel(); interrupt();
    const tx = 25 + Math.random() * 55, tr = el('span', 'tg-floor-treat'); tr.innerHTML = pic('🍤'); tr.style.left = tx + '%'; room.append(tr);
    C.busy = true; say(`${p.name} heard the treat bag.`); pose('beg'); await sleep(450);
    if (await walkTo(tx, 55)){ pose('pounce'); await sleep(350); tr.remove(); pose('eat'); blip(880, .08); gain('food', 8); gain('fun', 12); gain('love', 8); xp(2); careDay();
      say(rnd(['CHOMP. Gone in one bite.', `${p.name} ate the shrimp and is now checking your pockets for more.`, `${p.name} would do crimes for another one.`])); hearts(); save(); drawHud(); await sleep(1200); }
    else tr.remove();
    C.busy = false; pose('sit');
  }

  /* ---------- a life of its own: needs first, then cat things ---------- */
  async function idle(){
    if (C.busy || game || p.asleep || last != null || Date.now() - saidAt < 5500) return;
    if (p.food < 55 && p.bowl.amt > 0) return eat();
    C.busy = true; const t = C.token;
    try {
      if (p.food < 30){ await walkTo(BOWL_X + 12); C.face = -1; pose('beg'); say(rnd([`${p.name} is sitting by the empty bowl. Meowing. Loudly.`, `${p.name} would like to report an empty bowl.`, 'MRRROW. (Translation: the bowl.)'])); blip(500, .15, 'sine', .05); await sleep(3500); return; }
      if (p.energy < 22){ const bed = (p.furniture || []).includes('bed'); if (bed) await walkTo(SPOTS.bed); if (t !== C.token) return; pose('nap'); say(bed ? `${p.name} curled up in the fluffy bed for a catnap.` : `${p.name} flopped over right there for a catnap.`); await sleep(9000); if (t === C.token){ gain('energy', 10); save(); drawHud(); } return; }
      if (p.fun < 28 && Math.random() < .6){ say(rnd([`${p.name} has the zoomies.`, `${p.name} is sprinting laps for no reason at all.`])); for (let i = 0; i < 3 && t === C.token; i++){ await walkTo(i % 2 ? 85 : 12, 75); } gain('energy', -3); return; }
      const furn = p.furniture || [];
      const options = [
        [3, async () => { await walkTo(10 + Math.random() * 78); }],
        [2, async () => { pose('groom'); say(rnd([`${p.name} is grooming. Very thorough. Very serious.`, `${p.name} is licking one paw like it owes them money.`])); await sleep(3200); }],
        [1.5, async () => { pose('stretch'); say(`${p.name} did a big stretch. Front paws, then back paws.`); await sleep(1800); }],
        [1.5, async () => { await walkTo(78); pose('watch'); say(new Date().getHours() >= 19 || new Date().getHours() < 7 ? `${p.name} is watching the night through the window.` : rnd([`${p.name} is chattering at a bird outside.`, `${p.name} is guarding the window. Nothing gets past.`])); await sleep(4200); }],
        [1, async () => { pose('loaf'); say(rnd([`${p.name} turned into a loaf.`, `${p.name} is sitting very still, judging the room.`])); await sleep(4500); }],
      ];
      if (furn.includes('box')) options.push([2, async () => { await walkTo(SPOTS.box); pose('loaf'); say('If it fits, I sits.'); await sleep(4200); }]);
      if (furn.includes('tree')) options.push([2, async () => { await walkTo(SPOTS.tree + 2); pose('climb'); say(`${p.name} climbed the cat tree to survey the kingdom.`); await sleep(4500); }]);
      if (furn.includes('plant')) options.push([1, async () => { await walkTo(SPOTS.plant - 4); pose('sniff'); say(`${p.name} is "not" eating the plant.`); await sleep(2500); }]);
      if (furn.includes('fish')) options.push([1.5, async () => { await walkTo(SPOTS.fish - 3); pose('stalk'); say(`${p.name} is staring into the fish bowl. Unblinking.`); await sleep(3500); }]);
      if (furn.includes('rug')) options.push([1.5, async () => { await walkTo(SPOTS.rug); pose('swat'); say(`${p.name} is batting the yarn around.`); await sleep(1200); gain('fun', 4); }]);
      if (furn.includes('bed') && p.energy < 60) options.push([1.5, async () => { await walkTo(SPOTS.bed); pose('nap'); say(`${p.name} is napping in the fluffy bed.`); await sleep(8000); gain('energy', 6); }]);
      if (Math.random() < .3) say(rnd(trait().lines));
      let total = options.reduce((s, o) => s + o[0], 0), r = Math.random() * total; const pick = options.find(o => (r -= o[0]) < 0) || options[0];
      await pick[1]();
    } finally { if (t === C.token){ C.busy = false; if (!p.asleep && !game && C.pose !== 'walk') pose('sit'); } }
  }

  /* ---------- panels ---------- */
  function closePanel(){ panel = null; tray.hidden = true; tray.innerHTML = ''; drawHud(); }
  function openPanel(which){
    panel = panel === which ? null : which; tray.innerHTML = ''; tray.hidden = !panel; drawHud(); if (!panel) return;
    const item = (e, label, fn, cls) => { const b = el('button', 'tg-item' + (cls ? ' ' + cls : '')); b.type = 'button'; b.innerHTML = `<span aria-hidden="true">${pic(e)}</span><span></span>`; b.lastChild.textContent = label; b.onclick = fn; tray.append(b); };
    if (which === 'feed'){
      item('🥣', 'Fill Bowl: Kibble', () => fillBowl('fish'));
      item('🥛', 'Pour Milk', () => fillBowl('milk'));
      item('🍤', 'Shrimp Treat · 2🪙', dropTreat);
    }
    if (which === 'play'){
      if (p.asleep){ tray.append(el('p', 'note', `${p.name} is asleep. Play later.`)); return; }
      item('🔴', 'Laser Pointer', () => { closePanel(); laser(); });
      item('🪶', 'Feather Wand', () => { closePanel(); wand(); });
      item('🍤', 'Treat Toss', () => { closePanel(); treatToss(); });
    }
    if (which === 'shop'){
      tray.append(el('p', 'tg-h', 'For the room'));
      FURNITURE.forEach(([k, e, label, price, line]) => { const owned = (p.furniture || []).includes(k); item(e, label + (owned ? ' · owned' : ` · ${price}🪙`), () => {
        if (owned){ interrupt(); walkTo(SPOTS[k]); say(line); return; }
        if (p.coins < price){ say(`${label} costs ${price} 🪙. Keep caring for ${p.name} to earn more.`); return; }
        p.coins -= price; p.furniture = (p.furniture || []).concat(k); confetti(40); say(line); commit(); interrupt(); walkTo(SPOTS[k]); openPanel('shop'); openPanel('shop'); }, owned ? 'worn' : ''); });
      tray.append(el('p', 'tg-h', 'To wear'));
      ACCESSORIES.forEach(([e, label, slot, price]) => { const owned = (p.owned || []).includes(e), worn = (p.worn || {})[slot] === e; item(e, label + (owned ? (worn ? ' · wearing' : '') : ` · ${price}🪙`), () => {
        if (!owned){ if (p.coins < price){ say(`${label} costs ${price} 🪙.`); return; } p.coins -= price; p.owned = (p.owned || []).concat(e); confetti(40); }
        p.worn = p.worn || {}; if (p.worn[slot] === e) delete p.worn[slot]; else p.worn[slot] = e;
        say(p.worn[slot] === e ? rnd([`${p.name} looks incredible. Fashion icon.`, `${p.name} refuses to take it off now.`]) : `${label} off.`); commit(); openPanel('shop'); openPanel('shop'); }, worn ? 'worn' : ''); });
    }
  }

  /* ---------- play ---------- */
  // Shared: a full-room layer that follows your finger, and a chase loop that moves the kitten with a little lag.
  function playLayer(cls){ const layer = el('div', 'tg-game ' + cls); room.append(layer); return layer; }
  const roomPt = e => { const r = room.getBoundingClientRect(); return {x:Math.max(3, Math.min(97, (e.clientX - r.left) / r.width * 100)), y:Math.max(3, Math.min(97, (e.clientY - r.top) / r.height * 100))}; };
  function endGame(){ if (!game) return; game.stop(); game = null; cat.style.transition = ''; C.busy = false; pose('sit'); }
  // Laser: drag your finger and the dot follows. The kitten chases it, and only catches it if it's moving.
  function laser(){
    if (p.energy < 10){ say(`${p.name} is too tired to play. Nap first.`); return; }
    interrupt(); C.busy = true; cat.style.transition = 'none';
    const layer = playLayer('laser'), dot = el('span', 'tg-laser'); layer.append(dot);
    let pt = {x:60, y:80}, moved = 0, catches = 0, cool = 0, raf = 0, t0 = performance.now(), lastT = t0;
    const put2 = () => { dot.style.left = pt.x + '%'; dot.style.top = pt.y + '%'; };
    layer.addEventListener('pointerdown', e => { layer.setPointerCapture(e.pointerId); pt = roomPt(e); moved = performance.now(); put2(); });
    layer.addEventListener('pointermove', e => { if (e.buttons === 0 && e.pointerType === 'mouse') return; const q = roomPt(e); if (Math.hypot(q.x - pt.x, q.y - pt.y) > .6) moved = performance.now(); pt = q; put2(); });
    put2(); say(`Drag your finger around the room. ${p.name} is locked on.`);
    const tick = now => {
      const dt = Math.min(.05, (now - lastT) / 1000); lastT = now;
      const tired = p.energy < 15, speed = (tired ? 18 : 48) * (now < cool ? .2 : 1);
      const dx = pt.x - C.x; if (Math.abs(dx) > 1.5){ C.face = dx < 0 ? -1 : 1; C.x += Math.sign(dx) * Math.min(Math.abs(dx), speed * dt); if (C.pose !== 'run' && now > cool) { C.pose = 'run'; } }
      else if (now > cool && C.pose === 'run') C.pose = 'stalk';
      const high = pt.y < 55, near = Math.abs(dx) < 6, fresh = now - moved < 1100;
      if (near && fresh && now > cool){ cool = now + 900; C.pose = high ? 'leap' : 'pounce'; catches++; gain('fun', 3); gain('energy', -1.5); blip(700 + catches * 15, .05); }
      drawCat();
      if (now - t0 > 16000 || p.energy < 6){ finish(); return; }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => { endGame(); gain('fun', 6); gain('energy', -6); const c = Math.min(10, catches); earn(c); xp(2 + Math.floor(catches / 3)); careDay();
      say(p.energy < 8 ? `${p.name} flopped over, completely out of breath. Laser retired for today.` : catches >= 10 ? `${catches} catches! ${p.name} is a professional hunter. +${c} 🪙` : `${catches} catches. ${p.name} is pleased and slightly out of breath. +${c} 🪙`); commit(); };
    game = {stop(){ cancelAnimationFrame(raf); layer.remove(); }}; stoppers.push(endGame);
    raf = requestAnimationFrame(tick);
  }
  // Feather wand: dangle a feather on a string. Low = she bats it; high = she wiggles, then leaps for it.
  function wand(){
    if (p.energy < 10){ say(`${p.name} is too tired to play. Nap first.`); return; }
    interrupt(); C.busy = true; cat.style.transition = 'none';
    const layer = playLayer('wand'); layer.innerHTML = '<svg class="tg-string" preserveAspectRatio="none" viewBox="0 0 100 100"><line x1="50" y1="0" x2="50" y2="50" vector-effect="non-scaling-stroke"/></svg><span class="tg-feather">🪶</span>';
    const line = layer.querySelector('line'), fe = layer.querySelector('.tg-feather');
    let pt = {x:50, y:55}, hits = 0, cool = 0, wiggleAt = 0, raf = 0, t0 = performance.now(), lastT = t0, moved = t0;
    const put2 = () => { fe.style.left = pt.x + '%'; fe.style.top = pt.y + '%'; line.setAttribute('x1', Math.max(0, Math.min(100, pt.x - 8))); line.setAttribute('x2', pt.x); line.setAttribute('y2', pt.y); };
    layer.addEventListener('pointerdown', e => { layer.setPointerCapture(e.pointerId); pt = roomPt(e); moved = performance.now(); put2(); });
    layer.addEventListener('pointermove', e => { if (e.buttons === 0 && e.pointerType === 'mouse') return; const q = roomPt(e); if (Math.hypot(q.x - pt.x, q.y - pt.y) > .6) moved = performance.now(); pt = q; put2(); });
    put2(); say(`Dangle the feather. Low for swats, high for big leaps.`);
    const tick = now => {
      const dt = Math.min(.05, (now - lastT) / 1000); lastT = now; const dx = pt.x - C.x;
      if (now > cool){
        if (Math.abs(dx) > 7){ C.face = dx < 0 ? -1 : 1; C.x += Math.sign(dx) * Math.min(Math.abs(dx) - 6, 20 * dt); C.pose = 'stalk'; wiggleAt = 0; }
        else if (now - moved < 1500){
          if (pt.y > 62){ cool = now + 650; C.pose = 'swat'; hits++; gain('fun', 2.5); blip(820, .04); }
          else if (!wiggleAt){ wiggleAt = now; C.pose = 'wiggle'; }
          else if (now - wiggleAt > 700){ cool = now + 900; wiggleAt = 0; C.pose = 'leap'; hits++; gain('fun', 4); gain('energy', -1.5); blip(980, .06); }
        } else C.pose = 'sit';
      }
      drawCat();
      if (now - t0 > 18000 || p.energy < 6){ finish(); return; }
      raf = requestAnimationFrame(tick);
    };
    const finish = () => { endGame(); gain('energy', -5); const c = Math.min(10, hits); earn(c); xp(2 + Math.floor(hits / 3)); careDay();
      say(hits >= 8 ? `${hits} hits! ${p.name} caught the feather and is now walking away with it. +${c} 🪙` : `${hits} hits. ${p.name} is pretending they weren't trying very hard. +${c} 🪙`); commit(); };
    game = {stop(){ cancelAnimationFrame(raf); layer.remove(); }}; stoppers.push(endGame);
    raf = requestAnimationFrame(tick);
  }
  // Treat Toss: the cat paces; tap to toss a shrimp and land it in their mouth.
  function treatToss(){
    if (p.energy < 10){ say(`${p.name} is too tired. Nap first.`); return; }
    interrupt(); C.busy = true; cat.style.transition = 'none';
    const layer = playLayer('toss'); let caught = 0, thrown = 0, dir = 1;
    say(`Tap anywhere to toss a shrimp. Time it so ${p.name} catches it!`);
    const pace = setInterval(() => { C.x += dir * 2.2; if (C.x > 85 || C.x < 10) dir *= -1; C.face = dir; C.pose = 'walk'; drawCat(); }, 50);
    layer.onclick = () => { thrown++; const t = el('span', 'tg-treat'); t.innerHTML = pic('🍤'); layer.append(t); blip(500, .05, 'triangle');
      setTimeout(() => { const hit = Math.abs(C.x - 50) < 9; t.classList.add(hit ? 'in' : 'miss'); if (hit){ caught++; blip(880, .1); hearts(); say(rnd(['CHOMP.', 'Caught it mid-air! Elite.', `${p.name} did a backflip. (Not really. But spiritually.)`])); } else say(rnd(['Missed. The floor gets a snack.', `${p.name} watched it sail past with mild disappointment.`])); setTimeout(() => t.remove(), 600); }, 650); };
    game = {stop(){ clearInterval(pace); layer.remove(); }}; stoppers.push(endGame);
    setTimeout(() => { if (!game) return; endGame(); gain('food', caught * 4); gain('fun', 8 + caught * 3); gain('energy', -8); earn(Math.min(10, caught * 2)); xp(2 + caught); careDay();
      say(`${caught} of ${thrown} shrimp caught. ${caught >= 5 ? `${p.name} is a shrimp-catching legend.` : 'Practice makes perfect. And full cats.'} +${Math.min(10, caught * 2)} 🪙`); commit(); }, 15000);
  }
  function toggleSleep(){ interrupt(); p.asleep = !p.asleep; if (p.asleep) p.sleptAt = Date.now(); careDay(); say(p.asleep ? `Lights out. ${p.name} curled into a perfect loaf. 💤` : (p.energy > 70 ? `${p.name} woke up and stretched for a full minute.` : `${p.name} woke up grumpy. More sleep next time.`)); if (!p.asleep) C.pose = 'stretch'; commit(); if (!p.asleep) setTimeout(() => { if (C.pose === 'stretch') pose('sit'); }, 1800); }
  function vet(){ p.sick = false; gain('food', 40); gain('fun', 20); gain('love', 20); p.poops = []; careDay(); say(`The vet says ${p.name} will be fine. Extra cuddles prescribed.`); commit(); }
  function rename(){ tray.innerHTML = ''; panel = 'rename'; tray.hidden = false; const f = el('form', 'tg-rename'); f.innerHTML = `<label class="sr" for="petRename">New name</label><input id="petRename" maxlength="20" value="${p.name.replace(/"/g, '&quot;')}"><button class="btn">Save</button>`;
    f.onsubmit = e => { e.preventDefault(); const v = f.querySelector('input').value.trim(); if (!v) return; p.name = v; closePanel(); commit(); }; tray.append(f); }
  if (!p.asleep && Date.now() - (p.lastEvent || 0) > 4 * 36e5 && Math.random() < .6){
    p.lastEvent = Date.now();
    const ev = rnd([() => { earn(3); return `${p.name} left a gift by your shoe: a toy mouse 🐭. Very proud. +3 🪙`; }, () => { gain('fun', 10); return `${p.name} knocked a pen off the table, then looked right at you.`; }, () => { xp(3); return `${p.name} learned a new trick: sitting on whatever you're using.`; }, () => { gain('love', 10); return `${p.name} brought you a sock. It is now your sock. You're welcome.`; }])();
    petSave(p); setTimeout(() => say(ev), 500);
  }
  const life = setInterval(idle, 3200);
  const refresh = setInterval(() => { const q = petLoad(); Object.assign(p, {food:q.food, fun:q.fun, love:q.love, energy:q.energy, poops:q.poops, sick:q.sick}); save(); drawHud(); drawRoom(); }, 60000);
  stoppers.push(() => { clearInterval(life); clearInterval(refresh); C.token++; p.x = C.x; save(); });
  drawRoom(); drawHud(); show();
  if (!p.asleep && p.food < 55 && p.bowl.amt > 0) setTimeout(eat, 1200);
}

/* ================= D. Catch the kittens ================= */
function drawCuke(g, x, y, rot){
  g.save(); g.translate(x, y); g.rotate(rot || 0);
  const grd = g.createLinearGradient(0, -9, 0, 9); grd.addColorStop(0, '#7cc95a'); grd.addColorStop(.5, '#3f9a35'); grd.addColorStop(1, '#2a6e25');
  g.fillStyle = grd; g.strokeStyle = '#225c1e'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 0, 22, 9, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#9fdc7c'; [-12, -4, 5, 13].forEach((bx, i) => { g.beginPath(); g.arc(bx, i % 2 ? -3 : 3, 1.5, 0, 7); g.fill(); });
  g.fillStyle = '#5a8f2a'; g.beginPath(); g.ellipse(21, 0, 2.5, 3.5, 0, 0, 7); g.fill(); g.restore();
}
function drawSpray(g, x, y){
  g.save(); g.translate(x, y);
  g.fillStyle = '#f4f7fb'; g.strokeStyle = '#8fa3b8'; g.lineWidth = 1.5;
  g.beginPath(); g.roundRect ? g.roundRect(-9, -6, 18, 26, 5) : g.rect(-9, -6, 18, 26); g.fill(); g.stroke();
  g.fillStyle = '#3d8be0'; g.beginPath(); g.rect(-6, -16, 12, 10); g.fill();
  g.beginPath(); g.moveTo(6, -14); g.lineTo(15, -12); g.lineTo(15, -8); g.lineTo(6, -8); g.fill();
  g.fillStyle = 'rgba(80,160,255,.55)'; for (let i = 0; i < 5; i++){ g.beginPath(); g.arc(19 + i * 3, -10 + (i % 2 ? -2 : 2), 1.4, 0, 7); g.fill(); }
  g.fillStyle = '#9fc8f5'; g.beginPath(); g.rect(-7, 6, 14, 12); g.fill(); g.restore();
}
function catchKittens(){
  const {body, show} = sheet('funCatch', 'Catch the kittens');
  const best = get('try_catchbest', 0);
  const wrap = el('div', 'catch'); const cv = el('canvas'); wrap.append(cv);
  const hud = el('div', 'catch-hud'); const score = el('span', '', 'Score 0'); const time = el('span', '', '30s'); hud.append(score, time);
  const start = el('button', 'btn', 'Start'); start.type = 'button';
  const info = el('p', 'note', `Catch 🐱 (+1) and golden retrievers 🐶 (+3). Dodge cucumbers (−2) and the dreaded spray bottle (−3). Best: ${best}.`);
  body.append(hud, wrap, info, start); show();
  let run = null;
  const g = cv.getContext('2d');
  const size = () => { const w = wrap.clientWidth || 320, h = Math.max(260, Math.round(wrap.getBoundingClientRect().height) || Math.round(innerHeight * .6)); const d = devicePixelRatio || 1; cv.width = w * d; cv.height = h * d; cv.style.height = h + 'px'; g.setTransform(d, 0, 0, d, 0, 0); return {w, h}; };
  const move = e => { if (!run) return; const r = cv.getBoundingClientRect(); run.bx = Math.max(30, Math.min(run.w - 30, (e.touches ? e.touches[0].clientX : e.clientX) - r.left)); };
  cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move); cv.addEventListener('touchmove', e => { e.preventDefault(); move(e); }, {passive:false});
  start.onclick = () => {
    const {w, h} = size(); start.hidden = true;
    run = {w, h, bx:w / 2, items:[], drops:[], score:0, t0:performance.now(), last:0, spawn:0};
    const loop = t => {
      if (!run) return;
      const left = Math.max(0, 30 - (t - run.t0) / 1000);
      const dt = Math.min(50, t - (run.last || t)); run.last = t;
      if (t - run.spawn > Math.max(320, 760 - (30 - left) * 15)){ run.spawn = t; const r = Math.random(); run.items.push({x:20 + Math.random() * (w - 40), y:-30, v:1.6 + Math.random() * 1.6 + (30 - left) * .05, e:r < .14 ? '🐶' : r < .26 ? 'cuke' : r < .36 ? 'spray' : '🐱', rot:R(-.5, .5)}); }
      g.clearRect(0, 0, w, h);
      g.font = '30px system-ui, "Apple Color Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '30px system-ui, "Apple Color Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      run.items.forEach(it => { it.y += it.v * dt / 16; if (it.e === 'cuke') drawCuke(g, it.x, it.y, it.rot); else if (it.e === 'spray') drawSpray(g, it.x, it.y); else g.fillText(it.e, it.x, it.y); });
      g.font = '40px system-ui, "Apple Color Emoji", sans-serif'; g.fillText('🧺', run.bx, h - 26);
      run.items = run.items.filter(it => {
        if (it.y > h - 46 && it.y < h - 6 && Math.abs(it.x - run.bx) < 34){ const pts = it.e === '🐶' ? 3 : it.e === 'cuke' ? -2 : it.e === 'spray' ? -3 : 1; if (it.e === 'spray'){ FX.bigText('💦'); } else if (it.e === 'cuke') FX.shake(); run.score = Math.max(0, run.score + pts); blip(pts > 0 ? 640 + pts * 60 : 180, .08, pts > 0 ? 'sine' : 'square', .08); return false; }
        return it.y < h + 30;
      });
      score.textContent = `Score ${run.score}`; time.textContent = `${Math.ceil(left)}s`;
      if (left <= 0){
        const s = run.score; run = null; const prev = get('try_catchbest', 0);
        if (s > prev){ put('try_catchbest', s); confetti(); }
        info.textContent = s > prev ? `New record: ${s}! ${rnd(['Professional kitten wrangler.', 'The cats have unionized against you.', 'Somebody call the cat Olympics.'])}`
          : `${s} kittens caught. ${rnd([`Best is still ${prev}. The kittens are laughing.`, `So close to ${prev}. Again?`, `The cucumbers got you. Best: ${prev}.`])}`;
        start.textContent = 'Play again'; start.hidden = false; return;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  stoppers.push(() => { run = null; });
}

/* ================= F. Fortune cookie ================= */
const FORTUNES = [
  'A small snack will improve your mood by exactly 40%. Do not question the math.',
  'Today, a cat will judge you. Ignore it. You are doing great.',
  'You will find something you lost. It will be in the last place you look, because obviously.',
  'Someone is going to laugh at your joke today. Make it a bad one.',
  'Lucky numbers: 4, 17, and however many snacks you have left.',
  'The universe says: take the nap. The universe is never wrong about naps.',
  'A golden retriever somewhere is thinking about you right now.',
  'You will get a text that makes you smile. Possibly from me.',
  'Your next decision will be correct, unless it involves putting cheese on cereal.',
  'Good news travels fast. Yours is already on the way.',
  'Beware of people who say "quick question." It is never quick.',
  'Today is a great day to say no to one thing and yes to dessert.',
  'A surprise is coming. It is probably snacks.',
  'Your future holds a very comfortable blanket.',
  'You are one good playlist away from a great afternoon.',
  'The cat knocked it off the table for your own good. Probably.',
  'Something you have been worrying about will turn out fine. Mostly because you are you.',
  'In the near future you will say "I told you so." Enjoy it.',
  'You will soon find a parking spot right up front. Act casual.',
  'Someone thinks you are the coolest person they know. Spoiler: it is me.',
  'Treat yourself today. That is not a suggestion, it is a fortune.',
  'Today you will be 12% more charming than usual. Use it wisely.',
  'An unexpected nap will change your life.',
  'The answer is yes. The question was "should I get the fries."',
  'Your laugh will fix somebody\'s whole day today.',
];
function fortuneCookie(){
  const {body, show} = sheet('funFortune', 'Fortune cookie');
  const stage = el('div', 'fc');
  const cookie = el('button', 'fc-cookie'); cookie.type = 'button'; cookie.setAttribute('aria-label', 'Crack the fortune cookie');
  const half = side => `<svg class="fc-half ${side}" viewBox="0 0 200 140" aria-hidden="true"><defs><linearGradient id="fcg${side}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d08a"/><stop offset=".55" stop-color="#e0a24c"/><stop offset="1" stop-color="#b9772e"/></linearGradient></defs>
    <path d="${side === 'l' ? 'M100 30 C70 14 18 34 20 92 C48 70 80 76 100 112 Z' : 'M100 30 C130 14 182 34 180 92 C152 70 120 76 100 112 Z'}" fill="url(#fcg${side})" stroke="#a5672a" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="${side === 'l' ? 'M36 80 C44 52 68 38 94 40' : 'M164 80 C156 52 132 38 106 40'}" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="5" stroke-linecap="round"/>
    <path d="${side === 'l' ? 'M100 112 C86 92 62 82 40 86' : 'M100 112 C114 92 138 82 160 86'}" fill="none" stroke="rgba(140,80,20,.35)" stroke-width="3" stroke-linecap="round"/>
    <circle cx="${side === 'l' ? 58 : 142}" cy="58" r="2" fill="rgba(140,80,20,.35)"/><circle cx="${side === 'l' ? 76 : 124}" cy="70" r="1.6" fill="rgba(140,80,20,.3)"/></svg>`;
  cookie.innerHTML = half('l') + half('r') + '<span class="fc-paper" aria-hidden="true"></span>';
  const slip = el('p', 'fc-slip'); slip.hidden = true;
  const hint = el('p', 'note', 'Tap to crack it open.');
  const again = el('button', 'btn ghost', 'Another cookie'); again.type = 'button'; again.hidden = true;
  let last = -1;
  cookie.onclick = () => {
    if (cookie.classList.contains('open')) return;
    let i; do { i = Math.floor(Math.random() * FORTUNES.length); } while (i === last); last = i;
    cookie.classList.add('open'); blip(300, .06, 'square', .06); setTimeout(() => blip(220, .08, 'square', .05), 60);
    if (!reduced()){ const r2 = cookie.getBoundingClientRect(); add(Array.from({length:14}, () => ({e:rnd(['🟫', '🟧']), x:r2.left + r2.width / 2 + R(-20, 20), y:r2.top + r2.height * .6, vx:R(-3, 3), vy:R(-4, -1), g:.3, size:R(5, 9), vr:R(-.2, .2), life:900}))); }
    setTimeout(() => { slip.textContent = FORTUNES[i]; slip.hidden = false; hint.hidden = true; again.hidden = false; }, reduced() ? 0 : 650);
  };
  again.onclick = () => { cookie.classList.remove('open'); slip.hidden = true; hint.hidden = false; again.hidden = true; };
  stage.append(cookie, slip); body.append(stage, hint, again); show();
}

/* ================= G. Date night for two (password-locked) ================= */
const US_PASS = 'try_us_pass';
let usData = null;
async function openUs(pass){
  const r = await fetch('us.enc.json', {cache:'no-cache'}); if (!r.ok) throw 0;
  const e = await r.json();
  const b64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.normalize('NFKC').trim().toLowerCase()), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt:b64(e.salt), iterations:e.iter, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['decrypt']);
  const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:b64(e.iv)}, key, b64(e.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function dateNight(){
  const {body, show} = sheet('funUs', 'Just us');
  const saved = get(US_PASS, null);
  if (!usData && saved){ try { usData = await openUs(saved); } catch { put(US_PASS, null); } }
  if (!usData){
    const f = el('form', 'us-lock');
    f.innerHTML = '<div class="us-icon" aria-hidden="true">🔒</div><p>Grown-ups only. Enter the password.</p><label class="sr" for="usPass">Password</label><input id="usPass" type="password" autocomplete="off" autocapitalize="none" spellcheck="false"><label class="us-remember"><input type="checkbox" id="usRemember"> Remember on this phone</label><button class="btn">Unlock</button>';
    f.onsubmit = async e => { e.preventDefault(); const pw = f.querySelector('#usPass').value; if (!pw) return;
      try { usData = await openUs(pw); if (f.querySelector('#usRemember').checked) put(US_PASS, pw); dateNight(); }
      catch { A().toast('That\'s not it'); f.querySelector('#usPass').select(); } };
    body.append(f); show(); setTimeout(() => f.querySelector('#usPass').focus(), 350); return;
  }
  const dice = el('div', 'us-dice');
  const faces = usData.dice.map(() => { const d = el('div', 'us-die', '?'); dice.append(d); return d; });
  const labels = el('div', 'us-labels'); (usData.labels || []).forEach(l => labels.append(el('span', '', l)));
  const wild = el('p', 'us-wild'); wild.hidden = true;
  const roll = el('button', 'btn', 'Roll'); roll.type = 'button';
  const lock = el('button', 'btn ghost', 'Lock'); lock.type = 'button';
  lock.onclick = () => { usData = null; put(US_PASS, null); stopAll(); A().close(); A().toast('Locked'); };
  roll.onclick = () => {
    roll.disabled = true; wild.hidden = true;
    const spins = reduced() ? 1 : 10; let n = 0;
    const iv = setInterval(() => {
      n++; faces.forEach((f, i) => { f.textContent = rnd(usData.dice[i]); f.classList.toggle('spin', n < spins); });
      blip(400 + n * 30, .03, 'triangle', .05);
      if (n >= spins){ clearInterval(iv); roll.disabled = false; if (usData.wild && Math.random() < .2){ wild.textContent = '🃏 ' + rnd(usData.wild); wild.hidden = false; } }
    }, 70);
  };
  const row = el('div', 'us-row'); row.append(roll, lock);
  body.append(labels, dice, wild, row); show();
}

/* ================= H. Croatia photo games ================= */
const shortDate = m => { const [y, mo, d] = (m.date || '').split('-').map(Number); return y ? new Date(y, mo - 1, d).toLocaleDateString('en-US', {month:'short', day:'numeric'}) : ''; };
const caption = m => [m.place, shortDate(m)].filter(Boolean).join(' · ');
const stamp = m => { const [y, mo, d] = (m.date || '').split('-').map(Number); const [hh, mm] = String(m.time || '12:00').split(':').map(Number); return new Date(y, mo - 1, d, hh || 12, mm || 0).getTime(); };
async function tripPhotos(min){
  const pool = A().loadTrip ? await A().loadTrip() : null;
  const ph = pool ? pool.filter(m => m.k === 'p' && m.thumb && m.full) : [];
  return ph.length >= min ? ph : null;
}
const pickN = (arr, n, key = m => m.thumb) => { const out = [], seen = new Set(); let guard = 0; while (out.length < n && guard++ < 2000){ const p = rnd(arr); if (!seen.has(key(p))){ seen.add(key(p)); out.push(p); } } return out; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const noPhotos = body => body.append(el('p', 'note', 'I couldn\'t reach the Croatia photos just now. Try again in a bit.'));
function lightbox(host, m){
  const box = el('div', 'lb'); box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', caption(m));
  const img = el('img'); img.src = m.full; img.alt = caption(m);
  const cap = el('p', 'lb-cap', caption(m)); const x = el('button', 'btn ghost', 'Close'); x.type = 'button'; x.onclick = () => box.remove();
  box.append(img, cap, x); box.onclick = e => { if (e.target === box) box.remove(); }; host.append(box);
}
const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Memory match: Easy/Hard, 3D flips, "where & when" on every match, timer, and a gallery at the end.
async function memoryMatch(level){
  const {body, show} = sheet('funMatch', 'Memory match');
  if (!level){
    const best = get('try_matchbest2', {});
    body.append(el('p', 'note', 'Flip two cards. Find the pairs from our trip.'));
    const row = el('div', 'mm-levels');
    [['easy', 'Easy', '6 pairs'], ['hard', 'Hard', '10 pairs']].forEach(([k, l, d]) => { const b = el('button', 'tile'); b.type = 'button';
      b.innerHTML = `<span class="e" aria-hidden="true">${k === 'easy' ? '🙂' : '🔥'}</span><span>${l} · ${d}</span><small>${best[k] ? `Best ${best[k].moves} moves · ${fmtTime(best[k].secs)}` : 'No record yet'}</small>`;
      b.onclick = () => memoryMatch(k); row.append(b); });
    body.append(row); show(); return;
  }
  const pairs = level === 'hard' ? 10 : 6;
  body.append(el('p', 'note', 'Shuffling photos…')); show();
  const photos = await tripPhotos(pairs); body.innerHTML = '';
  if (!photos){ noPhotos(body); return; }
  const picks = pickN(photos, pairs);
  const cards = shuffle([...picks, ...picks]);
  const hud = el('div', 'mm-hud'); const hm = el('span', '', '0 moves'); const ht = el('span', '', '0:00'); hud.append(hm, ht);
  const cap = el('p', 'mm-cap', 'Find the pairs.');
  const grid = el('div', 'mm-grid' + (level === 'hard' ? ' hard' : ''));
  let first = null, lock = false, moves = 0, found = 0, t0 = 0, timer = 0;
  const tick = () => { ht.textContent = fmtTime((performance.now() - t0) / 1000); };
  cards.forEach(p => {
    const b = el('button', 'mm-card'); b.type = 'button'; b.setAttribute('aria-label', 'Hidden photo');
    b.innerHTML = `<span class="mm-inner"><span class="mm-face mm-back" aria-hidden="true">✦</span><span class="mm-face mm-front"><img alt="" loading="lazy" src="${p.thumb}"><span class="mm-tag"></span></span></span>`;
    b.querySelector('.mm-tag').textContent = p.place || '';
    b.onclick = () => {
      if (lock || b.classList.contains('up')) return;
      if (!t0){ t0 = performance.now(); timer = setInterval(tick, 500); }
      b.classList.add('up'); b.setAttribute('aria-label', caption(p)); blip(600, .05);
      if (!first){ first = {b, p}; return; }
      moves++; hm.textContent = `${moves} moves`;
      if (first.p.thumb === p.thumb){
        found++; first.b.classList.add('done'); b.classList.add('done'); first = null; blip(880, .12);
        cap.textContent = `📍 ${caption(p)}`; cap.classList.remove('pop'); void cap.offsetWidth; cap.classList.add('pop');
        if (found === pairs) finish();
      } else { lock = true; const a = first.b; first = null; setTimeout(() => { [a, b].forEach(x => { x.classList.remove('up'); x.setAttribute('aria-label', 'Hidden photo'); }); lock = false; }, 950); }
    };
    grid.append(b);
  });
  const finish = () => {
    clearInterval(timer); const secs = (performance.now() - t0) / 1000; confetti();
    const all = get('try_matchbest2', {}); const prev = all[level]; const record = !prev || moves < prev.moves || (moves === prev.moves && secs < prev.secs);
    if (record){ all[level] = {moves, secs}; put('try_matchbest2', all); }
    setTimeout(() => {
      body.innerHTML = '';
      body.append(el('p', 'mm-done', `All ${pairs} pairs in ${moves} moves · ${fmtTime(secs)}`), el('p', 'note', record ? 'New record. Your memory is elite.' : `Best is ${prev.moves} moves · ${fmtTime(prev.secs)}.`));
      const gal = el('div', 'mm-gallery');
      picks.forEach(p => { const b = el('button', 'mm-thumb'); b.type = 'button'; b.setAttribute('aria-label', 'Open ' + caption(p)); b.innerHTML = `<img alt="" src="${p.thumb}"><span></span>`; b.lastChild.textContent = caption(p); b.onclick = () => lightbox(body, p); gal.append(b); });
      const row = el('div', 'us-row'); const again = el('button', 'btn', 'Play again'); again.type = 'button'; again.onclick = () => memoryMatch(level);
      const lv = el('button', 'btn ghost', level === 'easy' ? 'Try Hard' : 'Try Easy'); lv.type = 'button'; lv.onclick = () => memoryMatch(level === 'easy' ? 'hard' : 'easy');
      row.append(again, lv); body.append(el('p', 'note', 'Tap a photo to see it big.'), gal, row);
    }, 900);
  };
  stoppers.push(() => clearInterval(timer));
  body.append(hud, grid, cap);
}

// E. Photo puzzle: slide the tiles back into place.
async function photoPuzzle(){
  const {body, show} = sheet('funPuzzle', 'Photo puzzle');
  body.append(el('p', 'note', 'Cutting up a photo…')); show();
  const photos = await tripPhotos(1); body.innerHTML = '';
  if (!photos){ noPhotos(body); return; }
  const p = rnd(photos), N = 3;
  const img = new Image(); img.src = p.full;
  const board = el('div', 'pz'); const info = el('p', 'note', 'Tap a tile next to the gap to slide it.'); const hud = el('p', 'mm-hud', '0 moves');
  let tiles = [...Array(N * N).keys()]; // value = home index; N*N-1 is the gap
  const gapHome = N * N - 1;
  const neighbors = i => [i - N, i + N, i % N ? i - 1 : -1, (i + 1) % N ? i + 1 : -1].filter(j => j >= 0 && j < N * N);
  let gap = tiles.indexOf(gapHome); let last = -1;
  for (let k = 0; k < 160; k++){ const opts = neighbors(gap).filter(j => j !== last); const j = rnd(opts); [tiles[gap], tiles[j]] = [tiles[j], tiles[gap]]; last = gap; gap = j; }
  let moves = 0;
  const draw = () => {
    board.innerHTML = '';
    tiles.forEach((v, i) => {
      const t = el('button', 'pz-tile' + (v === gapHome ? ' gap' : '')); t.type = 'button';
      if (v !== gapHome){ t.style.backgroundImage = `url("${p.full}")`; t.style.backgroundPosition = `${(v % N) / (N - 1) * 100}% ${Math.floor(v / N) / (N - 1) * 100}%`; t.setAttribute('aria-label', `Tile ${v + 1}`); }
      else t.setAttribute('aria-label', 'Gap');
      t.onclick = () => { const g = tiles.indexOf(gapHome); if (!neighbors(g).includes(i)) return; [tiles[g], tiles[i]] = [tiles[i], tiles[g]]; moves++; hud.textContent = `${moves} moves`; blip(500 + Math.random() * 200, .04); draw(); if (tiles.every((x, k) => x === k)) win(); };
      board.append(t);
    });
  };
  const win = () => { confetti(); board.classList.add('solved'); board.innerHTML = ''; const full = el('img', 'pz-full'); full.src = p.full; full.alt = caption(p); board.append(full);
    info.textContent = `Solved in ${moves} moves! 📍 ${caption(p)}`; const again = el('button', 'btn', 'Another photo'); again.type = 'button'; again.onclick = photoPuzzle; body.append(again); };
  const peek = el('button', 'btn ghost', 'Peek at the photo'); peek.type = 'button'; peek.onclick = () => lightbox(body, p);
  body.append(hud, board, info, peek); draw();
}

// F. Which came first? Tap the photo taken earlier.
async function whichFirst(){
  const {body, show} = sheet('funFirst', 'Which came first?');
  body.append(el('p', 'note', 'Picking photos…')); show();
  const photos = await tripPhotos(6); body.innerHTML = '';
  if (!photos){ noPhotos(body); return; }
  const total = 8; let round = 0, score = 0;
  const hud = el('p', 'mm-hud'); const pair = el('div', 'wf-pair'); const msg = el('p', 'note'); const next = el('button', 'btn', 'Next'); next.type = 'button'; next.hidden = true;
  const play = () => {
    if (round >= total){ pair.innerHTML = ''; msg.textContent = `${score} of ${total}! ${score >= 7 ? 'You have a time machine for a brain.' : score >= 5 ? 'Solid trip memory.' : 'Time is a blur on vacation. As it should be.'}`; next.textContent = 'Play again'; next.hidden = false; next.onclick = () => { round = 0; score = 0; next.textContent = 'Next'; play(); }; if (score >= 6) confetti(); return; }
    round++; next.hidden = true; msg.textContent = 'Tap the photo that was taken first.'; hud.textContent = `Round ${round} of ${total} · ${score} right`;
    let a, b, guard = 0; do { [a, b] = pickN(photos, 2); } while (Math.abs(stamp(a) - stamp(b)) < 36e5 && guard++ < 50);
    pair.innerHTML = '';
    [a, b].forEach(p => { const c = el('button', 'wf-card'); c.type = 'button'; c.innerHTML = `<img alt="" src="${p.thumb}"><span class="wf-when"></span>`; c.setAttribute('aria-label', 'Choose this photo');
      c.onclick = () => { if (!next.hidden) return; const earlier = stamp(a) <= stamp(b) ? a : b; const right = p === earlier; if (right) score++;
        pair.querySelectorAll('.wf-card').forEach((x, i) => { const q = i ? b : a; x.classList.add(q === earlier ? 'right' : 'wrong'); x.querySelector('.wf-when').textContent = `${shortDate(q)}${q.time ? ', ' + q.time : ''} · ${q.place}`; });
        blip(right ? 880 : 200, .1, right ? 'sine' : 'square', .07); msg.textContent = right ? rnd(['Yes! Good memory.', 'Correct. Very impressive.', 'Nailed it.']) : 'Nope, the other one came first.'; hud.textContent = `Round ${round} of ${total} · ${score} right`; next.hidden = false; next.onclick = play; };
      pair.append(c); });
  };
  body.append(hud, pair, msg, next); play();
}

// G. Zoom detective: the photo starts zoomed way in and slowly zooms out. Guess sooner, score more.
async function zoomDetective(){
  const {body, show} = sheet('funZoom', 'Zoom detective');
  body.append(el('p', 'note', 'Loading the evidence…')); show();
  const photos = await tripPhotos(6); body.innerHTML = '';
  if (!photos){ noPhotos(body); return; }
  const places = [...new Set(photos.map(p => p.place))];
  if (places.length < 4){ noPhotos(body); return; }
  const total = 5, DUR = 12000; let round = 0, score = 0, raf = 0;
  const hud = el('p', 'mm-hud'); const frame = el('div', 'zd'); const img = el('img'); img.alt = 'A mystery photo'; frame.append(img);
  const opts = el('div', 'game-opts zd-opts'); const msg = el('p', 'note'); const next = el('button', 'btn', 'Next'); next.type = 'button'; next.hidden = true;
  const play = () => {
    cancelAnimationFrame(raf);
    if (round >= total){ opts.innerHTML = ''; img.style.transform = 'none'; msg.textContent = `Case closed: ${score} points. ${score >= 35 ? 'Detective of the year.' : score >= 20 ? 'Sharp eyes.' : 'The clues were very blurry. Not your fault.'}`; next.textContent = 'Play again'; next.hidden = false; next.onclick = () => { round = 0; score = 0; next.textContent = 'Next'; play(); }; if (score >= 30) confetti(); return; }
    round++; next.hidden = true; msg.textContent = 'Guess the place before it zooms all the way out.';
    const p = rnd(photos); const choices = shuffle([p.place, ...shuffle(places.filter(x => x !== p.place)).slice(0, 3)]);
    const fx = 20 + Math.random() * 60, fy = 20 + Math.random() * 60;
    img.src = p.full; img.style.transformOrigin = `${fx}% ${fy}%`;
    let t0 = 0, done = false;
    const step = t => { if (!t0) t0 = t; const k = Math.min(1, (t - t0) / DUR); img.style.transform = `scale(${(7 - 6 * k).toFixed(3)})`; if (k < 1 && !done) raf = requestAnimationFrame(step); };
    img.onload = () => { raf = requestAnimationFrame(step); };
    hud.textContent = `Case ${round} of ${total} · ${score} points`;
    opts.innerHTML = '';
    choices.forEach(c => { const b = el('button', 'btn ghost', c); b.type = 'button';
      b.onclick = () => { if (done) return; done = true; cancelAnimationFrame(raf); const left = t0 ? Math.max(0, DUR - (performance.now() - t0)) : DUR; const pts = c === p.place ? 1 + Math.ceil(left / 1000) : 0; score += pts;
        img.style.transform = 'none';
        opts.querySelectorAll('button').forEach(x => { x.disabled = true; if (x.textContent === p.place) x.className = 'btn right'; else if (x === b) x.className = 'btn wrong'; });
        blip(pts ? 880 : 200, .1, pts ? 'sine' : 'square', .07); msg.textContent = pts ? `Yes! ${caption(p)}. +${pts} points` : `It was ${caption(p)}.`; hud.textContent = `Case ${round} of ${total} · ${score} points`; next.hidden = false; next.onclick = play; };
      opts.append(b); });
  };
  stoppers.push(() => cancelAnimationFrame(raf));
  body.append(hud, frame, opts, msg, next); play();
}

// H. Trip timeline: tap four photos in the order they happened.
async function tripTimeline(){
  const {body, show} = sheet('funTimeline', 'Trip timeline');
  body.append(el('p', 'note', 'Picking four moments…')); show();
  const photos = await tripPhotos(8); body.innerHTML = '';
  if (!photos){ noPhotos(body); return; }
  const byDay = {}; photos.forEach(p => (byDay[p.date] = byDay[p.date] || []).push(p));
  const days = Object.keys(byDay); if (days.length < 4){ noPhotos(body); return; }
  const set = shuffle(days).slice(0, 4).map(d => rnd(byDay[d]));
  const correct = set.slice().sort((a, b) => stamp(a) - stamp(b));
  const msg = el('p', 'note', 'Tap the photos in the order they happened: first to last.');
  const grid = el('div', 'tl-grid'); const order = [];
  const row = el('div', 'us-row'); const reset = el('button', 'btn ghost', 'Start over'); reset.type = 'button'; const check = el('button', 'btn', 'Check'); check.type = 'button'; check.disabled = true;
  const draw = () => {
    grid.innerHTML = '';
    set.forEach(p => { const n = order.indexOf(p); const c = el('button', 'tl-card' + (n >= 0 ? ' picked' : '')); c.type = 'button'; c.innerHTML = `<img alt="" src="${p.thumb}"><span class="tl-num">${n >= 0 ? n + 1 : ''}</span><span class="tl-when"></span>`;
      c.setAttribute('aria-label', n >= 0 ? `Photo, number ${n + 1}` : 'Photo, not numbered yet');
      c.onclick = () => { if (check.dataset.done) return; if (n >= 0) order.splice(n, 1); else order.push(p); blip(500 + order.length * 80, .05); check.disabled = order.length < 4; draw(); };
      grid.append(c); });
  };
  reset.onclick = () => { order.length = 0; check.disabled = true; draw(); };
  check.onclick = () => {
    check.dataset.done = '1'; let right = 0;
    grid.querySelectorAll('.tl-card').forEach((c, i) => { const p = set[i]; const ok = order.indexOf(p) === correct.indexOf(p); if (ok) right++; c.classList.add(ok ? 'right' : 'wrong'); c.querySelector('.tl-num').textContent = correct.indexOf(p) + 1; c.querySelector('.tl-when').textContent = `${shortDate(p)} · ${p.place}`; });
    msg.textContent = right === 4 ? 'Perfect timeline! You remember everything.' : `${right} of 4 in the right spot. The numbers now show the real order.`;
    if (right === 4) confetti();
    check.textContent = 'New photos'; check.disabled = false; check.onclick = tripTimeline; reset.hidden = true;
  };
  row.append(reset, check); body.append(msg, grid, row); draw();
}

/* ================= I. Brag button ================= */
const TROPHY_LINES = ['Put it on the fridge. Frame it. Tell the cats.', 'Official ruling: you are crushing it.', 'This deserves a parade. I\'ll bring the confetti. Oh wait, I just did.', 'I\'m so proud of you. Seriously.', 'Somebody give this woman a trophy. Oh, here\'s one.', 'Hall of fame material right here.'];
function bragButton(){
  const {body, show} = sheet('funBrag', 'Brag button');
  const brags = get('try_brags', 0);
  const f = el('form', 'brag');
  f.innerHTML = '<label for="bragIn">What did you do? Big or small, it counts.</label><textarea id="bragIn" maxlength="200" rows="2" placeholder="e.g. Answered every email. Didn\'t cry at the DMV."></textarea><button class="btn">🎉 Brag</button>';
  const shelf = el('p', 'brag-shelf', brags ? `🏆 × ${brags} on your shelf` : 'Your trophy shelf is empty. For now.');
  const out = el('div', 'brag-out');
  f.onsubmit = e => { e.preventDefault(); const t = f.querySelector('textarea').value.trim(); if (!t) return;
    const n = get('try_brags', 0) + 1; put('try_brags', n);
    if (A().addLedger) A().addLedger(t);
    confetti(140); blip(523, .12, 'triangle'); setTimeout(() => blip(659, .12, 'triangle'), 120); setTimeout(() => blip(784, .25, 'triangle'), 240);
    if (A().voiceNote) A().voiceNote('proud', 1500);
    out.innerHTML = ''; const tr = el('div', 'brag-trophy', '🏆'); const said = el('p', 'brag-said'); said.textContent = `"${t}"`; out.append(tr, said, el('p', 'brag-line', rnd(TROPHY_LINES)));
    shelf.textContent = `🏆 × ${n} on your shelf · saved to your Good Things Ledger`; f.querySelector('textarea').value = ''; };
  body.append(f, out, shelf); show();
}

/* ================= Menus (More fun, Croatia games) ================= */
function menu(id, title, items, intro){
  const {body, show} = sheet(id, title);
  if (intro) body.append(el('p', 'note', intro));
  const grid = el('div', 'tiles');
  items.forEach(([e, label, fn]) => { const b = el('button', 'tile'); b.type = 'button'; b.innerHTML = `<span class="e" aria-hidden="true">${e}</span><span></span>`; b.lastChild.textContent = label; b.onclick = () => { stopAll(); fn(); }; grid.append(b); });
  body.append(grid); show();
}
const moreFun = items => menu('funMore', 'More fun', items);
async function croatiaGames(items){
  const {body, show} = sheet('funCroatia', 'Croatia games');
  body.append(el('p', 'note', 'Little games made from our trip photos.'));
  const grid = el('div', 'pc-grid');
  const pool = A().loadTrip ? await A().loadTrip() : null; const ph = pool ? shuffle(pool.filter(m => m.k === 'p' && m.thumb)) : [];
  items.forEach(([e, label, fn], i) => { const b = el('button', 'pc-card'); b.type = 'button';
    if (ph[i]) b.style.backgroundImage = `url("${ph[i].thumb}")`;
    b.innerHTML = `<span class="pc-e" aria-hidden="true">${e}</span><span class="pc-t"></span>`; b.querySelector('.pc-t').textContent = label; b.setAttribute('aria-label', label);
    b.onclick = () => { stopAll(); fn(); }; grid.append(b); });
  body.append(grid); show();
}

/* ================= Effects engine v2 (secret words + message effects) =================
   One shared full-screen canvas, emoji pre-rendered to sprites (no font jank), every particle eases in and out,
   scenes (waves, night sky, storm, disco, rainbow) are painted on the canvas instead of popping DOM overlays. */
const R = (a, b) => a + Math.random() * (b - a);
const ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
const sprites = new Map();
function sprite(e, size){
  const key = e + size; if (sprites.has(key)) return sprites.get(key);
  const d = Math.min(3, devicePixelRatio || 1), c = document.createElement('canvas'); c.width = c.height = Math.ceil(size * 1.3 * d);
  const g = c.getContext('2d'); g.scale(d, d); g.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, size * .65, size * .7);
  const s = {c, w:size * 1.3}; sprites.set(key, s); return s;
}
const stage = {c:null, g:null, W:0, H:0, items:[], scenes:[], raf:0};
function ensureStage(){
  if (stage.c) return;
  const c = el('canvas', 'fx-stage'); document.body.appendChild(c); stage.c = c; stage.g = c.getContext('2d');
  const fit = () => { const d = Math.min(2, devicePixelRatio || 1); stage.W = innerWidth; stage.H = innerHeight; c.width = stage.W * d; c.height = stage.H * d; stage.g.setTransform(d, 0, 0, d, 0, 0); };
  fit(); addEventListener('resize', fit);
}
function run(){
  if (stage.raf) return; let last = performance.now();
  const frame = t => {
    const dt = Math.min(48, t - last) / 16.67; last = t; const {g, W, H} = stage;
    g.clearRect(0, 0, W, H);
    stage.scenes = stage.scenes.filter(s => { const k = (t - s.t0) / s.dur; if (k >= 1) return false; s.draw(g, W, H, k, t); return true; });
    stage.items = stage.items.filter(p => {
      const age = t - p.t0; if (age < 0) return true; if (age > p.life) return false;
      p.vy += (p.g || 0) * dt; p.vx *= p.drag || 1; p.vy *= p.drag || 1; p.x += p.vx * dt + (p.sway ? Math.sin((age / 1000 + p.ph) * p.sway) * .8 : 0); p.y += p.vy * dt; p.rot += (p.vr || 0) * dt;
      const a = Math.min(ease(age / 220), ease((p.life - age) / 500)), sc = p.pop ? .4 + .6 * ease(age / 260) : 1;
      const s = sprite(p.e, p.size); g.save(); g.globalAlpha = a * (p.alpha || 1); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(sc * (p.flip ? -1 : 1), sc); g.drawImage(s.c, -s.w / 2, -s.w / 2, s.w, s.w); g.restore();
      return true; });
    if (stage.items.length || stage.scenes.length) stage.raf = requestAnimationFrame(frame); else { stage.raf = 0; g.clearRect(0, 0, W, H); }
  };
  stage.raf = requestAnimationFrame(frame);
}
const add = list => { if (reduced()) return; ensureStage(); const t = performance.now(); list.forEach(p => { p.t0 = t + (p.delay || 0); p.rot = p.rot || 0; stage.items.push(p); }); run(); };
const scene = (dur, draw) => { if (reduced()) return; ensureStage(); stage.scenes.push({t0:performance.now(), dur, draw}); run(); };
const FX = {
  rain:(emojis, n = 36) => add(Array.from({length:n}, () => ({e:rnd(emojis), x:R(0, innerWidth), y:R(-80, -20), vx:R(-.3, .3), vy:R(2.4, 4.4), size:R(24, 40), vr:R(-.02, .02), sway:R(1, 2.5), ph:R(0, 6), life:R(3200, 4200), delay:R(0, 1400), pop:true}))),
  rise:(emojis, n = 24) => add(Array.from({length:n}, () => ({e:rnd(emojis), x:R(20, innerWidth - 20), y:innerHeight + 30, vx:R(-.3, .3), vy:R(-3.6, -2), size:R(24, 42), vr:R(-.01, .01), sway:R(1.5, 3), ph:R(0, 6), life:R(3400, 4400), delay:R(0, 1200), pop:true}))),
  burst:(emojis, n = 34) => add(Array.from({length:n}, () => { const a = R(0, Math.PI * 2), v = R(3, 9); return {e:rnd(emojis), x:innerWidth / 2, y:innerHeight * .48, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 2, g:.16, drag:.985, size:R(22, 38), vr:R(-.05, .05), life:R(2000, 2800), pop:true}; })),
  // emoji animals face left, so they're mirrored to run forward
  across:(e, {size = 90, y = .55, speed = 9} = {}) => add([{e, x:-size, y:innerHeight * y, vx:speed, vy:0, size, flip:true, life:(innerWidth + size * 2) / speed * 16.67, sway:3, ph:0}]),
  bigText:t => { const o = el('div', 'fx-big', t); document.body.appendChild(o); setTimeout(() => o.remove(), 1500); },
  shake:() => { const a = document.getElementById('app'); if (!a || reduced()) return; a.classList.remove('fx-shake'); void a.offsetWidth; a.classList.add('fx-shake'); setTimeout(() => a.classList.remove('fx-shake'), 700); },
  squeeze:() => { const a = document.getElementById('app'); if (!a || reduced()) return; a.classList.remove('fx-hug'); void a.offsetWidth; a.classList.add('fx-hug'); setTimeout(() => a.classList.remove('fx-hug'), 1300); },
  fireworks:() => { const cols = ['#ffd36b', '#ff7aa2', '#7ad7ff', '#b98cff', '#ffffff', '#ffb36b'];
    for (let k = 0; k < 6; k++){ const cx = R(.2, .8), cy = R(.18, .45), col = rnd(cols), t1 = k * 380;
      scene(2200 + t1, (g, W, H, kk, t) => { const el2 = kk * (2200 + t1) - t1; if (el2 < 0) return; const up = Math.min(1, el2 / 500);
        if (up < 1){ g.fillStyle = col; g.beginPath(); g.arc(W * cx, H * (1 - (1 - cy) * ease(up)), 3, 0, 7); g.fill(); return; }
        const e2 = (el2 - 500) / 1500, r = ease(e2) * Math.min(W, H) * .22; g.globalAlpha = Math.max(0, 1 - e2);
        for (let i = 0; i < 28; i++){ const a = i / 28 * Math.PI * 2; const x = W * cx + Math.cos(a) * r, y = H * cy + Math.sin(a) * r + e2 * e2 * 40; g.fillStyle = col; g.beginPath(); g.arc(x, y, 2.6 * (1 - e2) + .6, 0, 7); g.fill(); }
        g.globalAlpha = 1; }); } },
  // The Adriatic rolls in: layered waves with foam crests and sparkles, then slides back out
  wave:() => scene(3600, (g, W, H, k, t) => {
    const lvl = k < .45 ? ease(k / .45) : 1 - ease((k - .55) / .45) * (k > .55 ? 1 : 0), top = H * (1 - .5 * lvl);
    const layers = [['rgba(14,92,128,.55)', 0, 18, .9], ['rgba(28,140,170,.55)', 18, 14, 1.3], ['rgba(64,184,200,.6)', 34, 11, 1.8]];
    layers.forEach(([col, off, amp, sp]) => { const y0 = top + off; g.fillStyle = col; g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) g.lineTo(x, y0 + Math.sin(x / 70 + t / 1000 * sp) * amp + Math.sin(x / 31 + t / 700) * amp * .35); g.lineTo(W, H); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 8){ const y = y0 + Math.sin(x / 70 + t / 1000 * sp) * amp + Math.sin(x / 31 + t / 700) * amp * .35; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); });
    for (let i = 0; i < 26; i++){ const x = (i * 97 + t / 9) % W, y = top + 60 + ((i * 53) % Math.max(1, H - top - 40)); g.fillStyle = `rgba(255,255,255,${.35 + .35 * Math.sin(t / 200 + i)})`; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } }),
  stars:() => scene(4200, (g, W, H, k, t) => {
    const a = Math.min(ease(k / .2), ease((1 - k) / .25)); const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, `rgba(8,10,34,${.85 * a})`); grd.addColorStop(1, `rgba(40,30,80,${.6 * a})`); g.fillStyle = grd; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++){ const x = (i * 137.5) % W, y = (i * 71.3) % (H * .75), tw = .5 + .5 * Math.sin(t / 400 + i * 1.7); g.fillStyle = `rgba(255,248,220,${a * tw})`; g.beginPath(); g.arc(x, y, i % 9 ? 1.2 : 2.2, 0, 7); g.fill(); }
    if (k > .3 && k < .6){ const s = (k - .3) / .3, x = W * (.15 + .7 * s), y = H * (.12 + .25 * s); const sg = g.createLinearGradient(x - 90, y - 32, x, y); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(1, `rgba(255,255,255,${a})`); g.strokeStyle = sg; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x - 90, y - 32); g.lineTo(x, y); g.stroke(); }
    g.font = `${Math.min(W, H) * .16}px "Apple Color Emoji",system-ui`; g.globalAlpha = a; g.fillText('🌙', W * .72, H * .2); g.globalAlpha = 1; }),
  disco:() => scene(3600, (g, W, H, k, t) => { const a = Math.min(ease(k / .15), ease((1 - k) / .25)); g.globalCompositeOperation = 'source-over';
    g.fillStyle = `rgba(20,10,40,${.45 * a})`; g.fillRect(0, 0, W, H);
    ['255,64,160', '64,200,255', '255,220,64', '150,90,255', '80,255,170'].forEach((c, i) => { const ang = t / 700 + i * 1.26, x = W / 2 + Math.cos(ang) * W * .38, y = H * .45 + Math.sin(ang * 1.3) * H * .3, r = Math.min(W, H) * .42;
      const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(${c},${.55 * a})`); rg.addColorStop(1, `rgba(${c},0)`); g.fillStyle = rg; g.fillRect(0, 0, W, H); });
    g.font = '64px "Apple Color Emoji",system-ui'; g.textAlign = 'center'; g.globalAlpha = a; g.save(); g.translate(W / 2, 70 + Math.sin(t / 300) * 6); g.rotate(Math.sin(t / 500) * .2); g.fillText('🪩', 0, 0); g.restore(); g.globalAlpha = 1; }),
  storm:() => { scene(3600, (g, W, H, k, t) => { const a = Math.min(ease(k / .15), ease((1 - k) / .2)), clear = ease((k - .55) / .3);
      g.fillStyle = `rgba(40,48,66,${.55 * a * (1 - clear)})`; g.fillRect(0, 0, W, H);
      if (k > .2 && k < .24 || k > .36 && k < .38) { g.fillStyle = `rgba(255,255,240,${.6 * a})`; g.fillRect(0, 0, W, H); }
      g.strokeStyle = `rgba(190,210,235,${.6 * a * (1 - clear)})`; g.lineWidth = 1.4; g.beginPath(); for (let i = 0; i < 70; i++){ const x = (i * 53 + t * .9) % (W + 40) - 20, y = (i * 97 + t * 1.6) % H; g.moveTo(x, y); g.lineTo(x - 6, y + 16); } g.stroke();
      if (clear > 0){ const rg = g.createRadialGradient(W * .78, H * .12, 0, W * .78, H * .12, Math.max(W, H) * .7); rg.addColorStop(0, `rgba(255,214,120,${.55 * clear * a})`); rg.addColorStop(1, 'rgba(255,214,120,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }
      g.font = `${Math.min(W, H) * .22}px "Apple Color Emoji",system-ui`; g.textAlign = 'center'; g.globalAlpha = a; g.fillText(clear > .3 ? '🌤️' : '⛈️', W * .5 + (k - .5) * 60, H * .24); g.globalAlpha = 1; }); },
  rainbow:() => scene(3400, (g, W, H, k) => { const a = Math.min(ease(k / .2), ease((1 - k) / .3)), reveal = ease(k / .45);
    ['#ff5a5a', '#ffa54a', '#ffe14a', '#5ad06a', '#4aa8ff', '#8a6bff'].forEach((c, i) => { g.strokeStyle = c; g.globalAlpha = .55 * a; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.arc(W / 2, H * .72, Math.min(W, H) * .62 - i * 14, Math.PI, Math.PI + Math.PI * reveal); g.stroke(); });
    g.globalAlpha = 1; }),
  dim:(ms = 3000, a0 = .5) => scene(ms, (g, W, H, k) => { g.fillStyle = `rgba(10,8,24,${a0 * Math.min(ease(k / .2), ease((1 - k) / .3))})`; g.fillRect(0, 0, W, H); }),
  zoomies:() => { if (reduced() || !window.iRobCat) return; const o = el('div', 'fx-zoomies'); o.innerHTML = window.iRobCat.sitting(((get(PK, null) || {}).coat) || 'orange', 'wide'); document.body.appendChild(o); setTimeout(() => o.remove(), 2700); },
};

// 1A. Secret words she can type. [match, name, description, effect]
const SECRETS = [
  [/\b(kittens?|kitty|kitties)\b/i, 'kitten', 'Kitten weather. Bring an umbrella. Or don\'t, they\'re soft.', () => FX.rain(['🐱', '😺', '😸', '🐈'], 36)],
  [/\b(puppy|puppies|golden retriever|doggo)\b/i, 'puppy', 'A very good boy sprints through at 40 mph. He will not stop to explain.', () => FX.across('🐕', {size:96, y:.62, speed:12})],
  [/\b(croatia|dubrovnik|cavtat|lokrum)\b/i, 'croatia', 'The Adriatic stops by to say hi. Please wipe your feet.', () => FX.wave()],
  [/\b(love you|luv you|ily)\b/i, 'love you', 'Hearts. So many hearts. A medically concerning amount of hearts.', () => FX.burst(['💗', '💕', '💖', '❤️'], 40)],
  [/\bhappy birthday\b/i, 'happy birthday', 'Balloons. Nobody had to blow them up.', () => FX.rise(['🎈', '🎈', '🎉', '🎂'], 30)],
  [/\bpizza\b/i, 'pizza', 'It\'s raining pizza. This is the weather we were promised.', () => FX.rain(['🍕'], 30)],
  [/\bcucumbers?\b/i, 'cucumber', 'A cucumber appears. Every cat in the app files a complaint and leaves.', () => { FX.bigText('🥒'); FX.burst(['🙀', '😾', '🐈'], 18); }],
  [/\b(coffee|caffeine|espresso)\b/i, 'coffee', 'Caffeine shakes, but for your phone.', () => { FX.rise(['☕', '☕', '⚡'], 16); FX.shake(); }],
  [/\b(boo|halloween|spooky)\b/i, 'boo', 'Ghosts drift by. They\'re friendly. Mostly.', () => { FX.dim(3600, .55); FX.rise(['👻', '🎃', '🦇'], 22); }],
  [/\b(party|dance|disco)\b/i, 'party', 'Instant disco. No cover charge. Questionable lighting.', () => FX.disco()],
  [/\b(cha-?ching|bookings?|money|rich)\b/i, 'money', 'Make it rain. Every bill is a booking. Manifesting.', () => FX.rain(['💸', '💵', '🤑'], 34)],
  [/\bsnow\b/i, 'snow', 'Florida-legal snow. Melts in three seconds, like real Florida snow.', () => FX.rain(['❄️', '❄️', '⛄'], 40)],
  [/\b(nap|naptime|sleepy|zzz)\b/i, 'nap', 'The whole app lies down with you. Don\'t tell anyone.', () => { FX.dim(3200, .45); FX.rise(['💤', '💤', '🌙'], 14); }],
  [/\b(cheers|bellini|champagne|wine)\b/i, 'cheers', 'Clink. Responsible amounts of bubbly.', () => FX.burst(['🥂', '🍾', '✨'], 26)],
  [/\b(ugh|fml|worst day)\b/i, 'ugh', 'A tiny storm cloud passes over. The sun wins. It always does.', () => FX.storm()],
  [/\b(yay|woohoo|hooray|let'?s go)\b/i, 'yay', 'Confetti: the international sign for "heck yes."', () => confetti(150)],
  [/\bfireworks?\b/i, 'fireworks', 'Fourth of July, any day you want. No fingers lost.', () => FX.fireworks()],
  [/\bsharks?\b/i, 'shark', 'Dun dun… dun dun… dun dun dun dun…', () => FX.across('🦈', {size:80, y:.85, speed:6})],
  [/\bchocolate\b/i, 'chocolate', 'Chocolate rain. Scientists hate this one weird trick.', () => FX.rain(['🍫', '🍬'], 30)],
  [/\bunicorns?\b/i, 'unicorn', 'A unicorn gallops by. Don\'t ask questions you don\'t want answered.', () => { FX.across('🦄', {size:84, y:.4, speed:10}); FX.rain(['🌈', '✨'], 14); }],
  [/\b(beach|vacation)\b/i, 'beach', 'Instant vacation. Sunscreen not included.', () => FX.rise(['🌴', '☀️', '🐚', '🏖️'], 22)],
  [/\bmeow\b/i, 'meow', 'Cat translation services are now online. Accuracy: 3%.', () => { FX.bigText('MEOW'); FX.across('🐾', {size:40, y:.75, speed:5}); }],
  [/\bzoomies\b/i, 'zoomies', '3 a.m. cat energy, delivered on demand.', () => FX.zoomies()],
  [/\bbubbles?\b/i, 'bubbles', 'Bubbles float up. Popping them is optional but encouraged.', () => FX.rise(['🫧', '🫧', '🫧'], 30)],
  [/\btacos?\b/i, 'taco', 'It\'s raining tacos, from out of the sky.', () => FX.rain(['🌮'], 30)],
  [/\b(best husband|rob is the best)\b/i, 'best husband', 'Correct answer. Prize awarded. Crown issued.', () => { FX.rain(['👑', '🏆'], 22); confetti(80); }],
  [/\bhugs?\b/i, 'hug', 'The whole app hugs you. Gently. With consent.', () => { FX.squeeze(); FX.rise(['🤗', '💛'], 10); }],
  [/\b(boom|mic drop)\b/i, 'boom', 'Mic drop. Everybody stand back.', () => { FX.bigText('💥'); FX.shake(); }],
  [/\b(rainbow)\b/i, 'rainbow', 'A rainbow. Free of charge. Pot of gold sold separately.', () => FX.rainbow()],
  [/\b(goodnight|good night|night night)\b/i, 'good night', 'The lights go down and the stars come out.', () => FX.stars()],
];
// "She's mad at me" → Separate Ways + raining broken hearts. Not listed on the Secret Words page.
const MAD = /\b((mad|angry|pissed( off)?|upset|annoyed|furious|irritated|ticked( off)?) (at|with) (you|u|rob)|i hate you|you'?re in (so much |big )?trouble|not (talking|speaking) to (you|u)|you (made|make) me (so )?(mad|angry))\b/i;
function madAtRob(){ FX.dim(5200, .35); FX.rain(['💔', '💔', '😭', '😢'], 46); if (window.iRobMusic && window.iRobMusic.playTag) window.iRobMusic.playTag('mad'); }
function secretWord(text){
  if (MAD.test(text)){ madAtRob(); return true; }
  const hit = SECRETS.find(s => s[0].test(text)); if (!hit) return false;
  hit[3](); const found = get('try_secrets_found', []); if (!found.includes(hit[1])){ found.push(hit[1]); put('try_secrets_found', found); if (found.length === 1 && A()) A().toast('🤫 You found a secret word! See them all in More fun.'); }
  return true;
}
// 1B. Effects on Rob's replies
const REPLY_FX = [
  [/\b(congrat\w*|proud of you|crushed it|nailed it|you did it)\b/i, 1, () => { confetti(120); FX.rise(['🏆'], 6); }],
  [/\b(good ?night|sweet dreams|sleep well)\b/i, 1, () => FX.stars()],
  [/\bhappy birthday\b/i, 1, () => FX.rise(['🎈', '🎈', '🎉'], 26)],
  [/\bhigh[- ]five\b/i, 1, () => { FX.bigText('✋'); FX.shake(); }],
  [/\bcheers\b/i, 1, () => FX.burst(['🥂', '✨'], 18)],
  [/\b(hug|hugs)\b/i, .8, () => FX.squeeze()],
  [/\b(boom|mic drop)\b/i, 1, () => FX.bigText('💥')],
  [/\b(you'?ve got this|go get (it|'?em)|let'?s go)\b/i, .6, () => FX.rise(['💪', '🔥'], 12)],
  [/\blove you\b/i, .25, () => FX.rise(['💗', '💕'], 10)],
  [/\b(haha|lol|hilarious)\b/i, .25, () => FX.rise(['😂'], 8)],
  [/\b(kitten|kitty)\b/i, .3, () => FX.across('🐾', {size:34, y:.8, speed:5})],
];
function replyEffect(text){ const hit = REPLY_FX.find(([re, p]) => re.test(text) && Math.random() < p); if (hit) setTimeout(hit[2], 250); return !!hit; }
function secretWords(){
  const {body, show} = sheet('funSecrets', 'Secret words');
  const found = get('try_secrets_found', []);
  body.append(el('p', 'note', `Type one of these in a message and watch what happens. You've found ${found.length} of ${SECRETS.length}.`));
  const list = el('div', 'sw-list');
  SECRETS.forEach(([, word, desc, run]) => { const row = el('button', 'sw-row' + (found.includes(word) ? ' found' : '')); row.type = 'button';
    row.innerHTML = '<span class="sw-word"></span><span class="sw-desc"></span><span class="sw-try" aria-hidden="true">Try</span>'; row.querySelector('.sw-word').textContent = '“' + word + '”'; row.querySelector('.sw-desc').textContent = desc;
    row.setAttribute('aria-label', `Try the secret word ${word}`); row.onclick = () => { A().close(); setTimeout(run, 350); }; list.append(row); });
  body.append(list, el('p', 'note', 'Rob has some too: congratulate him, say good night, or ask for a high five.')); show();
}

/* ================= 1C. The kitten roams the app (naps on buttons until you tap it) ================= */
const NAP_SPOTS = [['chipsBtn', 'on the ✦ button'], ['send', 'on the send button'], ['menuBtn', 'on the menu'], ['musicBtn', 'on the music button']];
let roamer = null;
function roam(force){
  const p = petLoad(); if (!p || roamer || !window.iRobCat) return;
  if (document.querySelector('.sheet.show') || document.querySelector('.app.chips-open') || document.querySelector('.slides.show, .viewer.show')){ if (force) setTimeout(() => roam(true), 20000); return; }
  if (!force && Math.random() < .5) return;
  const input = document.getElementById('input');
  const spots = NAP_SPOTS.filter(([id]) => { const b = document.getElementById(id); if (!b || !b.offsetParent) return false; if (id === 'send' && input && input.value.trim()) return false; const r = b.getBoundingClientRect(); return r.width > 0 && r.top >= 30 && r.bottom <= innerHeight; });
  if (!spots.length) return;
  const [id, where] = rnd(spots), btn = document.getElementById(id), r = btn.getBoundingClientRect();
  const k = el('button', 'roam-cat'); k.type = 'button'; k.setAttribute('aria-label', `${p.name} is asleep ${where}. Tap to wake them.`);
  k.innerHTML = window.iRobCat.sleeping(p.coat || 'grey') + '<span class="rc-z" aria-hidden="true">z</span><span class="rc-z z2" aria-hidden="true">z</span>';
  const w = 86, h = w * 132 / 220;
  // Lie across the top of the button, slightly hanging over it, the way a real cat claims a warm spot
  const left = Math.max(4, Math.min(innerWidth - w - 4, r.left + r.width / 2 - w / 2));
  Object.assign(k.style, {left:left + 'px', top:(r.top + r.height * .55 - h) + 'px', width:w + 'px', height:h + 'px'});
  document.body.appendChild(k); roamer = {k, id};
  const leave = msg => {
    if (k.classList.contains('waking')) return;
    k.classList.add('waking'); k.innerHTML = window.iRobCat.sitting(p.coat || 'grey', 'wide'); k.style.width = (w * .55) + 'px'; k.style.height = (w * .55 * 222 / 200) + 'px'; k.style.top = (r.top + r.height * .55 - w * .55 * 222 / 200) + 'px'; k.style.left = (left + w * .22) + 'px';
    blip(760, .07, 'triangle'); setTimeout(() => blip(980, .06, 'triangle'), 80);
    const b2 = el('span', 'rc-say', msg || rnd(['meep!', 'mrrp?', 'prrt', '*offended meow*', 'fine.'])); b2.style.left = (left + w * .1) + 'px'; b2.style.top = (r.top - 70) + 'px'; document.body.appendChild(b2);
    setTimeout(() => k.classList.add('hop'), 450); setTimeout(() => { k.remove(); b2.remove(); roamer = null; }, 1100);
    const s2 = get(PK, null); if (s2){ s2.love = Math.min(100, (s2.love || 0) + 4); put(PK, s2); }
  };
  k.onclick = e => { e.preventDefault(); e.stopPropagation(); leave(); };
  if (input) input.addEventListener('input', function off(){ if (roamer && roamer.id === 'send' && input.value.trim()){ input.removeEventListener('input', off); leave('fine, type.'); } });
  setTimeout(() => { if (roamer && roamer.k === k) leave(''); }, 90000 + Math.random() * 60000);
}
setTimeout(() => roam(true), 4000);
setInterval(() => { if (document.visibilityState === 'visible') roam(); }, 4 * 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(() => roam(), 2500); });

/* ================= 1H. Love coupons ================= */
const COUPONS = [
  'One back rub. Fifteen minutes. No rushing, no "is that good?" every ten seconds.',
  'I do the dishes tonight. All of them. Even the pan you "let soak."',
  'Your movie pick. Zero complaints. I will even stay awake.',
  'Breakfast in bed, coffee exactly how you like it.',
  'One free "you were right." Use it wisely. It does not expire.',
  'A night off: I handle dinner and bedtime. You do absolutely nothing.',
  'Foot rub during your show. Two full episodes.',
  'Date night. You pick the place, I plan everything else.',
  'I clean the litter box for a whole week. Without sighing.',
  'A surprise treat, delivered. You won\'t know when. Suspense.',
  'A long walk together, phones in pockets.',
  'Get out of one chore. Any chore. No questions asked.',
  'Unlimited couch cuddles tonight. Blanket included.',
  'I run that errand you\'ve been dreading.',
  'Kitchen dance party. Your song. My questionable moves.',
  'A handwritten love note, delivered within 24 hours.',
  'Sleep in. I\'ve got the whole morning.',
  'One automatic "yes" to whatever you want to do this weekend.',
  'An ice cream run, right now, no questions asked.',
  'Scalp massage, ten minutes, eyes closed.',
  'I plan a surprise mini day trip. You just show up.',
  'Your car: washed and gassed up. On me.',
  'I\'ll watch the show you love and pretend I\'m not into it. (I\'m into it.)',
  'Five minutes of me listing things I love about you. Out loud. No interrupting.',
];
let spicy = null;
async function loadSpicy(){
  if (spicy) return spicy;
  const pw = get(US_PASS, null) || (usData ? 'unlocked' : null);
  if (usData && usData.coupons) return (spicy = usData.coupons);
  if (pw && pw !== 'unlocked'){ try { const d = await openUs(pw); usData = d; return (spicy = d.coupons || []); } catch {} }
  return null;
}
const todayKey = () => new Date().toDateString();
function couponBadge(){ const c = get('try_coupons', {wallet:[], day:''}); return c.day === todayKey() ? 0 : 1; }
async function loveCoupons(){
  const {body, show} = sheet('funCoupons', 'Love coupons');
  const st = get('try_coupons', {wallet:[], day:''});
  const sp = await loadSpicy();
  const draw = () => {
    body.innerHTML = '';
    if (st.day !== todayKey()){
      const pool = sp && sp.length && Math.random() < .35 ? sp.map(t => ({t, spicy:true})) : COUPONS.map(t => ({t}));
      const used = new Set(st.wallet.map(w => w.t)); const fresh = pool.filter(x => !used.has(x.t)); const pick = rnd(fresh.length ? fresh : pool);
      body.append(el('p', 'note', 'Today\'s coupon is under the foil. Scratch it with your finger.'));
      const card = el('div', 'cp-card' + (pick.spicy ? ' spicy' : '')); const txt = el('p', 'cp-text', pick.t); const tag = el('span', 'cp-tag', pick.spicy ? '🔥 Just us' : '💛 Love coupon');
      const cv = el('canvas', 'cp-foil'); card.append(tag, txt, el('span', 'cp-from', 'Redeemable with Rob · no expiration'), cv); body.append(card);
      requestAnimationFrame(() => {
        const w = card.clientWidth, h = card.clientHeight, d = devicePixelRatio || 1; cv.width = w * d; cv.height = h * d; const g = cv.getContext('2d'); g.scale(d, d);
        const grd = g.createLinearGradient(0, 0, w, h); grd.addColorStop(0, '#c9a35c'); grd.addColorStop(.5, '#f1d999'); grd.addColorStop(1, '#b68235'); g.fillStyle = grd; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(90,60,20,.55)'; g.font = '600 16px Lora, Georgia, serif'; g.textAlign = 'center'; g.fillText('Scratch here ✦', w / 2, h / 2 + 6);
        g.globalCompositeOperation = 'destination-out'; let n = 0, done = false;
        const scratch = e => { const r = cv.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top; g.beginPath(); g.arc(x, y, 22, 0, Math.PI * 2); g.fill(); if (++n % 12 === 0) blip(1200 + Math.random() * 400, .02, 'square', .02);
          if (!done && n > 45){ done = true; cv.classList.add('gone'); st.day = todayKey(); st.wallet.unshift({id:Date.now().toString(36), t:pick.t, spicy:!!pick.spicy, got:Date.now()}); put('try_coupons', st); confetti(60); setTimeout(draw, 1400); } };
        cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); scratch(e); cv.onpointermove = scratch; });
        cv.addEventListener('pointerup', () => { cv.onpointermove = null; });
      });
    } else body.append(el('p', 'note', 'New coupon tomorrow. Here\'s your wallet.'));
    const wallet = st.wallet.filter(w => !w.used && (!w.spicy || sp));
    if (wallet.length){ body.append(el('p', 'cp-h', 'Your wallet'));
      wallet.forEach(w => { const row = el('div', 'cp-row' + (w.spicy ? ' spicy' : '')); row.append(el('span', 'cp-rt', w.t)); const b = el('button', 'btn', 'Redeem'); b.type = 'button';
        b.onclick = async () => { const msg = `I'm redeeming my love coupon: "${w.t}" 💛`;
          try { if (navigator.share){ await navigator.share({text:msg}); } else { location.href = 'sms:&body=' + encodeURIComponent(msg); } } catch (e){ if (e && e.name === 'AbortError') return; }
          w.used = Date.now(); put('try_coupons', st); A().toast('Redeemed! Rob has been notified (well, he will be when he reads it).'); draw(); };
        row.append(b); body.append(row); }); }
    const usedN = st.wallet.filter(w => w.used).length; if (usedN) body.append(el('p', 'note', `${usedN} coupon${usedN > 1 ? 's' : ''} redeemed so far.`));
  };
  draw(); show();
}

/* ================= 2.6. First-sound tip (iPhone silent switch mutes web sounds) ================= */
function soundTip(){ if (get('try_soundtip', false)) return; put('try_soundtip', true); setTimeout(() => A() && A().toast('🔈 Sounds play when your ringer switch is on.'), 600); }

function petTile(){
  const p = petLoad(); if (!p) return null;
  const [face, line] = petFace(p);
  return {name:p.name, face, line:line.replace(p.name + ' ', '').replace(/^./, c => c.toUpperCase()), low:Math.round(Math.min(p.food, p.fun, p.love, p.energy, p.clean))};
}
function petStatus(){
  const p = petLoad(); if (!p) return null;
  const [face, line] = petFace(p);
  return `${face} ${line}`;
}
function fortuneOfDay(){ const d = new Date(); return FORTUNES[(d.getFullYear() * 400 + d.getMonth() * 31 + d.getDate()) % FORTUNES.length]; }

new MutationObserver(() => { if (roamer && document.querySelector('.sheet.show')){ roamer.k.remove(); roamer = null; } }).observe(document.documentElement, {subtree:true, attributes:true, attributeFilter:['class']});
window.iRobFun = {petStatus, fortuneOfDay, petTile, secretWord, replyEffect, secretWords, loveCoupons, couponBadge, roam, FX, puppyPower, kittenCuddles, pocketKitten, catchKittens, fortuneCookie, dateNight, memoryMatch, photoPuzzle, whichFirst, zoomDetective, tripTimeline, bragButton, moreFun, croatiaGames, confetti, stop:stopAll,
  petName:() => (get(PK, null) || {}).name || null};
})();
