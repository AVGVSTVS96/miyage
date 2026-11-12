import { writeFileSync } from "node:fs"

// From Bassim's sketch: a cursive m written in one line, standing on the floor of a square and leaving through its ceiling.
const out = import.meta.dirname
const BLACK = "#000000", IVORY = "#f3efe6"
const S = 512
const f = (n) => +n.toFixed(2)
const rad = (d) => (d * Math.PI) / 180

// a pen in screen space: heading -90 is up, a positive turn is clockwise; it records lines and true arcs
const pen = () => {
  let x = 0, y = 0, hd = -90
  const cmds = [["M", 0, 0]], pts = [[0, 0]], marks = {}
  const api = {
    fd(len) { x += Math.cos(rad(hd)) * len; y += Math.sin(rad(hd)) * len; cmds.push(["L", x, y]); pts.push([x, y]); return api },
    arc(r, deg) {
      const s = Math.sign(deg)
      const cx = x + Math.cos(rad(hd + 90 * s)) * r, cy = y + Math.sin(rad(hd + 90 * s)) * r
      for (let i = 1; i <= 24; i++) { const a = rad(hd - 90 * s + (deg * i) / 24); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]) }
      hd += deg
      x = cx + Math.cos(rad(hd - 90 * s)) * r; y = cy + Math.sin(rad(hd - 90 * s)) * r
      cmds.push(["A", r, s > 0 ? 1 : 0, x, y]); return api
    },
    mark(name) { marks[name] = pts.length; return api },
    cmds, pts, marks,
  }
  return api
}
// each hump: straight up, round over the top, diagonal down, a tight turn back up. A small lead-in hump, two full ones, then the exit and its wave.
const cursive = ({ humps = [[112, 25, 58], [192, 31, 114], [214, 31, 62]], lean = 148, rho = 9, exit = 112, wave = [48, 98, 120, 34, 0] } = {}) => {
  const p = pen()
  for (const [up, R, down] of humps) p.fd(up).arc(R, lean).fd(down).arc(rho, -lean)
  p.fd(exit).mark("exit")
  if (wave) p.arc(wave[0], wave[1]).arc(wave[2], -wave[3]).fd(wave[4])
  return p
}
const d = (p, k, ox, oy) => p.cmds.map(([c, ...a]) => c === "A" ? `A${f(a[0] * k)} ${f(a[0] * k)} 0 0 ${a[1]} ${f(ox + a[2] * k)} ${f(oy + a[3] * k)}` : `${c}${f(ox + a[0] * k)} ${f(oy + a[1] * k)}`).join("")
const bounds = (pts) => ({ x1: Math.min(...pts.map((q) => q[0])), x2: Math.max(...pts.map((q) => q[0])), y1: Math.min(...pts.map((q) => q[1])), y2: Math.max(...pts.map((q) => q[1])) })
const line = (dd, w, color, extra = "") => `<path d="${dd}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`
const svg = (body, defs = "", bg = BLACK) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="miyage">${defs && `<defs>${defs}</defs>`}${bg ? `<rect width="${S}" height="${S}" fill="${bg}"/>` : ""}${body}</svg>\n`

// rise: the tile is the square. The line comes up from its bottom edge.
const rise = ({ w = 30, top = 76, width = 0.6, standalone = false, p = cursive() } = {}) => {
  const b = bounds(p.pts)
  const k = Math.min((S - top) / -b.y1, (S * width) / (b.x2 - b.x1))
  const ox = (S - (b.x2 - b.x1) * k) / 2 - b.x1 * k + (standalone ? 0 : 14)
  const oy = standalone ? (S + -b.y1 * k) / 2 : S + w
  return (ink) => line(d(p, k, ox, oy), w, ink)
}
// escape: a solid square. The line is cut out of it, then carries on in the square's color once it is through the top.
const escape = ({ w = 22, F0 = 140, F1 = 404, p = cursive({ exit: 156 }), shift = [-28, 12] } = {}) => {
  const side = F1 - F0
  const k = (side + w * 1.4) / -p.pts[p.marks.exit - 1][1]
  const b = bounds(p.pts.slice(0, p.marks.exit))
  const dd = d(p, k, (F0 + F1) / 2 - ((b.x1 + b.x2) / 2) * k, F1 + w)
  const defs = `<mask id="cut"><rect x="${F0}" y="${F0}" width="${side}" height="${side}" fill="#fff"/>${line(dd, w, "#000")}</mask><clipPath id="above"><rect x="0" y="0" width="${S}" height="${F0}"/></clipPath>`
  return { defs, body: (ink) => `<g transform="translate(${shift[0]} ${shift[1]})"><rect x="${F0}" y="${F0}" width="${side}" height="${side}" fill="${ink}" mask="url(#cut)"/>` + line(dd, w, ink, ' clip-path="url(#above)"') + "</g>" }
}

const r = rise({ top: 62 }), rs = rise({ standalone: true, top: 150, width: 0.66 }), e = escape()
const small = rise({ w: 46, top: 96, width: 0.62, p: cursive({ humps: [[170, 38, 104], [226, 38, 70]], rho: 12, exit: 96, wave: null }) })
const es = escape({ w: 40, F0: 120, F1: 416, shift: [-22, 22], p: cursive({ humps: [[170, 40, 104], [226, 40, 70]], rho: 12, exit: 190, wave: [56, 98, 120, 30, 0] }) })
const files = {
  "rise": svg(r(IVORY)), "rise-mark": svg(rs(IVORY), "", null), "rise-mark-dark-ink": svg(rs(BLACK), "", null),
  "escape": svg(e.body(IVORY), e.defs), "escape-mark": svg(e.body(IVORY), e.defs, null), "escape-mark-dark-ink": svg(e.body(BLACK), e.defs, null),
  "small": svg(small(IVORY)), "escape-small": svg(es.body(IVORY), es.defs),
}
for (const [n, s] of Object.entries(files)) writeFileSync(`${out}/${n}.svg`, s)
console.log("ok")
