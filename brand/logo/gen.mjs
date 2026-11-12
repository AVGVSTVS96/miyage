import { writeFileSync } from "node:fs"

// From Bassim's sketch: an m written in one line, climbing a square corner to corner and leaving it at the top.
const out = import.meta.dirname
const BLACK = "#000000", IVORY = "#f3efe6", GOLD = "#c9b58a"
const S = 512, F0 = 106, F1 = 406
const f = (n) => n.toFixed(1)

// the line: a rolling-wheel curve with three arches (s = 1 gives points, > 1 loops, < 1 soft valleys), then a tail
const line = ({ s = 0.86, A = 90, grow = 0, deg = 38, start = [132, F1], lead = 0, span = 240, tail = [456, 84], end = 0.5 }) => {
  const rise = Math.tan((deg * Math.PI) / 180)
  const c = span / (6 * Math.PI)
  const pts = [start]
  const last = (6 + end) * Math.PI
  for (let th = 0; th <= last + 1e-6; th += Math.PI / 90) {
    const k = 1 + grow * (th / (6 * Math.PI) - 0.5)
    const u = c * th - s * c * k * Math.sin(th), v = (A * k * (1 - Math.cos(th))) / 2
    pts.push([start[0] + u, start[1] - lead - u * rise - v])
  }
  // tail: leave along the line's own direction, land flat to the right, outside the square
  const [p, q] = [pts.at(-1), pts.at(-4)]
  const t = Math.hypot(p[0] - q[0], p[1] - q[1])
  const dir = [(p[0] - q[0]) / t, (p[1] - q[1]) / t]
  const L = Math.hypot(tail[0] - p[0], tail[1] - p[1]) * 0.55
  const b1 = [p[0] + dir[0] * L, p[1] + dir[1] * L], b2 = [tail[0] - L * 0.9, tail[1] + L * 0.25]
  for (let i = 1; i <= 40; i++) {
    const x = i / 40, y = 1 - x
    pts.push([0, 1].map((a) => y ** 3 * p[a] + 3 * y * y * x * b1[a] + 3 * y * x * x * b2[a] + x ** 3 * tail[a]))
  }
  return pts
}
const stroke = (pts, w, color, extra = "") =>
  `<path d="M${pts.map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`
// a broad-nib ribbon: thick where the pen travels across the nib, thin along it
const ribbon = (pts, min, max, nibDeg, color) => {
  const nib = (nibDeg * Math.PI) / 180, L = [], R = []
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0])
    const w = (min + (max - min) * Math.abs(Math.sin(ang - nib))) / 2
    L.push([p[0] - Math.sin(ang) * w, p[1] + Math.cos(ang) * w]); R.push([p[0] + Math.sin(ang) * w, p[1] - Math.cos(ang) * w])
  })
  return `<path fill="${color}" d="M${[...L, ...R.reverse()].map((p) => `${f(p[0])} ${f(p[1])}`).join("L")}Z"/>`
}
const frame = (w, color = IVORY, fill = "none") => `<rect x="${F0}" y="${F0}" width="${F1 - F0}" height="${F1 - F0}" fill="${fill}" stroke="${color}" stroke-width="${w}"/>`
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="miyage"><rect width="${S}" height="${S}" fill="${BLACK}"/>${body}</svg>\n`
const clip = (id, inside) => `<clipPath id="${id}"><path d="${inside ? `M${F0} ${F0}H${F1}V${F1}H${F0}Z` : `M0 0H${S}V${S}H0ZM${F0} ${F0}V${F1}H${F1}V${F0}Z`}" clip-rule="evenodd"/></clipPath>`

const soft = line({}), points = line({ s: 1, A: 96 }), loops = line({ s: 1.45, A: 86 }), rising = line({ grow: 0.8, A: 82 })
const marks = {
  "1-line": frame(3) + stroke(soft, 3, IVORY),
  "2-points": frame(7) + stroke(points, 7, IVORY),
  "3-loops": frame(3) + stroke(loops, 3, IVORY),
  "4-rising": frame(3) + stroke(rising, 5, GOLD),
  "5-pen": frame(2.5) + ribbon(soft, 2.5, 20, 35, IVORY),
  "6-flip": `<defs>${clip("in", true)}${clip("out", false)}</defs>` + frame(0, IVORY, IVORY) + stroke(soft, 9, BLACK, 'clip-path="url(#in)"') + stroke(soft, 9, IVORY, 'clip-path="url(#out)"'),
}
for (const [name, body] of Object.entries(marks)) writeFileSync(`${out}/${name}.svg`, svg(body))
console.log("ok")
