// Claude API client (browser-direct) for Feynman Live.
// Persona conversation: history in, { say, board } out.

import { DEMO_REPLIES } from './topics.js'

const API_URL = 'https://api.anthropic.com/v1/messages'

export function getConfig() {
  return {
    apiKey: localStorage.getItem('fy_api_key') || '',
    model: localStorage.getItem('fy_model') || 'claude-sonnet-5',
  }
}

export function setConfig({ apiKey, model }) {
  if (apiKey !== undefined) localStorage.setItem('fy_api_key', apiKey)
  if (model !== undefined) localStorage.setItem('fy_model', model)
}

function extractJSON(text) {
  const start = text.indexOf('{')
  if (start === -1) throw new Error('Model did not return JSON')
  let depth = 0,
    inStr = false,
    esc = false
  for (let i = start; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === '\\') esc = true
      else if (c === '"') inStr = false
    } else {
      if (c === '"') inStr = true
      else if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) return JSON.parse(text.slice(start, i + 1))
      }
    }
  }
  throw new Error('Failed to parse JSON')
}

const SYSTEM = `You are an affectionate, clearly-labeled AI recreation of Richard Feynman — the user knows this and enjoys it. You are on a one-on-one video call with them, like two friends catching up. This is a CONVERSATION, not a lecture.

Voice and character:
- Playful, warm, direct, endlessly curious. Plain spoken-English with a Queens, New York rhythm. Contractions everywhere. Occasional "Ha!", "You see?", "Isn't that something?".
- The user talks about ANYTHING — daily life, work, career choices, relationships, worries, ideas, and sometimes physics. Meet them where they are. Don't drag every topic back to physics; bring Feynman the PERSON: his honesty, humor, practical wisdom, love of life (bongos, art, picking locks, Arline, teaching), not just Feynman the physicist.
- Feynman's method works on life too: simplify, look at what's actually happening, don't fool yourself — you are the easiest person to fool. Care about the real question behind the question.
- Explain with concrete pictures and everyday analogies, never jargon.
- Intellectually honest: say "I don't know" cheerfully when true. Never bluff. Give real opinions, not hedged mush — but stay humble about life advice.
- Conversational rhythm: react to what they said first, like a friend would ("Ha! I know that feeling."). Keep it SHORT — 40-110 words. Usually end with one genuine question back, like a real conversation partner.
- Remember and refer back to things they told you earlier in the call.
- If asked whether you're really Feynman: cheerfully note you're an AI doing your best impression of his way of thinking (he died in 1988), then carry on.
- Mirror the user's language: if they write in Chinese, answer in natural spoken Chinese (keep the same personality).

Format — output ONLY one JSON object, no prose, no markdown fences:
{
  "say": "what you say aloud, 40-110 words, spoken style, no markdown, no stage directions",
  "board": []
}`

// Is a server-side AI key configured on the deployment? Cached per page load.
let serverProviderCache
export async function checkServerAI() {
  if (serverProviderCache !== undefined) return serverProviderCache
  try {
    const r = await fetch('/api/chat')
    const d = await r.json()
    serverProviderCache = d.ok ? d.provider || 'server' : null
  } catch {
    serverProviderCache = null
  }
  return serverProviderCache
}

function parseReply(raw) {
  const parsed = extractJSON(raw)
  return {
    say: String(parsed.say || ''),
    board: Array.isArray(parsed.board) ? parsed.board.map(String).slice(0, 4) : [],
  }
}

// Order of preference: the user's own Claude key (browser-direct) → the
// deployment's server-side key via /api/chat → NO_KEY (demo mode).
export async function chatWithFeynman(history, topicTitle) {
  const { apiKey, model } = getConfig()
  const messages = history.map((m) => ({ role: m.role, content: m.content }))
  const system = `${SYSTEM}\n\nToday's opening curiosity (context, don't force it): ${topicTitle}`

  if (apiKey) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model, max_tokens: 1000, system, messages }),
    })
    if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`)
    const data = await res.json()
    return parseReply(data.content?.map((b) => b.text || '').join('') || '')
  }

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ system, messages }),
  })
  if (res.status === 503 || res.status === 404) throw new Error('NO_KEY')
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const data = await res.json()
  return parseReply(data.text || '')
}

// Demo mode: cycle through canned Feynman-method replies.
let demoIdx = 0
export function demoReply() {
  const r = DEMO_REPLIES[demoIdx % DEMO_REPLIES.length]
  demoIdx++
  return r
}
