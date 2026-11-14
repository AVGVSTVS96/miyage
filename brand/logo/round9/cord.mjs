// The approved mizuhiki cord, laid along a closed skeleton.
// The skeleton is drawn with a turtle pen (straight runs and circular turns), then smoothed so every bend
// eases in and out like a real cord under tension; each strand is the skeleton offset along its normal.
export const S = 512
const rad = (d) => (d * Math.PI) / 180
const f = (n) => +n.toFixed(2)

export const pen = (x, y, hd) => {
  const pts = [[x, y]]
  const step = 1
  const push = (nx, ny) => { pts.push([nx, ny]); x = nx; y = ny }
  const api = {
    fd(len) {
      const n = Math.max(1, Math.ceil(Math.abs(len) / step)), x0 = x, y0 = y
      for (let i = 1; i <= n; i++) push(x0 + Math.cos(rad(hd)) * len * (i / n), y0 + Math.sin(rad(hd)) * len * (i / n))
      return api
    },
    // positive deg turns clockwise on screen (y down)
    arc(r, deg) {
      const s = Math.sign(deg), cx = x + Math.cos(rad(hd + 90 * s)) * r, cy = y + Math.sin(rad(hd + 90 * s)) * r
      const a0 = hd - 90 * s, n = Math.max(2, Math.ceil((Math.abs(deg) * Math.PI * r) / 180 / step))
      for (let i = 1; i <= n; i++) { const a = a0 + (deg * i) / n; push(cx + Math.cos(rad(a)) * r, cy + Math.sin(rad(a)) * r) }
      hd += deg
      return api
    },
    get pos() { return [x, y, hd] },
    pts,
  }
  return api
}

// even spacing along a closed loop
const resample = (pts, step) => {
  const ring = [...pts, pts[0]], out = [ring[0]]
  let carry = 0
  for (let i = 1; i < ring.length; i++) {
    const [ax, ay] = ring[i - 1], [bx, by] = ring[i], l = Math.hypot(bx - ax, by - ay)
    let t = step - carry
    while (t <= l) { out.push([ax + ((bx - ax) * t) / l, ay + ((by - ay) * t) / l]); t += step }
    carry = l - (t - step)
  }
  if (Math.hypot(out.at(-1)[0] - out[0][0], out.at(-1)[1] - out[0][1]) < step / 2) out.pop()
  return out
}

// Gaussian smoothing around the closed loop: curvature ramps in and out of every bend instead of jumping
export const smooth = (pts, sigma) => {
  const p = resample(pts, 1), n = p.length, k = Math.ceil(sigma * 3)
  const w = Array.from({ length: 2 * k + 1 }, (_, i) => Math.exp(-((i - k) ** 2) / (2 * sigma * sigma)))
  const sum = w.reduce((a, b) => a + b)
  return p.map((_, i) => {
    let x = 0, y = 0
    for (let j = -k; j <= k; j++) { const q = p[(i + j + n) % n]; x += q[0] * w[j + k]; y += q[1] * w[j + k] }
    return [x / sum, y / sum]
  })
}

const normal = (pts, i, closed) => {
  const n = pts.length
  const a = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)], b = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)]
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1
  return [-dy / l, dx / l]
}

// only points where the path bends, so straight runs are written as single exact lines
const write = (pts, closed) => {
  const keep = pts.filter((p, i) => {
    if (!closed && (i === 0 || i === pts.length - 1)) return true
    const a = pts[(i - 1 + pts.length) % pts.length], b = pts[(i + 1) % pts.length]
    return Math.abs((p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])) > 2e-3
  })
  return "M" + keep.map((p) => `${f(p[0])} ${f(p[1])}`).join("L") + (closed ? "Z" : "")
}

export const offsetLoop = (pts, o) => write(pts.map((p, i) => { const [nx, ny] = normal(pts, i, true); return [p[0] + nx * o, p[1] + ny * o] }), true)
export const offsetRun = (loop, i0, i1, o) => {
  const n = loop.length, idx = Array.from({ length: i1 - i0 + 1 }, (_, k) => (i0 + k + n) % n)
  return write(idx.map((i) => { const [nx, ny] = normal(loop, i, true), p = loop[i]; return [p[0] + nx * o, p[1] + ny * o] }), false)
}

// where a closed loop crosses itself: index pairs of the two passes
export const crossings = (pts) => {
  const n = pts.length, out = []
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n]
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      const c = pts[j], d = pts[(j + 1) % n]
      const den = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0])
      if (!den) continue
      const t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / den
      const u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / den
      if (t >= 0 && t < 1 && u >= 0 && u < 1) out.push([i, j])
    }
  }
  return out
}

export const STROKES = {
  full: { n: 5, gap: 8.5, w: 3 },
  mid: { n: 3, gap: 15, w: 8 },
  band: { n: 1, gap: 0, w: 40 },
}

// The whole loop, with the under pass cut where the over pass crosses it. The cut is a mask, so the gap
// is true transparency and the same file works on any background.
export const cord = (loop, over, { n, gap, w }, id, clear = 7) => {
  const width = (n - 1) * gap + w, L = loop.length
  const [o0, o1] = over, reach = Math.ceil(width * 1.6)
  const strands = (fn) => Array.from({ length: n }, (_, i) => `<path d="${fn((i - (n - 1) / 2) * gap)}"/>`).join("")
  const mask =
    `<mask id="${id}-cut" maskUnits="userSpaceOnUse" x="-${S}" y="-${S}" width="${3 * S}" height="${3 * S}">` +
    `<rect x="-${S}" y="-${S}" width="${3 * S}" height="${3 * S}" fill="#fff"/>` +
    `<path d="${offsetRun(loop, o0 - reach, o1 + reach, 0)}" fill="none" stroke="#000" stroke-width="${f(width + 2 * clear)}" stroke-linecap="butt"/></mask>`
  void L
  return (
    mask +
    `<g stroke-width="${w}"><g mask="url(#${id}-cut)">${strands((o) => offsetLoop(loop, o))}</g>` +
    strands((o) => offsetRun(loop, o0 - reach - 3, o1 + reach + 3, o)) +
    `</g>`
  )
}
