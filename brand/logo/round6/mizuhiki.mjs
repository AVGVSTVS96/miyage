import { writeFileSync, mkdirSync } from "node:fs"

// One cord of five strands, like the mizuhiki cord tied on a Japanese gift, written as a cursive m.
// It comes up through the floor of the square and sweeps out through its right side.
const S = 512, BLACK = "#000000", IVORY = "#f2efe8"
const f = (n) => +n.toFixed(2), rad = (d) => (d * Math.PI) / 180

// a pen that records exact lines and arcs, so every strand is an exact offset of the same path
const pen = (x, y, hd) => {
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
const strand = (segs, o) => {
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

// stems stand at x, x+2R, x+2R+2r, x+4R+2r; the middle one is a hairpin, so the strands never cross
export const path = ({ x = 146, base = 360, xh = 196, R = 42, r = 24, foot = 40, sweep = 160 } = {}) => {
  const p = pen(x, S + 80, -90)
  p.fd(S + 80 - base + xh - R).arc(R, 180)
  // r = 0 is for one band at tiny sizes: down the middle stem and back up it, a plain m
  if (r) p.fd(xh - R - r).arc(r, -180).fd(xh - R - r)
  else p.fd(xh - R).turn(180).fd(xh - R)
  p.arc(R, 180)
  p.fd(xh - R - foot).arc(foot, -90).arc(sweep, -90).fd(200)
  return p.segs
}
export const cord = (segs, { n = 5, gap = 8.5, w = 3 } = {}) =>
  Array.from({ length: n }, (_, i) => `<path d="${strand(segs, (i - (n - 1) / 2) * gap)}" stroke-width="${w}"/>`).join("")

export const svg = (body, { id, bg = BLACK, ink = IVORY, label = "Miyage" } = {}) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="${label}">` +
  `<clipPath id="${id}"><rect width="${S}" height="${S}"/></clipPath>` +
  (bg ? `<rect width="${S}" height="${S}" fill="${bg}"/>` : "") +
  `<g clip-path="url(#${id})" fill="none" stroke="${ink}" stroke-linecap="butt" stroke-linejoin="round">${body}</g></svg>\n`
