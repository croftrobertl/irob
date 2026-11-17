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
const ac = () => { if (!actx){ try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } } if (actx.state === 'suspended') actx.resume(); return actx; };
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

/* ================= C. Pocket kitten ================= */
const PK = 'try_pocketkitten';
const STAGES = [['kitten', 0], ['young cat', 12], ['grown cat', 40], ['royal cat', 90]];
function petState(){
  const p = get(PK, null); if (!p) return null;
  const hrs = ms => (Date.now() - ms) / 36e5;
  p.food = Math.max(0, 100 - hrs(p.fedAt) * 6);      // hungry after ~12 hours
  p.fun = Math.max(0, 100 - hrs(p.playedAt) * 5);    // bored after ~16 hours
  p.love = Math.max(0, 100 - hrs(p.pettedAt) * 4);
  p.stage = STAGES.filter(s => p.xp >= s[1]).length - 1;
  return p;
}
function petMood(p){
  if (p.food < 25) return ['😿', `${p.name} is staring at the food bowl. Dramatically.`];
  if (p.fun < 25) return ['🙀', `${p.name} has started knocking things off the counter. Boredom.`];
  if (p.love < 25) return ['😾', `${p.name} would like some attention. Now, please.`];
  const h = new Date().getHours();
  if (h >= 22 || h < 6) return ['😴', `${p.name} is asleep in a perfect circle.`];
  if (p.food > 75 && p.fun > 75 && p.love > 75) return ['😻', `${p.name} is the happiest cat in Florida.`];
  return ['😺', `${p.name} is doing just fine. Purring a little.`];
}
function pocketKitten(){
  const {body, show} = sheet('funPet', 'Pocket kitten');
  const p0 = petState();
  if (!p0){
    const f = el('form', 'pet-new');
    f.innerHTML = '<div class="pet-egg" aria-hidden="true">🧺</div><p>A kitten showed up in a basket. It needs a name.</p><label class="sr" for="petName">Kitten name</label><input id="petName" maxlength="20" placeholder="Name your kitten" autocomplete="off"><button class="btn">Adopt</button>';
    f.onsubmit = e => { e.preventDefault(); const n = f.querySelector('input').value.trim(); if (!n) return;
      const now = Date.now(); put(PK, {name:n, born:now, fedAt:now, playedAt:now, pettedAt:now, xp:0, days:[]}); confetti(60); pocketKitten(); };
    body.append(f); show(); setTimeout(() => f.querySelector('input').focus(), 350); return;
  }
  const view = el('div', 'pet');
  const render = () => {
    const p = petState(); const [face, line] = petMood(p);
    view.innerHTML = '';
    const pet = el('div', 'pet-cat', face); pet.style.fontSize = (64 + p.stage * 14) + 'px'; pet.setAttribute('role', 'img'); pet.setAttribute('aria-label', `${p.name}, ${STAGES[p.stage][0]}`);
    if (p.stage >= 3) pet.dataset.crown = '👑';
    const name = el('h3', 'pet-name', p.name); const sub = el('p', 'pet-sub', `${STAGES[p.stage][0]} · ${(d => d === 1 ? '1 day' : d + ' days')(Math.max(1, Math.ceil((Date.now() - p.born) / 864e5)))} old`);
    const say = el('p', 'pet-line', line);
    const bars = el('div', 'pet-bars');
    [['🐟', 'Food', p.food], ['🧶', 'Fun', p.fun], ['💗', 'Love', p.love]].forEach(([e, l, v]) => { const b = el('div', 'pet-bar'); b.innerHTML = `<span aria-hidden="true">${e}</span><span class="sr">${l}</span><b><i style="width:${Math.round(v)}%"></i></b>`; bars.append(b); });
    const acts = el('div', 'pet-acts');
    const act = (emoji, label, key, reply) => { const b = el('button', 'tile'); b.type = 'button'; b.innerHTML = `<span class="e" aria-hidden="true">${emoji}</span><span>${label}</span>`;
      b.onclick = () => { const s = get(PK, null); s[key] = Date.now(); const today = new Date().toDateString(); s.days = (s.days || []).filter(d => d !== today).concat(today).slice(-120); s.xp = (s.xp || 0) + 1; const before = petState().stage; put(PK, s);
        blip(key === 'fedAt' ? 520 : key === 'playedAt' ? 700 : 880, .1, 'triangle'); render(); view.querySelector('.pet-line').textContent = reply.replace('{n}', s.name);
        const after = petState().stage; if (after > before){ confetti(); A().toast(`${s.name} grew into a ${STAGES[after][0]}!`); } };
      acts.append(b); };
    act('🐟', 'Feed', 'fedAt', rnd(['{n} inhaled it. Zero chewing.', '{n} ate, then looked at you like you forgot dessert.', 'Nom. {n} approves.']));
    act('🧶', 'Play', 'playedAt', rnd(['{n} attacked the yarn with full commitment.', '{n} did a sideways hop. Elite athlete.', 'Zoomies achieved.']));
    act('🤍', 'Pet', 'pettedAt', rnd(['{n} is purring so loud the neighbors can hear.', '{n} headbutted your hand. That means love.', 'Slow blink from {n}. You are trusted.']));
    view.append(pet, name, sub, say, bars, acts);
  };
  render(); body.append(view); show();
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
    run = {w, h, bx:w / 2, items:[], score:0, t0:performance.now(), last:0, spawn:0};
    const loop = t => {
      if (!run) return;
      const left = Math.max(0, 30 - (t - run.t0) / 1000);
      const dt = Math.min(50, t - (run.last || t)); run.last = t;
      if (t - run.spawn > Math.max(320, 760 - (30 - left) * 15)){ run.spawn = t; const r = Math.random(); run.items.push({x:20 + Math.random() * (w - 40), y:-30, v:1.6 + Math.random() * 1.6 + (30 - left) * .05, e:r < .14 ? '🐶' : r < .3 ? '🥒' : '🐱'}); }
      g.clearRect(0, 0, w, h);
      g.font = '30px system-ui, "Apple Color Emoji", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      run.items.forEach(it => { it.y += it.v * dt / 16; g.fillText(it.e, it.x, it.y); });
      g.font = '40px system-ui, "Apple Color Emoji", sans-serif'; g.fillText('🧺', run.bx, h - 26);
      run.items = run.items.filter(it => {
        if (it.y > h - 46 && it.y < h - 6 && Math.abs(it.x - run.bx) < 34){ const pts = it.e === '🐶' ? 3 : it.e === '🥒' ? -2 : 1; run.score = Math.max(0, run.score + pts); blip(pts > 0 ? 640 + pts * 60 : 180, .08, pts > 0 ? 'sine' : 'square', .08); return false; }
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

/* ================= H. Croatia memory match ================= */
async function memoryMatch(){
  const {body, show} = sheet('funMatch', 'Croatia memory match');
  body.append(el('p', 'note', 'Shuffling photos…')); show();
  const pool = A().loadTrip ? await A().loadTrip() : null;
  const photos = pool ? pool.filter(m => m.k === 'p' && m.thumb) : [];
  body.innerHTML = '';
  if (photos.length < 6){ body.append(el('p', 'note', 'I couldn\'t reach the Croatia photos just now. Try again in a bit.')); return; }
  const picks = []; const used = new Set();
  while (picks.length < 6){ const p = rnd(photos); if (!used.has(p.thumb)){ used.add(p.thumb); picks.push(p); } }
  const cards = [...picks, ...picks].map((p, i) => ({p, i})).sort(() => Math.random() - .5);
  const best = get('try_matchbest', null);
  const hud = el('p', 'note', best ? `Find all 6 pairs. Best: ${best} moves.` : 'Find all 6 pairs.');
  const grid = el('div', 'mm-grid');
  let first = null, lock = false, moves = 0, found = 0;
  cards.forEach(c => {
    const b = el('button', 'mm-card'); b.type = 'button'; b.setAttribute('aria-label', 'Hidden photo');
    b.innerHTML = `<span class="mm-back" aria-hidden="true">✦</span><img alt="" loading="lazy" src="${c.p.thumb}">`;
    b.onclick = () => {
      if (lock || b.classList.contains('up')) return;
      b.classList.add('up'); b.setAttribute('aria-label', c.p.place || 'Croatia photo'); blip(600, .05);
      if (!first){ first = {b, c}; return; }
      moves++;
      if (first.c.p.thumb === c.p.thumb){ found++; first.b.classList.add('done'); b.classList.add('done'); first = null; blip(880, .12);
        if (found === 6){ confetti(); const prev = get('try_matchbest', null); if (!prev || moves < prev) put('try_matchbest', moves);
          hud.textContent = `All pairs in ${moves} moves! ${!prev || moves < prev ? 'New record. Your memory is elite.' : `Best is ${prev}. Still impressive.`}`; again.hidden = false; }
        else hud.textContent = `${found} of 6 pairs · ${moves} moves`;
      } else { lock = true; const a = first.b; first = null; setTimeout(() => { a.classList.remove('up'); b.classList.remove('up'); a.setAttribute('aria-label', 'Hidden photo'); b.setAttribute('aria-label', 'Hidden photo'); lock = false; }, 900); hud.textContent = `${found} of 6 pairs · ${moves} moves`; }
    };
    grid.append(b);
  });
  const again = el('button', 'btn ghost', 'Play again'); again.type = 'button'; again.hidden = true; again.onclick = memoryMatch;
  body.append(hud, grid, again);
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

/* ================= More fun ================= */
function moreFun(items){
  const {body, show} = sheet('funMore', 'More fun');
  const grid = el('div', 'tiles');
  items.forEach(([e, label, fn]) => { const b = el('button', 'tile'); b.type = 'button'; b.innerHTML = `<span class="e" aria-hidden="true">${e}</span><span></span>`; b.lastChild.textContent = label; b.onclick = () => { stopAll(); fn(); }; grid.append(b); });
  body.append(grid); show();
}

window.iRobFun = {puppyPower, kittenCuddles, pocketKitten, catchKittens, fortuneCookie, dateNight, memoryMatch, bragButton, moreFun, confetti,
  petName:() => (get(PK, null) || {}).name || null};
})();
