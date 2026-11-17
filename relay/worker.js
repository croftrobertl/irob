// iRob relay — a free Cloudflare Worker that keeps the Groq key secret.
// Order: Groq (fast, free tier) → Cloudflare Workers AI (free daily allowance) → error (the app then falls back on its own).
// Secrets/bindings set in the Cloudflare dashboard: GROQ_API_KEY (secret), AI (Workers AI binding),
// LOG (optional KV namespace binding: stores anonymous app error reports for 30 days; no chat text is ever sent).
const ALLOWED_ORIGINS = ['https://croftrobertl.github.io'];
const GROQ_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
const CF_MODELS = ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct-fast', '@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.2-3b-instruct'];
const MAX_MESSAGES = 30, MAX_CHARS = 24000, MAX_TOKENS = 600;
const PER_MINUTE = 20;            // per visitor IP, per Worker instance — keeps strangers from burning the free quota
const hits = new Map();

function cors(origin){
  const ok = ALLOWED_ORIGINS.includes(origin);
  return { 'Access-Control-Allow-Origin': ok ? origin : ALLOWED_ORIGINS[0], 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
}
const json = (obj, status, origin) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });

function limited(ip){
  const now = Date.now(), list = (hits.get(ip) || []).filter(t => now - t < 60000);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > PER_MINUTE;
}

function cleanMessages(raw){
  if (!Array.isArray(raw)) return null;
  const msgs = raw.slice(-MAX_MESSAGES).filter(m => m && ['system', 'user', 'assistant'].includes(m.role) && typeof m.content === 'string').map(m => ({ role: m.role, content: m.content }));
  if (!msgs.length || JSON.stringify(msgs).length > MAX_CHARS) return null;
  return msgs;
}

async function tryGroq(env, messages, maxTokens){
  if (!env.GROQ_API_KEY) return null;
  for (const model of GROQ_MODELS){
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { 'Authorization': `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.8 })
      });
      if (!r.ok) continue;                         // 429 (limit), 404/400 (model gone) → next model
      const j = await r.json();
      const text = j?.choices?.[0]?.message?.content;
      if (text && text.trim()) return { text: text.trim(), provider: 'groq', model };
    } catch {}
  }
  return null;
}

async function tryCloudflare(env, messages, maxTokens){
  if (!env.AI) return null;
  for (const model of CF_MODELS){
    try {
      const out = await env.AI.run(model, { messages, max_tokens: maxTokens });
      const text = typeof out === 'string' ? out : (out?.response ?? out?.choices?.[0]?.message?.content);
      if (text && String(text).trim()) return { text: String(text).trim(), provider: 'cloudflare', model };
    } catch {}
  }
  return null;
}

// Anonymous error reports from the app: what broke and where, never what anyone typed.
async function logError(request, env, origin){
  if (!ALLOWED_ORIGINS.includes(origin)) return json({ error: 'forbidden' }, 403, origin);
  if (limited('log:' + (request.headers.get('CF-Connecting-IP') || 'unknown'))) return json({ error: 'slow_down' }, 429, origin);
  let b; try { b = JSON.parse((await request.text()).slice(0, 4000)); } catch { return json({ error: 'bad_json' }, 400, origin); }
  const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').slice(0, n);
  const entry = { t: new Date().toISOString(), m: clip(b.m, 300), src: clip(b.src, 120), line: +b.line || 0, col: +b.col || 0, ver: clip(b.ver, 20), ua: clip(b.ua, 80), where: clip(b.where, 40) };
  if (env.LOG) { try { await env.LOG.put(`e:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`, JSON.stringify(entry), { expirationTtl: 30 * 86400 }); } catch {} }
  else console.log('iRob error', JSON.stringify(entry));
  return json({ ok: true }, 200, origin);
}
async function countErrors(env){
  if (!env.LOG) return null;
  try { const since = Date.now() - 7 * 86400000; const list = await env.LOG.list({ prefix: 'e:', limit: 1000 }); return list.keys.filter(k => +k.name.split(':')[1] >= since).length; } catch { return null; }
}

export default {
  async fetch(request, env){
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method === 'GET') {
      if (url.searchParams.get('deep') !== '1') return json({ ok: true, groq: !!env.GROQ_API_KEY, workersAI: !!env.AI }, 200, origin);
      const probe = [{ role: 'user', content: 'Reply with one short friendly sentence.' }];
      const g = await tryGroq(env, probe, 300), c = await tryCloudflare(env, probe, 60);
      const errors7d = await countErrors(env);
      return json({ ok: !!(g || c), groq: g ? g.model : null, cloudflare: c ? c.model : null, errors7d }, g || c ? 200 : 503, origin);
    }
    if (request.method === 'POST' && url.pathname === '/log') return logError(request, env, origin);
    if (request.method !== 'POST' || url.pathname !== '/chat') return json({ error: 'not_found' }, 404, origin);
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return json({ error: 'forbidden' }, 403, origin);
    if (limited(request.headers.get('CF-Connecting-IP') || 'unknown')) return json({ error: 'slow_down' }, 429, origin);
    let body; try { body = await request.json(); } catch { return json({ error: 'bad_json' }, 400, origin); }
    const messages = cleanMessages(body.messages); if (!messages) return json({ error: 'bad_messages' }, 400, origin);
    const maxTokens = Math.min(Math.max(parseInt(body.max_tokens, 10) || 400, 16), MAX_TOKENS);
    const result = await tryGroq(env, messages, maxTokens) || await tryCloudflare(env, messages, maxTokens);
    return result ? json(result, 200, origin) : json({ error: 'all_busy' }, 503, origin);
  }
};
