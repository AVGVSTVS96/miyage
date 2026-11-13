// Round eight: m letterforms that differ in skeleton, all in the approved cord.
// Each mark draws itself at three size ranges: full (256px and up), mid (48 to 255px), small (under 48px).
import { pen, cord, STROKES, S } from "./cord.mjs"

const mirror = (pts) => pts.map(([x, y]) => [S - x, y]).reverse()

// bisection on one number so a skeleton lands where it must
const solve = (fn, lo, hi, target) => {
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; (fn(m) < target) === (fn(lo) < target) ? (lo = m) : (hi = m) }
  return (lo + hi) / 2
}

// 1. Tied: the cord runs straight across the square, as it does across a gift, and is pulled up into an M
// whose middle is tied in a small loop where the cord crosses itself. The right half passes over the left.
const tiedPath = ({ Y = 392, X = 128, k = 40, T = 150, a = 48, rv = 30, V = 352 } = {}) => {
  const build = (th, len) => pen(-40, Y, 0).fd(X - k + 40).arc(k, -90).fd(Y - k - T - a).arc(a, 90 + th).fd(len).arc(rv, 180 - th)
  const lenFor = (th) => solve((len) => build(th, len).pos[0], 10, 600, S / 2)
  const th = solve((t) => build(t, lenFor(t)).pos[1], 45, 89, V)
  const left = build(th, lenFor(th)).pts, right = mirror(left)
  // the cord is drawn whole, then the right half's run through the crossing again on top
  const over = right.slice(0, right.findIndex(([, y]) => y < V - 2 * rv - 150))
  return [[...left, ...right.slice(1)], over]
}
const tied = (size) => cord(tiedPath(), STROKES[size])

// 2 and 3 are pleated: the strands gather to a point at every fold, as a flat bundle of cords does when it is
// folded over, and open into a smooth fan between folds, widest midway.
const pleat = (V, { gap = 11, ramp = 260, size = "full" } = {}) => {
  const { n, w } = { full: { n: 5, w: 3 }, mid: { n: 3, w: 8 } }[size] ?? {}
  const g = size === "mid" ? gap * 2.1 : gap
  const edge = (o) => {
    const pts = []
    for (let s = 0; s < V.length - 1; s++) {
      const [a, b] = [V[s], V[s + 1]], len = Math.hypot(b[0] - a[0], b[1] - a[1])
      const nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len
      const pinA = s > 0, pinB = s < V.length - 2
      const k = (t) => pinA && pinB ? Math.sin(Math.PI * t) : pinA ? Math.sin((Math.PI / 2) * Math.min(1, (t * len) / ramp)) : Math.sin((Math.PI / 2) * Math.min(1, ((1 - t) * len) / ramp))
      for (let j = s ? 1 : 0; j <= 160; j++) {
        const t = j / 160, sc = k(t) * o
        pts.push([a[0] + (b[0] - a[0]) * t + nx * sc, a[1] + (b[1] - a[1]) * t + ny * sc])
      }
    }
    return pts
  }
  const d = (pts) => "M" + pts.map((p) => `${+p[0].toFixed(2)} ${+p[1].toFixed(2)}`).join("L")
  // under 48px the fan becomes one solid band that still gathers to a point at each fold
  if (size === "small") {
    const h = gap * 2.6
    return `<path d="${d([...edge(-h), ...edge(h).reverse()])}Z" fill="#f2efe8" stroke="none"/>`
  }
  return Array.from({ length: n }, (_, i) => `<path d="${d(edge((i - (n - 1) / 2) * g))}" stroke-width="${w}"/>`).join("")
}

// 2. Pleated M: a capital M of four straight folds with pointed peaks and a pointed valley, legs splayed.
const pleated = (size) => pleat([[104, 424], [170, 110], [256, 340], [342, 110], [408, 424]], { gap: 12, ramp: 320, size })

// 3. Written m: a lowercase m written in one quick stroke, each peak higher than the last, ending in a short flick up.
const written = (size) => pleat([[88, 420], [142, 180], [212, 380], [292, 130], [362, 380], [444, 284]], { size })

export const marks = { tied, pleated, written }
