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

// 1. Chancery italic: compressed, slanted 9 degrees, arches branch low off each stem and the strands split like a switch
export const italic = ({ lead = 0, tail = 30 } = {}) => {
  const base = 372, top = 150
  const xs = [158, 256, 354]
  const ey = top + 30, er = 32, ea = (26 * Math.PI) / 180
  const entry = pen(xs[0] - er - er * Math.cos(ea), ey, -64).arc(er, 154).fd(base - ey - er * Math.sin(ea) + lead).pts
  const arch = (x0, x1, last) => {
    const p = pen(x0, base, -90).fd(96).to(x0 + 62, top - 2, 0, 0.5, 0.42).to(x1, top + 70, 90, 0.42, 0.46)
    if (!last) return p.fd(base - (top + 70)).pts
    return p.fd(base - (top + 70) - 46).arc(40, -90).arc(70, -40).fd(tail).pts
  }
  // stems lie over the arches that branch out of them, so each arch seems tucked under the stroke before it
  const pieces = [arch(xs[1], xs[2], true), arch(xs[0], xs[1]), entry]
  return fit(slant(pieces, 9, base), 252, 300)
}

// 2. Folded capital M: one cord folded tight at three points, legs running off the bottom like a cord around a box
export const folded = ({ L = 136, T = 128, r = 22, V = 352 } = {}) => {
  const half = (th) => pen(L, S + 40, -90).fd(S + 40 - T - r).arc(r, 90 + th).fd(0)
  const build = (th) => {
    // the diagonal runs until the valley fold brings the cord level exactly at the center line
    const p0 = half(th)
    const [x, , hd] = p0.pos
    const valleyDx = r * Math.sin((th * Math.PI) / 180)
    const len = (S / 2 - valleyDx - x) / Math.cos((hd * Math.PI) / 180)
    const p = half(th).fd(len).arc(r, -th)
    return p
  }
  const th = solve((t) => build(t).pos[1], 40, 80, V)
  const left = build(th).pts
  return [[...left, ...mirror(left)]]
}

// 6. Crossed M: two cords, each a tall fold, laid over each other so the middle of the M is the crossing of a tied cord
export const crossed = ({ L = 128, T = 132, r = 24, X = 372 } = {}) => {
  const one = (th) => pen(L, S + 40, -90).fd(S + 40 - T - r).arc(r, 90 + th)
  // the diagonal must pass through the crossing point on the center line
  const at = (t) => { const [x, y, hd] = one(t).pos; const h = (hd * Math.PI) / 180; return y + Math.tan(h) * (S / 2 - x) }
  const th = solve(at, 20, 89, X)
  const a = one(th); const [, y, hd] = a.pos
  a.fd((S + 60 - y) / Math.sin((hd * Math.PI) / 180))
  return [a.pts, mirror(a.pts)]
}

export const marks = { italic, folded, crossed }
