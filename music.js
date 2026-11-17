/* Erica's playlist: a tiny, hidden player (♫ in the header → ⏮ ⏯ ⏭).
   Songs live in music/*.bin as AES-GCM ciphertext, so the public repo never holds playable music.
   Her phone gets the key once from …/irob/#music=<key> and keeps it; songs added later unlock with the same key.
   Lock-screen / Control Center controls come from the Media Session API. */
(() => {
'use strict';
const KEY = 'try_music_key', POS = 'try_music_pos';
const get = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const b64u = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));

// one-time key link (works on a fresh open and when the link is opened while the app is already running)
function takeKey(){
  const m = location.hash.match(/(?:^#|&)music=([A-Za-z0-9_-]{40,})/); if (!m) return;
  put(KEY, m[1]);
  const rest = location.hash.replace(/(^#|&)music=[A-Za-z0-9_-]+/, '$1').replace(/^#&/, '#');
  try { history.replaceState(null, '', location.pathname + location.search + (rest === '#' ? '' : rest)); } catch {}
  cryptoKey = null; build();
  setTimeout(() => window.iRob && window.iRob.toast('🎶 Your playlist is unlocked. Tap ♫ at the top.'), 1500);
}

let cryptoKey = null, songs = [], idx = get(POS, 0), audio = null, url = null, loading = false;
async function key(){
  if (cryptoKey) return cryptoKey;
  const k = get(KEY, null); if (!k) return null;
  cryptoKey = await crypto.subtle.importKey('raw', b64u(k), 'AES-GCM', false, ['decrypt']); return cryptoKey;
}
async function open(bytes){ const k = await key(); return crypto.subtle.decrypt({name:'AES-GCM', iv:bytes.slice(0, 12)}, k, bytes.slice(12)); }
async function loadList(){
  if (songs.length) return songs;
  const r = await fetch('music/playlist.bin', {cache:'no-cache'}); if (!r.ok) throw new Error('list');
  const j = JSON.parse(new TextDecoder().decode(await open(new Uint8Array(await r.arrayBuffer()))));
  songs = (j.songs || []).filter(s => s.file);           // songs still waiting for their file are skipped
  if (idx >= songs.length) idx = 0;
  return songs;
}

// ---------- UI ----------
const NOTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
const I = {
  prev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9.5 12z"/></svg>',
  next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5v14l10.5-7z"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l12.5-7.5z"/></svg>',
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></svg>',
};
let btn, bar, title, playBtn, hideT;
function build(){
  const menu = document.getElementById('menuBtn'); if (!menu || btn) return;
  btn = document.createElement('button'); btn.type = 'button'; btn.className = 'icon-btn music-btn'; btn.id = 'musicBtn'; btn.setAttribute('aria-label', 'Music'); btn.innerHTML = NOTE;
  menu.before(btn);
  bar = document.createElement('div'); bar.className = 'music-bar'; bar.hidden = true; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Music controls');
  const mk = (name, label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mb-btn'; b.setAttribute('aria-label', label); b.innerHTML = I[name]; b.onclick = e => { e.stopPropagation(); fn(); poke(); }; return b; };
  title = document.createElement('span'); title.className = 'mb-title';
  playBtn = mk('play', 'Play', toggle);
  bar.append(mk('prev', 'Previous song', prev), playBtn, mk('next', 'Next song', next), title);
  document.getElementById('app').appendChild(bar);
  btn.onclick = () => { bar.hidden = !bar.hidden; if (!bar.hidden){ paintTitle(); poke(); } };
}
function poke(){ clearTimeout(hideT); hideT = setTimeout(() => { if (bar) bar.hidden = true; }, 7000); }
function paintTitle(){
  const s = songs[idx];
  title.textContent = s ? (s.artist ? `${s.title} · ${s.artist}` : s.title) : (loading ? 'Loading…' : 'Tap play');
  title.classList.toggle('long', title.textContent.length > 26);
  const on = audio && !audio.paused;
  playBtn.innerHTML = on ? I.pause : I.play; playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
  btn.classList.toggle('playing', !!on);
}

// ---------- playback ----------
async function playAt(i){
  if (loading) return; loading = true; paintTitle();
  try {
    await loadList(); if (!songs.length) throw new Error('empty');
    idx = (i + songs.length) % songs.length; put(POS, idx);
    const s = songs[idx];
    const r = await fetch('music/' + s.file); if (!r.ok) throw new Error('song');
    const plain = await open(new Uint8Array(await r.arrayBuffer()));
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(new Blob([plain], {type:'audio/mpeg'}));
    if (!audio){ audio = new Audio(); audio.preload = 'auto'; audio.onended = () => playAt(idx + 1); audio.onplay = audio.onpause = paintTitle; }
    if (window.iRob && window.iRob.stopSpeaking) window.iRob.stopSpeaking();
    audio.src = url; await audio.play();
    session(s);
  } catch (e){ if (window.iRob) window.iRob.toast(e.message === 'empty' ? 'No songs yet' : 'Couldn\'t play that song. Check your connection.'); }
  loading = false; paintTitle();
}
function toggle(){ if (!audio || !audio.src) return playAt(idx); if (audio.paused) audio.play().catch(() => {}); else audio.pause(); }
function next(){ playAt(idx + 1); }
function prev(){ if (audio && audio.currentTime > 3){ audio.currentTime = 0; return; } playAt(idx - 1); }
function session(s){
  if (!('mediaSession' in navigator)) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({title:s.title, artist:s.artist, album:'For Erica', artwork:[{src:'icon-512.png', sizes:'512x512', type:'image/png'}]});
    navigator.mediaSession.setActionHandler('play', () => audio.play());
    navigator.mediaSession.setActionHandler('pause', () => audio.pause());
    navigator.mediaSession.setActionHandler('nexttrack', next);
    navigator.mediaSession.setActionHandler('previoustrack', prev);
  } catch {}
}

function init(){ takeKey(); if (get(KEY, null)) build(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
addEventListener('hashchange', takeKey);
window.iRobMusic = {playAt, toggle, next, prev, list:() => loadList(), get playing(){ return !!(audio && !audio.paused); }, get current(){ return songs[idx] || null; }};
})();
