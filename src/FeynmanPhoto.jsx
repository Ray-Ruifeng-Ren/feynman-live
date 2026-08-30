// Static portrait: Richard Feynman in his armchair, mid-explanation — still
// from the BBC interview "Fun to Imagine" (1983), the exact look the user
// asked for. No facial animation by user preference — the call UI's
// active-speaker glow and audio bars carry the "he's talking" signal.

const SRC = '/feynman1983.jpg'

export default function FeynmanPhoto({ className = '' }) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        aspectRatio: '4 / 3',
        filter: 'contrast(1.03) saturate(1.05)',
      }}
    >
      <img
        src={SRC}
        alt="Richard Feynman in the 1983 BBC interview 'Fun to Imagine'"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
        draggable={false}
      />
    </div>
  )
}
