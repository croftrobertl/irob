// Encrypt songs for Erica's playlist (AES-GCM, 256-bit key). The public repo only ever holds scrambled data.
// Usage: node tools/seal-music.mjs <playlist.json> <key base64url | "new">
// playlist.json: [{"title":"…","artist":"…","src":"/path/to/song.mp3"}, …]  (order = play order)
// Writes music/<n>.bin per song and music/playlist.bin (the encrypted list). Erica's phone gets the key once via …/irob/#music=<key>.
import fs from 'node:fs';
import { webcrypto as crypto, createHash } from 'node:crypto';
const [listPath, keyArg] = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
const keyBytes = keyArg === 'new' ? crypto.getRandomValues(new Uint8Array(32)) : new Uint8Array(Buffer.from(keyArg, 'base64url'));
const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
const seal = async bytes => { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, bytes)); const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return out; };
fs.mkdirSync('music', {recursive: true});
const songs = [];
for (const s of list){
  if (!s.src || !fs.existsSync(s.src)){ songs.push({title: s.title, artist: s.artist, file: null}); continue; }
  const data = fs.readFileSync(s.src);
  const id = createHash('sha256').update(data).digest('hex').slice(0, 16);   // stable, reveals nothing about the song
  if (!fs.existsSync(`music/${id}.bin`)) fs.writeFileSync(`music/${id}.bin`, await seal(data));   // already sealed songs stay untouched
  songs.push({title: s.title, artist: s.artist, file: `${id}.bin`});
}
fs.writeFileSync('music/playlist.bin', await seal(new TextEncoder().encode(JSON.stringify({v: 1, songs}))));
console.log(keyArg === 'new' ? 'KEY=' + Buffer.from(keyBytes).toString('base64url') : 'sealed with existing key');
