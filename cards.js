/* iRob — Card & Comfort System.
   Loaded after index.html's main script, which exposes window.iRob (the app's helpers).
   Everything stays on Erica's phone: card state lives in IndexedDB ("irob" database). */
(() => {
'use strict';
const A = window.iRob;
if (!A) return;
const $ = A.$, uid = A.uid, toast = A.toast, HER = A.HER;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd = arr => arr[Math.floor(Math.random() * arr.length)];
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmtDate = t => new Date(t).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'});
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* ================= IndexedDB (with an in-memory fallback for private mode) ================= */
const DB = (() => {
  const mem = new Map(); let dbp = null, broken = false;
  const openDB = () => dbp || (dbp = new Promise((res, rej) => {
    try { const r = indexedDB.open('irob', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }
    catch (e) { rej(e); }
  }));
  async function run(mode, fn){
    if (broken) throw 0;
    const db = await openDB();
    return new Promise((res, rej) => { const t = db.transaction('kv', mode), req = fn(t.objectStore('kv')); t.oncomplete = () => res(req && 'result' in req ? req.result : undefined); t.onerror = t.onabort = () => rej(t.error); });
  }
  return {
    async get(k, d){ try { const v = await run('readonly', s => s.get(k)); return v === undefined ? d : v; } catch { broken = true; return mem.has(k) ? mem.get(k) : d; } },
    async set(k, v){ try { await run('readwrite', s => s.put(v, k)); } catch { broken = true; mem.set(k, v); } },
    async del(k){ try { await run('readwrite', s => s.delete(k)); } catch { mem.delete(k); } },
    async entries(){ try { const keys = await run('readonly', s => s.getAllKeys()), vals = await run('readonly', s => s.getAll()); return keys.map((k, i) => [k, vals[i]]); } catch { return [...mem.entries()]; } },
    async clear(){ try { await run('readwrite', s => s.clear()); } catch { mem.clear(); } }
  };
})();
const blobToDataURL = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
const dataURLToBlob = async u => (await fetch(u)).blob();

/* ================= Sharing to Real Rob (2B: iPhone share sheet) ================= */
async function shareToRob(text){
  try { if (navigator.share){ await navigator.share({text}); toast('Sent your way 💛'); return true; } }
  catch (e) { if (e && e.name === 'AbortError') return false; }
  try { await navigator.clipboard.writeText(text); toast('Copied — paste it in a text to Rob'); return true; } catch { toast('Press and hold to copy'); return false; }
}

/* ================= Cute-animal engine ================= */
const POOL = {
  dogs: ['https://images.dog.ceo/breeds/retriever-golden/n02099601_1580.jpg','https://images.dog.ceo/breeds/retriever-golden/z6a_4365_200807.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_286.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_1633.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_831.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_1454.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_2358.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_3494.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_7432.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_70.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_3097.jpg','https://images.dog.ceo/breeds/retriever-golden/pxl_20220311_055611129.mp_3.jpg','https://images.dog.ceo/breeds/retriever-golden/z6a_4928_200816.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_3388.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_2408.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_447.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_5642.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_342.jpg','https://images.dog.ceo/breeds/retriever-golden/sasha3_delgado.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_1768.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_2994.jpg','https://images.dog.ceo/breeds/retriever-golden/joey_img_0261.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_1162.jpg','https://images.dog.ceo/breeds/retriever-golden/n02099601_3327.jpg'],
  cats: ['https://cataas.com/cat/ZcZisZAzDIYQsvEP?width=600','https://cataas.com/cat/LKQPYAXavhxY0JjO?width=600','https://cataas.com/cat/vrl8c2DtjdmZdLwb?width=600','https://cataas.com/cat/kW6IiNXzifcHYe74?width=600','https://cataas.com/cat/Fy1ZRM362ukJIXkD?width=600','https://cataas.com/cat/VRb1RrqGSK6ULPXD?width=600','https://cataas.com/cat/aRV0Dih6ocRpOkoF?width=600','https://cataas.com/cat/z4HCl4bFpc00IxHL?width=600','https://cataas.com/cat/iVrhUeVmF099KKzb?width=600','https://cataas.com/cat/ZrpBHMZHyYZEo1JM?width=600','https://cataas.com/cat/hmaofQBdVWtK77mc?width=600','https://cataas.com/cat/8nIcQVhyTfuVLqSt?width=600'],
  vids: ['https://random.dog/43632c92-9e69-432e-9547-c0bed9bf39f0.mp4','https://random.dog/58693049-95d5-409b-b14c-3f57ed047662.mp4','https://random.dog/baf767c9-bef8-4055-a8d9-2e26337d2a87.mp4','https://random.dog/c1af38f9-27cf-4a36-b9e9-ef995dcfd3e3.mp4']
};
// Drawn critters for when there's no internet at all, so a broken image never shows.
const SVG_CAT = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><rect width="200" height="160" fill="#efe4d2"/><path d="M60 120c0-34 18-58 40-58s40 24 40 58z" fill="#d9a22b"/><circle cx="100" cy="72" r="34" fill="#d9a22b"/><path d="M70 52 74 24 92 44zM130 52 126 24 108 44z" fill="#d9a22b"/><path d="M83 70q5-5 10 0M107 70q5-5 10 0" stroke="#3c3730" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M96 82h8l-4 4z" fill="#a8452f"/><path d="M100 86q-6 7-12 3M100 86q6 7 12 3" stroke="#3c3730" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M140 112q30-6 22-30" stroke="#d9a22b" stroke-width="10" fill="none" stroke-linecap="round"/></svg>');
const SVG_DOG = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160"><rect width="200" height="160" fill="#efe4d2"/><ellipse cx="100" cy="128" rx="46" ry="28" fill="#d9a22b"/><circle cx="100" cy="74" r="38" fill="#e0b45a"/><ellipse cx="64" cy="80" rx="14" ry="26" fill="#b68235"/><ellipse cx="136" cy="80" rx="14" ry="26" fill="#b68235"/><circle cx="86" cy="68" r="5" fill="#3c3730"/><circle cx="114" cy="68" r="5" fill="#3c3730"/><ellipse cx="100" cy="86" rx="9" ry="6" fill="#3c3730"/><path d="M100 92v8M92 102q8 9 16 0" stroke="#3c3730" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M98 103q2 10 6 0" fill="#e07a6a"/></svg>');
const CAPTIONS = {
  dog:["This golden retriever would like you to know you're doing great.","Official golden retriever opinion: you're the best person in the room.","Emergency happiness delivery. Tail wags included.","He heard you needed a friend. He brought his whole face.","Golden retriever energy, transferred directly to you."],
  cat:["This cat has reviewed your situation and approves of a nap.","Purr-scription: one deep breath, then a snack.","A small, very serious cat has decided you deserve good things.","Cat says: knock the worry off the table. Gently.","This kitty is sending you a slow blink. That means love in cat."],
  any:["Emergency serotonin, delivered.","A tiny furry reminder that the world still has good things in it.","Paws for a second. This one's for you.","Cuteness has been dispatched to your location."]
};
const timeout = (ms) => AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined;
async function getJSON(url){ const r = await fetch(url, {signal:timeout(2500), cache:'no-store'}); if (!r.ok) throw 0; return r.json(); }
const SOURCES = {
  golden: async () => ({type:'image', kind:'dog', url:(await getJSON('https://dog.ceo/api/breed/retriever/golden/images/random')).message}),
  cat: async () => { const j = await getJSON(Math.random() < .3 ? 'https://cataas.com/cat/gif?json=true' : 'https://cataas.com/cat?json=true'); const gif = /gif/.test(j.mimetype || ''); return {type:gif ? 'gif' : 'image', kind:'cat', url:`https://cataas.com/cat/${j.id || j._id}${gif ? '' : '?width=600'}`}; },
  pup: async () => { const j = await getJSON('https://random.dog/woof.json'); const ext = (j.url.split('.').pop() || '').toLowerCase();
    if (!j.fileSizeBytes || j.fileSizeBytes > 3e6 || ext === 'webm') throw 0;
    return {type:ext === 'mp4' ? 'video' : ext === 'gif' ? 'gif' : 'image', kind:'dog', url:j.url}; }
};
function preload(item){
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(0), 4500);
    if (item.type === 'video'){ const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.oncanplay = () => { clearTimeout(t); res(item); }; v.onerror = () => { clearTimeout(t); rej(0); }; v.src = item.url; v.load(); }
    else { const i = new Image(); i.onload = () => { clearTimeout(t); res(item); }; i.onerror = () => { clearTimeout(t); rej(0); }; i.src = item.url; }
  });
}
function poolItem(kind){
  if (kind === 'cat') return {type:'image', kind:'cat', url:rnd(POOL.cats)};
  if (kind === 'golden') return {type:'image', kind:'dog', url:rnd(POOL.dogs)};
  const r = Math.random(); return r < .15 ? {type:'video', kind:'dog', url:rnd(POOL.vids)} : r < .55 ? {type:'image', kind:'cat', url:rnd(POOL.cats)} : {type:'image', kind:'dog', url:rnd(POOL.dogs)};
}
async function freshCritter(kind){
  const names = kind === 'cat' ? ['cat'] : kind === 'golden' ? ['golden'] : ['golden', 'cat', 'pup'];
  try { const item = await Promise.any(names.map(n => SOURCES[n]())); return await preload(item); } catch {}
  try { return await preload(poolItem(kind)); } catch {}
  return {type:'image', kind:kind === 'cat' ? 'cat' : 'dog', url:kind === 'cat' ? SVG_CAT : SVG_DOG, offline:true};
}
const nextUp = {};
function critter(kind = 'any'){ const p = nextUp[kind] || freshCritter(kind); nextUp[kind] = freshCritter(kind); return p; } // always pre-fetch the next one
function critterEl(item){
  let el;
  if (item.type === 'video'){ el = document.createElement('video'); Object.assign(el, {src:item.url, muted:true, loop:true, autoplay:true, playsInline:true}); el.setAttribute('playsinline', ''); el.setAttribute('muted', ''); el.play().catch(() => {}); }
  else { el = document.createElement('img'); el.src = item.url; el.alt = item.kind === 'cat' ? 'A cute cat' : 'A cute dog'; }
  el.className = 'kc-media';
  el.onerror = () => { const f = document.createElement('img'); f.className = 'kc-media'; f.src = item.kind === 'cat' ? SVG_CAT : SVG_DOG; f.alt = 'A drawn cute animal'; el.replaceWith(f); };
  return el;
}
const captionFor = item => rnd([...(CAPTIONS[item.kind] || []), ...CAPTIONS.any]);

/* ================= Gentle sound (Web Audio, started by a tap) ================= */
let actx = null;
function audio(){ actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); return actx; }
function noiseBuffer(ctx, kind){
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < len; i++){ const w = Math.random() * 2 - 1; if (kind === 'brown'){ last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w * .5; }
  return buf;
}
function soundscape(kind){
  const ctx = audio(), src = ctx.createBufferSource(); src.buffer = noiseBuffer(ctx, kind === 'rain' ? 'white' : 'brown'); src.loop = true;
  const filter = ctx.createBiquadFilter(), out = ctx.createGain(); out.gain.value = 0;
  const nodes = [src];
  if (kind === 'ocean'){ filter.type = 'lowpass'; filter.frequency.value = 700;
    const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = .09; depth.gain.value = .35; lfo.connect(depth); const swell = ctx.createGain(); swell.gain.value = .55; depth.connect(swell.gain);
    src.connect(filter); filter.connect(swell); swell.connect(out); lfo.start(); nodes.push(lfo); }
  else if (kind === 'rain'){ filter.type = 'bandpass'; filter.frequency.value = 2400; filter.Q.value = .4; src.connect(filter); filter.connect(out); }
  else { // purr: low rumble pulsing ~24 times a second, breathing slowly
    filter.type = 'lowpass'; filter.frequency.value = 260; const am = ctx.createGain(); am.gain.value = .5;
    const flutter = ctx.createOscillator(), fd = ctx.createGain(); flutter.frequency.value = 24; fd.gain.value = .5; flutter.connect(fd); fd.connect(am.gain);
    const breath = ctx.createOscillator(), bd = ctx.createGain(); breath.frequency.value = .22; bd.gain.value = .25; breath.connect(bd); bd.connect(am.gain);
    src.connect(filter); filter.connect(am); am.connect(out); flutter.start(); breath.start(); nodes.push(flutter, breath); }
  out.connect(ctx.destination); src.start();
  const target = kind === 'purr' ? .9 : kind === 'rain' ? .22 : .5;
  out.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.2);
  return () => { try { out.gain.cancelScheduledValues(ctx.currentTime); out.gain.setValueAtTime(out.gain.value, ctx.currentTime); out.gain.linearRampToValueAtTime(0, ctx.currentTime + .8); setTimeout(() => nodes.forEach(n => { try { n.stop(); } catch {} }), 900); } catch {} };
}
const buzz = p => { if (navigator.vibrate) try { navigator.vibrate(p); } catch {} };

/* ================= Content ================= */
const FLIPS = [
  {k:/(fail|failure|failed|not good enough|useless|i suck)/i, f:"I'm failing at everything.", b:"I see someone carrying more than most people ever would, and still showing up. That's not failing — that's strength on a tired day."},
  {k:/(fault|blame|messed up|mess up|ruined)/i, f:"This is all my fault.", b:"I see someone who cares so much she takes the blame for everything. You did your best with what you knew. That's all anyone gets to do."},
  {k:/(behind|late|slow|everyone else)/i, f:"Everyone else has it figured out. I'm so behind.", b:"I see a highlight reel on their side and your behind-the-scenes on yours. You're right on your own time."},
  {k:/(too much|overwhelm|can'?t handle|drowning)/i, f:"It's too much. I can't handle it.", b:"I see someone who's handled every hard day so far — every single one. You don't have to handle all of it today. Just the next small piece."},
  {k:/(stupid|dumb|idiot)/i, f:"I'm so stupid.", b:"I see someone smart enough to notice her mistakes — and kind enough to everyone but herself. Let's extend you some of that kindness."},
  {k:/(alone|lonely|nobody)/i, f:"Nobody really gets it.", b:"I see someone worth understanding, and people who'd want to if they knew how heavy today was. You're not alone in this."},
  {k:/(ugly|look awful|hate how i look)/i, f:"I look awful today.", b:"I see someone beautiful — inside and out — on a day she's being hard on herself. Your worth was never about today's mirror."},
  {k:/(anxious|worry|worried|what if)/i, f:"What if everything goes wrong?", b:"I see a big heart trying to protect everything it loves. Most what-ifs never happen — and the ones that do, you handle."},
  {k:/./, f:"I should be doing better than this.", b:"I see someone doing her honest best on a hard day. That's not 'should be better' — that's enough."}
];
const FACTS = ["Survived 100% of your hardest days so far","Kept the people you love fed, safe and loved","Made someone smile this week, probably without noticing","Kept going on days you really didn't want to","Showed up for your kids, again and again","Asked for comfort instead of pretending — that takes guts"];
const NOTES = ["You're my favorite notification.","Proof you're doing great: you're still trying. That counts double.","Somewhere a golden retriever is thinking about you. So am I.","You're allowed to rest before you're finished.","Your laugh is still one of the best sounds in the world.","Today's forecast: a little lighter than yesterday."];
const TICKETS = [
  {id:'date', title:'Date night', detail:'You pick the place — Rob plans the rest.', kind:'romantic'},
  {id:'breakfast', title:'Breakfast in bed', detail:'Coffee exactly how you like it, no getting up.', kind:'romantic'},
  {id:'dance', title:'Slow dance in the kitchen', detail:'One song, lights low, no phones.', kind:'romantic'},
  {id:'movie', title:'Movie night, your pick', detail:'Your movie, extra snacks, zero complaints.', kind:'romantic'},
  {id:'bedtime', title:'Bedtime takeover', detail:'You\'re off duty tonight — Rob handles bedtime.', kind:'practical'},
  {id:'dinner', title:'Dinner\'s handled', detail:'Rob cooks, orders or figures it out. You rest.', kind:'practical'},
  {id:'nap', title:'Two-hour nap', detail:'Guaranteed quiet. Kids and chaos handled.', kind:'practical'},
  {id:'errand', title:'Errand rescue', detail:'One errand you\'re dreading — gone.', kind:'practical'}
];
const VOUCHERS = TICKETS.filter(t => ['breakfast','nap','dinner','movie'].includes(t.id));
const HYPE = ["You were made for this. Walk in like the golden retriever version of you: tail up, zero doubt.","Golden retriever energy only: you're amazing, everyone's lucky to have you, and today is going to be great.","Nervous just means it matters. You've got this — and a whole golden retriever believes in you.","Deep breath, shoulders back. You're smart, capable and ridiculously lovable. Go get it."];
const SANCTUARY_THOUGHTS = ["Nothing needs you for the next two minutes.","Let your shoulders drop. Unclench your jaw.","Breathe in slowly… and let it go even slower.","The water doesn't hurry. Neither do you.","You're safe right here.","Whatever's waiting can wait. You're allowed this."];
const GROUND = [[5,'things you can see'],[4,'things you can feel'],[3,'things you can hear'],[2,'things you can smell'],[1,'thing you can taste']];

/* ================= Card registry ================= */
const MOODS = {smile:'Need a smile', calm:'Need calm', perspective:'Need perspective', connect:'Connect with Real Rob'};
const CARDS = {};
const def = (id, mood, title, blurb, render) => { CARDS[id] = {id, mood, title, blurb, render}; };
const btn = (label, cls = 'btn') => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = label; return b; };
const row = (...els) => { const r = document.createElement('div'); r.className = 'kc-btns'; r.append(...els); return r; };
const p = (text, cls) => { const e = document.createElement('p'); if (cls) e.className = cls; e.textContent = text; return e; };
const speakBtn = getText => { const b = btn('', 'kc-speak'); b.setAttribute('aria-label', 'Read aloud'); b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>'; b.onclick = () => A.speak(getText()); return b; };

// 1 — "Open when…" prescriptions
def('drop', 'connect', 'Permission to drop the ball', 'Official permission to let one thing go today.', body => {
  body.append(p('Official permission, signed by Rob: you are allowed to drop one ball today. Pick it:'));
  const chips = document.createElement('div'); chips.className = 'kc-chips'; let pick = null;
  ['Dinner','Laundry','Bedtime','The dishes','Replying to texts','Being "on" for everyone'].forEach(t => { const c = btn(t, 'chip'); c.onclick = () => { pick = t; chips.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === c)); go.disabled = false; }; chips.appendChild(c); });
  const go = btn('Cash this in →'); go.disabled = true;
  go.onclick = () => shareToRob(`🏳️ I'm cashing in my "Permission to drop the ball" card: can you take ${pick.toLowerCase()} off my plate tonight?`);
  body.append(chips, row(go));
});
def('receipt', 'perspective', 'Receipt of facts', 'Proof, itemized, that you\'re doing better than you think.', body => {
  const led = A.getLedger().slice(0, 5); const box = document.createElement('div'); box.className = 'kc-receipt';
  const items = led.length ? led.map(e => [e.text, fmtDate(e.t)]) : FACTS.slice(0, 5).map(f => [f, '✓']);
  box.innerHTML = '<b>RECEIPT OF FACTS</b><small>' + esc(fmtDate(Date.now())) + '</small>' + items.map(([a, b]) => `<div class="kc-line"><span>${esc(a)}</span><i>${esc(b)}</i></div>`).join('') + '<div class="kc-total"><span>TOTAL</span><span>More capable than you feel right now</span></div><small>Paid in full. No refunds on self-doubt.</small>';
  body.append(box);
  if (!led.length) body.append(p('Your Good Things Ledger is empty, so these are on the house. Add your own wins there and they\'ll show up here.', 'kc-note'));
});
def('escape', 'calm', 'Mini-escape', 'Sixty seconds somewhere you were happy.', async body => {
  const m = await A.randomMemory(); const fig = document.createElement('div'); fig.className = 'kc-photo';
  if (m){ const i = document.createElement('img'); i.src = m.thumb; i.alt = 'Photo from ' + m.place; i.loading = 'lazy'; fig.append(i); }
  body.append(fig, p(m ? `Sixty seconds in ${m.place}. Look at the light in this picture. Breathe in for four… out for six. Nothing here needs anything from you.` : 'Close your eyes for sixty seconds. Picture warm stone, clear water and nowhere to be. Breathe in for four… out for six.'));
  const back = btn('Take me back (1 minute)'); back.onclick = () => A.startSlides();
  const more = btn('Another place', 'btn ghost'); more.onclick = () => { body.innerHTML = ''; CARDS.escape.render(body); };
  body.append(row(back, more));
});
def('letters', 'connect', 'Rob’s sealed letters', '“Open when…” letters, sealed with your word.', body => {
  body.append(p('Rob sealed some letters for the moments that need them. Only your word opens them.'));
  const b = btn('Open the envelope box'); b.onclick = () => A.open('sheetLetters'); body.append(row(b));
});

// 2 — Bad day insurance
let sealedCount = 0;
async function refreshSealed(){ sealedCount = (await DB.get('capsules', [])).filter(c => !c.opened).length; }
def('capsule', 'smile', 'Bad day insurance', 'Seal a good moment for a rainy day.', body => {
  body.append(p('Having a good moment? Seal it. It stays locked until the next time you\'re having a rough day — then it breaks open for you.'));
  const ta = document.createElement('textarea'); ta.className = 'kc-input'; ta.placeholder = 'Right now I feel good because…'; ta.maxLength = 600;
  const led = A.getLedger().slice(0, 8);
  const sel = document.createElement('select'); sel.className = 'kc-select'; sel.innerHTML = '<option value="">…or seal a Ledger win</option>' + led.map((e, i) => `<option value="${i}">${esc(e.text.slice(0, 60))}</option>`).join('');
  sel.onchange = () => { if (sel.value !== '') ta.value = led[+sel.value].text; };
  const go = btn('Seal it 🔒');
  go.onclick = async () => { const v = ta.value.trim(); if (!v) { toast('Write a few words first'); return; }
    const caps = await DB.get('capsules', []); caps.push({id:uid(), text:v, t:Date.now(), opened:false}); await DB.set('capsules', caps); await refreshSealed();
    body.innerHTML = ''; body.append(p('🔒 Sealed. It\'ll be waiting for the next rough day. Future you says thank you.', 'kc-done')); };
  body.append(ta, led.length ? sel : document.createTextNode(''), row(go));
});
def('glass', 'smile', 'Break glass in case of emergency', 'A good moment you sealed for a day like this.', async body => {
  const caps = await DB.get('capsules', []), c = caps.find(x => !x.opened);
  if (!c){ body.append(p('Nothing sealed yet. Next time you\'re having a good moment, seal it here — it\'ll be waiting for a hard day.')); const b = btn('Seal a good moment'); b.onclick = () => openCard('capsule'); body.append(row(b)); return; }
  const pane = document.createElement('div'); pane.className = 'kc-glass'; pane.innerHTML = '<span>IN CASE OF A HARD DAY</span><b>Break glass</b>';
  const b = btn('Break the glass'); body.append(p('Past you left something for today.'), pane, row(b));
  b.onclick = async () => { pane.classList.add('broken'); buzz(30); c.opened = true; c.openedAt = Date.now(); await DB.set('capsules', caps); await refreshSealed();
    setTimeout(() => { pane.replaceWith(Object.assign(document.createElement('blockquote'), {className:'kc-quote', textContent:c.text})); b.remove(); body.append(p(`You sealed this on ${fmtDate(c.t)}. That person is still you.`, 'kc-note')); }, reduceMotion() ? 0 : 700); };
});

// 3 — Co-regulation
def('ground', 'calm', '5-4-3-2-1', 'Come back to right here, one sense at a time.', body => {
  body.append(p('Tap a dot for each one you notice. No rush.'));
  const list = document.createElement('div'); list.className = 'kc-ground'; let left = 15;
  const done = p('', 'kc-done'); done.hidden = true;
  GROUND.forEach(([n, label]) => { const r = document.createElement('div'); r.className = 'kc-grow'; const l = document.createElement('span'); l.textContent = `${n} ${label}`; const dots = document.createElement('span');
    for (let i = 0; i < n; i++){ const d = btn('', 'kc-dot'); d.setAttribute('aria-label', `${label}, ${i + 1}`); d.onclick = () => { if (d.classList.contains('on')) return; d.classList.add('on'); buzz(10); if (--left === 0){ done.textContent = 'You\'re here. You\'re safe. Nicely done.'; done.hidden = false; } }; dots.append(d); }
    r.append(l, dots); list.append(r); });
  body.append(list, done);
});
def('shred', 'calm', 'Brain dump & shred', 'Type every worry. Let Rob carry it.', body => {
  const ta = document.createElement('textarea'); ta.className = 'kc-input'; ta.placeholder = 'Every worry, messy is fine. Nobody will ever see this — not even Rob.';
  const go = btn('Let Rob carry it');
  go.onclick = () => { const v = ta.value.trim(); if (!v){ toast('Type a worry or two first'); return; }
    const out = document.createElement('div'); out.className = 'kc-shred'; out.setAttribute('aria-hidden', 'true');
    [...v.slice(0, 400)].forEach(ch => { const s = document.createElement('span'); s.textContent = ch; s.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px'); s.style.setProperty('--dy', (Math.random() * -90 - 20) + 'px'); s.style.setProperty('--r', (Math.random() * 180 - 90) + 'deg'); s.style.transitionDelay = (Math.random() * .5) + 's'; out.append(s); });
    ta.replaceWith(out); go.remove(); requestAnimationFrame(() => requestAnimationFrame(() => out.classList.add('go')));
    setTimeout(() => { out.replaceWith(p('Got it. I\'m carrying all of that tonight. You can put it down now.', 'kc-done')); }, reduceMotion() ? 200 : 1900); };
  body.append(ta, row(go));
});

// 4 — Real-world bridge
def('translate', 'connect', 'Translate my mood for Rob', 'Three taps, one gentle status update.', body => {
  const pickers = [['Mood', ['😊 okay','😐 meh','😔 low','😣 overwhelmed']], ['Battery', ['full','half','low','empty']], ['I could use', ['a hug','quiet','help with something','to vent','a laugh','space']]];
  const sel = {}; const preview = p('', 'kc-quote');
  const update = () => { preview.textContent = `${HER}'s status: ${sel.Mood || '…'} · battery ${sel.Battery || '…'} · could use ${sel['I could use'] || '…'}. Nothing to fix — just so you know. 💛`; send.disabled = !(sel.Mood && sel.Battery && sel['I could use']); };
  pickers.forEach(([name, opts]) => { const lab = p(name, 'kc-label'); const c = document.createElement('div'); c.className = 'kc-chips';
    opts.forEach(o => { const b = btn(o, 'chip'); b.onclick = () => { sel[name] = o; c.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); update(); }; c.append(b); }); body.append(lab, c); });
  const send = btn('Send to Rob'); send.onclick = () => shareToRob(preview.textContent);
  body.append(preview, row(send)); update();
});
def('tickets', 'connect', 'Ticket stubs', 'Claim a date or a takeover with one tap.', async body => {
  const claimed = await DB.get('tickets', {});
  const list = document.createElement('div'); list.className = 'kc-tickets';
  TICKETS.forEach(t => { const s = document.createElement('div'); s.className = 'kc-ticket ' + t.kind;
    s.innerHTML = `<div><b>${esc(t.title)}</b><small>${esc(t.detail)}</small></div>`; const c = btn(claimed[t.id] ? 'Claim again' : 'Claim', 'kc-claim');
    if (claimed[t.id]) s.insertAdjacentHTML('beforeend', `<em>Claimed ${esc(fmtDate(claimed[t.id]))}</em>`);
    c.onclick = async () => { const ok = await shareToRob(`🎟️ I'm claiming my ticket: ${t.title}! (${t.detail})`); if (ok){ claimed[t.id] = Date.now(); await DB.set('tickets', claimed); body.innerHTML = ''; CARDS.tickets.render(body); } };
    s.append(c); list.append(s); });
  body.append(list);
});

// 5 — Perspective flip
def('flip', 'perspective', 'Perspective shift', 'Flip what your stressed brain says.', (body, ctx) => {
  let pair = FLIPS.find(f => ctx && ctx.text && f.k.test(ctx.text) && f.k.source !== '.') || rnd(FLIPS);
  const card = document.createElement('button'); card.type = 'button'; card.className = 'kc-flip'; card.setAttribute('aria-pressed', 'false');
  const draw = () => { card.innerHTML = `<span class="front"><small>What your stressed brain says</small><q>${esc(pair.f)}</q><i>Tap to flip</i></span><span class="back"><small>What Rob sees</small><q>${esc(pair.b)}</q></span>`; };
  draw(); card.onclick = () => { const on = card.getAttribute('aria-pressed') !== 'true'; card.setAttribute('aria-pressed', on); buzz(8); };
  const save = btn('Save to Pocket', 'btn ghost'); save.onclick = () => { A.addToPocket(pair.b); };
  const another = btn('Another', 'btn ghost'); another.onclick = () => { pair = rnd(FLIPS.filter(f => f !== pair)); card.setAttribute('aria-pressed', 'false'); setTimeout(draw, reduceMotion() ? 0 : 250); };
  body.append(card, row(speakBtn(() => pair.b), save, another));
});

// 6 — Unspoken needs decoder
def('needs', 'connect', 'Unspoken needs decoder', 'Slide to show what you need — no explaining required.', body => {
  const S = [['listen','Listen','Fix'], ['company','Company','Quiet'], ['distract','Distract me','Talk it out'], ['hugs','Hugs','Space']];
  const vals = {}; const out = p('', 'kc-quote');
  const word = (v, a, b) => v < 35 ? a.toLowerCase() : v > 65 ? b.toLowerCase() : `a bit of both ${a.toLowerCase()} and ${b.toLowerCase()}`;
  const update = () => { out.textContent = `What I need right now: ${word(vals.listen, 'Listening', 'Fixing')} · ${word(vals.company, 'Company', 'Quiet')} · ${word(vals.distract, 'Distraction', 'Talking it out')} · ${word(vals.hugs, 'Hugs', 'Space')}. No pressure, no explaining needed. 💛`; };
  S.forEach(([k, a, b]) => { vals[k] = 50; const wrap = document.createElement('label'); wrap.className = 'kc-slider';
    wrap.innerHTML = `<span>${esc(a)}</span><input type="range" min="0" max="100" step="5" value="50" aria-label="${esc(a)} versus ${esc(b)}"><span>${esc(b)}</span>`;
    wrap.querySelector('input').oninput = e => { vals[k] = +e.target.value; update(); }; body.append(wrap); });
  const send = btn('Send to Rob'); send.onclick = () => shareToRob(out.textContent);
  const here = btn('Have iRob do this', 'btn ghost'); here.onclick = () => { const m = vals.distract < 35 ? 'distract' : vals.listen < 35 ? 'listen' : vals.listen > 65 ? 'advice' : null; A.setMode(m); toast(m ? 'Got it — I\'ll respond that way' : 'Got it'); };
  body.append(out, row(send, here)); update();
});

// 7 + 13 — press-and-hold cards
function holdPad(body, opts){
  const pad = document.createElement('button'); pad.type = 'button'; pad.className = 'kc-pad ' + (opts.cls || ''); pad.innerHTML = opts.inner;
  pad.setAttribute('aria-label', opts.label); const msg = p(opts.idle, 'kc-note'); const toggle = btn('Hands-free', 'btn ghost'); toggle.setAttribute('aria-pressed', 'false');
  let on = false, stop = null, timer = null, beat = 0;
  const card = () => body.closest('.kc');
  const start = () => { if (on) return; on = true; pad.classList.add('on'); card() && card().classList.add('glow'); stop = opts.sound ? opts.sound() : null;
    timer = setInterval(() => { msg.textContent = opts.lines[beat++ % opts.lines.length]; buzz(opts.buzz || [40, 120, 40]); }, opts.every || 2400); msg.textContent = opts.lines[0]; };
  const end = () => { if (!on) return; on = false; pad.classList.remove('on'); card() && card().classList.remove('glow'); clearInterval(timer); if (stop) stop(); stop = null; msg.textContent = opts.done; };
  pad.addEventListener('pointerdown', e => { if (toggle.getAttribute('aria-pressed') === 'true') return; e.preventDefault(); start(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => pad.addEventListener(ev, () => { if (toggle.getAttribute('aria-pressed') !== 'true') end(); }));
  pad.addEventListener('contextmenu', e => e.preventDefault());
  pad.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !on){ e.preventDefault(); start(); } });
  pad.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') end(); });
  toggle.onclick = () => { const v = toggle.getAttribute('aria-pressed') !== 'true'; toggle.setAttribute('aria-pressed', v); v ? start() : end(); };
  body.append(pad, msg, row(toggle));
  return end;
}
def('hand', 'calm', 'Hold my hand', 'Press and hold. Feel the heartbeat slow down.', body => holdPad(body, {
  label:'Press and hold to hold Rob\'s hand', inner:'<span class="ring"></span><span class="ring r2"></span><span class="ring r3"></span><svg viewBox="0 0 24 24" width="42" height="42" fill="currentColor"><path d="M12 21s-7.6-4.6-9.5-9.3C1 8.1 3.3 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.6 0 5.9 3.6 4.4 7.2-1.9 4.7-9.5 9.3-9.5 9.3z"/></svg>',
  idle:'Press and hold the heart. (Or tap “Hands-free”.)', lines:['I\'m right here.','Breathe in with me…','…and out, slowly.','I\'ve got you.','Nothing to do but this.'], done:'Still here whenever you need me.', every:2600 }));
def('purr', 'calm', 'Purr therapy', 'A sleepy kitty rumble to slow everything down.', body => holdPad(body, {
  cls:'cat', label:'Press and hold the kitty to hear it purr', inner:'<span class="ring"></span><span class="ring r2"></span><svg class="kitty" viewBox="0 0 120 100"><path d="M24 92c0-26 14-46 36-46s36 20 36 46z" fill="currentColor"/><circle cx="60" cy="42" r="26" fill="currentColor"/><path d="M38 26l2-22 14 14zM82 26l-2-22-14 14z" fill="currentColor"/><path d="M48 42q4-4 8 0M64 42q4-4 8 0" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M57 50h6l-3 3z" fill="#fff"/></svg>',
  idle:'Press and hold the kitty. Turn your sound on. (Or tap “Hands-free”.)', lines:['Purrrrr…','Slow blink. That means love in cat.','Breathe as slow as the purr.','Purrrrr…'], done:'The kitty says you did great.', every:3000, buzz:[20, 40, 20, 40, 20], sound:() => soundscape('purr') }));

// 8 — Postcard to future you
def('future', 'perspective', 'Postcard to future you', 'Write to yourself. Seal it until a date or a mood.', async body => {
  const m = await A.randomMemory(); const photo = document.createElement('div'); photo.className = 'kc-photo';
  if (m){ const i = document.createElement('img'); i.src = m.thumb; i.alt = 'Photo from ' + m.place; photo.append(i); }
  const ta = document.createElement('textarea'); ta.className = 'kc-input'; ta.placeholder = 'Dear future me…'; ta.maxLength = 800;
  const when = document.createElement('div'); when.className = 'kc-when';
  const tmr = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  when.innerHTML = `<label><input type="radio" name="fw${uid()}" value="date" checked> Open on <input type="date" min="${tmr}" value="${new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)}"></label><label><input type="radio" name="fw" value="hard"> Open on my next hard day</label>`;
  const radios = when.querySelectorAll('input[type=radio]'); radios[1].name = radios[0].name;
  const go = btn('Seal postcard ✉️');
  go.onclick = async () => { const v = ta.value.trim(); if (!v){ toast('Write a few words first'); return; }
    const byDate = radios[0].checked, date = when.querySelector('input[type=date]').value;
    const list = await DB.get('futures', []); list.push({id:uid(), text:v, t:Date.now(), openOn:byDate ? date : null, onHardDay:!byDate, memory:m || null, opened:false}); await DB.set('futures', list);
    body.innerHTML = ''; body.append(p(byDate ? `✉️ Sealed until ${fmtDate(date + 'T12:00:00')}. I'll deliver it myself.` : '✉️ Sealed for your next hard day. I\'ll make sure it finds you.', 'kc-done')); };
  body.append(photo, ta, when, row(go));
});
def('futureOpen', 'perspective', 'A postcard from past you', 'Delivered right on time.', async (body, ctx) => {
  const list = await DB.get('futures', []), f = list.find(x => x.id === (ctx && ctx.data)) || list.find(x => x.opened);
  if (!f){ body.append(p('This postcard has already been read.')); return; }
  const pc = document.createElement('div'); pc.className = 'kc-postcard';
  pc.innerHTML = (f.memory ? `<img src="${esc(f.memory.thumb)}" alt="">` : '') + `<div><small>From you · ${esc(fmtDate(f.t))}</small><p>${esc(f.text)}</p></div>`;
  body.append(pc); if (!f.opened){ f.opened = true; await DB.set('futures', list); }
  const save = btn('Save to Pocket', 'btn ghost'); save.onclick = () => A.addToPocket(f.text); body.append(row(save));
});

// 9 — Memory constellation
def('constellation', 'perspective', 'Memory constellation', 'Your worry, your proof, and a happy place — all true at once.', async (body, ctx) => {
  const worry = (ctx && ctx.text ? ctx.text : 'What\'s weighing on you').replace(/\s+/g, ' ').slice(0, 60);
  const led = A.getLedger(); const proof = led.length ? rnd(led).text : rnd(FACTS);
  const m = await A.randomMemory();
  const svg = `<svg viewBox="0 0 300 200" class="kc-stars" aria-hidden="true"><path class="ln" d="M60 150 L150 40 L240 140 Z"/><circle cx="60" cy="150" r="7"/><circle cx="150" cy="40" r="8"/><circle cx="240" cy="140" r="7"/></svg>`;
  const box = document.createElement('div'); box.className = 'kc-const';
  box.innerHTML = svg + `<span class="s1"><small>Your worry</small>${esc(worry)}</span><span class="s2"><small>Proof you handle things</small>${esc(proof.slice(0, 70))}</span><span class="s3"><small>A happy place</small>${esc(m ? m.place : 'Croatia')}</span>`;
  body.append(box, p('Your worry is real. So is the proof. So is a place where you were completely happy. All three are true at the same time.', 'kc-note'));
});

// 10 — Two-minute sanctuary (invitation first; never opens by itself)
def('sanctuary', 'calm', 'Two-minute sanctuary', 'Dusk over the Adriatic, soft sound, nothing to do.', body => {
  body.append(p('Two minutes. Dusk over the water, a soft ocean sound, and nothing at all to do.'));
  const go = btn('Enter the sanctuary'); go.onclick = startSanctuary; body.append(row(go));
});
let sanc = null;
function startSanctuary(){
  if (sanc) return; A.stopSpeaking(); A.closeAll();
  const o = document.createElement('section'); o.className = 'kc-sanct'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); o.setAttribute('aria-label', 'Two-minute sanctuary');
  o.innerHTML = `<div class="sky"></div><button class="icon-btn kc-x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
    <p class="thought" aria-live="polite"></p><div class="timer">2:00</div>
    <div class="kc-btns snd"><button type="button" class="chip" data-s="ocean" aria-pressed="true">Ocean</button><button type="button" class="chip" data-s="rain" aria-pressed="false">Rain</button><button type="button" class="chip" data-s="off" aria-pressed="false">Silence</button><button type="button" class="chip" data-s="voice" aria-pressed="false">Read to me</button></div>`;
  document.getElementById('app').append(o); A.setInert(true);
  let stop = soundscape('ocean'), i = 0, left = 120, voice = false;
  const th = o.querySelector('.thought'), tm = o.querySelector('.timer');
  const show = () => { th.classList.remove('in'); setTimeout(() => { th.textContent = SANCTUARY_THOUGHTS[i++ % SANCTUARY_THOUGHTS.length]; th.classList.add('in'); if (voice) A.speak(th.textContent); }, 600); };
  show();
  const tick = setInterval(() => { left--; tm.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; if (left % 20 === 0 && left > 0) show(); if (left <= 0) finish(true); }, 1000);
  o.querySelectorAll('.snd .chip').forEach(c => c.onclick = () => {
    if (c.dataset.s === 'voice'){ voice = !voice; c.setAttribute('aria-pressed', voice); if (voice) A.speak(th.textContent); else A.stopSpeaking(); return; }
    o.querySelectorAll('.snd .chip:not([data-s=voice])').forEach(x => x.setAttribute('aria-pressed', x === c)); if (stop) stop(); stop = c.dataset.s === 'off' ? null : soundscape(c.dataset.s); });
  function finish(natural){ clearInterval(tick); if (stop) stop(); A.stopSpeaking();
    if (natural){ th.textContent = 'Welcome back.'; th.classList.add('in'); tm.textContent = ''; setTimeout(close, 2600); } else close(); }
  function close(){ o.classList.add('out'); setTimeout(() => { o.remove(); A.setInert(false); }, reduceMotion() ? 0 : 500); sanc = null; document.removeEventListener('keydown', onKey, true); }
  const onKey = e => { if (e.key === 'Escape'){ e.stopPropagation(); finish(false); } };
  document.addEventListener('keydown', onKey, true);
  o.querySelector('.kc-x').onclick = () => finish(false); setTimeout(() => o.querySelector('.kc-x').focus({preventScroll:true}), 50);
  sanc = o;
}

// 11 — Scratch to reveal
def('scratch', 'smile', 'Scratch to reveal', 'Something underneath: a note, a favor, or a critter.', async body => {
  const kind = rnd(['note', 'favor', 'critter']); const under = document.createElement('div'); under.className = 'kc-under';
  let after = null;
  if (kind === 'note') under.append(p(rnd(NOTES), 'kc-big'));
  else if (kind === 'favor'){ const t = rnd(VOUCHERS); under.append(p('🎟️ You won: ' + t.title, 'kc-big'), p(t.detail, 'kc-note')); after = () => { const c = btn('Claim it'); c.onclick = () => shareToRob(`🎟️ I scratched a card and won: ${t.title}! (${t.detail})`); body.append(row(c)); }; }
  else { const item = await critter('any'); under.append(critterEl(item), p(captionFor(item), 'kc-note')); }
  const wrap = document.createElement('div'); wrap.className = 'kc-scratch'; const cv = document.createElement('canvas'); cv.setAttribute('aria-hidden', 'true');
  wrap.append(under, cv); const reveal = btn('Tap to reveal', 'btn ghost'); body.append(wrap, row(reveal));
  let revealed = false; const done = () => { if (revealed) return; revealed = true; cv.classList.add('gone'); reveal.remove(); buzz(30); setTimeout(() => cv.remove(), 600); if (after) after(); };
  reveal.onclick = done;
  requestAnimationFrame(() => {
    const W = wrap.clientWidth || 280, H = Math.max(wrap.clientHeight, 160), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = W * dpr; cv.height = H * dpr; const x = cv.getContext('2d'); x.scale(dpr, dpr);
    const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1d4a57'); g.addColorStop(.45, '#5f9fb0'); g.addColorStop(.55, '#d6e8ec'); g.addColorStop(.65, '#5f9fb0'); g.addColorStop(1, '#1d4a57');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++){ x.fillStyle = `rgba(255,255,255,${Math.random() * .35})`; x.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); }
    x.fillStyle = 'rgba(255,255,255,.92)'; x.font = '600 20px "Cinzel", Georgia, serif'; x.textAlign = 'center'; x.fillText('SCRATCH ME', W / 2, H / 2 + 7);
    x.globalCompositeOperation = 'destination-out'; x.lineCap = x.lineJoin = 'round'; x.lineWidth = 34;
    let down = false, last = null, moves = 0;
    const pt = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const check = () => { const d = x.getImageData(0, 0, cv.width, cv.height).data; let clear = 0, n = 0; for (let i = 3; i < d.length; i += 4 * 37){ n++; if (d[i] === 0) clear++; } if (clear / n > .55) done(); };
    cv.addEventListener('pointerdown', e => { down = true; last = pt(e); cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', e => { if (!down) return; const q = pt(e); x.beginPath(); x.moveTo(...last); x.lineTo(...q); x.stroke(); last = q; if (++moves % 8 === 0) check(); });
    ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { down = false; check(); }));
  });
});

// 12 — Emergency serotonin drop
async function critterCard(body, kind, captionList){
  const stage = document.createElement('div'); stage.className = 'kc-critter loading'; const cap = p('Fetching a critter…', 'kc-note'); body.append(stage, cap);
  let cur = null;
  const show = async () => { stage.classList.add('loading'); cap.textContent = 'Fetching a critter…'; cur = await critter(kind); stage.innerHTML = ''; stage.append(critterEl(cur)); stage.classList.remove('loading'); cap.textContent = captionList ? rnd(captionList) : captionFor(cur); if (cur.offline) cap.textContent += ' (Drawn by hand — the real ones need internet.)'; };
  const again = btn('Deal another critter'); again.onclick = show;
  const save = btn('Save to Pocket', 'btn ghost'); save.onclick = () => saveCritter(cur, cap.textContent);
  body.append(row(again, save)); await show();
}
def('serotonin', 'smile', 'Emergency serotonin drop', 'A cat or a golden retriever, immediately.', body => critterCard(body, 'any'));
def('golden', 'smile', 'Golden retriever energy', 'Unconditional, tail-wagging belief in you.', async (body, ctx) => {
  if (ctx && ctx.milestone){ body.append(p(`🎉 ${ctx.milestone} good things in your Ledger!`, 'kc-big')); confetti(body); }
  body.append(p(ctx && ctx.milestone ? 'This golden retriever is losing his mind about how proud he is of you. So am I.' : rnd(HYPE), 'kc-quote'));
  await critterCard(body, 'golden', CAPTIONS.dog);
});
async function saveCritter(item, caption){
  if (!item || item.offline){ toast('Save a real one when you\'re online'); return; }
  const list = await DB.get('critters', []); if (list.some(c => c.url === item.url)){ toast('Already in your Pocket'); return; }
  let blob = null;
  if (item.type !== 'video'){ try { const r = await fetch(item.url, {signal:timeout(8000)}); const b = await r.blob(); if (b.size < 3e6) blob = b; } catch {} }
  list.unshift({id:uid(), type:item.type, kind:item.kind, url:item.url, blob, caption, t:Date.now()}); await DB.set('critters', list.slice(0, 60));
  toast('Saved to your Pocket 🐾');
}
function confetti(host){
  if (reduceMotion()) return; const box = document.createElement('div'); box.className = 'kc-confetti'; box.setAttribute('aria-hidden', 'true');
  const colors = ['#d9a22b', '#b68235', '#2d6a7c', '#a8452f', '#efe4d2'];
  for (let i = 0; i < 36; i++){ const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = rnd(colors); s.style.animationDelay = Math.random() * .4 + 's'; s.style.setProperty('--x', (Math.random() * 80 - 40) + 'px'); box.append(s); }
  host.append(box); setTimeout(() => box.remove(), 2600);
}

// 15 — "P.S. from Real Rob" (sealed with the letters word)
def('ps', 'connect', 'P.S. from Real Rob', 'A sealed note that arrived by link.', async (body, ctx) => {
  const store = await DB.get('ps', {}), item = store[ctx && ctx.data];
  if (!item){ body.append(p('This P.S. couldn\'t be found.')); return; }
  const draw = () => { body.innerHTML = '';
    if (item.payload){ const pl = item.payload;
      body.append(p(pl.title ? '🎟️ ' + pl.title : '💌 A note from Rob', 'kc-label'), p(pl.text, 'kc-quote'));
      if (pl.type === 'voucher'){ const c = btn('Redeem'); c.onclick = () => shareToRob(`🎟️ Redeeming your P.S. voucher: ${pl.title || pl.text}`); body.append(row(c, speakBtn(() => pl.text))); }
      else body.append(row(speakBtn(() => pl.text)));
      return; }
    body.append(p('This P.S. is sealed with your word.'));
    const f = document.createElement('form'); f.className = 'kc-unlock'; f.innerHTML = '<input type="password" placeholder="Our word" aria-label="Our word" autocapitalize="none"><button class="btn">Open</button>';
    f.onsubmit = async e => { e.preventDefault(); const w = f.querySelector('input').value; const pl = await openPS(item.raw, w); if (!pl){ toast('That\'s not quite the word'); return; } A.save(A.K.lpass, w); item.payload = pl; store[ctx.data] = item; await DB.set('ps', store); draw(); };
    body.append(f); };
  draw();
});
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), c => c.charCodeAt(0));
async function openPS(raw, word){
  try { const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(word.normalize('NFKC').trim().toLowerCase()), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey({name:'PBKDF2', salt:b64u(raw.s), iterations:raw.n || 250000, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:b64u(raw.i)}, key, b64u(raw.c)); return JSON.parse(new TextDecoder().decode(pt)); } catch { return null; }
}
async function checkPS(){
  const m = location.hash.match(/(?:^#|&)ps=([A-Za-z0-9_-]+)/); if (!m) return;
  history.replaceState(null, '', location.pathname + location.search);
  let raw; try { raw = JSON.parse(new TextDecoder().decode(b64u(m[1]))); } catch { return; }
  if (!raw || !raw.c || !raw.i || !raw.s) return;
  const id = raw.id || m[1].slice(0, 16), store = await DB.get('ps', {}); if (store[id]) return;
  const word = A.load(A.K.lpass, null); const payload = word ? await openPS(raw, word) : null;
  store[id] = {raw, payload, t:Date.now()}; await DB.set('ps', store);
  A.pushRob({content:'P.S. — I left you something. 💌', card:'ps', cardData:id});
}

/* ================= Rendering ================= */
async function build(id, ctx, host){
  const c = CARDS[id]; if (!c) return null;
  const el = host || document.createElement('article'); el.className = 'kc mood-' + c.mood; el.innerHTML = '';
  const head = document.createElement('header'); head.innerHTML = `<small>${esc(MOODS[c.mood])}</small><b>${esc(c.title)}</b>`;
  const body = document.createElement('div'); body.className = 'kc-body';
  el.append(head, body);
  try { await c.render(body, ctx || {}); } catch (e) { body.append(p('This card couldn\'t open right now.', 'kc-note')); }
  return el;
}
function chatCard(m){
  const wrap = document.createElement('div'); wrap.className = 'kc-wrap';
  const host = document.createElement('article'); wrap.append(host);
  const ctx = {text:m.cardText, data:m.cardData, milestone:m.milestone};
  build(m.card, ctx, host);
  const alts = (m.cardAlts || []).filter(a => CARDS[a]);
  if (alts.length){
    const link = btn('Try a different card →', 'kc-alt');
    link.onclick = () => { const next = alts.shift(); alts.push(m.card); m.card = next; m.cardAlts = alts; A.saveChat(); lastDealt = next; build(next, ctx, host); };
    wrap.append(link);
  }
  return wrap;
}

/* ================= Dealer (one card per reply, only on a clear signal) ================= */
const RULES = [
  {re:/\b(hurt myself|kill myself|suicid\w*|end it|can'?t go on)\b/i, cards:null},
  {re:/\b(rough|awful|terrible|worst|horrible|cry|crying|sad|heartbroken|stormy|falling apart|bad day|hard day|heavy day|rainy inside)\b/i, cards:['glass', 'hand', 'escape', 'serotonin', 'sanctuary']},
  {re:/\b(anxious|anxiety|panic\w*|worried|worry|worrying|overthink\w*|spiral\w*|racing|scared)\b/i, cards:['ground', 'shred', 'sanctuary', 'constellation']},
  {re:/\b(my fault|fail\w*|not good enough|stupid|messed up|mess up|i suck|useless|hate myself|ugly|behind|blame)\b/i, cards:['flip', 'receipt', 'constellation']},
  {re:/\b(nervous|interview|presentation|exam|big day|doubt\w*|can'?t do this|not ready)\b/i, cards:['golden', 'flip']},
  {re:/\b(tired|exhausted|so much to do|too much|drained|burn(ed|t)? out|overwhelm\w*|no energy|worn out)\b/i, cards:['drop', 'tickets', 'purr', 'sanctuary']},
  {re:/\b(lonely|alone|miss (you|rob)|need you|wish you were here)\b/i, cards:['translate', 'hand', 'letters', 'purr']},
  {re:/\b(smile|bored|cheer|laugh|cute|puppy|puppies|dog|cat|kitty|kitten)\b/i, cards:['serotonin', 'golden', 'scratch']},
  {re:/\b(happy|proud|great day|good day|grateful|excited|amazing|i did it|sunny)\b/i, cards:['capsule', 'future']},
  {re:/\b(can'?t sleep|insomnia|wide awake)\b/i, cards:['sanctuary', 'purr', 'hand']},
  {re:/\b(what i need|don'?t know what i need|tell rob|talk to rob)\b/i, cards:['needs', 'translate']}
];
let lastDealt = null;
function deal(text, opts = {}){
  if (opts.fixing || !text) return null;
  let cands = [];
  for (const r of RULES){ if (r.re.test(text)){ if (!r.cards) return null; cands.push(...r.cards); } }
  cands = [...new Set(cands)].filter(id => id !== 'glass' || sealedCount > 0);
  if (!cands.length) return null;
  if (cands.length > 1 && cands[0] === lastDealt) cands.push(cands.shift());   // don't repeat the same mechanic back-to-back
  lastDealt = cands[0];
  return {card:cands[0], cardAlts:cands.slice(1, 4), cardText:text.slice(0, 200)};
}

/* ================= Toolkit (menu) ================= */
const GROUPS = [['smile', ['serotonin', 'golden', 'scratch', 'capsule']], ['calm', ['ground', 'shred', 'hand', 'purr', 'sanctuary', 'escape']], ['perspective', ['flip', 'receipt', 'constellation', 'future', 'glass']], ['connect', ['translate', 'needs', 'tickets', 'drop', 'letters']]];
function ensureSheets(){
  if ($('sheetToolkit')) return;
  const X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const mk = (id, title) => { const s = document.createElement('section'); s.className = 'sheet'; s.id = id; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); s.setAttribute('aria-label', title);
    s.innerHTML = `<div class="grab"></div><header><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="Close">${X}</button></header><div class="body"></div>`; s.querySelector('[data-close]').onclick = () => A.close(); $('scrim').before(s); return s; };
  mk('sheetToolkit', 'Comfort toolkit'); mk('sheetDeck', 'Card');
}
async function renderToolkit(){
  const body = $('sheetToolkit').querySelector('.body'); body.innerHTML = '';
  const futures = (await DB.get('futures', [])).filter(f => !f.opened).length;
  GROUPS.forEach(([mood, ids]) => {
    const h = document.createElement('div'); h.className = 'menu-head'; h.textContent = MOODS[mood]; body.append(h);
    const grid = document.createElement('div'); grid.className = 'kc-deck';
    ids.forEach(id => { const c = CARDS[id]; if (id === 'glass' && !sealedCount) return;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'kc-mini mood-' + c.mood; b.innerHTML = `<b>${esc(c.title)}</b><small>${esc(c.blurb)}</small>`; b.onclick = () => openCard(id); grid.append(b); });
    body.append(grid);
  });
  const note = p(`Sealed for later: ${sealedCount} good moment${sealedCount === 1 ? '' : 's'} · ${futures} postcard${futures === 1 ? '' : 's'} to future you.`, 'kc-note'); body.append(note);
}
async function openCard(id, ctx){
  ensureSheets(); const s = $('sheetDeck'); s.querySelector('h2').textContent = CARDS[id].title;
  const body = s.querySelector('.body'); body.innerHTML = ''; A.open('sheetDeck');
  const el = await build(id, ctx || {}); if (el) body.append(el);
}

/* ================= Deliveries, milestones, Pocket critters ================= */
async function deliverFutures(){
  const list = await DB.get('futures', []), today = todayKey();
  const due = list.find(f => !f.opened && !f.delivered && f.openOn && f.openOn <= today); if (!due) return;
  due.delivered = true; await DB.set('futures', list);
  A.pushRob({content:'A postcard just arrived — from you. ✉️', card:'futureOpen', cardData:due.id});
}
async function hardDayExtras(text){   // a sealed "next hard day" postcard rides along with rough-day replies
  if (!RULES[1].re.test(text)) return;
  const list = await DB.get('futures', []), f = list.find(x => !x.opened && !x.delivered && x.onHardDay); if (!f) return;
  f.delivered = true; await DB.set('futures', list);
  setTimeout(() => A.pushRob({content:'Something you wrote for a day like this. ✉️', card:'futureOpen', cardData:f.id}), 1200);
}
function onLedger(n){
  const MILES = [5, 10, 25, 50, 100, 250]; if (!MILES.includes(n)) return;
  const done = A.load('try_miles', []); if (done.includes(n)) return; A.save('try_miles', [...done, n]);
  A.pushRob({content:`${n} good things! That's not luck — that's you.`, card:'golden', milestone:n});
}
async function pocketCritters(host){
  const list = await DB.get('critters', []); if (!list.length) return;
  const h = document.createElement('div'); h.className = 'menu-head'; h.textContent = 'Critters'; const g = document.createElement('div'); g.className = 'mgrid';
  list.forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', c.caption || 'Saved critter');
    const src = c.blob ? URL.createObjectURL(c.blob) : c.url;
    if (c.type === 'video'){ const v = document.createElement('video'); Object.assign(v, {src, muted:true, loop:true, autoplay:true, playsInline:true}); v.setAttribute('playsinline', ''); b.append(v); }
    else { const i = document.createElement('img'); i.src = src; i.alt = ''; i.onerror = () => { i.src = c.kind === 'cat' ? SVG_CAT : SVG_DOG; }; b.append(i); }
    b.onclick = () => openCard('serotonin'); g.append(b); });
  host.append(h, g);
}

/* ================= Backup support (IndexedDB rides along in the backup file) ================= */
async function exportData(){
  const out = {};
  for (const [k, v] of await DB.entries()){
    if (k === 'critters') out[k] = await Promise.all(v.map(async c => ({...c, blob:c.blob ? await blobToDataURL(c.blob) : null})));
    else out[k] = v;
  }
  return out;
}
async function importData(obj){
  if (!obj || typeof obj !== 'object') return;
  await DB.clear();
  for (const [k, v] of Object.entries(obj)){
    if (!['capsules', 'futures', 'tickets', 'critters', 'ps'].includes(k)) continue;
    if (k === 'critters' && Array.isArray(v)) await DB.set(k, await Promise.all(v.map(async c => ({...c, blob:typeof c.blob === 'string' && c.blob.startsWith('data:') ? await dataURLToBlob(c.blob) : null}))));
    else await DB.set(k, v);
  }
}

/* ================= Wire up ================= */
window.iRobCards = {
  render:chatCard, deal, onLedger, openCard, exportData, importData, clearAll:() => DB.clear(), pocketCritters, hardDayExtras,
  toolkit:async () => { ensureSheets(); await renderToolkit(); A.open('sheetToolkit'); },
  _test:{CARDS, DB, freshCritter, RULES}
};
ensureSheets();
refreshSealed().then(() => { A.renderChat(); deliverFutures(); checkPS(); });
addEventListener('hashchange', checkPS);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') deliverFutures(); });
})();
