// Round nine: the Endless m, drawn properly. Writes every file and the sheet.
// Run with `node logo/round9/gen.mjs` from brand/; needs rsvg-convert and ImageMagick.
import { writeFileSync, mkdirSync, rmSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { endless, bbox, DRAWINGS } from "./marks.mjs"
import { cord, S } from "./cord.mjs"

const out = import.meta.dirname
const INK = "#000", PAPER = "#f2efe8"
const f = (n) => +n.toFixed(1)

const draw = (size, id) => {
  const d = DRAWINGS[size], { loop, over } = endless(d.shape)
  const half = ((d.stroke.n - 1) * d.stroke.gap + d.stroke.w) / 2
  return { body: cord(loop, over, d.stroke, id, d.clear), box: bbox(loop, half) }
}

// the square icon, cord on a filled square
const icon = (size, bg, fg, id) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="Miyage">` +
  `<rect width="${S}" height="${S}" fill="${bg}"/><g fill="none" stroke="${fg}">${draw(size, id).body}</g></svg>\n`

// the mark alone on a transparent background, cropped to the cord with a little air
const mark = (size, fg, id) => {
  const { body, box } = draw(size, id), pad = 8
  const [x0, y0, x1, y1] = [box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad]
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}" role="img" aria-label="Miyage">` +
    `<g fill="none" stroke="${fg}">${body}</g></svg>\n`
  )
}

const files = {
  "miyage-icon": icon("full", INK, PAPER, "a"),
  "miyage-icon-mid": icon("mid", INK, PAPER, "b"),
  "miyage-icon-small": icon("small", INK, PAPER, "c"),
  "miyage-icon-light": icon("full", PAPER, INK, "d"),
  "miyage-icon-light-mid": icon("mid", PAPER, INK, "e"),
  "miyage-icon-light-small": icon("small", PAPER, INK, "g"),
  "miyage-mark": mark("full", PAPER, "h"),
  "miyage-mark-mid": mark("mid", PAPER, "i"),
  "miyage-mark-small": mark("small", PAPER, "j"),
  "miyage-mark-black": mark("full", INK, "k"),
  "miyage-mark-black-mid": mark("mid", INK, "l"),
  "miyage-mark-black-small": mark("small", INK, "n"),
}
for (const dir of ["svg", "png"]) { rmSync(`${out}/${dir}`, { recursive: true, force: true }); mkdirSync(`${out}/${dir}`) }
for (const [k, v] of Object.entries(files)) writeFileSync(`${out}/svg/${k}.svg`, v)

// each pixel size gets the drawing made for it
const pick = (px) => (px >= 180 ? "" : px >= 64 ? "-mid" : "-small")
const render = (svg, w, png) => execFileSync("rsvg-convert", ["-w", String(w), svg, "-o", png])
for (const theme of ["", "-light"]) {
  for (const px of [1024, 512, 180, 128, 64, 48, 32, 16]) render(`${out}/svg/miyage-icon${theme}${pick(px)}.svg`, px, `${out}/png/miyage-icon${theme}-${px}.png`)
}
for (const m of ["miyage-mark", "miyage-mark-black"]) render(`${out}/svg/${m}.svg`, 1024, `${out}/png/${m}-1024.png`)
execFileSync("magick", [16, 32, 48].map((px) => `${out}/png/miyage-icon-${px}.png`).concat(`${out}/png/favicon.ico`))

// the sheet: large on black, then real pixel sizes on black, on white, and the black mark on paper
const W = 1600, H = 960, big = 800, m = 80
const b64 = (file) => execFileSync("base64", ["-w0", file]).toString()
const img = (file, x, y, w, h = w) => `<image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${b64(file)}"/>`
const label = (x, y, t, c) => `<text x="${x}" y="${y}" font-family="Inter" font-size="16" fill="${c}">${t}</text>`
const px = [180, 64, 32, 16], tmp = `${out}/.tmp`
mkdirSync(tmp, { recursive: true })
const panel = (i, bg, lc, file) => {
  const ph = 256, gap = 16, y = m + i * (ph + gap), x0 = big + m + 40
  let x = x0 + 40, s = `<rect x="${x0}" y="${y}" width="${W - x0 - m}" height="${ph}" rx="18" fill="${bg}"/>`
  for (const p of px) {
    const [f, w, h] = file(p)
    s += img(f, x, y + 26 + 180 - h, w, h) + label(x, y + ph - 18, `${p}`, lc)
    x += w + 48
  }
  return s
}
// the mark keeps its proportions; its width is the size
const markPng = (p) => {
  const f = `${tmp}/mark-${p}.png`
  render(`${out}/svg/miyage-mark-black${pick(p)}.svg`, p, f)
  const [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", f]).toString().split(" ").map(Number)
  return [f, w, h]
}
render(`${out}/svg/miyage-icon.svg`, big * 2, `${tmp}/big.png`)
const sheet =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#0b0b0b"/>` +
  img(`${tmp}/big.png`, m, m, big) +
  `<rect x="${m}" y="${m}" width="${big}" height="${big}" fill="none" stroke="#262626"/>` +
  panel(0, "#000", "#77746d", (p) => [`${out}/png/miyage-icon-${p}.png`, p, p]) +
  panel(1, "#fff", "#8a877f", (p) => [`${out}/png/miyage-icon-${p}.png`, p, p]) +
  panel(2, PAPER, "#77746d", markPng) +
  `</svg>`
writeFileSync(`${tmp}/sheet.svg`, sheet)
render(`${tmp}/sheet.svg`, W, `${out}/sheet.png`)
rmSync(tmp, { recursive: true })
console.log("ok")
