# iRob — hand-off notes for Claude

iRob is a private, mobile-first comfort-and-fun chat app that Rob built for his wife. It is a static site on GitHub Pages
(https://croftrobertl.github.io/irob/, repo `croftrobertl/the-rob-you-want`, branch `main`) plus one Cloudflare Worker.
There is no build step. Rob is not a professional developer and usually works from his phone or Mac.

**Secrets and private details are NOT in this repo.** If a `private/` folder exists (git-ignored), read
`private/PRIVATE-NOTES.md` first: it has the music key, the Just Us password, the plaintext sources and the Cloudflare setup.
Never commit anything from `private/`, never paste keys or passwords into code, comments or commit messages.

## How Rob wants you to work

- Verify, then speak. Say "I measured X" or "I could not verify Y". Never present a guess as a finding.
- **Never push without his say-so.** Commit, show him (screenshots help), wait for "push". After a push, confirm on the live site.
- Never enter passwords or sign in as him. For anything in Cloudflare or GitHub settings, give exact steps; for Worker changes
  give the **whole file** in one copyable block (he pastes it over everything in the dashboard and clicks Deploy).
- Lead with the outcome, keep it short, plain language, no jargon. Don't re-propose things he has already decided.
- Back up before destructive changes. Booking/guest data of his business is unrelated to this repo and off limits.
- Bump `CACHE` in `sw.js` on every change that ships (it is how installed phones pick up updates).
- Test screenshots must never land in the repo (`.gitignore` blocks root-level PNGs; keep test output outside the repo).

## Decisions already made (don't reopen)

- Persona: a normal, warm husband. No comments on her looks, nothing sexual in chat, no "just friends / you'll find someone
  else" lines (filters in `scrubLooks` enforce this). One question per reply, short casual texting style, no made-up plans.
- The cat everywhere is **Weezy**: snow-white, long-haired, one small grey patch on top of her head, green eyes. No coat choice.
- Voice cloning was tried (on-device Pocket TTS, `voice/` test page) and rejected: it only vaguely sounded like him.
  Real recorded voice notes are used instead.
- Just Us (adult dice game + spicy coupons) stays behind its password; Rob chose not to change the password.
- Backups: her phone holds its own restore link; Rob does not get a copy.
- Future plan (not started): separate versions for two more family members with a "who are you?" picker.

## Files

| File | What it is |
|---|---|
| `index.html` | The app: styles, markup and main script (chat, persona prompt, reply filters, tray, menu, roulette, Croatia photo games, Settings, manual + automatic backup). |
| `life.js` | Error reporter (posts to the Worker `/log`), memory notebook, date messages, tapbacks. |
| `fun.js` / `fun.css` | Games and effects: Pocket Kitten (v4, Weezy walks/eats/plays on her own), Puppy Power, Kitten Cuddles, Catch Kittens, Fortune Cookie, Just Us, memory match and other Croatia games, effects engine, secret words, napping kitten on buttons, love coupons. |
| `cards.js` / `cards.css` | Comfort Toolkit cards (IndexedDB). |
| `music.js` | Hidden playlist player + Rob's voice notes + the "mad at Rob" cue. Files are fetched from the Worker, decrypted on the phone. |
| `cat.js` | Old drawn SVG cat, now only a fallback. |
| `icons/` | Painted icon set. `N.webp` numbers follow the icon sheet (1–206, plus `1197`), `pk-*.webp` are Pocket Kitten extras, `room-day/night.webp` are the kitten's room. Weezy poses: 158–163 sitting moods/asleep, 176–181 and 197–203 action poses. |
| `relay/worker.js` | The Cloudflare Worker source (deployed by pasting into the dashboard). |
| `tools/seal-*.mjs` | Encrypt music, voice notes and the Just Us file before upload. |
| `sw.js` | Service worker: network-first for pages, cache-first for images/fonts. |
| `voice/` | The abandoned voice-clone test page. |

## The Worker (`irob-ai.croftrobertl.workers.dev`)

Routes: `POST /chat` (Groq first, then Workers AI; the app has its own further fallbacks), `POST /log` and `GET /?deep=1`
(health, 7-day error count, storage object count), `GET /f/<name>?k=<sha256 of music key>` (music, playlist, voice notes),
`POST /us` (Just Us file after a server-side password check, 8 wrong guesses per hour per visitor),
`GET|POST /b/<id>?a=<proof>` (automatic backups; keeps `latest` and `prev`).
Bindings: `GROQ_API_KEY` (secret), `AI`, `LOG` (KV), `FILES` (R2 bucket `irob-private`), `US_CHECK` (secret).
R2 rejects streams of unknown length: always `put` an ArrayBuffer. Free Workers allow about 50 sub-requests per request.

## Private files live in R2, not here

`music/`, `us.enc.json` and `profile.enc.json` were purged from the repo and its history and are git-ignored.
R2 layout: `music/<hash>.bin` songs, `music/v-<hash>.bin` voice notes, `music/playlist.bin`, `music/notes.bin`,
`us.enc.json`, `b/<id>/latest|prev` backups. To add a song or voice note: seal it with the tool (it writes into the
ignored `music/` folder), then Rob uploads the new `.bin` files plus the rewritten `playlist.bin`/`notes.bin` to the bucket
under `music/`. A song with `"tag":"mad"` never plays in the playlist, only on the "mad at Rob" cue.

Unlocking on a phone: the home-screen app has separate storage from Safari, so the music link must be pasted inside the app
(tray → Music → Paste). The same key unlocks voice notes.

## Testing

Use Playwright with a route that serves this folder at a fake origin (see `private/tests/` if present). Mock the Worker by
importing `relay/worker.js` as a module with a stand-in R2/KV when testing storage routes; make the stand-in reject streams.
Live checks: `curl` the site and the Worker, then drive the real site in a browser.

## Open items

- Voice notes: 5 recorded (good morning ×2, love you, proud, silly). Goodnight and hard-moment categories are wired but empty.
- Ten extra painted kitten accessories are saved (`icons/pk-sunhat`, `-pirate`, `-wizard`, `-party`, `-halo`, `-cape`, `-sweater`, `-detective`, `-beanie`, `-antennae`) but are not in the kitten's shop yet.
- Optional: put the whole app behind Cloudflare Access (would stop link previews from showing).
- Three tiny test backups sit under `b/` in the bucket; harmless.
