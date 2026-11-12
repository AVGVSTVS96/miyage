import { writeFileSync, mkdirSync } from "node:fs"

// One cord of strands, like the mizuhiki cord tied on a Japanese gift, drawn as an m.
// It rises through the floor of the square, folds flat at the foot of the middle stem, and sweeps out through the right side.
const S = 512, BLACK = "#000000", IVORY = "#f2efe8"
const f = (n) => +n.toFixed(2), rad = (d) => (d * Math.PI) / 180

// a pen that records exact lines and arcs, so every strand is an exact offset of the same path
export const pen = (x, y, hd) => {
  const segs = []
  const api = {
    fd(len) { const nx = x + Math.cos(rad(hd)) * len, ny = y + Math.sin(rad(hd)) * len; segs.push({ k: "L", x0: x, y0: y, x1: nx, y1: ny, hd }); x = nx; y = ny; return api },
    arc(r, deg) {
      const s = Math.sign(deg), cx = x + Math.cos(rad(hd + 90 * s)) * r, cy = y + Math.sin(rad(hd + 90 * s)) * r
      segs.push({ k: "A", cx, cy, r, a0: hd - 90 * s, deg, s })
      hd += deg; x = cx + Math.cos(rad(hd - 90 * s)) * r; y = cy + Math.sin(rad(hd - 90 * s)) * r; return api
    },
    turn(deg) { hd += deg; return api },
    segs,
  }
  return api
}
// o > 0 is to the right of travel
export const strand = (segs, o) => {
  let d = ""
  for (const g of segs) {
    if (g.k === "L") {
      const nx = -Math.sin(rad(g.hd)) * o, ny = Math.cos(rad(g.hd)) * o
      d += `${d ? "L" : "M"}${f(g.x0 + nx)} ${f(g.y0 + ny)}L${f(g.x1 + nx)} ${f(g.y1 + ny)}`
    } else {
      const r = g.r - g.s * o, p = (a) => [g.cx + Math.cos(rad(a)) * r, g.cy + Math.sin(rad(a)) * r]
      const [sx, sy] = p(g.a0), [ex, ey] = p(g.a0 + g.deg)
      d += `${d ? "L" : "M"}${f(sx)} ${f(sy)}A${f(r)} ${f(r)} 0 ${Math.abs(g.deg) > 180 ? 1 : 0} ${g.s > 0 ? 1 : 0} ${f(ex)} ${f(ey)}`
    }
  }
  return d
}

// two pieces: up the first stem, over the first arch and down the middle stem; then, folded flat at
// the baseline, back up the same stem, over the second arch and out. The second passes over the first.
export const path = ({ x = 140, base = 340, xh = 180, D = 124, a = 62, foot = 40, sweep = 160 } = {}) => {
  const top = base - xh
  const under = pen(x, S + 80, -90).fd(S + 80 - top - a).arc(a, 90).fd(D - 2 * a).arc(a, 90).fd(xh - a)
  const over = pen(x + D, base, -90).fd(xh - a).arc(a, 90).fd(D - 2 * a).arc(a, 90).fd(xh - a - foot).arc(foot, -90).arc(sweep, -90).fd(300)
  return [under.segs, over.segs]
}
// n strands; the piece on top gets a black gap around it so the crossing reads
export const cord = (pieces, { n = 5, gap = 8.5, w = 3, knock = 6 } = {}) => {
  const band = (n - 1) * gap + w
  const strands = (segs) => Array.from({ length: n }, (_, i) => `<path d="${strand(segs, (i - (n - 1) / 2) * gap)}" stroke-width="${w}"/>`).join("")
  return pieces.map((segs, i) => (i ? `<path d="${strand(segs, 0)}" stroke="${BLACK}" stroke-width="${band + 2 * knock}"/>` : "") + strands(segs)).join("")
}
export const svg = (body, { id, bg = BLACK, ink = IVORY, label = "Miyage" } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="${label}">` +
  `<clipPath id="${id}"><rect width="${S}" height="${S}"/></clipPath>` +
  (bg ? `<rect width="${S}" height="${S}" fill="${bg}"/>` : "") +
  `<g clip-path="url(#${id})" fill="none" stroke="${ink}" stroke-linecap="butt" stroke-linejoin="round">${body}</g></svg>\n`
