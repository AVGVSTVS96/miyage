// Round eight: different m skeletons, all in the approved cord.
import { pen, slant, S } from "./cord.mjs"

const mirror = (pts) => pts.map(([x, y]) => [S - x, y]).reverse()

// scale a drawing about its own center so its skeleton is h tall, then center it, a touch above the middle for the eye
const fit = (pieces, h, w) => {
  const all = pieces.flat(), xs = all.map((p) => p[0]), ys = all.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const k = Math.min(h / (y1 - y0), w / (x1 - x0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
  return pieces.map((pts) => pts.map(([x, y]) => [S / 2 + (x - cx) * k, S / 2 - 6 + (y - cy) * k]))
}

// bisection on one number so a skeleton lands where it must
const solve = (fn, lo, hi, target) => {
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; (fn(m) < target) === (fn(lo) < target) ? (lo = m) : (hi = m) }
  return (lo + hi) / 2
}

// 1. Folded capital M: one cord folded at three points, legs running off the bottom like a cord around a box
export const folded = ({ L = 116, T = 128, r = 30, V = 376 } = {}) => {
  const build = (th) => {
    const p = pen(L, S + 40, -90).fd(S + 40 - T - r).arc(r, 90 + th)
    // the diagonal runs until the valley fold brings the cord level exactly at the center line
    const [x, , hd] = p.pos
    const len = (S / 2 - r * Math.sin((th * Math.PI) / 180) - x) / Math.cos((hd * Math.PI) / 180)
    return p.fd(len).arc(r, -th)
  }
  const left = build(solve((t) => build(t).pos[1], 40, 85, V)).pts
  return [[...left, ...mirror(left)]]
}

// 2. Knotted M: the same fold, but the valley is a small closed loop where the cord crosses itself, as in a mizuhiki knot;
// the right half is drawn after the left, so it passes over at the crossing
export const knotted = ({ L = 132, T = 124, r = 40, rv = 34, V = 392 } = {}) => {
  const build = (th, len) => pen(L, S + 40, -90).fd(S + 40 - T - r).arc(r, 90 + th).fd(len).arc(rv, 180 - th)
  // for a slant, the run length that lands the loop's bottom on the center line
  const lenFor = (th) => solve((len) => build(th, len).pos[0], 10, 600, S / 2)
  const th = solve((t) => build(t, lenFor(t)).pos[1], 45, 85, V)
  const left = build(th, lenFor(th)).pts
  return [left, mirror(left)]
}

// 3. Zigzag M: no upright stems; the cord is wound up and down across the square in four diagonals, like cord wound around a gift
export const zigzag = ({ r = 40, T = 128, V = 372, X0 = 20 } = {}) => {
  // lengths are found by search so each fold lands exactly: peaks top out at T, the valley bottoms out at V on the center line
  const build = (th) => {
    const peak = (len) => pen(X0, S + 40, -th).fd(len).arc(r, 2 * th)
    const up = solve((len) => Math.min(...peak(len).pts.map((q) => q[1])), 1, 900, T)
    const valley = (len) => peak(up).fd(len).arc(r, -th)
    const down = solve((len) => valley(len).pos[1], 1, 900, V)
    return valley(down)
  }
  const th = solve((t) => build(t).pos[0], 45, 85, S / 2)
  const left = build(th).pts
  return [[...left, ...mirror(left)]]
}

export const marks = { folded, knotted, zigzag }
