import opentype from "opentype.js"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"

const out = import.meta.dirname + "/round1"
mkdirSync(out, { recursive: true })

const load = (pkg, file) => {
  const buf = readFileSync(new URL(`../node_modules/@fontsource/${pkg}/files/${file}.woff`, import.meta.url))
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}
const geist = load("geist-sans", "geist-sans-latin-600-normal")
const mono = load("geist-mono", "geist-mono-latin-700-normal")
const brico = load("bricolage-grotesque", "bricolage-grotesque-latin-600-normal")

const INK = "#111113", PAPER = "#ffffff", PAPER_DARK = "#0c0c0e", INK_DARK = "#f2f2f0"
const BLUE = "#2f5bff", BLUE_DARK = "#6f8dff"
const RED = "#e5391f", RED_DARK = "#ff5a3c"
const GREEN = "#12824a", GREEN_DARK = "#3fc27c"

const f = (n) => n.toFixed(2)
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(w)} ${f(h)}" role="img" aria-label="miyage">${body}</svg>\n`

// each glyph as a list of closed contours, so a letter's parts can be taken apart
const contours = (font, ch, x, y, size) => {
  const cmds = font.charToGlyph(ch).getPath(x, y, size).commands
  const list = []
  let cur = []
  for (const c of cmds) {
    cur.push(c)
    if (c.type === "Z") { list.push(cur); cur = [] }
  }
  return list
}
const toD = (cmds) =>
  cmds.map((c) =>
    c.type === "Z" ? "Z"
    : c.type === "C" ? `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}`
    : c.type === "Q" ? `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}`
    : `${c.type}${f(c.x)} ${f(c.y)}`).join("")
const bbox = (cmds) => {
  const xs = [], ys = []
  for (const c of cmds) for (const k of ["x", "x1", "x2"]) if (c[k] !== undefined) { xs.push(c[k]); ys.push(c[k.replace("x", "y")]) }
  return { x1: Math.min(...xs), x2: Math.max(...xs), y1: Math.min(...ys), y2: Math.max(...ys) }
}
const adv = (font, ch, size) => (font.charToGlyph(ch).advanceWidth / font.unitsPerEm) * size
const kern = (font, a, b, size) => (font.getKerningValue(font.charToGlyph(a), font.charToGlyph(b)) / font.unitsPerEm) * size

// set a word; returns the ink path, and the tittle of each i kept apart
const word = (font, str, x, y, size, track = 0, lift = false) => {
  let cx = x, d = "", prev
  const tittles = []
  for (const ch of str) {
    if (prev) cx += kern(font, prev, ch, size)
    const cs = contours(font, ch, cx, y, size)
    if (ch === "i") {
      const sorted = cs.toSorted((a, b) => bbox(a).y1 - bbox(b).y1)
      tittles.push({ dot: bbox(sorted[0]), stem: bbox(sorted[1]) })
      d += lift ? toD(sorted[1]) : cs.map(toD).join("")
    } else d += cs.map(toD).join("")
    cx += adv(font, ch, size) + track
    prev = ch
  }
  return { d, end: cx - track, tittles }
}

// ── A · parcel: the dot of the i is the small gift ─────────────────────────
const A = (ink, blue) => {
  const size = 120, base = 118, pad = 10
  const w = word(geist, "miyage", pad, base, size, -3.2, true)
  const { dot, stem } = w.tittles[0]
  const sw = stem.x2 - stem.x1
  const side = sw * 1.75
  const cx = (stem.x1 + stem.x2) / 2
  const y = dot.y2 - side - sw * 0.12
  const body = `<path fill="${ink}" d="${w.d}"/><rect fill="${blue}" x="${f(cx - side / 2)}" y="${f(y)}" width="${f(side)}" height="${f(side)}" rx="${f(side * 0.12)}"/>`
  return { w: w.end + pad, h: base + 38, body }
}
const Aicon = (bg, fg, blue) => {
  const s = 100
  const cs = contours(geist, "i", 0, 0, 96)
  const sorted = cs.toSorted((a, b) => bbox(a).y1 - bbox(b).y1)
  const st = bbox(sorted[1])
  const sw = 18, side = 32, h = 38
  const x = s / 2
  return `<rect width="${s}" height="${s}" rx="22" fill="${bg}"/><rect x="${x - sw / 2}" y="${s - 20 - h}" width="${sw}" height="${h}" fill="${fg}"/><rect x="${x - side / 2}" y="${s - 20 - h - 8 - side}" width="${side}" height="${side}" rx="3.2" fill="${blue}"/>`
}

// ── B · seal: mi / ya / ge, three syllables stacked into a stamp ───────────
const sealBody = (red, paper, s = 100) => {
  const size = 37, lead = 26.5
  const cell = adv(mono, "m", size)
  const blockW = cell * 2
  const xh = (mono.tables.os2.sxHeight / mono.unitsPerEm) * size
  const blockH = lead * 2 + xh
  const x0 = (s - blockW) / 2
  const y0 = (s - blockH) / 2 + xh - 1.5
  let d = ""
  ;["mi", "ya", "ge"].forEach((row, r) => {
    ;[...row].forEach((ch, c) => { d += contours(mono, ch, x0 + c * cell, y0 + r * lead, size).map(toD).join("") })
  })
  return `<rect width="${s}" height="${s}" rx="14" fill="${red}"/><path fill="${paper}" d="${d}"/>`
}
const B = (ink, red, paper) => {
  const s = 100, gap = 22
  const w = word(mono, "miyage", s + gap, 66, 54, -1.5)
  return { w: w.end + 4, h: s, body: sealBody(red, paper) + `<path fill="${ink}" d="${w.d}"/>` }
}

// ── C · ribbon: an m in one line, tied at the middle ──────────────────────
const knot = (ink, green, paper, ox = 0, oy = 0, k = 1) =>
  `<g transform="translate(${ox} ${oy}) scale(${k})"><path d="M17 84 V43 a16.5 16.5 0 0 1 33 0 V84 M50 43 a16.5 16.5 0 0 1 33 0 V84" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><rect x="-10.5" y="-10.5" width="21" height="21" rx="4" transform="translate(50 43) rotate(45)" fill="${green}" stroke="${paper}" stroke-width="5"/></g>`
const C = (ink, green, paper) => {
  const gap = 16
  const w = word(brico, "miyage", 100 + gap, 84, 82, -1.6)
  return { w: w.end + 6, h: 104, body: knot(ink, green, paper, 0, 4) + `<path fill="${ink}" d="${w.d}"/>` }
}
const Cicon = (ink, green, paper) => `<rect width="100" height="100" rx="22" fill="${ink}"/>` + knot(paper, green, ink, 14, 9, 0.72)

const write = (name, w, h, body) => writeFileSync(`${out}/${name}.svg`, svg(w, h, body))
for (const [t, ink, paper, blue, red, green] of [["", INK, PAPER, BLUE, RED, GREEN], ["-dark", INK_DARK, PAPER_DARK, BLUE_DARK, RED_DARK, GREEN_DARK]]) {
  const a = A(ink, blue); write(`a-parcel${t}`, a.w, a.h, a.body)
  write(`a-parcel-icon${t}`, 100, 100, Aicon(ink, paper, blue))
  const b = B(ink, red, PAPER); write(`b-seal${t}`, b.w, b.h, b.body)
  write(`b-seal-icon${t}`, 100, 100, sealBody(red, PAPER))
  const c = C(ink, green, paper); write(`c-furoshiki${t}`, c.w, c.h, c.body)
  write(`c-furoshiki-icon${t}`, 100, 100, Cicon(ink, t ? GREEN : GREEN_DARK, paper))
}
console.log("ok")
