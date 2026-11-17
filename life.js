/* iRob "life" layer: what Rob knows about Erica and her world.
   - Private profile: profile.enc.json is AES-GCM ciphertext. Her phone gets the key once from a link
     (…/irob/#key=…), keeps it in localStorage, and the key never touches the repo or any server.
   - 1. Memory: after she writes something substantial, the relay pulls out lasting facts into a notebook on her phone.
   - 2. Dates: birthdays, hard days and her favorite holiday get a message on the day.
   - 3. Her usual: food and coffee suggestions use her real orders.
   - 4. Storm alerts: National Weather Service alerts for Winter Park (free, no key).
   - 5. Tapbacks: Rob sometimes reacts to her message before replying.
   Personal data only goes to the relay (Groq with zero data retention), never to the Pollinations fallback. */
// 2.7: anonymous error reports → the relay's /log (no chat text, at most 5 per visit, each message once).
(() => {
  const VER = '2026-11-17', sent = new Set(); let n = 0;
  const report = (m, src, line, col) => {
    if (!m || n >= 5 || /^Script error\.?$/.test(m) || sent.has(m)) return; sent.add(m); n++;
    const body = JSON.stringify({m:String(m).slice(0, 300), src:String(src || '').replace(location.origin, '').slice(0, 120), line, col, ver:VER, ua:(navigator.userAgent.match(/(iPhone OS [\d_]+|Android [\d.]+|Mac OS X [\d_]+|Windows NT [\d.]+)/) || [''])[0], where:(document.querySelector('.sheet.show') || {}).id || 'chat'});
    try { fetch('https://irob-ai.croftrobertl.workers.dev/log', {method:'POST', body, keepalive:true, headers:{'Content-Type':'text/plain'}}).catch(() => {}); } catch {}
  };
  addEventListener('error', e => report(e.message, e.filename, e.lineno, e.colno));
  addEventListener('unhandledrejection', e => { const r = e.reason; report('Unhandled: ' + (r && (r.message || r.name) || String(r)), r && r.stack ? (r.stack.split('\n')[1] || '') : '', 0, 0); });
  window.iRobReport = report;
})();
(() => {
'use strict';
const PK = 'try_pkey', NOTES = 'try_notes', SENT = 'try_dates_sent', SEEN = 'try_alerts_seen', SUGG = 'try_sugg';
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const R = () => window.iRob;

// ---------- Key from the one-time link ----------
let justKeyed = false;
(() => {
  const m = location.hash.match(/(?:^#|&)key=([A-Za-z0-9_-]{40,})/); if (!m) return;
  put(PK, m[1]); justKeyed = true;
  const rest = location.hash.replace(/(^#|&)key=[A-Za-z0-9_-]+/, '$1').replace(/^#&/, '#');
  try { history.replaceState(null, '', location.pathname + location.search + (rest === '#' ? '' : rest)); } catch {}
})();

// ---------- Profile ----------
let profile = null;
const fromB64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
async function loadProfile(){
  const k = get(PK, null); if (!k || !crypto.subtle) return null;
  try {
    const r = await fetch('profile.enc.json', {cache:'no-cache'}); if (!r.ok) return null;
    const e = await r.json();
    const key = await crypto.subtle.importKey('raw', fromB64u(k), 'AES-GCM', false, ['decrypt']);
    const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:fromB64u(e.iv)}, key, fromB64u(e.ct));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch { return null; }
}
const ready = loadProfile().then(p => { profile = p; if (p && justKeyed && R()) R().toast('All set. Rob knows you a little better now.'); return p; });

// ---------- 1. Memory notebook ----------
let lastLearn = 0;
async function learn(text){
  if (!text || text.split(/\s+/).length < 6 || !R() || !R().relay) return;
  const wait = 6000 - (Date.now() - lastLearn);
  if (wait > 0){ await new Promise(res => setTimeout(res, wait)); }
  if (/(hurt myself|kill myself|suicid)/i.test(text)) return;
  lastLearn = Date.now();
  const notes = get(NOTES, []);
  const res = await R().relay([
    {role:'system', content:`You keep a small notebook about ${R().HER} for her friend Rob. From her newest message, pull out at most 3 facts worth remembering for weeks or months: people in her life (name and who they are), plans and upcoming events, preferences, ongoing situations, things she's proud of or worried about. Skip passing moods, small talk, anything about Rob or attraction, and anything already in the notebook. Write each as one short note about her in third person, like "Her friend Jess just had a baby." Reply with ONLY a JSON array of strings, or [] if nothing is worth keeping.`},
    {role:'user', content:`Notebook so far:\n${notes.slice(-25).map(n => '- ' + n.text).join('\n') || '(empty)'}\n\nHer newest message:\n${text}`}
  ], 20000).catch(() => null);
  if (!res || !res.text) return;
  let arr; try { arr = JSON.parse((res.text.match(/\[[\s\S]*\]/) || ['[]'])[0]); } catch { return; }
  if (!Array.isArray(arr)) return;
  const have = notes.map(n => n.text.toLowerCase());
  arr.filter(x => typeof x === 'string' && x.length > 8 && x.length < 160 && !/attract|romanc/i.test(x)).slice(0, 3).forEach(x => {
    if (!have.some(h => h === x.toLowerCase())) notes.push({id:Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text:x.trim(), t:Date.now()});
  });
  put(NOTES, notes.slice(-60));
}
function renderNotes(box){
  if (!box) return;
  const notes = get(NOTES, []).slice().reverse(); box.innerHTML = '';
  if (!notes.length){ const p = document.createElement('p'); p.className = 'none'; p.textContent = 'Nothing yet. Tell me about your people and plans and I\'ll remember.'; box.appendChild(p); return; }
  notes.forEach(n => {
    const row = document.createElement('div'); row.className = 'fu';
    const sp = document.createElement('span'); sp.textContent = n.text;
    const x = document.createElement('button'); x.type = 'button'; x.textContent = 'Forget';
    x.onclick = () => { put(NOTES, get(NOTES, []).filter(z => z.id !== n.id)); renderNotes(box); R() && R().toast('Forgotten'); };
    row.append(sp, x); box.appendChild(row);
  });
}

// ---------- 4. Storm alerts (NWS) ----------
const PT = '28.6,-81.3';
let alerts = [], alertsAt = 0;
const IMPORTANT = /(tornado|hurricane|tropical storm|severe thunderstorm|flash flood|flood warning|storm surge|extreme wind|excessive heat|extreme heat|heat advisory|freeze warning|hard freeze)/i;
const TIP = [
  [/tornado warning/i, 'Go to a small room in the middle of the house on the lowest floor, away from windows, right now. Grab the cats only if it takes seconds. Shoes on, phone with you.'],
  [/tornado watch/i, 'Nothing is happening yet, but tornadoes are possible. Keep your phone charged, know your safe room, and keep the cat carriers handy.'],
  [/hurricane warning|storm surge/i, 'Charge everything, fill the tub and some jugs with water, get cash and gas, bring in anything loose outside, and plan where the cats ride it out. If officials say leave, leave.'],
  [/hurricane watch|tropical storm/i, 'Good time to check supplies: water, food, flashlights, batteries, meds, cat food and litter. Charge your phone and a power bank.'],
  [/severe thunderstorm/i, 'Stay inside and away from windows until it passes. Unplug the important electronics if you can.'],
  [/flood/i, 'Don\'t drive through water on the road, even if it looks shallow. Turn around.'],
  [/heat/i, 'Stay in the AC, drink more water than you think you need, and keep the cats cool too.'],
  [/freeze/i, 'Bring plants in, keep the cats inside, and drip a faucet tonight.'],
];
async function refreshAlerts(force){
  if (!force && Date.now() - alertsAt < 10 * 60000) return alerts;
  if (navigator.onLine === false) return alerts;
  try {
    const r = await fetch(`https://api.weather.gov/alerts/active?point=${PT}`, {headers:{Accept:'application/geo+json'}, signal:AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined});
    if (!r.ok) return alerts;
    const j = await r.json(); alertsAt = Date.now();
    alerts = (j.features || []).map(f => f.properties || {}).filter(p => (p.severity === 'Extreme' || p.severity === 'Severe' || IMPORTANT.test(p.event || '')) && (!p.ends && !p.expires || new Date(p.ends || p.expires) > new Date()))
      .map(p => ({id:p.id || p.headline, event:p.event || 'Weather alert', headline:p.headline || p.event, ends:p.ends || p.expires}));
  } catch {}
  return alerts;
}
// Weather alerts show as a slim banner above the chat (not as a chat message). Dismissed alerts stay dismissed.
function alertsBannerNow(){
  if (!R() || !R().showBanner) return;
  const seen = get(SEEN, []);
  alerts.forEach(a => {
    if (seen.includes(a.id)) return;
    const until = a.ends ? ` until ${new Date(a.ends).toLocaleString('en-US', {weekday:'short', hour:'numeric', minute:'2-digit', timeZone:'America/New_York'})}` : '';
    const tip = (TIP.find(([re]) => re.test(a.event)) || [null, 'Keep an eye on it and stay safe.'])[1];
    const esc = t => t.replace(/[&<>]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;'}[c]));
    R().showBanner('wx-' + a.id, `<b>${esc(a.event)}</b>${esc(until)}. ${esc(tip)}`, {icon:/warning/i.test(a.event) ? '🚨' : '⚠️', onDismiss:() => { const s2 = get(SEEN, []); s2.push(a.id); put(SEEN, s2.slice(-50)); }});
  });
}
async function alertsBanner(){ await refreshAlerts(); alertsBannerNow(); }

// ---------- 2. Dates ----------
function dateMessage(d, her){
  const sweet = profile && (profile.dessert || profile.sweet);
  const cats = profile && profile.cats && profile.cats.length ? profile.cats : null;
  switch (d.kind){
    case 'her-birthday': return `Happy birthday, ${her}! 🎂 I hope today is easy, fun, and ends with ${sweet ? sweet : 'something sweet'}. You deserve a really good one.`;
    case 'kid-birthday': return `Happy birthday to ${d.name} today! 🎉 Hope it's a great day for both of you.`;
    case 'kid-birthday-eve': return `Heads up: ${d.name}'s birthday is tomorrow. Anything you need help pulling together?`;
    case 'pet-day': return `It's ${d.name}'s special day! 🐾 Extra treats are required by law.`;
    case 'memorial': return `I know today is ${d.what}. No pressure to talk about it, but I'm here if you want to. ${cats ? `Maybe a slow day with ${cats[0]} on your lap.` : 'Be gentle with yourself today.'}`;
    case 'fav-holiday': return `Happy Halloween! 🎃 Your favorite day of the year. What's the plan?`;
    case 'fav-month': return `It's October, which means it's officially Halloween season. 🎃 Your month.`;
    default: return `Just remembering: today is ${d.what}.${d.note ? ' ' + d.note : ''}`;
  }
}
function postDates(){
  if (!profile || !R()) return false;
  const now = new Date(), y = now.getFullYear();
  const md = x => String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  const today = md(now), tomorrow = md(new Date(now.getTime() + 864e5));
  if (now.getHours() < 6) return false;
  const sent = get(SENT, []); let posted = false;
  const list = [...(profile.dates || []).filter(d => d.md === today),
    ...(profile.dates || []).filter(d => d.kind === 'kid-birthday' && d.md === tomorrow).map(d => ({...d, kind:'kid-birthday-eve'}))];
  list.forEach(d => {
    const tag = `${y}:${d.kind}:${d.md}:${d.name || d.what}`;
    if (sent.includes(tag)) return;
    sent.push(tag); R().pushRob({content:dateMessage(d, R().HER)}); posted = true;
  });
  put(SENT, sent.slice(-80));
  return posted;
}

// ---------- 3. Her usual ----------
function suggest(text, reply){
  if (!profile) return null;
  const used = get(SUGG, {}), now = Date.now(), fresh = k => !used[k] || now - used[k] > 6 * 3600e3;
  const mark = k => { used[k] = now; put(SUGG, used); };
  const mentions = s => s && reply.toLowerCase().includes(s.toLowerCase().split(/\s+/)[0]);
  const foody = /\b(eat|bite|snack|pizza|chocolate|dinner|lunch|food|order|meal|takeout|cheesecake|pasta|alfredo)\b/i.test(reply);
  if (/\b(hungry|starving|dinner|lunch|what (should|do) i eat|nothing to eat|takeout|take-out|order (food|in|out)|feed me)\b/i.test(text) && fresh('food')){
    const o = profile.orders || [];
    if (o.length && !foody && !o.some(x => mentions(x.place))){ const x = o[Math.floor(Math.random() * o.length)]; mark('food'); return `Dinner idea: your usual from ${x.place}. ${x.order.charAt(0).toUpperCase() + x.order.slice(1)}. Just saying.`; }
  }
  if (/\b(coffee|caffeine|so tired this morning|need energy)\b/i.test(text) && profile.coffee && fresh('coffee') && !/coffee/i.test(reply) && new Date().getHours() < 15){
    mark('coffee'); return `Go get yourself an ${profile.coffee.replace(/^an? /i, '')}. Husband's orders.`;
  }
  if (/\b(craving|something sweet|chocolate|dessert|treat myself)\b/i.test(text) && (profile.sweet || profile.dessert) && fresh('sweet') && !foody){
    mark('sweet'); return `This feels like a ${profile.sweet || profile.dessert} situation.`;
  }
  return null;
}

// ---------- 5. Tapbacks ----------
function tapback(text){
  const r = Math.random();
  if (/(haha|hah\b|lol|lmao|😂|🤣|hilarious|so funny)/i.test(text)) return r < 0.7 ? '😂' : null;
  if (/(i did it|finished|got the|booked|bookings? (came|are)|5[- ]star|good news|guess what|so happy|excited|proud|yay)/i.test(text)) return r < 0.7 ? (r < 0.35 ? '‼️' : '❤️') : null;
  if (/\b(thank|thanks|thx|ty)\b/i.test(text)) return r < 0.6 ? '❤️' : null;
  if (/\b(sad|cry|crying|miss|lonely|hurt|rough|hard day|exhausted)\b/i.test(text)) return r < 0.45 ? '❤️' : null;
  return null;
}

// ---------- Prompt pieces ----------
function prompt(){
  let p = '';
  if (profile && profile.prompt) p += '\n\n[[PRIVATE]]\nHOW TO USE WHAT YOU KNOW: at most ONE personal detail per reply, and plenty of replies should use none. Never name more than one cat, one food or one fact in the same reply, and never stack suggestions. No coffee or caffeine suggestions after 3 PM. Talk about her, not about the list.\n\n' + profile.prompt;
  const notes = get(NOTES, []);
  if (notes.length) p += `${profile ? '' : '\n\n[[PRIVATE]]'}\n\nTHINGS SHE'S TOLD YOU (newest last; bring one up when it genuinely fits, like a husband who listens):\n- ` + notes.slice(-25).map(n => n.text).join('\n- ');
  if (p) p += '\n[[/PRIVATE]]';
  if (alerts.length) p += `\n\nACTIVE WEATHER ALERTS where she lives: ${alerts.map(a => a.headline).join('; ')}. If it's serious, check that she's safe.`;
  return p;
}
function avoidRe(){
  const a = (profile && profile.avoid || []).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "['’]?"));
  return a.length ? new RegExp('\\b(' + a.join('|') + ')\\b', 'i') : null;
}

async function refresh(){ await Promise.all([ready, refreshAlerts()]); }
async function autoPost(){
  await ready;
  const busy = () => R() && R().isBusy && R().isBusy();
  let posted = !busy() && postDates();
  return posted;
}

window.iRobLife = {ready, refresh, autoPost, alertsBanner, prompt, avoidRe, suggest, tapback, learn, renderNotes, get profile(){ return profile; }};
})();
