// Encrypt Rob's voice notes with the same key as the music (AES-GCM). The public repo only holds scrambled data.
// Usage: node tools/seal-notes.mjs <notes.json> <key base64url>
// notes.json: [{"cat":"morning|night|comfort|love|proud|silly","src":"/path/to/clip.m4a","dur":4.2}, …]
// Writes music/v-<hash>.bin per clip and music/notes.bin (the encrypted list). File names reveal nothing about the clip.
import fs from 'node:fs';
import { webcrypto as crypto, createHash } from 'node:crypto';
const [listPath, keyArg] = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(listPath, 'utf8'));
const key = await crypto.subtle.importKey('raw', new Uint8Array(Buffer.from(keyArg, 'base64url')), 'AES-GCM', false, ['encrypt']);
const seal = async bytes => { const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, bytes)); const out = new Uint8Array(12 + ct.length); out.set(iv); out.set(ct, 12); return out; };
const notes = [];
for (const n of list){
  const data = fs.readFileSync(n.src);
  const id = createHash('sha256').update(data).digest('hex').slice(0, 16);
  if (!fs.existsSync(`music/v-${id}.bin`)) fs.writeFileSync(`music/v-${id}.bin`, await seal(data));
  notes.push({id, cat: n.cat, dur: n.dur || 0, file: `v-${id}.bin`});
}
fs.writeFileSync('music/notes.bin', await seal(new TextEncoder().encode(JSON.stringify({v: 1, notes}))));
console.log(`sealed ${notes.length} voice notes`);
