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
    s = el('section', 'sheet fun-sheet'); s.id = id; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', title);
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
    presses++; put('try_pp', presses); paint();
    if (presses % 3 === 0) confetti(); else confetti(40);
    stage.innerHTML = '<p class="note">Fetching a good dog…</p>';
    const item = await critter('golden'); stage.innerHTML = ''; stage.append(media(item, 'A golden retriever'));
    btn.classList.remove('pressed'); busy = false;
  };
  body.append(stage, btn, meter, level); paint(); show();
}

/* ================= B. Kitten cuddles ================= */
const LOAF = ['Purring has begun.', 'Kitten is getting very soft.', 'Kitten has become a loaf.', 'Maximum loaf achieved. You may never move again.'];
function kittenCuddles(){
  const {body, show} = sheet('funKitten', 'Kitten cuddles');
  const pad = el('div', 'kc-pad'); pad.tabIndex = 0; pad.setAttribute('role', 'button'); pad.setAttribute('aria-label', 'Press and hold to cuddle the kitten');
  const pic = el('div', 'kc-pic'); pad.append(pic);
  const hint = el('p', 'kc-hint', 'Press and hold to cuddle');
  const hearts = el('div', 'kc-hearts'); pad.append(hearts);
  let snd = null, t0 = 0, raf = 0, heartT = 0;
  critter('cat').then(item => { pic.innerHTML = ''; pic.append(media(item, 'A cute kitten')); });
  const tick = () => {
    const s = (performance.now() - t0) / 1000;
    snd && snd.set(Math.min(.9, .15 + s * .08));
    pad.style.setProperty('--melt', Math.min(1, s / 10).toFixed(3));
    hint.textContent = LOAF[Math.min(LOAF.length - 1, Math.floor(s / 3.5))];
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

/* ================= C. Pocket kitten (a little tamagotchi) ================= */
const PK = 'try_pocketkitten';
const STAGES = [['kitten', 0, 64], ['young cat', 25, 74], ['grown cat', 70, 84], ['royal cat', 150, 92]];
const SHOP = [
  ['🎀', 'Bow', 'head', 10], ['🌸', 'Flower', 'head', 12], ['🎩', 'Top hat', 'head', 25], ['👑', 'Crown', 'head', 60],
  ['🕶️', 'Shades', 'face', 20], ['🧣', 'Scarf', 'neck', 15], ['🔔', 'Bell collar', 'neck', 8], ['🦋', 'Butterfly friend', 'side', 30],
];
const FOODS = [['🐟', 'Fish', {food:35}, 0], ['🥛', 'Milk', {food:20, fun:5}, 0], ['🍤', 'Treat', {food:10, fun:18, love:6}, 2]];
const clamp = v => Math.max(0, Math.min(100, v));
function petLoad(){
  let p = get(PK, null); if (!p) return null;
  if (!p.v){ // upgrade from the first version
    const h = ms => (Date.now() - ms) / 36e5;
    p = {v:2, name:p.name, born:p.born, xp:(p.xp || 0) * 2, coins:10, t:Date.now(), food:clamp(100 - h(p.fedAt) * 6), fun:clamp(100 - h(p.playedAt) * 5), love:clamp(100 - h(p.pettedAt) * 4), energy:80, poops:[], poopClock:Date.now(), asleep:false, owned:[], worn:{}, days:p.days || [], streak:1, lastEvent:0, gifts:0};
  }
  // time passes while she's away
  const hrs = Math.min(72, (Date.now() - p.t) / 36e5);
  if (hrs > 0){
    p.food = clamp(p.food - hrs * 6); p.fun = clamp(p.fun - hrs * (p.asleep ? 1 : 5)); p.love = clamp(p.love - hrs * 4);
    p.energy = clamp(p.energy + (p.asleep ? hrs * 14 : -hrs * 3));
    if (p.asleep && p.energy >= 100 && Date.now() - p.sleptAt > 3 * 36e5) p.asleep = false;
    while (!p.asleep && p.poops.length < 3 && Date.now() - p.poopClock > 5 * 36e5){ p.poopClock += 5 * 36e5; p.poops.push({x:15 + Math.random() * 70, id:Math.random().toString(36).slice(2, 7)}); }
    p.t = Date.now();
  }
  p.clean = clamp(100 - p.poops.length * 30);
  p.sick = p.sick || (p.food < 8 && (p.clean < 40 || p.fun < 8));
  p.stage = STAGES.filter(s => p.xp >= s[1]).length - 1;
  return p;
}
const petSave = p => { p.t = Date.now(); const {stage, clean, ...keep} = p; put(PK, keep); };
function petFace(p){
  if (p.sick) return ['🤒', `${p.name} isn't feeling great. Time for the vet.`];
  if (p.asleep) return ['😴', `${p.name} is asleep in a perfect circle. Shh.`];
  if (p.food < 25) return ['😿', `${p.name} is staring at the food bowl. Dramatically.`];
  if (p.clean < 40) return ['😾', `${p.name} would like the litter box cleaned. Immediately.`];
  if (p.energy < 20) return ['🥱', `${p.name} can barely keep their eyes open.`];
  if (p.fun < 25) return ['🙀', `${p.name} has started knocking things off the counter. Boredom.`];
  if (p.love < 25) return ['😼', `${p.name} is pretending not to want attention. (They want attention.)`];
  if (p.food > 70 && p.fun > 70 && p.love > 70) return ['😻', `${p.name} is the happiest cat in Florida.`];
  return ['😺', rnd([`${p.name} is people-watching from the window.`, `${p.name} is doing just fine. Purring a little.`, `${p.name} is grooming one paw very seriously.`])];
}
function pocketKitten(){
  const {body, show} = sheet('funPet', 'Pocket kitten');
  if (!petLoad()){
    const f = el('form', 'pet-new');
    f.innerHTML = '<div class="pet-egg" aria-hidden="true">🧺</div><p>A kitten showed up in a basket. It needs a name.</p><label class="sr" for="petName">Kitten name</label><input id="petName" maxlength="20" placeholder="Name your kitten" autocomplete="off"><button class="btn">Adopt</button>';
    f.onsubmit = e => { e.preventDefault(); const n = f.querySelector('input').value.trim(); if (!n) return;
      const now = Date.now(); put(PK, {v:2, name:n, born:now, xp:0, coins:10, t:now, food:80, fun:80, love:80, energy:90, poops:[], poopClock:now, asleep:false, owned:[], worn:{}, days:[], streak:0, lastEvent:now, gifts:0}); confetti(60); pocketKitten(); };
    body.append(f); show(); setTimeout(() => f.querySelector('input').focus(), 350); return;
  }
  let p = petLoad(), panel = null, laser = null;
  const top = el('div', 'tg-top'); const room = el('div', 'tg-room'); const bubble = el('p', 'tg-say');
  const bars = el('div', 'tg-bars'); const acts = el('div', 'tg-acts'); const tray = el('div', 'tg-panel'); tray.hidden = true;
  body.append(top, room, bubble, bars, acts, tray);
  const say = (t, ms) => { bubble.textContent = t; bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop'); };
  const gain = (k, n) => { p[k] = clamp(p[k] + n); };
  const earn = n => { p.coins += n; };
  // daily visit streak (+5 coins on the first care of a new day)
  const careDay = () => { const today = new Date().toDateString(); if ((p.days || []).includes(today)) return;
    const y = new Date(Date.now() - 864e5).toDateString(); p.streak = (p.days || []).includes(y) ? (p.streak || 0) + 1 : 1; p.days = (p.days || []).concat(today).slice(-120); earn(5); A().toast(`Day ${p.streak} streak! +5 🪙`); };
  const xp = n => { const before = p.stage; p.xp += n; p.stage = STAGES.filter(s => p.xp >= s[1]).length - 1; if (p.stage > before){ confetti(); A().toast(`${p.name} grew into a ${STAGES[p.stage][0]}!`); } };
  const commit = () => { p.clean = clamp(100 - p.poops.length * 30); petSave(p); draw(); };

  function draw(){
    const [face, line] = petFace(p);
    top.innerHTML = '';
    const nm = el('div', 'tg-name'); nm.append(el('b', '', p.name), el('span', '', `${STAGES[p.stage][0]} · ${(d => d === 1 ? '1 day' : d + ' days')(Math.max(1, Math.ceil((Date.now() - p.born) / 864e5)))} old`));
    const meta = el('div', 'tg-meta'); meta.append(el('span', '', `🪙 ${p.coins}`), el('span', '', `🔥 ${p.streak || 0}`));
    top.append(nm, meta);
    const h = new Date().getHours(); room.className = 'tg-room' + (p.asleep ? ' lights-off' : h >= 19 || h < 7 ? ' night' : '');
    room.innerHTML = `<div class="tg-window" aria-hidden="true">${h >= 19 || h < 7 ? '🌙' : '☀️'}</div><div class="tg-floor"></div><div class="tg-bowl" aria-hidden="true">🥣</div>`;
    p.poops.forEach(pp => { const b = el('button', 'tg-poop', '💩'); b.type = 'button'; b.style.left = pp.x + '%'; b.setAttribute('aria-label', 'Clean this up');
      b.onclick = e => { e.stopPropagation(); p.poops = p.poops.filter(z => z.id !== pp.id); earn(2); xp(1); careDay(); blip(900, .06); say(rnd(['Sparkling. +2 🪙', `${p.name} watched you do it. No thanks given.`, 'Fresh litter. Very luxurious.'])); commit(); };
      room.append(b); });
    const cat = el('button', 'tg-cat'); cat.type = 'button'; cat.style.fontSize = STAGES[p.stage][2] + 'px';
    cat.setAttribute('aria-label', `Pet ${p.name}`); cat.style.left = (p.x || 50) + '%';
    cat.innerHTML = `<span class="f">${face}</span>`;
    Object.entries(p.worn || {}).forEach(([slot, e]) => { const a = el('span', 'acc ' + slot, e); a.setAttribute('aria-hidden', 'true'); cat.append(a); });
    cat.onclick = () => {
      if (p.asleep){ say(`${p.name} is asleep. Gentle pets only. 💤`); return; }
      gain('love', 8); if (!p.lastPetCoin || Date.now() - p.lastPetCoin > 60000){ earn(1); p.lastPetCoin = Date.now(); }
      xp(1); careDay(); blip(880, .08); hearts(cat);
      say(rnd([`${p.name} is purring so loud the neighbors can hear.`, `${p.name} headbutted your hand. That means love.`, `Slow blink from ${p.name}. You are trusted.`, `${p.name} rolled over. It's a trap. Pet anyway.`])); commit();
    };
    room.append(cat);
    if (laser) room.append(laser.dot);
    bubble.textContent = line;
    bars.innerHTML = '';
    [['🐟', 'Food', p.food], ['🧶', 'Fun', p.fun], ['⚡', 'Energy', p.energy], ['🫧', 'Clean', p.clean], ['💗', 'Love', p.love]].forEach(([e, l, v]) => {
      const b = el('div', 'tg-bar' + (v < 25 ? ' low' : '')); b.innerHTML = `<span aria-hidden="true">${e}</span><b role="meter" aria-label="${l}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v)}"><i style="width:${Math.round(v)}%"></i></b>`; bars.append(b); });
    acts.innerHTML = '';
    const act = (e, label, fn, on) => { const b = el('button', 'tile' + (on ? ' on' : '')); b.type = 'button'; b.innerHTML = `<span class="e" aria-hidden="true">${e}</span><span></span>`; b.lastChild.textContent = label; b.onclick = fn; acts.append(b); };
    if (p.sick) act('🩺', 'Vet', vet);
    act('🍽️', 'Feed', () => openPanel('feed'), panel === 'feed');
    act('🔴', 'Play', playLaser);
    act(p.asleep ? '🌅' : '🌙', p.asleep ? 'Wake' : 'Sleep', toggleSleep);
    act('👒', 'Closet', () => openPanel('closet'), panel === 'closet');
    if (!p.sick) act('✏️', 'Rename', rename);
  }
  function hearts(anchor){ if (reduced()) return; for (let i = 0; i < 3; i++){ const h = el('span', 'tg-heart', rnd(['💗', '💕', '🤍'])); h.style.left = (parseFloat(anchor.style.left) + (Math.random() * 16 - 8)) + '%'; h.style.animationDelay = i * .12 + 's'; room.append(h); setTimeout(() => h.remove(), 1600); } }
  function openPanel(which){
    panel = panel === which ? null : which; tray.innerHTML = ''; tray.hidden = !panel; draw(); if (!panel) return;
    if (which === 'feed'){
      if (p.asleep){ tray.append(el('p', 'note', `${p.name} is asleep. Feed them when they wake up.`)); return; }
      FOODS.forEach(([e, label, fx, cost]) => { const b = el('button', 'tg-item'); b.type = 'button'; b.innerHTML = `<span aria-hidden="true">${e}</span><span>${label}${cost ? ` · ${cost}🪙` : ''}</span>`;
        b.onclick = () => { if (cost > p.coins){ say(`Not enough coins for a ${label.toLowerCase()} yet.`); return; } if (p.food >= 98){ say(`${p.name} is stuffed. Belly is round.`); return; }
          p.coins -= cost; Object.entries(fx).forEach(([k, v]) => gain(k, v)); xp(2); careDay(); blip(520, .1, 'triangle');
          say(rnd([`${p.name} inhaled the ${label.toLowerCase()}. Zero chewing.`, `${p.name} ate, then looked at you like you forgot dessert.`, `Nom. ${p.name} approves.`])); commit(); };
        tray.append(b); });
    }
    if (which === 'closet'){
      SHOP.forEach(([e, label, slot, price]) => { const owned = (p.owned || []).includes(e), worn = (p.worn || {})[slot] === e;
        const b = el('button', 'tg-item' + (worn ? ' worn' : '')); b.type = 'button'; b.innerHTML = `<span aria-hidden="true">${e}</span><span>${label}${owned ? (worn ? ' · wearing' : '') : ` · ${price}🪙`}</span>`;
        b.onclick = () => {
          if (!owned){ if (p.coins < price){ say(`${label} costs ${price} 🪙. Keep caring for ${p.name} to earn more.`); return; } p.coins -= price; p.owned = (p.owned || []).concat(e); confetti(40); }
          p.worn = p.worn || {}; if (p.worn[slot] === e) delete p.worn[slot]; else p.worn[slot] = e;
          say(p.worn[slot] === e ? rnd([`${p.name} looks incredible. Fashion icon.`, `${p.name} refuses to take it off now.`]) : `${label} off. Back to natural beauty.`); commit(); openPanel('closet'); openPanel('closet'); };
        tray.append(b); });
    }
  }
  function playLaser(){
    if (p.asleep){ say(`${p.name} is asleep. Play later.`); return; }
    if (p.energy < 10){ say(`${p.name} is too tired to play. Nap first.`); return; }
    if (laser) return;
    panel = null; tray.hidden = true;
    const dot = el('button', 'tg-laser'); dot.type = 'button'; dot.setAttribute('aria-label', 'Tap the laser dot');
    let hits = 0; laser = {dot};
    const jump = () => { dot.style.left = 8 + Math.random() * 84 + '%'; dot.style.top = 15 + Math.random() * 60 + '%'; p.x = Math.max(10, Math.min(90, parseFloat(dot.style.left))); const c = room.querySelector('.tg-cat'); if (c) c.style.left = p.x + '%'; };
    dot.onclick = e => { e.stopPropagation(); hits++; blip(700 + hits * 20, .05); jump(); };
    say(`Laser time! Tap the red dot. ${p.name} is ready.`); draw(); jump();
    const iv = setInterval(jump, 900);
    const end = () => { clearInterval(iv); laser = null; dot.remove(); };
    stoppers.push(end);
    setTimeout(() => { if (!laser) return; end(); gain('fun', 10 + hits * 4); gain('energy', -12); earn(Math.min(10, hits)); xp(2 + Math.floor(hits / 3)); careDay();
      say(hits >= 8 ? `${hits} catches! ${p.name} is a professional hunter. +${Math.min(10, hits)} 🪙` : `${hits} catches. ${p.name} is pleased and slightly out of breath. +${Math.min(10, hits)} 🪙`); commit(); }, 12000);
  }
  function toggleSleep(){
    p.asleep = !p.asleep; if (p.asleep) p.sleptAt = Date.now(); careDay();
    say(p.asleep ? `Lights out. ${p.name} curled into a ball. 💤` : (p.energy > 70 ? `${p.name} woke up and stretched for a full minute.` : `${p.name} woke up grumpy. More sleep next time.`)); commit();
  }
  function vet(){ p.sick = false; gain('food', 40); gain('fun', 20); gain('love', 20); p.poops = []; careDay(); say(`The vet says ${p.name} is going to be just fine. Extra cuddles prescribed.`); commit(); }
  function rename(){
    tray.innerHTML = ''; panel = 'rename'; tray.hidden = false;
    const f = el('form', 'tg-rename'); f.innerHTML = `<label class="sr" for="petRename">New name</label><input id="petRename" maxlength="20" value="${p.name.replace(/"/g, '&quot;')}"><button class="btn">Save</button>`;
    f.onsubmit = e => { e.preventDefault(); const n = f.querySelector('input').value.trim(); if (!n) return; p.name = n; panel = null; tray.hidden = true; commit(); };
    tray.append(f);
  }
  // little random events, at most every 4 hours
  if (!p.asleep && Date.now() - (p.lastEvent || 0) > 4 * 36e5 && Math.random() < .5){
    p.lastEvent = Date.now();
    const ev = rnd([
      () => { earn(3); p.gifts = (p.gifts || 0) + 1; return `${p.name} left a gift for you: a toy mouse 🐭. Very proud. +3 🪙`; },
      () => { gain('fun', 10); return `${p.name} knocked a pen off the table, then looked right at you.`; },
      () => { xp(3); return `${p.name} learned a new trick: sitting on whatever you're using.`; },
      () => { gain('love', 10); return `${p.name} was waiting by the door for you.`; },
    ])();
    petSave(p); setTimeout(() => say(ev), 400);
  }
  // wander around the room
  const wander = setInterval(() => { if (laser || p.asleep) return; p.x = 15 + Math.random() * 70; const c = room.querySelector('.tg-cat'); if (c) c.style.left = p.x + '%'; }, 3500);
  const refresh = setInterval(() => { const q = petLoad(); Object.assign(p, {food:q.food, fun:q.fun, love:q.love, energy:q.energy, poops:q.poops, sick:q.sick}); petSave(p); draw(); }, 60000);
  stoppers.push(() => { clearInterval(wander); clearInterval(refresh); });
  draw(); show();
}

/* ================= D. Catch the kittens ================= */
function catchKittens(){
  const {body, show} = sheet('funCatch', 'Catch the kittens');
  const best = get('try_catchbest', 0);
  const wrap = el('div', 'catch'); const cv = el('canvas'); wrap.append(cv);
  const hud = el('div', 'catch-hud'); const score = el('span', '', 'Score 0'); const time = el('span', '', '30s'); hud.append(score, time);
  const start = el('button', 'btn', 'Start'); start.type = 'button';
  const info = el('p', 'note', `Catch 🐱 (+1) and golden retrievers 🐶 (+3). Dodge the cucumbers 🥒 (−2). Best: ${best}.`);
  body.append(hud, wrap, info, start); show();
  let run = null;
  const g = cv.getContext('2d');
  const size = () => { const w = wrap.clientWidth || 320, h = Math.min(420, Math.round(innerHeight * .45)); const d = devicePixelRatio || 1; cv.width = w * d; cv.height = h * d; cv.style.height = h + 'px'; g.setTransform(d, 0, 0, d, 0, 0); return {w, h}; };
  const move = e => { if (!run) return; const r = cv.getBoundingClientRect(); run.bx = Math.max(30, Math.min(run.w - 30, (e.touches ? e.touches[0].clientX : e.clientX) - r.left)); };
  cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move); cv.addEventListener('touchmove', e => { e.preventDefault(); move(e); }, {passive:false});
  start.onclick = () => {
    const {w, h} = size(); start.hidden = true;
    run = {w, h, bx:w / 2, items:[], drops:[], score:0, t0:performance.now(), last:0, spawn:0};
    const loop = t => {
      if (!run) return;
      const left = Math.max(0, 30 - (t - run.t0) / 1000);
      const dt = Math.min(50, t - (run.last || t)); run.last = t;
      if (t - run.spawn > Math.max(320, 760 - (30 - left) * 15)){ run.spawn = t; const r = Math.random(); run.items.push({x:20 + Math.random() * (w - 40), y:-30, v:1.6 + Math.random() * 1.6 + (30 - left) * .05, e:r < .14 ? '🐶' : r < .3 ? '🥒' : '🐱'}); }
      g.clearRect(0, 0, w, h);
      g.font = '30px system-ui, "Apple Color Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      // Cucumbers: little white drops squirt from the top end and fade out quickly (they never reach the floor).
      run.items.forEach(it => { if (it.e === '🥒' && Math.random() < .35) run.drops.push({x:it.x + 9, y:it.y - 13, vx:.4 + Math.random() * 1.2, vy:-1.2 - Math.random() * 1.2, r:1.4 + Math.random() * 1.4, life:1}); });
      run.drops.forEach(d => { d.vy += .09 * dt / 16; d.x += d.vx * dt / 16; d.y += d.vy * dt / 16; d.life -= .035 * dt / 16; });
      run.drops = run.drops.filter(d => d.life > 0);
      run.drops.forEach(d => { g.globalAlpha = Math.max(0, d.life); g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(90,110,90,.45)'; g.lineWidth = .8; g.beginPath(); g.arc(d.x, d.y, d.r, 0, Math.PI * 2); g.fill(); g.stroke(); });
      g.globalAlpha = 1;
      g.font = '30px system-ui, "Apple Color Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      run.items.forEach(it => { it.y += it.v * dt / 16; g.fillText(it.e, it.x, it.y); });
      g.font = '40px system-ui, "Apple Color Emoji", sans-serif'; g.fillText('🧺', run.bx, h - 26);
      run.items = run.items.filter(it => {
        if (it.y > h - 46 && it.y < h - 6 && Math.abs(it.x - run.bx) < 34){ const pts = it.e === '🐶' ? 3 : it.e === '🥒' ? -2 : 1; if (it.e === '🥒') for (let k = 0; k < 10; k++) run.drops.push({x:it.x, y:h - 44, vx:(Math.random() - .5) * 4, vy:-1.5 - Math.random() * 2.5, r:1.4 + Math.random(), life:1}); run.score = Math.max(0, run.score + pts); blip(pts > 0 ? 640 + pts * 60 : 180, .08, pts > 0 ? 'sine' : 'square', .08); return false; }
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
  cookie.innerHTML = '<span class="l">🥠</span><span class="r">🥠</span>';
  const slip = el('p', 'fc-slip'); slip.hidden = true;
  const hint = el('p', 'note', 'Tap to crack it open.');
  const again = el('button', 'btn ghost', 'Another cookie'); again.type = 'button'; again.hidden = true;
  let last = -1;
  cookie.onclick = () => {
    if (cookie.classList.contains('open')) return;
    let i; do { i = Math.floor(Math.random() * FORTUNES.length); } while (i === last); last = i;
    cookie.classList.add('open'); blip(300, .06, 'square', .06); setTimeout(() => blip(220, .08, 'square', .05), 60);
    setTimeout(() => { slip.textContent = FORTUNES[i]; slip.hidden = false; hint.hidden = true; again.hidden = false; }, reduced() ? 0 : 380);
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

/* ================= Effects engine (secret words + message effects) ================= */
function fxCanvas(){
  const c = el('canvas', 'fun-confetti'); document.body.appendChild(c);
  const dpr = devicePixelRatio || 1; c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const g = c.getContext('2d'); g.scale(dpr, dpr); return {c, g, W:innerWidth, H:innerHeight};
}
// Generic emoji particle runner. make(i, W, H) → {x, y, vx, vy, size, rot, vr, e, delay}
function particles(n, make, {gravity = 0, dur = 3200, fade = true} = {}){
  if (reduced()) return;
  const {c, g, W, H} = fxCanvas(); const ps = Array.from({length:n}, (_, i) => ({rot:0, vr:0, delay:0, ...make(i, W, H)}));
  const t0 = performance.now(); let last = t0;
  (function frame(t){
    const dt = Math.min(40, t - last) / 16; last = t; const el2 = t - t0;
    g.clearRect(0, 0, W, H);
    ps.forEach(p => { if (el2 < p.delay) return; p.vy += gravity * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      g.save(); g.globalAlpha = fade ? Math.max(0, Math.min(1, (dur - el2) / 600)) : 1; g.translate(p.x, p.y); g.rotate(p.rot);
      g.font = `${p.size}px system-ui, "Apple Color Emoji", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.e, 0, 0); g.restore(); });
    if (el2 < dur) requestAnimationFrame(frame); else c.remove();
  })(t0);
}
const R = (a, b) => a + Math.random() * (b - a);
const FX = {
  rain:(emojis, n = 40) => particles(n, (i, W) => ({x:R(0, W), y:R(-H0(), -20), vx:R(-.4, .4), vy:R(3, 6), size:R(22, 38), vr:R(-.04, .04), e:rnd(emojis), delay:R(0, 900)}), {dur:3600}),
  rise:(emojis, n = 26) => particles(n, (i, W, H) => ({x:R(20, W - 20), y:H + 30, vx:R(-.6, .6), vy:R(-5, -2.5), size:R(22, 40), vr:R(-.03, .03), e:rnd(emojis), delay:R(0, 800)}), {dur:3800}),
  burst:(emojis, n = 34) => particles(n, (i, W, H) => { const a = R(0, Math.PI * 2), v = R(4, 11); return {x:W / 2, y:H * .5, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 3, size:R(20, 36), vr:R(-.1, .1), e:rnd(emojis)}; }, {gravity:.25, dur:2600}),
  across:(e, {size = 90, y = .55, speed = 14} = {}) => particles(1, (i, W, H) => ({x:-size, y:H * y, vx:speed, vy:0, size, e}), {dur:Math.round((innerWidth + 2 * size) / speed * 16), fade:false}),
  fireworks:() => { const cols = ['✨', '💥', '🎆', '🌟']; [0, 500, 1000, 1500].forEach(d => setTimeout(() => particles(22, (i, W, H) => { const cx = W * R(.2, .8), cy = H * R(.2, .5); const a = i / 22 * Math.PI * 2, v = R(3, 6); return {x:cx, y:cy, vx:Math.cos(a) * v, vy:Math.sin(a) * v, size:R(14, 24), e:rnd(cols)}; }, {gravity:.08, dur:1500}), d)); },
  overlay:(cls, ms = 2600) => { if (reduced()) return; const o = el('div', 'fx-overlay ' + cls); document.body.appendChild(o); setTimeout(() => o.classList.add('out'), ms - 600); setTimeout(() => o.remove(), ms); return o; },
  shake:() => { const a = document.getElementById('app'); if (!a || reduced()) return; a.classList.remove('fx-shake'); void a.offsetWidth; a.classList.add('fx-shake'); setTimeout(() => a.classList.remove('fx-shake'), 700); },
  squeeze:() => { const a = document.getElementById('app'); if (!a || reduced()) return; a.classList.remove('fx-hug'); void a.offsetWidth; a.classList.add('fx-hug'); setTimeout(() => a.classList.remove('fx-hug'), 1300); },
  bigText:(t, ms = 1400) => { if (reduced()) return; const o = el('div', 'fx-big', t); document.body.appendChild(o); setTimeout(() => o.remove(), ms); },
  stars:() => { const o = FX.overlay('fx-night', 3200); if (!o) return; for (let i = 0; i < 26; i++){ const s = el('i', '', '✦'); s.style.left = R(0, 100) + '%'; s.style.top = R(0, 70) + '%'; s.style.animationDelay = R(0, 1.5) + 's'; s.style.fontSize = R(8, 18) + 'px'; o.append(s); } },
  disco:() => { FX.overlay('fx-disco', 3200); FX.rain(['🪩', '✨', '💃'], 14); },
  wave:() => { const o = FX.overlay('fx-wave', 2400); if (o) o.innerHTML = '<svg viewBox="0 0 1200 300" preserveAspectRatio="none"><path d="M0 160 C150 90 300 230 450 160 S750 90 900 160 S1150 230 1200 160 V300 H0Z" fill="rgba(46,124,170,.55)"/><path d="M0 200 C150 140 300 260 450 200 S750 140 900 200 S1150 260 1200 200 V300 H0Z" fill="rgba(80,160,200,.6)"/></svg>'; },
  storm:() => { const o = FX.overlay('fx-storm', 3000); if (o){ o.textContent = '⛈️'; setTimeout(() => { o.textContent = '🌤️'; }, 1600); } },
  zoomies:() => { if (reduced()) return; const o = el('div', 'fx-zoomies', '🐈'); document.body.appendChild(o); setTimeout(() => o.remove(), 2600); },
};
function H0(){ return innerHeight * .6; }

// 1A. Secret words she can type. [match, name, description, effect]
const SECRETS = [
  [/\b(kittens?|kitty|kitties)\b/i, 'kitten', 'Kitten weather. Bring an umbrella. Or don\'t, they\'re soft.', () => FX.rain(['🐱', '😺', '😸', '🐈'], 36)],
  [/\b(puppy|puppies|golden retriever|doggo)\b/i, 'puppy', 'A very good boy sprints through at 40 mph. He will not stop to explain.', () => FX.across('🐕', {size:96, y:.62, speed:12})],
  [/\b(croatia|dubrovnik|cavtat|lokrum)\b/i, 'croatia', 'The Adriatic stops by to say hi. Please wipe your feet.', () => FX.wave()],
  [/\b(love you|luv you|ily)\b/i, 'love you', 'Hearts. So many hearts. A medically concerning amount of hearts.', () => FX.burst(['💗', '💕', '💖', '❤️'], 40)],
  [/\bhappy birthday\b/i, 'happy birthday', 'Balloons. Nobody had to blow them up.', () => FX.rise(['🎈', '🎈', '🎉', '🎂'], 30)],
  [/\bpizza\b/i, 'pizza', 'It\'s raining pizza. This is the weather we were promised.', () => FX.rain(['🍕'], 30)],
  [/\bcucumbers?\b/i, 'cucumber', 'A cucumber appears. Every cat in the app files a complaint and leaves.', () => { FX.bigText('🥒', 1600); FX.burst(['🙀', '😾', '🐈'], 18); }],
  [/\b(coffee|caffeine|espresso)\b/i, 'coffee', 'Caffeine shakes, but for your phone.', () => { FX.rise(['☕', '☕', '⚡'], 16); FX.shake(); }],
  [/\b(boo|halloween|spooky)\b/i, 'boo', 'Ghosts drift by. They\'re friendly. Mostly.', () => { FX.overlay('fx-dark', 3000); FX.rise(['👻', '🎃', '🦇'], 20); }],
  [/\b(party|dance|disco)\b/i, 'party', 'Instant disco. No cover charge. Questionable lighting.', () => FX.disco()],
  [/\b(cha-?ching|bookings?|money|rich)\b/i, 'money', 'Make it rain. Every bill is a booking. Manifesting.', () => FX.rain(['💸', '💵', '🤑'], 34)],
  [/\bsnow\b/i, 'snow', 'Florida-legal snow. Melts in three seconds, like real Florida snow.', () => FX.rain(['❄️', '❄️', '⛄'], 40)],
  [/\b(nap|naptime|sleepy|zzz)\b/i, 'nap', 'The whole app lies down with you. Don\'t tell anyone.', () => { FX.overlay('fx-dark', 2800); FX.rise(['💤', 'z', 'Z'], 16); }],
  [/\b(cheers|bellini|champagne|wine)\b/i, 'cheers', 'Clink. Responsible amounts of bubbly.', () => FX.burst(['🥂', '🍾', '✨'], 26)],
  [/\b(ugh|fml|worst day)\b/i, 'ugh', 'A tiny storm cloud passes over. The sun wins. It always does.', () => FX.storm()],
  [/\b(yay|woohoo|hooray|let'?s go)\b/i, 'yay', 'Confetti: the international sign for "heck yes."', () => confetti(150)],
  [/\bfireworks?\b/i, 'fireworks', 'Fourth of July, any day you want. No fingers lost.', () => FX.fireworks()],
  [/\bsharks?\b/i, 'shark', 'Dun dun… dun dun… dun dun dun dun…', () => FX.across('🦈', {size:80, y:.85, speed:6})],
  [/\bchocolate\b/i, 'chocolate', 'Chocolate rain. Scientists hate this one weird trick.', () => FX.rain(['🍫', '🍬'], 30)],
  [/\bunicorns?\b/i, 'unicorn', 'A unicorn gallops by. Don\'t ask questions you don\'t want answered.', () => { FX.across('🦄', {size:84, y:.4, speed:10}); FX.rain(['🌈', '✨'], 14); }],
  [/\b(beach|vacation)\b/i, 'beach', 'Instant vacation. Sunscreen not included.', () => FX.rise(['🌴', '☀️', '🐚', '🏖️'], 22)],
  [/\bmeow\b/i, 'meow', 'Cat translation services are now online. Accuracy: 3%.', () => { FX.bigText('MEOW', 1500); FX.across('🐾', {size:40, y:.75, speed:5}); }],
  [/\bzoomies\b/i, 'zoomies', '3 a.m. cat energy, delivered on demand.', () => FX.zoomies()],
  [/\bbubbles?\b/i, 'bubbles', 'Bubbles float up. Popping them is optional but encouraged.', () => FX.rise(['🫧', '🫧', '🫧'], 30)],
  [/\btacos?\b/i, 'taco', 'It\'s raining tacos, from out of the sky.', () => FX.rain(['🌮'], 30)],
  [/\b(best husband|rob is the best)\b/i, 'best husband', 'Correct answer. Prize awarded. Crown issued.', () => { FX.rain(['👑', '🏆'], 22); confetti(80); }],
  [/\bhugs?\b/i, 'hug', 'The whole app hugs you. Gently. With consent.', () => { FX.squeeze(); FX.rise(['🤗', '💛'], 10); }],
  [/\b(boom|mic drop)\b/i, 'boom', 'Mic drop. Everybody stand back.', () => { FX.bigText('💥', 1000); FX.shake(); }],
  [/\b(rainbow)\b/i, 'rainbow', 'A rainbow. Free of charge. Pot of gold sold separately.', () => FX.overlay('fx-rainbow', 2600)],
  [/\b(goodnight|good night|night night)\b/i, 'good night', 'The lights go down and the stars come out.', () => FX.stars()],
];
function secretWord(text){
  const hit = SECRETS.find(s => s[0].test(text)); if (!hit) return false;
  hit[3](); const found = get('try_secrets_found', []); if (!found.includes(hit[1])){ found.push(hit[1]); put('try_secrets_found', found); if (found.length === 1 && A()) A().toast('🤫 You found a secret word! See them all in More fun.'); }
  return true;
}
// 1B. Effects on Rob's replies
const REPLY_FX = [
  [/\b(congrat\w*|proud of you|crushed it|nailed it|you did it)\b/i, 1, () => { confetti(120); FX.rise(['🏆'], 6); }],
  [/\b(good ?night|sweet dreams|sleep well)\b/i, 1, () => FX.stars()],
  [/\bhappy birthday\b/i, 1, () => FX.rise(['🎈', '🎈', '🎉'], 26)],
  [/\bhigh[- ]five\b/i, 1, () => { FX.bigText('✋', 900); FX.shake(); }],
  [/\bcheers\b/i, 1, () => FX.burst(['🥂', '✨'], 18)],
  [/\b(hug|hugs)\b/i, .8, () => FX.squeeze()],
  [/\b(boom|mic drop)\b/i, 1, () => FX.bigText('💥', 900)],
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
const NAP_SPOTS = [['chipsBtn', 'on the ✦ button'], ['send', 'on the send button'], ['menuBtn', 'on the menu'], ['miniAvatar', 'on your photo of Rob']];
let roamer = null;
function roam(force){
  const p = petLoad(); if (!p || roamer || p.asleep && !force) return;
  if (!force && Math.random() < .5) return;
  const input = document.getElementById('input');
  const spots = NAP_SPOTS.filter(([id]) => { const b = document.getElementById(id); if (!b || !b.offsetParent) return false; if (id === 'send' && input && input.value.trim()) return false; const r = b.getBoundingClientRect(); return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight; });
  if (!spots.length) return;
  const [id, where] = rnd(spots), btn = document.getElementById(id), r = btn.getBoundingClientRect();
  const k = el('button', 'roam-cat'); k.type = 'button'; k.setAttribute('aria-label', `${p.name} is napping ${where}. Tap to move them.`);
  k.innerHTML = `<span class="rc-face">${p.asleep ? '😴' : rnd(['😺', '😽', '😸'])}</span><span class="rc-z" aria-hidden="true">z</span>`;
  Object.entries(p.worn || {}).forEach(([slot, e]) => { if (slot === 'head') { const a = el('span', 'rc-acc', e); k.append(a); } });
  const size = Math.max(34, Math.min(46, r.width + 6));
  Object.assign(k.style, {left:(r.left + r.width / 2 - size / 2) + 'px', top:(r.top + r.height / 2 - size / 2 - 4) + 'px', width:size + 'px', height:size + 'px', fontSize:(size - 8) + 'px'});
  document.body.appendChild(k); roamer = {k, id};
  const leave = (msg) => { k.classList.add('hop'); blip(760, .07, 'triangle'); const b2 = el('span', 'rc-say', msg || rnd(['mrrp!', 'mrow?', 'prrt', '*offended meow*', 'fine.'])); b2.style.left = k.style.left; b2.style.top = (parseFloat(k.style.top) - 22) + 'px'; document.body.appendChild(b2);
    setTimeout(() => { k.remove(); b2.remove(); roamer = null; }, 700); const s = get(PK, null); if (s){ s.love = Math.min(100, (s.love || 0) + 4); put(PK, s); } };
  k.onclick = e => { e.preventDefault(); e.stopPropagation(); leave(); };
  // a real cat would not move just because you started typing… but we're nice, so it moves off "send" when needed
  if (input) input.addEventListener('input', function off(){ if (roamer && roamer.id === 'send' && input.value.trim()){ input.removeEventListener('input', off); leave('fine, type.'); } });
  const away = setTimeout(() => { if (roamer && roamer.k === k) leave(''); }, 90000 + Math.random() * 60000);
  stoppersRoam.push(() => clearTimeout(away));
}
const stoppersRoam = [];
function walkAcross(){ const p = petLoad(); if (!p || p.asleep || roamer || reduced()) return; FX.across(rnd(['🐈', '🐈‍⬛']), {size:44, y:.86, speed:4}); }
setTimeout(() => roam(true), 4000);
setInterval(() => { if (document.visibilityState !== 'visible') return; Math.random() < .5 ? roam() : walkAcross(); }, 4 * 60000);
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

window.iRobFun = {petStatus, fortuneOfDay, petTile, secretWord, replyEffect, secretWords, loveCoupons, couponBadge, roam, FX, puppyPower, kittenCuddles, pocketKitten, catchKittens, fortuneCookie, dateNight, memoryMatch, photoPuzzle, whichFirst, zoomDetective, tripTimeline, bragButton, moreFun, croatiaGames, confetti, stop:stopAll,
  petName:() => (get(PK, null) || {}).name || null};
})();
