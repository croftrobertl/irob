// Seal the "Just us" game content into us.enc.json with a password (PBKDF2-SHA256 250k → AES-GCM).
// Usage: node tools/seal-us.mjs <plaintext.json> <password> [out]
// The plaintext stays out of the repo; only the ciphertext is committed.
import fs from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
const [inPath, pass, out = 'us.enc.json'] = process.argv.slice(2);
const data = fs.readFileSync(inPath);
const b64u = b => Buffer.from(b).toString('base64url');
const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)), iter = 250000;
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass.normalize('NFKC').trim().toLowerCase()), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256'}, base, {name: 'AES-GCM', length: 256}, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, data));
fs.writeFileSync(out, JSON.stringify({v: 1, salt: b64u(salt), iter, iv: b64u(iv), ct: b64u(ct)}));
console.log('sealed', out);
