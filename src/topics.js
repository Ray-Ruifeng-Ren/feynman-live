// A rotating shelf of Feynman-flavored daily curiosities.
// One is picked deterministically per calendar day.

export const TOPICS = [
  {
    title: 'Why do mirrors flip left and right, but not up and down?',
    board: ['mirror symmetry', 'front ↔ back', 'it flips YOU'],
    demo: "Here's one that drives people crazy. A mirror swaps left and right, but never up and down — why would it care about direction? Well, here's the trick: it doesn't swap left and right at all. It swaps front and back. You imagine yourself walking around behind the glass, and THAT's where the flip sneaks in. Try it — point north in a mirror, you both point north! So — what do you think the mirror actually reverses?",
  },
  {
    title: 'What is fire, really?',
    board: ['stored sunlight', 'carbon + oxygen', 'light let loose'],
    demo: "You ever look at a campfire and ask what that stuff actually IS? A tree grows by yanking carbon out of the air — using sunlight to pry it off the oxygen. That takes energy, and the energy gets stored in the wood. Light a match, and the carbon and oxygen snap back together — and out comes the light and heat that came from the sun! Fire is stored sunshine, pouring back out. Isn't that something?",
  },
  {
    title: 'Why does a rubber band snap back?',
    board: ['jiggling chains', 'heat = motion', 'entropy pulls'],
    demo: "Stretch a rubber band against your lip — it gets warm! Rubber is a tangle of long jiggling chains. Stretch it, the chains straighten out; let go, and the jiggling — plain old heat — kicks them back into a tangle. It's not a little spring in there. It's chaos, pulling. The band snaps back because disorder is more likely than order. Now hold on — if stretching makes it warm, what happens when it snaps back?",
  },
  {
    title: 'How does a train stay on the track?',
    board: ['no flange trick', 'cone-shaped wheels', 'self-correcting'],
    demo: "Everybody thinks the flanges keep a train on the rails. Nope! The wheels are cones — fatter toward the inside. Drift right, and the right wheel rides a bigger circle, the left a smaller one, and since they're locked on one axle, the whole thing steers itself back. It's self-correcting! The flange is just there for emergencies. Isn't it wonderful when the answer's cleverer than the question?",
  },
  {
    title: 'Where does a tree get its stuff?',
    board: ['trees come from AIR', 'CO₂ → carbon', 'water + light'],
    demo: "People think trees come out of the ground. But weigh the dirt around an oak — it barely loses anything! The substance of the tree comes out of the AIR. Carbon dioxide floats in, the tree splits it with sunlight, keeps the carbon, breathes the oxygen back out. A tree is air, knitted together by light. Next time you lean on one, you're leaning on sky.",
  },
  {
    title: 'What is heat?',
    board: ['atoms jiggling', 'temperature = speed', 'cold = slow'],
    demo: "Heat isn't a fluid, it isn't a thing you pour — it's motion. The atoms in this desk are jiggling like mad right now. Warm it up, they jiggle faster. Cool it down, slower. Freeze it near absolute zero and they nearly stand still — nearly! That's all temperature is: how hard the atoms are dancing. And once you see it that way, half of physics falls open like a book.",
  },
  {
    title: 'Why is the sky blue — and the sunset red?',
    board: ['light scatters', 'blue bounces most', 'sunset = leftovers'],
    demo: "Sunlight looks white, but it's every color mixed. Air molecules knock the blue around much more than the red — so blue light bounces all over the sky before reaching your eye. That scattered blue IS the sky! And at sunset, the light comes through so much air that the blue's all scattered away — you get the leftovers. Red. The sunset is the sky's blue, subtracted. Beautiful bookkeeping, right?",
  },
  {
    title: 'Why does ice float?',
    board: ['water is weird', 'crystals leave gaps', 'lakes freeze DOWN'],
    demo: "Almost everything shrinks when it freezes. Water expands! The molecules link up into an open, holey crystal — like scaffolding with rooms in it. So ice is lighter than water, and it floats. And that little oddity matters: lakes freeze from the top down, and the fish spend winter swimming under the roof. A tiny quirk of geometry keeps whole ecosystems alive. I love that.",
  },
  {
    title: 'How can a magnet push without touching?',
    board: ['what is "touching"?', 'fields everywhere', 'why-questions go deep'],
    demo: "People ask me: how does a magnet push through empty space? But wait — when your hand pushes a chair, what's touching? The atoms never touch! It's electric repulsion all the way down. So the magnet isn't the weird one — ALL pushing is action at a distance. The mystery isn't the magnet; it's that you thought ordinary touching was ordinary. Why-questions are wonderful like that — every answer opens another door.",
  },
  {
    title: 'Why does a spinning plate wobble?',
    board: ['Cornell cafeteria', 'wobble : spin = 2 : 1', 'play matters'],
    demo: "One day in the Cornell cafeteria a guy tossed a plate in the air. The medallion on it spun, but the plate also wobbled — and the wobble went around twice as fast as the spin. I worked out why, just for fun. People said, what's the importance? None! But that piddling around with the wobbling plate led me straight back into the physics that eventually won the Nobel Prize. Moral: follow what's fun.",
  },
  {
    title: 'What is the atom in a drop of wine?',
    board: ['a glass of wine', 'all of physics in it', 'look closely enough'],
    demo: "A poet once said the whole universe is in a glass of wine. He's right! Look closely: the liquid evaporates depending on the wind and weather — physics. The glass, a distillation of Earth's rocks. The ferment, life's chemistry. The light glinting — optics, atoms. If our small minds divide it into physics, biology, geology — remember, nature doesn't know the difference! Drink it up, and enjoy the whole thing at once.",
  },
  {
    title: 'Why can’t you see atoms — and how do we know they exist?',
    board: ['pollen jitters', 'Brownian motion', 'seeing by inference'],
    demo: "Atoms are too small for light itself to trace — light waves are too fat! But look at pollen grains in water under a microscope: they jitter around like crazy. Why? Invisible atoms are bombarding them from all sides, and the bumps don't quite cancel. You're watching the atoms' fingerprints. We knew atoms were real before anyone 'saw' one. Seeing isn't the only way of looking!",
  },
  {
    title: 'Why do we fall forward when the bus stops?',
    board: ['inertia', 'you keep going', 'the bus quit, not you'],
    demo: "The bus slams the brakes and you lurch forward — what pushed you? Nothing! That's the joke. Nothing pushed you at all. You were moving, and you simply kept moving — it's the bus that quit. Inertia isn't a force; it's the absence of one. Once you get that in your bones, Newton's first law stops being a sentence to memorize and becomes something you FEEL on every bus ride.",
  },
  {
    title: 'How does a soap bubble get its colors?',
    board: ['thin film', 'waves interfere', 'color = thickness map'],
    demo: "A soap bubble has no paint on it — so where do the swirling colors come from? Light bounces off the outside of the film AND the inside, and the two reflections interfere — some colors cancel, some reinforce, depending on the film's thickness. So the colors are a MAP: you're literally seeing how thick the soap is, everywhere, drawn in rainbow. Physics turns a bubble into a contour map. Not bad for dish soap.",
  },
  {
    title: 'Why is doubt so valuable?',
    board: ['doubt ≠ weakness', 'degrees of certainty', 'freedom to question'],
    demo: "I can live with doubt and uncertainty and not knowing. I think it's much more interesting that way. We have approximate answers, different degrees of certainty about different things — and none we're absolutely sure of. That doesn't frighten me! The freedom to doubt is hard-won; people fought for it. So today's question: is there something you 'know' that you've never actually checked?",
  },
  {
    title: 'What makes the moon stay up?',
    board: ['it IS falling', 'falling + missing', 'orbit = a long fall'],
    demo: "The moon doesn't stay up — it's falling! Right now, toward us. But it's also moving sideways so fast that as it falls, the Earth curves away beneath it. It falls and misses, falls and misses, forever. That's all an orbit is: a fall with good aim. Newton figured that out comparing the moon to an apple. Same fall! One law, from your breakfast table to the sky.",
  },
  {
    title: 'Why does hot metal glow red, then white?',
    board: ['jiggle → light', 'hotter = bluer', 'stars are thermometers'],
    demo: "Heat a poker and it glows red, then orange, then white — why those colors, in that order? The jiggling atoms shake the electric field, and faster jiggling makes bluer light. So color IS temperature. And here's the kicker: point that idea at the night sky. Red stars are the cool ones, blue-white the blazing hot. You can read a star's temperature with your naked eye. You're a walking thermometer for suns!",
  },
  {
    title: 'How does knowing a thing differ from knowing its name?',
    board: ['names vs knowledge', 'the brown-throated thrush', 'watch what it DOES'],
    demo: "My father taught me this. You can know the name of a bird in every language, and when you're done, you know nothing about the bird. Absolutely nothing! So look at the bird — what's it doing? Why does it peck its feathers? THAT's knowledge. Names are just tickets. Today, pick anything you 'know' — and ask what it actually does. You might find the name was doing all the work.",
  },
  {
    title: 'Why does the light bend in water?',
    board: ['light takes the fastest path', 'lifeguard problem', 'least time'],
    demo: "A stick in water looks bent because light changes direction at the surface. But WHY does it bend exactly that way? Here's the gorgeous answer: light takes the path of LEAST TIME. Like a lifeguard running on sand faster than she swims — she shouldn't head straight for the swimmer; she should run extra beach first. Light does that math automatically, every time. How does it know? Ah — now THAT question kept me up at night.",
  },
  {
    title: 'What keeps a bicycle up?',
    board: ['not just gyroscope', 'steering into the fall', 'stable by correction'],
    demo: "Everyone says gyroscopes keep a bike up. That's only a piece of it! The real trick: when a bike leans, the front wheel steers INTO the lean, the bike drives back under its own weight, and the fall gets canceled. It's not balance — it's continuous falling plus continuous correction. Which, between you and me, is also how you learn anything: lean, wobble, steer into it. Ha!",
  },
  {
    title: 'Why is there a two-slit experiment in every physics book?',
    board: ['one electron', 'two slits', 'the ONLY mystery'],
    demo: "Send electrons one at a time at two slits, and they land like waves interfering — each electron somehow 'knows' about both slits! Watch which slit it goes through, and the pattern vanishes. I always said this experiment has in it the heart of quantum mechanics — the only mystery. I can't explain it away, and neither can anybody. But oh, what a mystery to get to hold. Want to poke at it together?",
  },
]

// Deterministic topic-of-the-day.
export function topicForToday(date = new Date()) {
  const days = Math.floor(date.getTime() / 86400000)
  return TOPICS[days % TOPICS.length]
}

// Canned fallback replies for demo mode conversation.
export const DEMO_REPLIES = [
  {
    say: "Good question! You know, my father would answer things like this by starting with something you could SEE. So — what's the piece of this you've actually observed yourself, with your own eyes? Start there, and let's reason forward together, step by step.",
    board: ['start with what you SEE'],
  },
  {
    say: "Hmm — I don't know. Isn't that great? Not knowing is the fun part; it means there's something to find out. If I were stuck on this, I'd try the simplest possible version of the problem first. Strip everything away. What's the dumbest, simplest case of what you're asking?",
    board: ['simplify first', 'not knowing = fun'],
  },
  {
    say: "Here's a trick I always use: if you can't explain a thing in plain words — no jargon — you don't understand it yet. So try me! Explain your idea like I'm a smart kid from Brooklyn. Where does your explanation start to wobble? THAT's where the interesting physics is hiding.",
    board: ['explain it plainly', 'find the wobble'],
  },
  {
    say: "You're doing the right thing by asking. The first principle is that you must not fool yourself — and you are the easiest person to fool. So let's be honest: what would prove your idea WRONG? If you can't name it, we haven't got a real idea yet — we've got a wish. Let's sharpen it.",
    board: ["don't fool yourself", 'what would prove it wrong?'],
  },
  {
    say: "Ha! I like the way you're thinking. Now push it further — take your idea and ask 'and then what?' three times in a row. Follow the chain. Most ideas break by the second 'and then what' — and where it breaks is exactly where you learn something new. Go ahead, I'll wait.",
    board: ['and then what? ×3'],
  },
]
