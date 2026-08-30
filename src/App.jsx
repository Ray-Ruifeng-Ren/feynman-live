import { useEffect, useRef, useState } from 'react'
import FeynmanPhoto from './FeynmanPhoto.jsx'
import { topicForToday } from './topics.js'
import { chatWithFeynman, checkServerAI, demoReply, getConfig, setConfig } from './llm.js'
import { speak, stopSpeaking, createRecognizer, micErrorMessage, NEURAL_VOICES } from './speech.js'

export default function App() {
  const topic = useRef(topicForToday()).current

  const [phase, setPhase] = useState('join') // join | call
  const [fey, setFey] = useState('idle') // idle | thinking | speaking | listening
  const [caption, setCaption] = useState('')
  const [captionsOn, setCaptionsOn] = useState(true)
  const [chatOpen, setChatOpen] = useState(true)
  const [log, setLog] = useState([]) // {who:'you'|'fey', text}
  const [input, setInput] = useState('')
  const [listenText, setListenText] = useState('')
  const [error, setError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [joinedAt, setJoinedAt] = useState(null)
  const [clock, setClock] = useState('00:00')
  const [cfg, setCfg] = useState(() => ({
    ...getConfig(),
    neuralVoice: localStorage.getItem('fy_neural_voice') || NEURAL_VOICES[0].id,
    rate: parseFloat(localStorage.getItem('fy_rate') || '1'),
    elKey: localStorage.getItem('fy_el_key') || '',
    elVoice: localStorage.getItem('fy_el_voice') || '',
  }))
  const [recLang, setRecLang] = useState('en-US')
  const [serverAI, setServerAI] = useState(null)
  const [handsFree, setHandsFree] = useState(false)
  const handsFreeRef = useRef(false)
  handsFreeRef.current = handsFree
  const recLangRef = useRef(recLang)
  recLangRef.current = recLang

  useEffect(() => {
    checkServerAI().then(setServerAI)
  }, [])

  const historyRef = useRef([])
  const cancelSpeechRef = useRef(null)
  const recRef = useRef(null)
  const chatEndRef = useRef(null)
  const stageRef = useRef(null)
  const [tile, setTile] = useState({ w: 0, h: 0, ratio: 4 / 3 })
  const feyRef = useRef(fey)
  feyRef.current = fey

  // fit the video tile to the stage, between 3:4 (tall) and 4:3 (wide)
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const fit = () => {
      const W = el.clientWidth - 32
      const H = el.clientHeight - 32
      if (W <= 0 || H <= 0) return
      const ratio = Math.min(4 / 3, Math.max(3 / 4, W / H))
      const w = Math.min(W, H * ratio)
      setTile({ w, h: w / ratio, ratio })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [phase, chatOpen])

  const live = Boolean(cfg.apiKey) || Boolean(serverAI)

  // errors fade out on their own
  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(''), 8000)
    return () => clearTimeout(t)
  }, [error])

  // call timer
  useEffect(() => {
    if (!joinedAt) return
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - joinedAt) / 1000)
      const mm = String(Math.floor(s / 60)).padStart(2, '0')
      const ss = String(s % 60).padStart(2, '0')
      setClock(`${mm}:${ss}`)
    }, 1000)
    return () => clearInterval(id)
  }, [joinedAt])

  // chat auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  const speakReply = (reply) => {
    setLog((l) => [...l, { who: 'fey', text: reply.say }])
    replySayRef.current = reply.say // echo filter: ignore his own voice
    setFey('speaking')
    setCaption('')
    cancelSpeechRef.current = speak(
      reply.say,
      { neuralVoice: cfg.neuralVoice, rate: cfg.rate, elKey: cfg.elKey, elVoice: cfg.elVoice },
      {
        onSentence: (s) => setCaption(s),
        onDone: () => {
          speechEndAtRef.current = Date.now()
          setFey('idle')
          setCaption('')
        },
      },
    )
  }

  const join = () => {
    setPhase('call')
    setJoinedAt(Date.now())
    setHandsFree(true) // open mic like a real call — just start talking
    const opener = { say: topic.demo, board: [] }
    historyRef.current = [
      { role: 'user', content: '(I just joined our video call. Greet me briefly and open today’s curiosity.)' },
      { role: 'assistant', content: JSON.stringify(opener) },
    ]
    setTimeout(() => speakReply(opener), 700)
  }

  const leave = () => {
    setHandsFree(false)
    cancelSpeechRef.current?.()
    stopSpeaking()
    recRef.current?.stop()
    setPhase('join')
    setFey('idle')
    setCaption('')
    setLog([])
    setJoinedAt(null)
    setClock('00:00')
    historyRef.current = []
  }

  const send = async (text) => {
    const t = text.trim()
    if (!t || feyRef.current === 'thinking') return
    cancelSpeechRef.current?.()
    setInput('')
    setError('')
    setCaption('')
    setFey('thinking')
    setLog((l) => [...l, { who: 'you', text: t }])
    historyRef.current.push({ role: 'user', content: t })
    try {
      let reply
      if (live) {
        reply = await chatWithFeynman(historyRef.current, topic.title)
      } else {
        await new Promise((r) => setTimeout(r, 900))
        reply = demoReply()
      }
      historyRef.current.push({ role: 'assistant', content: JSON.stringify(reply) })
      speakReply(reply)
    } catch (e) {
      setFey('idle')
      setError(e.message === 'NO_KEY' ? 'No API key set — open settings.' : e.message)
    }
  }

  const stopTalking = () => {
    cancelSpeechRef.current?.()
    stopSpeaking()
    speechEndAtRef.current = Date.now()
    setFey('idle')
    setCaption('')
  }

  // Hands-free engine: ONE persistent recognizer runs the whole time the mic
  // is on — including while he speaks, so you can interrupt him mid-sentence
  // like a normal conversation (barge-in). His own voice coming back through
  // the speakers is filtered out by matching transcripts against what he is
  // currently saying.
  const replySayRef = useRef('')
  const speechEndAtRef = useRef(0)
  const pendingRef = useRef('')

  // fuzzy token overlap between a transcript and what he's currently saying —
  // exact substring matching fails both ways (drops short user replies,
  // misses imperfectly-recognized echo)
  const tokensOf = (s) => [
    ...((s || '').match(/[一-鿿]/g) || []),
    ...((s || '').toLowerCase().match(/[a-z0-9']+/g) || []),
  ]
  const overlapWithReply = (t) => {
    const rep = new Set(tokensOf(replySayRef.current))
    const toks = tokensOf(t)
    if (!toks.length || !rep.size) return 0
    return toks.filter((w) => rep.has(w)).length / toks.length
  }

  const bargeIn = () => {
    cancelSpeechRef.current?.()
    stopSpeaking()
    speechEndAtRef.current = Date.now()
    setCaption('')
    setFey('listening')
  }

  const startListening = () => {
    if (!handsFreeRef.current || recRef.current) return
    const rec = createRecognizer({
      lang: recLangRef.current,
      continuous: true,
      onInterim: (t) => {
        const st = feyRef.current
        if (st === 'speaking') {
          // clearly-different speech over his voice = you interrupting him;
          // ambiguous overlap is left alone so he doesn't stop himself
          if (tokensOf(t).length >= 2 && overlapWithReply(t) < 0.3) {
            bargeIn()
            setListenText(t)
          }
        } else if (st === 'listening') {
          setListenText(t)
        }
      },
      onResult: (t) => {
        const st = feyRef.current
        if (st === 'speaking') {
          if (overlapWithReply(t) >= 0.3) return // his own voice
          bargeIn()
        } else if (Date.now() - speechEndAtRef.current < 800 && overlapWithReply(t) >= 0.5) {
          return // tail of his audio right after he stopped
        }
        if (st === 'thinking') {
          pendingRef.current = t // he's mid-answer — queue it for right after
          return
        }
        setListenText('')
        send(t)
      },
      onError: (code) => {
        if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(code)) {
          setHandsFree(false)
          setError(micErrorMessage(code))
        }
        // transient errors (no-speech, network blips): onEnd restarts silently
      },
      onEnd: () => {
        recRef.current = null
        if (handsFreeRef.current) {
          setTimeout(() => {
            try {
              startListening()
            } catch {}
          }, 150)
        } else if (feyRef.current === 'listening') {
          setFey('idle')
        }
      },
    })
    if (!rec) {
      setHandsFree(false)
      setError('Voice input isn’t supported in this browser — try Chrome, or type below.')
      return
    }
    recRef.current = rec
    try {
      rec.start()
    } catch {
      recRef.current = null
      return
    }
    if (feyRef.current === 'idle') {
      setFey('listening')
      setCaption('')
      setListenText('')
    }
  }

  const toggleMic = () => {
    setError('')
    setHandsFree((h) => !h)
  }

  // enabling/disabling hands-free
  useEffect(() => {
    if (handsFree) {
      startListening()
    } else {
      const r = recRef.current
      recRef.current = null // prevent the onEnd auto-restart
      r?.stop()
      setListenText('')
      if (feyRef.current === 'listening') setFey('idle')
    }
  }, [handsFree])

  // visual state: mic-on + he's idle = we're listening; flush anything you
  // said while he was thinking
  useEffect(() => {
    if (fey === 'idle' && pendingRef.current) {
      const p = pendingRef.current
      pendingRef.current = ''
      send(p)
      return
    }
    if (handsFree && fey === 'idle' && recRef.current) setFey('listening')
  }, [fey, handsFree])

  // switching input language mid-call restarts the recognizer with the new lang
  useEffect(() => {
    if (handsFreeRef.current && recRef.current) {
      const r = recRef.current
      recRef.current = null
      r?.stop() // onEnd is skipped (ref cleared); restart manually
      setTimeout(startListening, 150)
    }
  }, [recLang])

  useEffect(() => () => stopSpeaking(), [])

  // ---------- join screen ----------
  if (phase === 'join') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0e1013] p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-5 text-center">
          <div className="relative h-44 w-44 overflow-hidden rounded-full ring-2 ring-white/15">
            <img
              src="/feynman1983.jpg"
              alt="Richard Feynman"
              className="absolute w-[260%] max-w-none"
              style={{ left: '-93%', top: '-7%' }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-white">Richard Feynman</h1>
            <p className="mt-1 text-sm text-gray-400">
              AI tribute (1918–1988) · daily one-on-one call · physics or just life
            </p>
          </div>
          <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
            <span className="text-gray-500">Today he’s wondering:</span> {topic.title}
          </div>
          <button
            onClick={join}
            className="w-full rounded-xl bg-emerald-500 py-3.5 text-lg font-semibold text-white transition hover:bg-emerald-400"
          >
            Join call
          </button>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>
              {cfg.apiKey
                ? '● Claude API connected'
                : serverAI
                  ? '● AI connected — real conversation, nothing to configure'
                  : '● Demo mode — add API key in settings'}
            </span>
            <button onClick={() => setShowSettings(true)} className="underline underline-offset-4 hover:text-gray-300">
              Settings
            </button>
          </div>
          <p className="text-[11px] text-gray-600">
            Image: still from “Fun to Imagine” (BBC, 1983) — personal tribute use.
            {cfg.elKey && cfg.elVoice ? ' Voice: ElevenLabs.' : ' Voice: neural TTS (free, no account needed).'}
          </p>
        </div>
        {showSettings && <Settings cfg={cfg} setCfg={setCfg} onClose={() => setShowSettings(false)} />}
      </div>
    )
  }

  // ---------- call screen ----------
  return (
    <div className="flex h-full w-full flex-col bg-[#0e1013]">
      {/* top bar */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/5 px-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="font-medium">Call with Richard Feynman</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] tracking-wide text-gray-400">AI TRIBUTE</span>
        </div>
        <div className="hidden text-sm text-gray-500 md:block">Today: {topic.title}</div>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className={live ? 'text-emerald-300' : 'text-amber-300'}>{live ? 'LIVE' : 'DEMO'}</span>
          <span className="tabular-nums">{clock}</span>
          <button onClick={() => setShowSettings(true)} className="rounded p-1.5 text-gray-400 hover:bg-white/10" title="Settings">
            <GearIcon />
          </button>
        </div>
      </div>

      {/* main area */}
      <div className="flex min-h-0 flex-1">
        {/* stage */}
        <div ref={stageRef} className="relative flex min-w-0 flex-1 items-center justify-center p-4">
          {/* Feynman tile */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-[#181b1f] transition-shadow ${
              fey === 'speaking' ? 'ring-2 ring-emerald-400/80 shadow-[0_0_40px_rgba(52,211,153,0.15)]' : 'ring-1 ring-white/10'
            }`}
            style={{ width: tile.w, height: tile.h }}
          >
            {/* photo fills the tile, cropped to head + chest */}
            <div
              className="pointer-events-none absolute left-1/2 -translate-x-1/2"
              style={{ top: '0', width: tile.ratio < 1 ? '178%' : '100%' }}
            >
              <FeynmanPhoto className="w-full" />
            </div>
            {/* soft vignette */}
            <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 -60px 80px rgba(0,0,0,0.45)' }} />

            {/* name tag */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-black/55 px-3 py-1.5 backdrop-blur-sm">
              {fey === 'speaking' ? <SpeakBars /> : <MicIcon size={14} className="text-gray-300" />}
              <span className="text-sm text-white">Richard Feynman</span>
            </div>

            {/* thinking chip */}
            {fey === 'thinking' && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/55 px-4 py-2 backdrop-blur-sm">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="thinking-dot h-2 w-2 rounded-full bg-gray-300" />
                ))}
              </div>
            )}

            {/* captions */}
            {captionsOn && caption && (
              <div className="absolute bottom-14 left-1/2 w-[88%] -translate-x-1/2 text-center">
                <p
                  key={caption}
                  className="caption-in inline-block rounded-xl bg-black/65 px-5 py-3 text-white backdrop-blur-sm"
                  style={{ fontSize: 'clamp(1.05rem, 1.6vw, 1.7rem)', lineHeight: 1.4 }}
                >
                  {caption}
                </p>
              </div>
            )}

            {/* live transcription while the mic is open */}
            {fey === 'listening' && (
              <div className="absolute bottom-14 left-1/2 w-[88%] -translate-x-1/2 text-center">
                <p
                  className="inline-flex items-center gap-2.5 rounded-xl bg-black/70 px-5 py-3 backdrop-blur-sm"
                  style={{ fontSize: 'clamp(1.05rem, 1.6vw, 1.7rem)', lineHeight: 1.4 }}
                >
                  <span className="mic-live h-3 w-3 shrink-0 rounded-full bg-red-500" />
                  {listenText ? (
                    <span className="text-white">{listenText}</span>
                  ) : (
                    <span className="text-gray-400">
                      {recLang === 'zh-CN' ? '免提已开——直接说话就行' : 'Mic is open — just talk'}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* self view */}
          <div
            className={`absolute bottom-6 right-6 flex h-28 w-44 flex-col items-center justify-center gap-1.5 rounded-xl bg-[#1c2026] ${
              fey === 'listening' ? 'ring-2 ring-red-400/80' : 'ring-1 ring-white/10'
            }`}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/80 text-lg font-semibold text-white">
              You
            </div>
            <span className="text-[11px] text-gray-400">
              {fey === 'listening' ? 'mic open' : handsFree ? 'mic paused' : 'muted'}
            </span>
          </div>
        </div>

        {/* chat panel */}
        {chatOpen && (
          <div className="flex w-80 shrink-0 flex-col border-l border-white/5 bg-[#121417]">
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/5 px-4">
              <span className="text-sm font-medium text-gray-200">In-call messages</span>
              <button onClick={() => setChatOpen(false)} className="text-gray-500 hover:text-gray-300">
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {log.length === 0 && (
                <p className="text-sm text-gray-600">The conversation transcript shows up here.</p>
              )}
              {log.map((m, i) => (
                <div key={i}>
                  <div className={`text-[11px] font-medium ${m.who === 'fey' ? 'text-emerald-300' : 'text-indigo-300'}`}>
                    {m.who === 'fey' ? 'Richard Feynman' : 'You'}
                  </div>
                  <div className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">{m.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* demo-mode notice — canned replies don't understand you */}
      {!live && (
        <div className="shrink-0 border-t border-white/5 bg-amber-400/10 px-4 py-2 text-center text-[13px] text-amber-100">
          ⚠️ Demo mode: these are pre-written lines — he can’t actually understand what you say.
          Add your Claude API key in ⚙ Settings (top right) for a real conversation that follows
          context. 演示模式回复是预置台词，填入 API key 后才是真实对话。
        </div>
      )}

      {/* control bar */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-t border-white/5 px-4">
        <button
          onClick={toggleMic}
          title={handsFree ? 'Hands-free voice is ON — click to mute' : 'Unmute — hands-free voice chat'}
          className={`flex h-11 shrink-0 items-center justify-center gap-2 rounded-full px-4 transition ${
            handsFree
              ? fey === 'listening'
                ? 'mic-live bg-red-500 text-white'
                : 'bg-emerald-600/80 text-white'
              : 'bg-white/10 text-gray-200 hover:bg-white/20'
          }`}
        >
          <MicIcon size={18} />
          <span className="text-xs font-medium">{handsFree ? 'On' : 'Muted'}</span>
        </button>
        <button
          onClick={() => setRecLang((l) => (l === 'en-US' ? 'zh-CN' : 'en-US'))}
          title="Voice input language"
          className="shrink-0 rounded-full bg-white/5 px-2.5 py-1.5 text-xs text-gray-400 hover:bg-white/10"
        >
          {recLang === 'en-US' ? 'EN' : '中'}
        </button>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex min-w-0 flex-1 items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={fey === 'thinking' ? 'He’s thinking…' : 'Say something, or type here…'}
            disabled={fey === 'thinking'}
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-[15px] text-white placeholder-gray-500 outline-none focus:border-emerald-400/50"
          />
          {fey === 'speaking' ? (
            <button
              type="button"
              onClick={stopTalking}
              className="shrink-0 rounded-full bg-white/10 px-5 py-2.5 text-sm text-white hover:bg-white/20"
            >
              ■ Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || fey === 'thinking'}
              className="shrink-0 rounded-full bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-30"
            >
              Send
            </button>
          )}
        </form>
        <button
          onClick={() => setCaptionsOn((c) => !c)}
          title="Toggle captions"
          className={`shrink-0 rounded-full px-3 py-2 text-xs ${captionsOn ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-500'} hover:bg-white/20`}
        >
          CC
        </button>
        <button
          onClick={() => setChatOpen((c) => !c)}
          title="Toggle chat"
          className={`shrink-0 rounded-full px-3 py-2 text-xs ${chatOpen ? 'bg-white/15 text-white' : 'bg-white/5 text-gray-500'} hover:bg-white/20`}
        >
          Chat
        </button>
        <button
          onClick={leave}
          title="Leave call"
          className="shrink-0 rounded-full bg-red-500/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-400"
        >
          Leave
        </button>
      </div>

      {error && (
        <div className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-red-900/85 px-4 py-2 text-sm text-red-100">
          {error}
        </div>
      )}

      {showSettings && <Settings cfg={cfg} setCfg={setCfg} onClose={() => setShowSettings(false)} />}
    </div>
  )
}

function SpeakBars() {
  return (
    <span className="flex h-3.5 items-end gap-[2px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="speak-bar w-[3px] rounded-sm bg-emerald-400"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  )
}

function Settings({ cfg, setCfg, onClose }) {
  const [apiKey, setApiKey] = useState(cfg.apiKey)
  const [model, setModel] = useState(cfg.model)
  const [neuralVoice, setNeuralVoice] = useState(cfg.neuralVoice)
  const [rate, setRate] = useState(cfg.rate)
  const [elKey, setElKey] = useState(cfg.elKey)
  const [elVoice, setElVoice] = useState(cfg.elVoice)

  const save = () => {
    setConfig({ apiKey, model })
    localStorage.setItem('fy_neural_voice', neuralVoice)
    localStorage.setItem('fy_rate', String(rate))
    localStorage.setItem('fy_el_key', elKey)
    localStorage.setItem('fy_el_voice', elVoice)
    setCfg({ apiKey, model, neuralVoice, rate, elKey, elVoice })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#16181c] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-white">Settings</h2>
        <label className="mb-1 block text-sm text-gray-300">
          Claude API key <span className="text-gray-500">(stored locally; blank = demo mode)</span>
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-…"
          className="mb-4 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-gray-100 outline-none focus:border-emerald-400/50"
        />
        <label className="mb-1 block text-sm text-gray-300">Model</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-100 outline-none"
        >
          <option value="claude-sonnet-5">Sonnet 5 (recommended)</option>
          <option value="claude-opus-5">Opus 5 (deepest)</option>
          <option value="claude-haiku-4-5-20251001">Haiku 4.5 (fastest)</option>
        </select>
        <label className="mb-1 block text-sm text-gray-300">
          Voice <span className="text-gray-500">(neural, free — Chinese switches automatically)</span>
        </label>
        <select
          value={neuralVoice}
          onChange={(e) => setNeuralVoice(e.target.value)}
          className="mb-4 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-100 outline-none"
        >
          {NEURAL_VOICES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
        <label className="mb-1 block text-sm text-gray-300">Speaking rate: {rate.toFixed(2)}</label>
        <input
          type="range"
          min="0.7"
          max="1.4"
          step="0.05"
          value={rate}
          onChange={(e) => setRate(parseFloat(e.target.value))}
          className="mb-5 w-full accent-emerald-400"
        />
        <div className="mb-4 border-t border-white/10 pt-4">
          <div className="mb-2 text-sm font-medium text-gray-200">
            Natural voice via ElevenLabs <span className="font-normal text-gray-500">(optional)</span>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-gray-500">
            System voices can’t match Feynman. With an ElevenLabs account, design a raspy, energetic
            New-York-accent voice at elevenlabs.io, then paste your API key and that voice’s ID here —
            it replaces the system voice automatically.
          </p>
          <input
            type="password"
            value={elKey}
            onChange={(e) => setElKey(e.target.value)}
            placeholder="ElevenLabs API key"
            className="mb-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-gray-100 outline-none focus:border-emerald-400/50"
          />
          <input
            type="text"
            value={elVoice}
            onChange={(e) => setElVoice(e.target.value)}
            placeholder="Voice ID (e.g. pNInz6obpgDQGcFmaJgB)"
            className="mb-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-gray-100 outline-none focus:border-emerald-400/50"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-gray-400 hover:text-gray-200">
            Cancel
          </button>
          <button
            onClick={save}
            className="rounded-lg bg-emerald-500 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function MicIcon({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
