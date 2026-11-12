import opentype from "opentype.js"
import { readFileSync, writeFileSync } from "node:fs"

const out = import.meta.dirname
const load = (pkg, cut) => {
  const buf = readFileSync(new URL(`../node_modules/@fontsource/${pkg}/files/${pkg}-latin-${cut}.woff`, import.meta.url))
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
}
const BLACK = "#000000", IVORY = "#f3efe6"
const S = 512
const svg = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="miyage"><rect width="${S}" height="${S}" fill="${BLACK}"/>${body}</svg>\n`

// one letter, centred in the square by its own outline rather than its advance box
const letter = (font, ch, height) => {
  const g = font.charToGlyph(ch)
  const b0 = g.getPath(0, 0, 1000).getBoundingBox()
  const size = (height / (b0.y2 - b0.y1)) * 1000
  const b = g.getPath(0, 0, size).getBoundingBox()
  const d = g.getPath(S / 2 - (b.x1 + b.x2) / 2, S / 2 - (b.y1 + b.y2) / 2, size).toPathData(2)
  return `<path fill="${IVORY}" d="${d}"/>`
}
// an m drawn as two arches in one line weight
const arches = (r, sw, leg) => {
  const top = S / 2 - (r + leg) / 2, cx = S / 2
  return `<path d="M${cx - 2 * r} ${top + r + leg} V${top + r} a${r} ${r} 0 0 1 ${2 * r} 0 V${top + r + leg} M${cx} ${top + r} a${r} ${r} 0 0 1 ${2 * r} 0 V${top + r + leg}" fill="none" stroke="${IVORY}" stroke-width="${sw}"/>`
}

const marks = {
  "1-italic": letter(load("instrument-serif", "400-italic"), "m", 190),
  "2-serif": letter(load("bodoni-moda", "400-normal"), "m", 170),
  "3-capital": letter(load("bodoni-moda", "400-normal"), "M", 230),
  "4-hairline": arches(84, 6, 100),
  "5-arches": arches(80, 30, 96),
  "6-thin": letter(load("geist-sans", "200-normal"), "m", 170),
}
for (const [name, body] of Object.entries(marks)) writeFileSync(`${out}/${name}.svg`, svg(body))
console.log("ok")
