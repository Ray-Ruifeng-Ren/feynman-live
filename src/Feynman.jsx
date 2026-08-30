import { useEffect, useRef, useState } from 'react'

// Painterly portrait of Richard Feynman modeled on the 1983 "Fun to Imagine"
// interview: high forehead, receded temples, brown-gray hair swept back with
// volume over the ears, hooded eyes, long nose, wide thin-lipped grin, deep
// smile folds, light-blue open-collar shirt. Key light from upper-left.
// state: 'idle' | 'thinking' | 'speaking' | 'listening'

export default function Feynman({ state = 'idle', className = '' }) {
  const speaking = state === 'speaking'
  const thinking = state === 'thinking'
  const listening = state === 'listening'

  const [blink, setBlink] = useState(false)
  const [viseme, setViseme] = useState(0)
  const [gaze, setGaze] = useState({ x: 0, y: 0 })
  const timers = useRef([])

  // blinks
  useEffect(() => {
    let alive = true
    const loop = () => {
      const t = setTimeout(() => {
        if (!alive) return
        setBlink(true)
        const t2 = setTimeout(() => {
          if (!alive) return
          setBlink(false)
          loop()
        }, 140)
        timers.current.push(t2)
      }, 2000 + Math.random() * 3500)
      timers.current.push(t)
    }
    loop()
    return () => {
      alive = false
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [])

  // eye saccades — tiny wandering; straight at you while listening
  useEffect(() => {
    if (listening) {
      setGaze({ x: 0, y: 0 })
      return
    }
    if (thinking) {
      setGaze({ x: 5, y: -4 })
      return
    }
    let alive = true
    const loop = () => {
      const t = setTimeout(() => {
        if (!alive) return
        setGaze({ x: (Math.random() - 0.5) * 4, y: (Math.random() - 0.5) * 2.5 })
        loop()
      }, 1400 + Math.random() * 2600)
      timers.current.push(t)
    }
    loop()
    return () => {
      alive = false
    }
  }, [thinking, listening])

  // mouth while speaking
  useEffect(() => {
    if (!speaking) {
      setViseme(0)
      return
    }
    let alive = true
    const cycle = () => {
      if (!alive) return
      setViseme((v) => {
        const options = [0, 1, 1, 2, 2, 3].filter((o) => o !== v)
        return options[Math.floor(Math.random() * options.length)]
      })
      const t = setTimeout(cycle, 85 + Math.random() * 90)
      timers.current.push(t)
    }
    cycle()
    return () => {
      alive = false
    }
  }, [speaking])

  const browLift = thinking ? -9 : listening ? -5 : speaking ? -2 : 0

  return (
    <svg viewBox="0 0 600 760" className={className} role="img" aria-label="Portrait of Richard Feynman, animated">
      <defs>
        <radialGradient id="fskin" cx="0.44" cy="0.36" r="0.78">
          <stop offset="0%" stopColor="#eec39c" />
          <stop offset="55%" stopColor="#dfa87c" />
          <stop offset="100%" stopColor="#bd855c" />
        </radialGradient>
        <linearGradient id="fhair" x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#a5988a" />
          <stop offset="50%" stopColor="#84776a" />
          <stop offset="100%" stopColor="#5f544a" />
        </linearGradient>
        <linearGradient id="fshirt" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#dfeaf2" />
          <stop offset="55%" stopColor="#b9d0e0" />
          <stop offset="100%" stopColor="#8fafc5" />
        </linearGradient>
        <radialGradient id="firis" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0%" stopColor="#5f4226" />
          <stop offset="70%" stopColor="#402a15" />
          <stop offset="100%" stopColor="#28190c" />
        </radialGradient>
        <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id="soft2" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <filter id="soft4" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      <g className="anim-breathe">
        {/* ================= shoulders / light-blue shirt ================= */}
        <path
          d="M56,760 C60,668 94,606 168,580 C212,564 256,556 300,556 C344,556 388,564 432,580 C506,606 540,668 544,760 Z"
          fill="url(#fshirt)"
        />
        {/* shirt folds + shadow under collar */}
        <path d="M178,596 C228,630 372,630 422,596 C402,658 360,688 300,688 C240,688 198,658 178,596 Z" fill="#5f83a0" opacity="0.3" filter="url(#soft)" />
        <path d="M146,648 C158,700 168,730 176,758 L146,758 Z" fill="#7396af" opacity="0.5" filter="url(#soft4)" />
        <path d="M454,648 C442,700 432,730 424,758 L454,758 Z" fill="#7396af" opacity="0.5" filter="url(#soft4)" />
        <path d="M242,700 C246,724 250,744 252,758 M358,700 C354,724 350,744 348,758" stroke="#7d9fb8" strokeWidth="5" fill="none" opacity="0.5" filter="url(#soft4)" />
        {/* open collar */}
        <path d="M300,560 L232,580 L280,652 L300,596 Z" fill="#eef4f8" />
        <path d="M300,560 L368,580 L320,652 L300,596 Z" fill="#d8e5ee" />
        <path d="M232,580 L280,652 L300,596 Z" fill="#5f83a0" opacity="0.22" filter="url(#soft2)" />
        {/* chest V of skin */}
        <path d="M280,652 L300,596 L320,652 L300,684 Z" fill="#c08c60" opacity="0.6" />
        {/* buttons */}
        <circle cx="300" cy="706" r="4" fill="#f2f6f9" stroke="#8fafc5" strokeWidth="1.5" />
        <circle cx="300" cy="744" r="4" fill="#f2f6f9" stroke="#8fafc5" strokeWidth="1.5" />

        {/* ================= neck ================= */}
        <path d="M250,466 L350,466 L354,576 C354,602 246,602 246,576 Z" fill="url(#fskin)" />
        <path d="M250,466 L350,466 L348,520 C316,538 284,538 252,520 Z" fill="#9c6636" opacity="0.5" filter="url(#soft)" />
        {/* throat lines */}
        <path d="M276,540 C292,548 308,548 324,540" stroke="#a9713f" strokeWidth="3" fill="none" opacity="0.4" filter="url(#soft2)" />

        {/* ================= head ================= */}
        <g className={speaking ? 'anim-head-talk' : 'anim-head'}>
          {/* hair — back/side mass, long over the ears like the interview */}
          <path
            d="M162,390 C142,250 188,86 300,82 C412,86 458,250 438,390 C444,428 428,458 412,438 C400,392 398,348 396,300 L204,300 C202,348 200,392 188,438 C172,458 156,428 162,390 Z"
            fill="url(#fhair)"
          />
          {/* darker under-mass at the sides (depth behind jaw) */}
          <path d="M188,320 C184,370 184,410 192,436 C200,420 202,370 202,330 Z" fill="#4e453c" opacity="0.8" />
          <path d="M412,320 C416,370 416,410 408,436 C400,420 398,370 398,330 Z" fill="#463e35" opacity="0.85" />

          {/* face — longer, leaner */}
          <path
            d="M198,300 C196,240 204,190 226,160 C248,132 272,120 300,120 C328,120 352,132 374,160 C396,190 404,240 402,300 C400,358 390,406 370,442 C350,476 326,496 300,496 C274,496 250,476 230,442 C210,406 200,358 198,300 Z"
            fill="url(#fskin)"
          />

          {/* --- shading --- */}
          <path d="M208,270 C204,330 212,390 234,436 C216,396 206,336 208,270 Z" fill="#9c6636" opacity="0.5" filter="url(#soft)" />
          <path d="M392,270 C396,330 388,390 366,436 C386,398 396,336 392,270 Z" fill="#8a5527" opacity="0.55" filter="url(#soft)" />
          {/* gaunt cheek hollows */}
          <path d="M222,356 C238,384 254,396 272,400 C250,408 228,394 222,356 Z" fill="#9c6636" opacity="0.55" filter="url(#soft)" />
          <path d="M378,356 C362,384 346,396 328,400 C350,408 372,394 378,356 Z" fill="#8a5527" opacity="0.6" filter="url(#soft)" />
          {/* eye sockets */}
          <ellipse cx="250" cy="286" rx="36" ry="17" fill="#a56c34" opacity="0.4" filter="url(#soft)" />
          <ellipse cx="350" cy="286" rx="36" ry="17" fill="#9a6230" opacity="0.45" filter="url(#soft)" />
          {/* highlights — restrained */}
          <ellipse cx="280" cy="196" rx="48" ry="26" fill="#ffdfb4" opacity="0.3" filter="url(#soft)" />
          <ellipse cx="248" cy="336" rx="20" ry="13" fill="#ffd9ac" opacity="0.28" filter="url(#soft)" />
          {/* jaw/chin shading */}
          <path d="M262,456 C284,472 316,472 338,456 C326,482 274,482 262,456 Z" fill="#9c6636" opacity="0.4" filter="url(#soft)" />

          {/* tall-forehead lines */}
          <g opacity="0.45" filter="url(#soft2)" transform={`translate(0 ${browLift * 0.5})`}>
            <path d="M240,178 C264,169 336,169 360,178" stroke="#9c6636" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M234,202 C262,192 338,192 366,202" stroke="#9c6636" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M240,226 C266,218 334,218 360,226" stroke="#9c6636" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>

          {/* ================= eyes — smaller, hooded ================= */}
          <g transform={`translate(0 ${browLift * 0.35})`}>
            {!blink ? (
              <g>
                {/* whites */}
                <path d="M224,290 C232,279 248,274 262,277 C272,280 278,286 280,291 C272,299 256,303 244,300 C234,298 227,295 224,290 Z" fill="#f1e9db" />
                <path d="M376,290 C368,279 352,274 338,277 C328,280 322,286 320,291 C328,299 344,303 356,300 C366,298 373,295 376,290 Z" fill="#ede4d4" />
                {/* iris + pupil */}
                <g transform={`translate(${gaze.x} ${gaze.y})`}>
                  <circle cx="252" cy="289" r="10" fill="url(#firis)" />
                  <circle cx="348" cy="289" r="10" fill="url(#firis)" />
                  <circle cx="252" cy="289" r="4.2" fill="#100905" />
                  <circle cx="348" cy="289" r="4.2" fill="#100905" />
                  <circle cx="249" cy="285.5" r="2.1" fill="#fff" opacity="0.95" />
                  <circle cx="345" cy="285.5" r="2.1" fill="#fff" opacity="0.95" />
                </g>
                {/* heavy hooded upper lids */}
                <path d="M222,289 C230,275 250,268 266,273 C275,276 280,282 281,289 C277,279 266,275 254,275 C240,275 229,281 222,289 Z" fill="#cb9265" />
                <path d="M378,289 C370,275 350,268 334,273 C325,276 320,282 319,289 C323,279 334,275 346,275 C360,275 371,281 378,289 Z" fill="#bf8757" />
                {/* upper lash lines */}
                <path d="M225,289 C236,279 254,275 268,279 C275,281 279,285 281,290" stroke="#54331b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
                <path d="M375,289 C364,279 346,275 332,279 C325,281 321,285 319,290" stroke="#54331b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                <path d="M224,288 C238,283 264,283 280,290 C264,294 238,294 224,288 Z" fill="#cb9265" />
                <path d="M376,288 C362,283 336,283 320,290 C336,294 362,294 376,288 Z" fill="#bf8757" />
                <path d="M226,290 C242,294 264,295 279,291" stroke="#54331b" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                <path d="M374,290 C358,294 336,295 321,291" stroke="#54331b" strokeWidth="2.8" fill="none" strokeLinecap="round" />
              </g>
            )}
            {/* lid creases + bags */}
            <path d="M226,272 C240,262 260,260 276,266" stroke="#9c6636" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.55" filter="url(#soft2)" />
            <path d="M374,272 C360,262 340,260 324,266" stroke="#9c6636" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.55" filter="url(#soft2)" />
            <path d="M230,304 C244,312 262,313 276,308" stroke="#a56c34" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.5" filter="url(#soft2)" />
            <path d="M370,304 C356,312 338,313 324,308" stroke="#a56c34" strokeWidth="3.2" fill="none" strokeLinecap="round" opacity="0.5" filter="url(#soft2)" />
            {/* crow's feet */}
            <path d="M216,286 C210,292 208,300 210,308 M212,284 C206,288 203,294 202,301" stroke="#9c6636" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.5" filter="url(#soft2)" />
            <path d="M384,286 C390,292 392,300 390,308 M388,284 C394,288 397,294 398,301" stroke="#9c6636" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.5" filter="url(#soft2)" />
          </g>

          {/* eyebrows — thicker, flatter, gray-brown */}
          <g transform={`translate(0 ${browLift})`}>
            <path d="M216,258 C232,246 260,242 282,247 C287,249 288,256 283,258 C260,254 236,257 220,266 C214,268 212,262 216,258 Z" fill="#5f5346" />
            <path d="M384,258 C368,246 340,242 318,247 C313,249 312,256 317,258 C340,254 364,257 380,266 C386,268 388,262 384,258 Z" fill="#574c40" />
            <path d="M226,254 C240,248 258,246 272,248 M232,261 C246,255 262,254 274,256" stroke="#736657" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9" />
            <path d="M374,254 C360,248 342,246 328,248 M368,261 C354,255 338,254 326,256" stroke="#6b5f50" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.9" />
          </g>

          {/* ================= nose — long, strong ================= */}
          <path d="M310,258 C316,292 322,326 330,352 C326,364 318,370 308,372" stroke="#9a6230" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.45" filter="url(#soft4)" />
          <path d="M294,252 C294,288 293,322 291,346" stroke="#ffdfb4" strokeWidth="8" fill="none" strokeLinecap="round" opacity="0.45" filter="url(#soft4)" />
          {/* tip + wings */}
          <path d="M274,352 C267,363 267,374 276,381 C285,388 296,390 300,390 C304,390 315,388 324,381 C333,374 333,363 326,352 C319,343 308,339 300,339 C292,339 281,343 274,352 Z" fill="#e2a879" opacity="0.9" />
          <path d="M269,364 C262,358 258,365 263,374 C267,381 276,385 281,380 C283,373 276,369 269,364 Z" fill="#d69c6f" />
          <path d="M331,364 C338,358 342,365 337,374 C333,381 324,385 319,380 C317,373 324,369 331,364 Z" fill="#c98f62" />
          {/* nostrils */}
          <ellipse cx="282" cy="379" rx="6.5" ry="4" fill="#6f421f" transform="rotate(20 282 379)" />
          <ellipse cx="318" cy="379" rx="6.5" ry="4" fill="#6f421f" transform="rotate(-20 318 379)" />
          <path d="M278,392 C292,398 308,398 322,392" stroke="#9c6636" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.4" filter="url(#soft2)" />
          <ellipse cx="295" cy="362" rx="8" ry="6" fill="#ffe4bd" opacity="0.5" filter="url(#soft2)" />

          {/* deep nasolabial folds */}
          <path d="M266,360 C246,384 236,406 234,430 M334,360 C354,384 364,406 366,430" stroke="#8a5527" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" filter="url(#soft2)" />
          {/* marionette hints */}
          <path d="M240,432 C238,446 240,458 246,468 M360,432 C362,446 360,458 354,468" stroke="#9c6636" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.45" filter="url(#soft2)" />

          {/* ================= mouth — wide, thin lips ================= */}
          <Mouth viseme={viseme} />

          {/* chin crease */}
          <path d="M280,464 C292,459 308,459 320,464" stroke="#9c6636" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.45" filter="url(#soft2)" />

          {/* ================= front hair — high forehead, receded temples ================= */}
          <path
            d="M204,320 C200,244 210,182 238,158 C260,140 280,132 300,132 C320,132 340,140 362,158 C390,182 400,244 396,320 C396,254 386,208 368,188 C372,202 370,212 362,216 C352,192 336,178 318,172 C322,184 320,194 312,198 C298,180 278,172 260,176 C264,188 260,198 250,200 C238,196 228,202 224,218 C214,246 206,282 204,320 Z"
            fill="url(#fhair)"
          />
          {/* unruly strands + silver streaks */}
          <g fill="none" strokeLinecap="round">
            <path d="M226,232 C238,182 268,150 304,144" stroke="#c9beb0" strokeWidth="4" opacity="0.9" />
            <path d="M214,280 C220,222 248,174 288,158" stroke="#6b5f52" strokeWidth="3.5" opacity="0.9" />
            <path d="M262,180 C288,158 320,152 348,162" stroke="#cfc5b8" strokeWidth="3.5" opacity="0.85" />
            <path d="M330,172 C356,184 376,210 386,246" stroke="#6b5f52" strokeWidth="3.5" opacity="0.9" />
            <path d="M346,162 C372,180 390,214 396,258" stroke="#b8ad9e" strokeWidth="3" opacity="0.8" />
            <path d="M176,340 C172,280 178,220 198,178" stroke="#b3a898" strokeWidth="4" opacity="0.85" />
            <path d="M424,340 C428,280 422,220 402,178" stroke="#544a40" strokeWidth="4" opacity="0.9" />
            <path d="M168,392 C162,340 164,280 180,230" stroke="#8d8172" strokeWidth="3" opacity="0.8" />
            <path d="M432,392 C438,340 436,280 420,230" stroke="#635749" strokeWidth="3" opacity="0.8" />
            <path d="M186,430 C180,400 178,360 180,326" stroke="#a296856" strokeWidth="3" opacity="0.7" />
            <path d="M414,430 C420,400 422,360 420,326" stroke="#57" strokeWidth="3" opacity="0.7" />
          </g>
          {/* wisps at the crown */}
          <path d="M258,142 C270,128 288,122 300,124 M310,126 C326,120 344,124 354,134" stroke="#9a8e7f" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
        </g>
      </g>
    </svg>
  )
}

// Wide, thin-lipped mouth: closed grin + 3 open visemes.
function Mouth({ viseme }) {
  if (viseme === 1) {
    return (
      <g>
        <path d="M248,416 C278,428 322,428 352,416 C348,440 326,450 300,450 C274,450 252,440 248,416 Z" fill="#38201a" />
        <path d="M254,419 C280,429 320,429 346,419 L342,431 C320,439 280,439 258,431 Z" fill="#efe6d2" />
        <path d="M248,416 C278,428 322,428 352,416 C322,421 278,421 248,416 Z" fill="#a2593c" />
        <path d="M260,446 C282,454 318,454 340,446 C324,456 276,456 260,446 Z" fill="#b96e50" />
      </g>
    )
  }
  if (viseme === 2) {
    return (
      <g>
        <path d="M244,412 C278,426 322,426 356,412 C352,452 328,468 300,468 C272,468 248,452 244,412 Z" fill="#301a15" />
        <path d="M252,416 C280,428 320,428 348,416 L344,433 C320,443 280,443 256,433 Z" fill="#efe6d2" />
        <path d="M270,458 C288,464 312,464 330,458 L328,450 C312,455 288,455 272,450 Z" fill="#ddd2ba" opacity="0.85" />
        <path d="M244,412 C278,426 322,426 356,412 C322,419 278,419 244,412 Z" fill="#9a5438" />
        <path d="M264,464 C286,472 314,472 336,464 C318,474 282,474 264,464 Z" fill="#b96e50" />
      </g>
    )
  }
  if (viseme === 3) {
    return (
      <g>
        <path d="M234,414 C278,430 322,430 366,414 C360,446 330,458 300,458 C270,458 240,446 234,414 Z" fill="#38201a" />
        <path d="M242,417 C280,430 320,430 358,417 L354,433 C320,443 280,443 246,433 Z" fill="#efe6d2" />
        <path d="M234,414 C278,430 322,430 366,414 C322,422 278,422 234,414 Z" fill="#a2593c" />
        <path d="M250,452 C278,461 322,461 350,452 C326,462 274,462 250,452 Z" fill="#b96e50" />
      </g>
    )
  }
  // closed — wide, thin-lipped grin
  return (
    <g>
      <path d="M238,416 C264,430 336,430 362,416" stroke="#61361e" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* corner tucks */}
      <path d="M238,416 C233,413 230,409 229,405 M362,416 C367,413 370,409 371,405" stroke="#8a5527" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.7" />
      {/* upper lip shadow */}
      <path d="M248,411 C274,422 326,422 352,411" stroke="#a56c34" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.5" filter="url(#soft2)" />
      {/* thin lower lip */}
      <path d="M262,432 C284,441 316,441 338,432" stroke="#c47a55" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.8" filter="url(#soft2)" />
      <ellipse cx="300" cy="436" rx="24" ry="6" fill="#ffd4a4" opacity="0.28" filter="url(#soft2)" />
      {/* under-lip shadow */}
      <path d="M272,446 C290,452 310,452 328,446" stroke="#9c6636" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.45" filter="url(#soft2)" />
    </g>
  )
}
