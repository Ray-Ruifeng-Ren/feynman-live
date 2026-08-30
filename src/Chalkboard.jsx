// Chalk text area: today's curiosity as the headline, plus the key
// phrases of whatever he's currently explaining, chalk-written.

const TILTS = [-1.5, 1, -0.8, 1.6]

export default function Chalkboard({ topicTitle, phrases }) {
  return (
    <div className="flex h-full flex-col justify-start gap-2 select-none">
      <div className="font-chalk text-[1.35rem] tracking-wide text-emerald-100/60">
        Today&rsquo;s curiosity
      </div>
      <h1
        className="font-chalk leading-[1.1] text-white/90"
        style={{
          fontSize: 'clamp(2.2rem, 3.8vw, 4rem)',
          textShadow: '0 0 14px rgba(255,255,255,0.14)',
        }}
      >
        {topicTitle}
      </h1>
      <div className="mt-1 h-[3px] w-40 rounded bg-white/25" />

      <div className="mt-8 flex flex-col gap-5">
        {phrases.map((p, i) => (
          <div
            key={`${p}-${i}`}
            className="chalk-in font-chalk text-amber-100/90"
            style={{
              fontSize: 'clamp(1.8rem, 2.6vw, 3rem)',
              transform: `rotate(${TILTS[i % TILTS.length]}deg)`,
              animationDelay: `${i * 0.55}s`,
              textShadow: '0 0 10px rgba(255,235,190,0.12)',
            }}
          >
            <span className="mr-3 text-white/40">{'›'}</span>
            {p}
          </div>
        ))}
      </div>
    </div>
  )
}

// Little chalk atom doodle for the corner of the board.
export function AtomDoodle({ className }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <g fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
        <ellipse cx="50" cy="50" rx="38" ry="14" />
        <ellipse cx="50" cy="50" rx="38" ry="14" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="38" ry="14" transform="rotate(120 50 50)" />
      </g>
      <circle cx="50" cy="50" r="5" fill="rgba(255,255,255,0.55)" />
    </svg>
  )
}
