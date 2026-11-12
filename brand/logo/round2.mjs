import opentype from "opentype.js"
import { readFileSync, writeFileSync } from "node:fs"

const out = import.meta.dirname
const load = (pkg, cut) => {
  const buf = readFileSync(new URL(`../node_modules/@fontsource/${pkg}/files/${pkg}-latin-${cut}.woff`, import.meta.url))
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}
const bodoni = load("bodoni-moda", "400-normal")
const instrument = load("instrument-serif", "400-italic")
const geist = load("geist-sans", "300-normal")
const cormorant = load("cormorant-garamond", "300-normal")

const BLACK = "#000000", IVORY = "#f3efe6", GOLD = "#c9b58a"
const f = (n) => n.toFixed(2)
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(w)} ${f(h)}" role="img" aria-label="miyage"><rect width="100%" height="100%" fill="${BLACK}"/>${body}</svg>\n`

// a word centred on cx, tracked in thousandths of an em, as one outline path
const word = (font, str, cx, y, size, tracking = 0, fill = IVORY) => {
  const opts = { kerning: true, tracking }
  const w = font.getAdvanceWidth(str, size, opts) - (tracking / 1000) * size
  return { w, svg: `<path fill="${fill}" d="${font.getPath(str, cx - w / 2, y, size, opts).toPathData(2)}"/>` }
}

const W = 1200, H = 520
const card = (name, body) => writeFileSync(`${out}/${name}.svg`, svg(W, H, body))
const icon = (name, body) => writeFileSync(`${out}/${name}-icon.svg`, svg(200, 200, body))

// A · didone: thick and hairline strokes, set plain
card("a-didone", word(bodoni, "miyage", W / 2, 305, 170, 10).svg)
icon("a-didone", word(bodoni, "m", 100, 132, 130).svg)

// B · italic: one flowing line of handwriting-like serif
card("b-italic", word(instrument, "miyage", W / 2, 305, 200, 0).svg)
icon("b-italic", word(instrument, "m", 100, 136, 170).svg)

// C · arch: a hairline m of two arches over a wide-set light sans
const arch = (cx, top, r, sw, stroke = IVORY) =>
  `<path d="M${cx - 2 * r} ${top + r * 2.1} V${top + r} a${r} ${r} 0 0 1 ${2 * r} 0 V${top + r * 2.1} M${cx} ${top + r} a${r} ${r} 0 0 1 ${2 * r} 0 V${top + r * 2.1}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="butt"/>`
card("c-arch", arch(W / 2, 128, 42, 2.5) + word(geist, "miyage", W / 2, 372, 54, 420).svg)
icon("c-arch", arch(100, 56, 38, 3))

// D · ring: a small m in a hairline ring, the name in a light old-style serif, in gold
const ring = (cx, cy, r, sw) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${GOLD}" stroke-width="${sw}"/>`
card("d-ring", ring(W / 2, 178, 62, 1.6) + word(cormorant, "m", W / 2, 204, 92, 0, GOLD).svg + word(cormorant, "miyage", W / 2, 372, 66, 300).svg)
icon("d-ring", ring(100, 100, 72, 2.2) + word(cormorant, "m", 100, 130, 108, 0, GOLD).svg)
console.log("ok")
