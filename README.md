# iRob

A single-file, free comfort chat for Erica. Open `index.html` — no build step.

- **AI:** the app calls the iRob relay (`relay/worker.js`, a free Cloudflare Worker at irob-ai.croftrobertl.workers.dev) which uses Groq, then Cloudflare Workers AI. If both fail it falls back to Pollinations (1 reply per 45 s), then built-in replies.
- **Croatia memories:** read live from the public trip site's `trip.json` (Croatia days only, photos and self-hosted videos up to 60 s). "On this day" appears Sep 12–26 each year. Mini map tiles © OpenStreetMap contributors.
- **Storage:** everything stays in the phone's browser. Settings → Save a backup / Restore a backup. On iPhone, add to the Home Screen so Safari doesn't clear it.
- **Night mode:** follows the iPhone's dark mode.
- **Weekly health check:** `.github/workflows/health-check.yml` runs Mondays and on demand (Actions → Weekly health check → Run workflow). GitHub emails the owner if the free AI, the Croatia list, or this page stops working. GitHub pauses scheduled runs in a public repo after 60 days with no commits, and emails before it does.
- **Letters:** `write-letters.html` seals the "Open when…" letters with a shared word (AES-GCM, PBKDF2 250k). Save the sealed output as `letters.json`.
- **Hosting:** GitHub Pages, Settings → Pages → Deploy from branch → `main` / root.
