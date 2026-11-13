// Round eight: m letterforms that differ in skeleton, all in the approved cord.
// Each mark draws itself at three size ranges: full (256px and up), mid (48 to 255px), small (under 48px).
import { pen, cord, STROKES, S } from "./cord.mjs"

const mirror = (pts) => pts.map(([x, y]) => [S - x, y]).reverse()

// finds the number that makes a skeleton land where it must: a coarse scan for the first crossing, then bisection
const solve = (fn, lo, hi, target) => {
  const N = 24, xs = Array.from({ length: N + 1 }, (_, i) => lo + ((hi - lo) * i) / N), fs = xs.map((x) => fn(x) - target)
  const i = fs.findIndex((f, j) => j < N && Number.isFinite(f) && Number.isFinite(fs[j + 1]) && Math.sign(f) !== Math.sign(fs[j + 1]))
  if (i < 0) return NaN
  ;[lo, hi] = [xs[i], xs[i + 1]]
  for (let k = 0; k < 40; k++) { const m = (lo + hi) / 2; Math.sign(fn(m) - target) === Math.sign(fn(lo) - target) ? (lo = m) : (hi = m) }
  return (lo + hi) / 2
}

// 1. Tied: the cord runs straight across the square, as it does across a gift, and is pulled up into an M of two
// leaning peaks whose middle is tied in a loop where the cord crosses itself. The right half passes over the left.
const tiedPath = ({ Y = 392, k = 40, T = 146, a = 44, rv = 30, V = 330, th = 66 } = {}) => {
  // each hump is symmetric: the outer side climbs at the same angle the inner side falls
  const build = (th, x0, len) => {
    const p = pen(-40, Y, 0).fd(x0 + 40).arc(k, -th)
    const up = (p.pos[1] + a * Math.cos((th * Math.PI) / 180) - a - T) / Math.sin((th * Math.PI) / 180) // so the hump tops out at T
    return p.fd(up).arc(a, 2 * th).fd(len).arc(rv, 180 - th)
  }
  // for a slope and a start, the run that lands the loop's bottom on the center line, then the start that lands it at V
  const fit = (th, x0) => build(th, x0, solve((len) => build(th, x0, len).pos[0], 1, 700, S / 2))
  const x0 = solve((x) => fit(th, x).pos[1], 0, 200, V)
  const left = fit(th, x0).pts, right = mirror(left)
  // the cord is drawn whole, then the right half's run through the crossing (on the center line, by symmetry) again on top
  const over = right.slice(0, right.findIndex(([x, y]) => y < V - 2 * rv && x > S / 2 + 46))
  return [[...left, ...right.slice(1)], over]
}
const tied = (size) => cord(tiedPath(), STROKES[size])

// 2. Endless: the same tied M, but the cord never ends: it runs down each outer side and closes under the knot,
// so the mark is one closed loop, like a cord tied around a gift.
const endlessPath = ({ Yb = 400, r = 44, T = 100, a = 44, rv = 28, V = 316, th = 69 } = {}) => {
  const build = (L0, len) => {
    const p = pen(S / 2, Yb, 180).fd(L0).arc(r, 180 - th)
    const up = (p.pos[1] + a * Math.cos((th * Math.PI) / 180) - a - T) / Math.sin((th * Math.PI) / 180) // so the hump tops out at T
    return p.fd(up).arc(a, 2 * th).fd(len).arc(rv, 180 - th)
  }
  const fit = (L0) => build(L0, solve((len) => build(L0, len).pos[0], 1, 700, S / 2))
  // the base run that puts the knot's loop at V
  const left = fit(solve((l) => fit(l).pos[1], 0, 200, V)).pts, right = mirror(left)
  const over = right.slice(0, right.findIndex(([x, y]) => y < V - 2 * rv && x > S / 2 + 46))
  return [[...left, ...right.slice(1)], over]
}
const endless = (size) => cord(endlessPath(), STROKES[size])

export const marks = { tied, endless }
