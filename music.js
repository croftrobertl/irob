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

let cryptoKey = null, songs = [], allSongs = [], idx = get(POS, 0), audio = null, url = null, loading = false;
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
  allSongs = (j.songs || []).filter(s => s.file);        // songs still waiting for their file are skipped
  songs = allSongs.filter(s => !s.tag);                  // tagged songs (e.g. 'mad') only play on their cue, never in the playlist
  if (idx >= songs.length) idx = 0;
  return songs;
}

// ---------- UI ----------
const NOTE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';
// Rounded glyphs (fill + same-colour round-joined stroke softens every corner), matching the Croatia site's player.
const G = d => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const I = {
  prev:G('M6.5 6v12M18 6.6v10.8a.6.6 0 0 1-.9.5L9.4 12.5a.6.6 0 0 1 0-1l7.7-5.4a.6.6 0 0 1 .9.5z'),
  next:G('M17.5 6v12M6 6.6v10.8a.6.6 0 0 0 .9.5l7.7-5.4a.6.6 0 0 0 0-1L6.9 6.1a.6.6 0 0 0-.9.5z'),
  play:G('M8 5.8v12.4a.8.8 0 0 0 1.2.7l9.6-6.2a.8.8 0 0 0 0-1.4L9.2 5.1a.8.8 0 0 0-1.2.7z'),
  pause:G('M7.5 5.5h2.6v13H7.5zM13.9 5.5h2.6v13h-2.6z'),
};
let btn, bar, title, playBtn, hideT;
function build(){
  const menu = document.getElementById('menuBtn'); if (!menu || btn) return;
  btn = document.createElement('button'); btn.type = 'button'; btn.className = 'icon-btn music-btn'; btn.id = 'musicBtn'; btn.setAttribute('aria-label', 'Music'); btn.innerHTML = NOTE;
  menu.before(btn);
  bar = document.createElement('div'); bar.className = 'music-bar'; bar.hidden = true; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Music controls');
  const mk = (name, label, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mb-btn'; b.setAttribute('aria-label', label); b.innerHTML = I[name]; b.onclick = e => { e.stopPropagation(); fn(); poke(); }; return b; };
  title = document.createElement('span'); title.className = 'mb-title'; title.innerHTML = '<b></b><small></small>';
  playBtn = mk('play', 'Play', toggle); playBtn.classList.add('mb-play');
  // progress ring around the play button
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); ring.setAttribute('class', 'mb-ring'); ring.setAttribute('viewBox', '0 0 52 52'); ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<circle cx="26" cy="26" r="24" class="tr"/><circle cx="26" cy="26" r="24" class="pr"/>'; playBtn.prepend(ring);
  const prevB = mk('prev', 'Previous song', prev), nextB = mk('next', 'Next song', next); prevB.classList.add('mb-skip'); nextB.classList.add('mb-skip');
  bar.append(prevB, playBtn, nextB, title);
  document.getElementById('app').appendChild(bar);
  btn.onclick = () => { bar.hidden = !bar.hidden; if (!bar.hidden){ paintTitle(); poke(); } };
}
function poke(){ clearTimeout(hideT); hideT = setTimeout(() => { if (bar) bar.hidden = true; }, 7000); }
function paintTitle(){
  const s = cue || songs[idx];
  title.querySelector('b').textContent = s ? s.title : (loading ? 'Loading…' : 'Tap play');
  title.querySelector('small').textContent = s ? (s.artist || '') : 'Your playlist';
  title.classList.toggle('loading', loading);
  const on = audio && !audio.paused;
  const glyph = playBtn.querySelector('svg:not(.mb-ring)'); if (glyph) glyph.remove();
  playBtn.insertAdjacentHTML('beforeend', on ? I.pause : I.play); playBtn.classList.toggle('on', !!on); playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
  btn.classList.toggle('playing', !!on);
}

// ---------- playback ----------
// iPhones only let a page start sound inside a tap. Decrypting takes a moment, so the audio element is "unlocked"
// right away with a blip of silence, and the real song is swapped in when it's ready.
function ensureAudio(){
  if (audio) return audio;
  audio = new Audio(); audio.preload = 'auto'; audio.onended = () => { if (cue){ cue = null; paintTitle(); return; } playAt(idx + 1); }; audio.onplay = audio.onpause = paintTitle;
  audio.ontimeupdate = () => { const c = document.querySelector('.mb-ring .pr'); if (c && audio.duration) c.style.strokeDashoffset = String(150.8 * (1 - audio.currentTime / audio.duration)); };
  return audio;
}
const SILENCE = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';
let cue = null;
async function playTag(tag){
  if (!get(KEY, null)) return;
  const a = ensureAudio(); if (a.paused){ a.src = SILENCE; a.play().catch(() => {}); }
  try {
    await loadList(); const s = allSongs.find(x => x.tag === tag); if (!s) return;
    const r = await fetch('music/' + s.file); if (!r.ok) return;
    const plain = await open(new Uint8Array(await r.arrayBuffer()));
    if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(new Blob([plain], {type:'audio/mpeg'}));
    if (window.iRob && window.iRob.stopSpeaking) window.iRob.stopSpeaking();
    cue = s; a.src = url; await a.play(); session(s); build(); if (title) paintTitle();
  } catch {}
}
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
    ensureAudio(); cue = null;
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

// Unlock from inside the app. Needed because an iPhone home-screen app keeps its own storage, separate from Safari,
// so opening the link in Safari doesn't unlock the installed app. Copy the link, then tap Paste here.
function unlockPrompt(){
  if (document.getElementById('mUnlock')) return;
  const o = document.createElement('div'); o.id = 'mUnlock'; o.className = 'm-unlock'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Unlock the music');
  o.innerHTML = `<div class="m-card"><b>🎶 Unlock your playlist</b><p>Copy the music link Rob sent you, then tap <b>Paste</b>.</p>
    <input type="text" id="mKey" placeholder="Music link" autocomplete="off" autocapitalize="off" spellcheck="false">
    <div class="m-row"><button type="button" class="btn ghost" id="mPaste">Paste</button><button type="button" class="btn" id="mGo">Unlock</button></div>
    <p class="m-msg" id="mMsg"></p><button type="button" class="m-x" id="mX">Not now</button></div>`;
  (document.getElementById('app') || document.body).appendChild(o);
  const inp = o.querySelector('#mKey'), msg = o.querySelector('#mMsg'), close = () => o.remove();
  o.querySelector('#mX').onclick = close; o.onclick = e => { if (e.target === o) close(); };
  o.querySelector('#mPaste').onclick = async () => { try { inp.value = (await navigator.clipboard.readText()).trim(); go(); } catch { msg.textContent = 'Couldn\'t read the clipboard. Long-press the box and choose Paste.'; inp.focus(); } };
  const go = async () => {
    const v = inp.value.trim(), m = v.match(/music=([A-Za-z0-9_-]{40,})/) || v.match(/^([A-Za-z0-9_-]{40,})$/);
    if (!m){ msg.textContent = 'That doesn\'t look like the music link. Copy the whole link and try again.'; return; }
    const old = get(KEY, null); put(KEY, m[1]); cryptoKey = null; songs = [];
    try { await loadList(); } catch { if (old) put(KEY, old); else try { localStorage.removeItem(KEY); } catch {} cryptoKey = null; msg.textContent = 'That link didn\'t unlock the music. Make sure it\'s the newest one.'; return; }
    close(); build(); if (window.iRob) window.iRob.toast('🎶 Unlocked! Tap ♫ at the top any time.'); window.iRobMusic.open();
  };
  o.querySelector('#mGo').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
}
// ---------- Rob's voice notes (sealed with the same key as the music) ----------
let notesList = null, vnAudio = null, vnTick = null; const vnUrls = new Map();
async function notes(){
  if (notesList) return notesList; if (!get(KEY, null)) return [];
  try { const r = await fetch('music/notes.bin', {cache:'no-cache'}); if (!r.ok) return []; notesList = (JSON.parse(new TextDecoder().decode(await open(new Uint8Array(await r.arrayBuffer())))).notes || []); }
  catch { return []; }
  return notesList;
}
function stopNote(){ if (vnAudio && !vnAudio.paused) vnAudio.pause(); if (vnTick){ const t = vnTick; vnTick = null; t(0, false); } }
// Called from a tap: the element is unlocked with silence right away (iPhone rule), then the clip is swapped in.
function playNote(id, onTick){
  stopNote();
  const a = vnAudio || (vnAudio = new Audio()); a.src = SILENCE; a.play().catch(() => {});
  if (audio && !audio.paused) audio.pause();
  if (window.iRob && window.iRob.stopSpeaking) window.iRob.stopSpeaking();
  vnTick = onTick || null;
  return (async () => {
    const n = (await notes()).find(x => x.id === id); if (!n) throw new Error('missing');
    let u = vnUrls.get(id);
    if (!u){ const r = await fetch('music/' + n.file); if (!r.ok) throw new Error('fetch'); u = URL.createObjectURL(new Blob([await open(new Uint8Array(await r.arrayBuffer()))], {type:'audio/mp4'})); vnUrls.set(id, u); }
    if (vnTick !== (onTick || null)) return;          // another note was tapped meanwhile
    a.ontimeupdate = () => { if (vnTick && a.duration) vnTick(a.currentTime / a.duration, true); };
    a.onended = () => { const t = vnTick; vnTick = null; t && t(1, false); };
    a.src = u; await a.play(); vnTick && vnTick(0, true);
  })().catch(e => { const t = vnTick; vnTick = null; t && t(0, false); throw e; });
}
function init(){ takeKey(); if (get(KEY, null)) build(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
addEventListener('hashchange', takeKey);
window.iRobMusic = {unlockPrompt, playTag, notes, playNote, stopNote, unlocked:() => !!get(KEY, null), open(){ build(); if (bar){ bar.hidden = false; paintTitle(); poke(); } if (!audio || audio.paused) toggle(); }, playAt, toggle, next, prev, list:() => loadList(), get playing(){ return !!(audio && !audio.paused); }, get current(){ return cue || songs[idx] || null; }};
})();
