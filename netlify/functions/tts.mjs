// Free neural TTS proxy (Microsoft Edge read-aloud voices) — the browser
// POSTs { text, voice } and gets back an MP3. No account or key needed.
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

export default async (req) => {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 })
  let body
  try {
    body = await req.json()
  } catch {
    return new Response('bad json', { status: 400 })
  }
  const text = String(body.text || '').slice(0, 800)
  const voice = /^[a-zA-Z0-9-]+$/.test(body.voice || '') ? body.voice : 'en-US-ChristopherNeural'
  if (!text.trim()) return new Response('empty', { status: 400 })

  const tts = new MsEdgeTTS()
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
  const res = tts.toStream(text)
  const stream = res.audioStream || res
  const chunks = []
  for await (const c of stream) chunks.push(c)
  try {
    tts.close?.()
  } catch {}
  return new Response(Buffer.concat(chunks), {
    headers: { 'content-type': 'audio/mpeg', 'cache-control': 'no-store' },
  })
}
