// The approved mizuhiki cord, laid along any smooth skeleton.
// A skeleton is drawn with a turtle pen (straight runs, circular turns, smooth curves to a point and heading),
// sampled densely, and each strand is the skeleton offset along its normal, so strands stay exactly parallel.
// Pieces are drawn in order; each lays a black bed under its strands first, so a later piece passes over an earlier one.
export const S = 512
const rad = (d) => (d * Math.PI) / 180
const f = (n) => +n.toFixed(2)

export const pen = (x, y, hd) => {
  const pts = [[x, y]]
  const step = 1.5
  const push = (nx, ny) => { pts.push([nx, ny]); x = nx; y = ny }
  const api = {
    fd(len) {
      const n = Math.max(1, Math.ceil(Math.abs(len) / step))
      const x0 = x, y0 = y
      for (let i = 1; i <= n; i++) push(x0 + Math.cos(rad(hd)) * len * (i / n), y0 + Math.sin(rad(hd)) * len * (i / n))
      return api
    },
    // turn of deg degrees on radius r; positive turns clockwise on screen (y down)
    arc(r, deg) {
      const s = Math.sign(deg), cx = x + Math.cos(rad(hd + 90 * s)) * r, cy = y + Math.sin(rad(hd + 90 * s)) * r
      const a0 = hd - 90 * s, n = Math.max(2, Math.ceil((Math.abs(deg) * Math.PI * r) / 180 / step))
      for (let i = 1; i <= n; i++) { const a = a0 + (deg * i) / n; push(cx + Math.cos(rad(a)) * r, cy + Math.sin(rad(a)) * r) }
      hd += deg
      return api
    },
    // smooth cubic to (tx, ty) arriving with heading th; k0/k1 are tangent lengths as fractions of the chord
    to(tx, ty, th, k0 = 0.4, k1 = k0) {
      const d = Math.hypot(tx - x, ty - y)
      const p0 = [x, y], p1 = [x + Math.cos(rad(hd)) * d * k0, y + Math.sin(rad(hd)) * d * k0]
      const p2 = [tx - Math.cos(rad(th)) * d * k1, ty - Math.sin(rad(th)) * d * k1], p3 = [tx, ty]
      const n = Math.max(8, Math.ceil(d / 0.5))
      const tmp = []
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t
        tmp.push([0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]))
      }
      // resample evenly so offsets stay smooth
      let acc = 0, last = [x, y]
      for (const p of tmp) { acc += Math.hypot(p[0] - last[0], p[1] - last[1]); last = p; if (acc >= step) { pts.push(p); acc = 0 } }
      pts.push([tx, ty]); x = tx; y = ty; hd = th
      return api
    },
    get pos() { return [x, y, hd] },
    pts,
  }
  return api
}

const dedupe = (pts) => pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.2)

export const offset = (raw, o) => {
  const pts = dedupe(raw)
  const out = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1
    return [p[0] - (dy / l) * o, p[1] + (dx / l) * o]
  })
  // keep only points where the path bends, so straight runs are written as single exact lines
  const keep = out.filter((p, i) => {
    if (i === 0 || i === out.length - 1) return true
    const a = out[i - 1], b = out[i + 1]
    return Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) > 1e-3
  })
  return "M" + keep.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")
}

// the approved stroke at full size, and size-specific drawings for small sizes
export const STROKES = {
  full: { n: 5, gap: 8.5, w: 3 },
  mid: { n: 3, gap: 17, w: 9 },
  band: { n: 1, gap: 0, w: 44 },
}

export const cord = (pieces, { n, gap, w }, bed = true) => {
  const width = (n - 1) * gap + w
  return pieces
    .map((pts) => {
      // the bed stops short of the piece's ends, so where a piece retraces another its strands cover the bed's edge and leave no seam
      const p0 = offset(pts.slice(16, -16), 0)
      const under = bed ? `<path d="${p0}" stroke="#000" stroke-width="${f(width + 14)}"/>` : ""
      const strands = Array.from({ length: n }, (_, i) => `<path d="${offset(pts, (i - (n - 1) / 2) * gap)}" stroke-width="${w}"/>`).join("")
      return under + strands
    })
    .join("")
}

export const svg = (body, id) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="Miyage">` +
  `<clipPath id="${id}"><rect width="${S}" height="${S}"/></clipPath><rect width="${S}" height="${S}" fill="#000"/>` +
  `<g clip-path="url(#${id})" fill="none" stroke="#f2efe8" stroke-linecap="butt" stroke-linejoin="round">${body}</g></svg>\n`

// shear about a baseline, for slanted letters drawn upright first
export const slant = (pieces, deg, baseY) => pieces.map((pts) => pts.map(([x, y]) => [x - Math.tan(rad(deg)) * (y - baseY), y]))
export const rotate = (pieces, deg, cx = S / 2, cy = S / 2) =>
  pieces.map((pts) => pts.map(([x, y]) => {
    const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)), dx = x - cx, dy = y - cy
    return [cx + dx * c - dy * s, cy + dx * s + dy * c]
  }))
export const move = (pieces, ox, oy) => pieces.map((pts) => pts.map(([x, y]) => [x + ox, y + oy]))
