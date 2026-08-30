// Text-to-speech with per-sentence captions, and speech recognition for
// voice input. Two TTS backends:
//  - ElevenLabs (optional, much more natural) when an API key + voice ID are set
//  - the browser's speechSynthesis otherwise, with a tuned deeper male default

const synth = window.speechSynthesis

let cachedVoices = []
function loadVoices() {
  cachedVoices = synth ? synth.getVoices() : []
  return cachedVoices
}
if (synth) {
  loadVoices()
  synth.onvoiceschanged = loadVoices
}

export function listVoices() {
  return (cachedVoices.length ? cachedVoices : loadVoices()).filter((v) =>
    /^(en|zh)/i.test(v.lang),
  )
}

// Modern voices first; ancient robotic ones (Fred etc.) intentionally absent —
// the generic en fallback only reaches them if nothing better exists.
const EN_PREFERRED = ['Alex', 'Evan', 'Nathan', 'Tom', 'Aaron', 'Reed', 'Eddy', 'Daniel', 'Google US English']
const ZH_PREFERRED = ['Tingting', 'Ting-Ting', 'Lilian', 'Google 普通话']

export function pickVoice(text, preferredName) {
  const voices = cachedVoices.length ? cachedVoices : loadVoices()
  const isZh = /[一-鿿]/.test(text)
  if (preferredName && !isZh) {
    const v = voices.find((v) => v.name === preferredName)
    if (v) return v
  }
  const prefs = isZh ? ZH_PREFERRED : EN_PREFERRED
  for (const name of prefs) {
    // prefer enhanced/premium variants of the same voice when installed
    const enhanced = voices.find((v) => v.name.includes(name) && /enhanced|premium/i.test(v.name))
    if (enhanced) return enhanced
    const v = voices.find((v) => v.name.includes(name))
    if (v) return v
  }
  return voices.find((v) => (isZh ? v.lang.startsWith('zh') : v.lang.startsWith('en'))) || null
}

export function splitSentences(text) {
  const parts = text.replace(/\s+/g, ' ').match(/[^.!?。！？]+[.!?。！？]*\s*/g)
  return (parts || [text]).map((s) => s.trim()).filter(Boolean)
}

// True when a genuinely good voice is installed (Enhanced/Premium, Alex, or
// Google's neural voice); used to show a one-time quality tip otherwise.
export function hasQualityVoice() {
  const voices = cachedVoices.length ? cachedVoices : loadVoices()
  return voices.some(
    (v) => v.lang.startsWith('en') && (/enhanced|premium/i.test(v.name) || v.name === 'Alex' || v.name.includes('Google US English')),
  )
}

// ---- system TTS ----
// pitch stays near 1.0 — system voices warble badly when shifted down.
function speakSystem(text, { voiceName, rate = 1.0, pitch = 0.95 } = {}, cb = {}) {
  if (!synth) {
    cb.onDone?.()
    return () => {}
  }
  synth.cancel()
  const sentences = splitSentences(text)
  let cancelled = false

  const speakAt = (i) => {
    if (cancelled) return
    if (i >= sentences.length) {
      cb.onDone?.()
      return
    }
    const s = sentences[i]
    const u = new SpeechSynthesisUtterance(s)
    const voice = pickVoice(s, voiceName)
    if (voice) u.voice = voice
    u.rate = /[一-鿿]/.test(s) ? rate : rate * 1.04
    u.pitch = pitch
    u.onstart = () => cb.onSentence?.(s, i, sentences.length)
    u.onend = () => speakAt(i + 1)
    u.onerror = () => speakAt(i + 1)
    synth.speak(u)
  }
  speakAt(0)

  return () => {
    cancelled = true
    synth.cancel()
  }
}

// ---- ElevenLabs TTS (per-sentence, prefetching the next while one plays) ----
function speakEleven(text, opts, cb = {}) {
  const { elKey, elVoice, rate = 1.0 } = opts
  const sentences = splitSentences(text)
  let cancelled = false
  let audio = null
  const controllers = []

  const fetchSentence = async (s) => {
    const ctrl = new AbortController()
    controllers.push(ctrl)
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(elVoice)}?output_format=mp3_44100_96`,
      {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'xi-api-key': elKey, 'content-type': 'application/json' },
        body: JSON.stringify({
          text: s,
          model_id: 'eleven_flash_v2_5',
          voice_settings: { stability: 0.45, similarity_boost: 0.8 },
        }),
      },
    )
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`)
    return URL.createObjectURL(await res.blob())
  }

  ;(async () => {
    try {
      let nextPromise = fetchSentence(sentences[0])
      for (let i = 0; i < sentences.length; i++) {
        const url = await nextPromise
        if (cancelled) return
        if (i + 1 < sentences.length) nextPromise = fetchSentence(sentences[i + 1])
        cb.onSentence?.(sentences[i], i, sentences.length)
        await new Promise((resolve) => {
          audio = new Audio(url)
          audio.playbackRate = rate
          audio.onended = resolve
          audio.onerror = resolve
          audio.play().catch(resolve)
        })
        URL.revokeObjectURL(url)
        if (cancelled) return
      }
      cb.onDone?.()
    } catch (e) {
      if (cancelled) return
      console.warn('ElevenLabs TTS failed, falling back to system voice:', e)
      speakSystem(text, opts, cb)
    }
  })()

  return () => {
    cancelled = true
    controllers.forEach((c) => c.abort())
    audio?.pause()
  }
}

// ---- Microsoft neural TTS via our own /api/tts function (free, default) ----
export const NEURAL_VOICES = [
  { id: 'en-US-ChristopherNeural', label: 'Christopher — deep & calm (default)' },
  { id: 'en-US-GuyNeural', label: 'Guy — lively' },
  { id: 'en-US-EricNeural', label: 'Eric — mature' },
  { id: 'en-US-AndrewNeural', label: 'Andrew — warm' },
  { id: 'en-GB-RyanNeural', label: 'Ryan — British' },
]
const NEURAL_ZH_DEFAULT = 'zh-CN-YunjianNeural'

function speakNeural(text, opts, cb = {}) {
  const { neuralVoice, rate = 1.0 } = opts
  const sentences = splitSentences(text)
  let cancelled = false
  let audio = null
  const controllers = []

  const fetchSentence = async (s) => {
    const ctrl = new AbortController()
    controllers.push(ctrl)
    const voice = /[一-鿿]/.test(s) ? NEURAL_ZH_DEFAULT : neuralVoice || NEURAL_VOICES[0].id
    const res = await fetch('/api/tts', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: s, voice }),
    })
    if (!res.ok) throw new Error(`neural TTS ${res.status}`)
    const blob = await res.blob()
    if (!blob.size) throw new Error('neural TTS empty audio')
    return URL.createObjectURL(blob)
  }

  ;(async () => {
    try {
      let nextPromise = fetchSentence(sentences[0])
      for (let i = 0; i < sentences.length; i++) {
        const url = await nextPromise
        if (cancelled) return
        if (i + 1 < sentences.length) nextPromise = fetchSentence(sentences[i + 1])
        cb.onSentence?.(sentences[i], i, sentences.length)
        await new Promise((resolve) => {
          audio = new Audio(url)
          audio.playbackRate = rate
          audio.onended = resolve
          audio.onerror = resolve
          audio.play().catch(resolve)
        })
        URL.revokeObjectURL(url)
        if (cancelled) return
      }
      cb.onDone?.()
    } catch (e) {
      if (cancelled) return
      console.warn('Neural TTS failed, falling back to system voice:', e)
      speakSystem(text, opts, cb)
    }
  })()

  return () => {
    cancelled = true
    controllers.forEach((c) => c.abort())
    audio?.pause()
  }
}

// Speak text sentence-by-sentence.
// Backend priority: ElevenLabs (if configured) → Microsoft neural (free,
// via /api/tts) → system speechSynthesis (last resort / local dev).
// callbacks: onSentence(sentence, i, total), onDone()
// Returns a cancel function.
export function speak(text, opts = {}, cb = {}) {
  if (opts.elKey && opts.elVoice) return speakEleven(text, opts, cb)
  return speakNeural(text, opts, cb)
}

export function stopSpeaking() {
  synth?.cancel()
}

// ---- speech recognition (voice input) ----
// Streams interim text via onInterim so the user can SEE that they're being
// heard; surfaces errors via onError instead of failing silently.
// continuous=true keeps the mic open for hands-free conversation.
export function createRecognizer({ onInterim, onResult, onError, onEnd, lang = 'en-US', continuous = false }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SR) return null
  const rec = new SR()
  rec.lang = lang
  rec.interimResults = true
  rec.continuous = continuous
  rec.maxAlternatives = 1
  rec.onresult = (e) => {
    let interim = ''
    let final = ''
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      if (r.isFinal) final += r[0].transcript
      else interim += r[0].transcript
    }
    if (interim) onInterim?.(interim)
    if (final.trim()) onResult?.(final.trim())
  }
  rec.onerror = (e) => onError?.(e.error || 'unknown')
  rec.onend = () => onEnd?.()
  return rec
}

// Friendly explanations for recognition failures.
export function micErrorMessage(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone blocked. Click the 🔒 in the address bar → allow Microphone → reload the page.'
    case 'no-speech':
      return 'Didn’t hear anything — click the mic and start speaking right away.'
    case 'audio-capture':
      return 'No microphone found on this device.'
    case 'network':
      return 'Speech service unavailable in this browser — voice input works best in Chrome.'
    case 'aborted':
      return null
    default:
      return `Voice input error: ${code}`
  }
}
