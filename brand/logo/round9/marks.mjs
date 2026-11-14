// Endless: an m as one closed loop of cord. It runs along the floor, up each outer side, over the two peaks,
// and down the inner sides, which cross and tie a loop under the middle, like a cord tied around a gift.
import { pen, smooth, crossings, S } from "./cord.mjs"

const solve = (fn, lo, hi, target) => {
  const N = 40, xs = Array.from({ length: N + 1 }, (_, i) => lo + ((hi - lo) * i) / N), fs = xs.map((x) => fn(x) - target)
  const i = fs.findIndex((v, j) => j < N && Number.isFinite(v) && Number.isFinite(fs[j + 1]) && Math.sign(v) !== Math.sign(fs[j + 1]))
  if (i < 0) return NaN
  ;[lo, hi] = [xs[i], xs[i + 1]]
  for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; Math.sign(fn(m) - target) === Math.sign(fn(lo) - target) ? (lo = m) : (hi = m) }
  return (lo + hi) / 2
}
const sin = (d) => Math.sin((d * Math.PI) / 180), cos = (d) => Math.cos((d * Math.PI) / 180)

// Yb floor, T peak tops, r floor corners, a peak bends, rv the tied loop, V the loop's bottom,
// thO and thI the slopes of the outer and inner sides, sigma how softly each bend eases in
export const endless = ({ Yb = 400, T = 104, r = 44, a = 44, rv = 32, V = 318, thO = 72, thI = 68, sigma = 9, dx = 0, dy = -2, scale = 0.92 } = {}) => {
  const build = (L0, len) => {
    const p = pen(S / 2, Yb, 180).fd(L0).arc(r, 180 - thO)
    const up = (p.pos[1] - (T + a - a * cos(thO))) / sin(thO)
    return p.fd(up).arc(a, thO + thI).fd(len).arc(rv, 180 - thI)
  }
  const fit = (L0) => { const len = solve((l) => build(L0, l).pos[0], 1, 800, S / 2); return Number.isFinite(len) ? build(L0, len) : { pos: [NaN, NaN] } }
  const L0 = solve((l) => fit(l).pos[1], 0, 300, V)
  if (!Number.isFinite(L0)) throw new Error("no fit")
  const left = fit(L0).pts
  const right = left.map(([x, y]) => [S - x, y]).reverse()
  const loop = smooth([...left, ...right.slice(1, -1)], sigma).map(([x, y]) => [S / 2 + (x - S / 2) * scale + dx, S / 2 + (y - S / 2) * scale + dy])
  // the right inner side passes over the left one
  const [[i, j]] = crossings(loop)
  // the pass heading up is the one running to the right peak
  const up = (k) => loop[(k + 1) % loop.length][1] < loop[k][1]
  const o = up(i) ? i : j
  return { loop, over: [o, o] }
}

// extent of the drawn cord, strands included
export const bbox = (loop, half) => {
  const xs = loop.map((p) => p[0]), ys = loop.map((p) => p[1])
  return [Math.min(...xs) - half, Math.min(...ys) - half, Math.max(...xs) + half, Math.max(...ys) + half].map((v) => +v.toFixed(1))
}

// One skeleton, a cord drawing for each size it's shown at. Finer strands than a pixel blur into grey, so
// the approved five strands hold from 256px, three strands from 100px, one band below that, and a heavier
// band at 16px. The bands' floors land on whole pixels at the sizes they're made for.
export const DRAWINGS = {
  full: { stroke: { n: 5, gap: 8.5, w: 3 }, clear: 7, min: 256 },
  mid: { stroke: { n: 3, gap: 15, w: 8 }, clear: 8, min: 100 },
  small: { stroke: { n: 1, gap: 0, w: 32 }, clear: 12, min: 24, shape: { scale: 1, dy: 0 } },
  tiny: { stroke: { n: 1, gap: 0, w: 48 }, clear: 14, min: 0, shape: { scale: 1.12, rv: 24, V: 312, dy: -9.3 } },
}
export const drawingFor = (px) => Object.keys(DRAWINGS).find((k) => px >= DRAWINGS[k].min)
