// Round nine: the Endless m, drawn properly. Writes every file and the sheet.
// Run with `node logo/round9/gen.mjs` from brand/; needs rsvg-convert and ImageMagick.
import { writeFileSync, mkdirSync, rmSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { endless, bbox, DRAWINGS, drawingFor } from "./marks.mjs"
import { cord, S } from "./cord.mjs"

const out = import.meta.dirname
const INK = "#000", PAPER = "#f2efe8"
const f = (n) => +n.toFixed(1)

// dark cord on a light ground reads thinner than light on dark at the same weight, so strands get a little heavier
const draw = (size, id, light) => {
  const d = DRAWINGS[size], { loop, over } = endless(d.shape)
  const stroke = d.stroke.n > 1 && light ? { ...d.stroke, w: d.stroke.w * 1.08 } : d.stroke
  return { body: cord(loop, over, stroke, id, d.clear), box: bbox(loop, ((stroke.n - 1) * stroke.gap + stroke.w) / 2) }
}
const open = (vb) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img" aria-label="Miyage">`

// the square icon; with no ground it is the mark alone, placed as in the icon
const icon = (size, bg, fg, id) =>
  open(`0 0 ${S} ${S}`) + (bg ? `<rect width="${S}" height="${S}" fill="${bg}"/>` : "") +
  `<g fill="none" stroke="${fg}">${draw(size, id, fg === INK).body}</g></svg>\n`

// the mark alone, cropped to the cord with a little air
const mark = (size, fg, id) => {
  const { body, box } = draw(size, id, fg === INK), pad = 8
  const [x0, y0, x1, y1] = [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad]
  return open(`${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}`) + `<g fill="none" stroke="${fg}">${body}</g></svg>\n`
}

const suffix = (size) => (size === "full" ? "" : `-${size}`)
const files = {}
for (const size of Object.keys(DRAWINGS)) {
  files[`miyage-icon${suffix(size)}`] = icon(size, INK, PAPER, `i${size}`)
  files[`miyage-icon-light${suffix(size)}`] = icon(size, PAPER, INK, `l${size}`)
  if (size !== "tiny") {
    files[`miyage-mark${suffix(size)}`] = mark(size, PAPER, `m${size}`)
    files[`miyage-mark-black${suffix(size)}`] = mark(size, INK, `b${size}`)
  }
}
for (const dir of ["svg", "png"]) { rmSync(`${out}/${dir}`, { recursive: true, force: true }); mkdirSync(`${out}/${dir}`) }
for (const [k, v] of Object.entries(files)) writeFileSync(`${out}/svg/${k}.svg`, v)

// each pixel size gets the drawing made for it
const render = (svg, w, png) => execFileSync("rsvg-convert", ["-w", String(w), svg, "-o", png])
const SIZES = [1024, 512, 256, 180, 128, 64, 48, 32, 16]
for (const theme of ["", "-light"])
  for (const px of SIZES) render(`${out}/svg/miyage-icon${theme}${suffix(drawingFor(px))}.svg`, px, `${out}/png/miyage-icon${theme}-${px}.png`)
for (const m of ["miyage-mark", "miyage-mark-black"]) render(`${out}/svg/${m}.svg`, 1024, `${out}/png/${m}-1024.png`)
execFileSync("magick", [16, 32, 48].map((px) => `${out}/png/miyage-icon-${px}.png`).concat(`${out}/png/favicon.ico`))

// the sheet, portrait for a phone: large on black, then real pixel sizes on black, on white, and the black mark on paper
const W = 1080, m = 40, big = W - 2 * m, ph = 250, pg = 20, row = [180, 128, 64, 32, 16]
const H = m + big + m + 3 * ph + 2 * pg + m
const tmp = `${out}/.tmp`
mkdirSync(tmp, { recursive: true })
const b64 = (file) => execFileSync("base64", ["-w0", file]).toString()
const img = (file, x, y, w) => `<image x="${x}" y="${y}" width="${w}" height="${w}" href="data:image/png;base64,${b64(file)}"/>`
const bare = (px) => {
  const svg = `${tmp}/bare-${px}.svg`, png = `${tmp}/bare-${px}.png`
  writeFileSync(svg, icon(drawingFor(px), null, INK, "x"))
  render(svg, px, png)
  return png
}
const panel = (i, bg, lc, file) => {
  const y = m + big + m + i * (ph + pg), gaps = (big - 80 - row.reduce((a, b) => a + b)) / (row.length - 1)
  let x = m + 40, s = `<rect x="${m}" y="${y}" width="${big}" height="${ph}" rx="18" fill="${bg}"/>`
  for (const px of row) {
    s += img(file(px), x, y + 24 + 180 - px, px)
    s += `<text x="${x + px / 2}" y="${y + ph - 18}" text-anchor="middle" font-family="Inter" font-size="17" fill="${lc}">${px}</text>`
    x += px + gaps
  }
  return s
}
render(`${out}/svg/miyage-icon.svg`, big * 2, `${tmp}/big.png`)
const sheet =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#0b0b0b"/>` +
  img(`${tmp}/big.png`, m, m, big) +
  `<rect x="${m + 0.5}" y="${m + 0.5}" width="${big - 1}" height="${big - 1}" fill="none" stroke="#262626"/>` +
  panel(0, "#000", "#77746d", (px) => `${out}/png/miyage-icon-${px}.png`) +
  panel(1, "#fff", "#8a877f", (px) => `${out}/png/miyage-icon-${px}.png`) +
  panel(2, PAPER, "#77746d", bare) +
  `</svg>`
writeFileSync(`${tmp}/sheet.svg`, sheet)
render(`${tmp}/sheet.svg`, W, `${out}/sheet.png`)
rmSync(tmp, { recursive: true })
console.log("ok")
