// Seal Erica's questionnaire answers into profile.enc.json (AES-GCM, 256-bit key).
// Usage: node tools/seal-profile.mjs <answers.json> <questionnaire.html> <base64url key | "new"> [out]
// The key never goes in the repo. Erica's phone gets it once from https://croftrobertl.github.io/irob/#key=<key>
import fs from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';

const [answersPath, formPath, keyArg, out = 'profile.enc.json'] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(answersPath, 'utf8'));
const form = fs.readFileSync(formPath, 'utf8');
const HER = 'Erica';

// Question labels and section titles, read from the questionnaire itself so new questions just work.
const labelsIn = txt => Object.fromEntries([...txt.matchAll(/F\('(\w+)','((?:[^'\\]|\\.)*)'/g)].map(m => [m[1], m[2].replace(/\\'/g, "'")]));
const sections = [...form.matchAll(/\{id:'(\w+)', title:'((?:[^'\\]|\\.)*)'[\s\S]*?(?=\n  \{id:'|\n\];)/g)].map(m => ({id: m[1], title: m[2].replace(/\\'/g, "'"), body: m[0]}));
const v = x => (typeof x === 'string' ? x.trim() : '');
const F = A.fields || {}, Ls = A.lists || {};
const md = d => (/^\d{4}-\d\d-\d\d$/.test(d) ? d.slice(5) : null);
const pretty = d => new Date(d + 'T12:00:00').toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'});

const DCC = 'Dora Canal Court (doracanalcourt.com) is her family\'s business since 1971: 8 waterfront vacation cottages on the Dora Canal in Tavares, Florida (The Boathouse, The Lighthouse, Hibiscus Hut, Flamingo Bungalow, Pineapple Place, Coconut Cottage, Blue Heron Hideaway, Sunshine Suite). Guests rent a whole cottage and book on the website.';

const lines = [];
for (const s of sections){
  const out = [];
  const [fieldsPart, ...rest] = s.body.split('lists:['); const listsPart = rest.join('lists:[');
  const labels = labelsIn(fieldsPart);
  for (const k of Object.keys(labels)){
    let val = v(F[k]); if (!val) continue;
    if (/^\d{4}-\d\d-\d\d$/.test(val)) val = pretty(val);
    out.push(`${labels[k] || k}: ${val}`);
  }
  for (const m of listsPart.matchAll(/\{k:'(\w+)', l:'((?:[^'\\]|\\.)*)', title:'(\w+)'[^\n]*?cols:\[([^\n]*?)\]\}/g)){
    const cl = labelsIn(m[4]);
    (Ls[m[1]] || []).forEach(row => {
      const bits = Object.keys(cl).map(c => [c, row[c]]).filter(([, x]) => v(x)).map(([c, x]) => [c, x]).filter(([, x]) => v(x)).map(([c, x]) => `${cl[c] || c}: ${/^\d{4}-\d\d-\d\d$/.test(x) ? pretty(x) : v(x)}`);
      if (bits.length) out.push(`${m[3]}: ${bits.join('; ')}`);
    });
  }
  (A.custom?.[s.id] || []).forEach(r => { if (v(r.a)) out.push(`${v(r.q) || 'Note'}: ${v(r.a)}`); });
  if (out.length) lines.push(`${s.title}:\n- ` + out.join('\n- '));
}
const allText = JSON.stringify(A);
const guide = [
  `WHAT YOU KNOW ABOUT ${HER.toUpperCase()} (from Rob; private). Use it the way a close friend would: naturally, one or two details at most in a reply, only when they fit. Never recite it, list it back, or mention that you have notes.`,
  /dora canal court/i.test(allText) ? DCC : '',
  /\b(died|passed|passed away|death)\b/i.test(allText) ? 'Anyone listed as having died: only bring them up if she does, and then gently.' : '',
  (Ls.pets || []).some(p => v(p.name)) ? `Her cats (${(Ls.pets || []).map(p => v(p.name)).filter(Boolean).join(', ')}) are her biggest comfort. When she's sad, anxious, angry or lonely, suggesting she cuddle one of them is often the right move: name just ONE cat, a different one each time.` : '',
  v(F.hates_hearing) ? `Never say these to her: ${v(F.hates_hearing)}.` : '',
].filter(Boolean).join('\n');

// Structured bits the app uses directly.
const dates = [];
if (md(F.birthday)) dates.push({md: md(F.birthday), kind: 'her-birthday', what: `${HER}'s birthday`});
(Ls.kids || []).forEach(k => { if (v(k.name) && md(k.dob)) dates.push({md: md(k.dob), kind: 'kid-birthday', name: v(k.nickname) || v(k.name)}); });
(Ls.pets || []).forEach(p => { if (v(p.name) && md(p.birthday)) dates.push({md: md(p.birthday), kind: 'pet-day', name: v(p.name)}); });
if (md(F.mom_birthday)) dates.push({md: md(F.mom_birthday), kind: 'memorial', what: 'her mom\'s birthday'});
if (md(F.mom_passed)) dates.push({md: md(F.mom_passed), kind: 'memorial', what: 'the anniversary of losing her mom'});
(Ls.dates || []).forEach(d => { if (v(d.what) && md(d.date)) dates.push({md: md(d.date), kind: 'other', what: v(d.what), note: v(d.notes)}); });
if (/halloween/i.test(v(F.holiday))) dates.push({md: '10-31', kind: 'fav-holiday', what: 'Halloween'}, {md: '10-01', kind: 'fav-month', what: 'Halloween'});

const orders = (Ls.restaurants || []).filter(r => v(r.place) && v(r.order)).map(r => ({place: v(r.place), order: v(r.order)}));
const profile = {
  v: 1, built: new Date().toISOString(),
  prompt: guide + '\n\n' + lines.join('\n\n'),
  dates, orders,
  coffee: v(F.coffee), sweet: v(F.candy) || v(F.comfort_food), dessert: v(F.dessert), drink: v(F.drink),
  fastFood: v(F.fast_food), cats: (Ls.pets || []).map(p => v(p.name)).filter(Boolean),
  avoid: v(F.hates_hearing).split(/[;,\n]+/).map(x => x.trim().replace(/^["']|["']$/g, '')).filter(x => x.length > 2),
};

const b64u = b => Buffer.from(b).toString('base64url');
const keyBytes = keyArg === 'new' ? crypto.getRandomValues(new Uint8Array(32)) : new Uint8Array(Buffer.from(keyArg, 'base64url'));
if (keyBytes.length !== 32) throw new Error('key must be 32 bytes');
const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, new TextEncoder().encode(JSON.stringify(profile))));
fs.writeFileSync(out, JSON.stringify({v: 1, iv: b64u(iv), ct: b64u(ct)}));
if (process.env.SHOW_PROFILE) console.error(JSON.stringify(profile, null, 1));
console.log(keyArg === 'new' ? `KEY=${b64u(keyBytes)}` : 'sealed with existing key');
