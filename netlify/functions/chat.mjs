// Server-side AI proxy so the user never has to paste a key in the browser.
// Uses ANTHROPIC_API_KEY if configured, else GEMINI_API_KEY (free tier).
// GET  -> { ok, provider }  (health check for the client)
// POST -> { system, messages:[{role, content}] } => { text }

const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash']

export default async (req) => {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY

  if (req.method === 'GET') {
    const provider = anthropicKey ? 'claude' : geminiKey ? 'gemini' : null
    return Response.json({ ok: Boolean(provider), provider })
  }
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })

  let body
  try {
    body = await req.json()
  } catch {
    return new Response('bad json', { status: 400 })
  }
  const system = String(body.system || '').slice(0, 8000)
  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-24)
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 4000),
    }))
  if (!messages.length) return new Response('no messages', { status: 400 })

  let claudeErr = ''
  if (anthropicKey) {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 1000, system, messages }),
    })
    if (r.ok) {
      const d = await r.json()
      return Response.json({ text: d.content?.map((b) => b.text || '').join('') || '' })
    }
    // e.g. a stale account-level key — fall through to Gemini if available
    claudeErr = `claude ${r.status} ${(await r.text()).slice(0, 150)}`
    if (!geminiKey) return new Response(`claude error: ${claudeErr}`, { status: 502 })
  }

  if (geminiKey) {
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    let lastErr = ''
    for (const model of GEMINI_MODELS) {
      const generationConfig = { temperature: 0.9, maxOutputTokens: 1500 }
      if (model.startsWith('gemini-2.5')) generationConfig.thinkingConfig = { thinkingBudget: 0 }
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: system }] },
            contents,
            generationConfig,
          }),
        },
      )
      if (r.ok) {
        const d = await r.json()
        const text = d.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || ''
        if (text) return Response.json({ text })
        lastErr = `${model}: empty response`
        continue
      }
      lastErr = `${model}: ${r.status} ${(await r.text()).slice(0, 200)}`
      if (![400, 404, 429].includes(r.status)) break
    }
    return new Response(`gemini error: ${lastErr}`, { status: 502 })
  }

  return new Response('no AI key configured', { status: 503 })
}
