// Round eight: writes each candidate at every size range, then the sheet.
// Run with `node logo/round8/gen.mjs` from brand/; needs rsvg-convert.
import { writeFileSync, mkdirSync, rmSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { marks } from "./marks.mjs"
import { svg } from "./cord.mjs"

const out = import.meta.dirname
const order = Object.keys(marks)
// 256px and up gets the full cord, 48 to 255 three strands, under 48 one band
const ranges = { "": "full", "-mid": "mid", "-small": "band" }
for (const k of order) for (const [suf, size] of Object.entries(ranges)) writeFileSync(`${out}/${k}${suf}.svg`, svg(marks[k](size), k + suf))

const W = 1200, tile = 520, gap = 40, pad = (W - 2 * tile - gap) / 2
const H = 64 + tile + 26 + 64 + 64
const png = (file, w) => "data:image/png;base64," + execFileSync("rsvg-convert", ["-w", String(w), `${out}/${file}.svg`]).toString("base64")
const tiles = order
  .map((k, i) => {
    const x = pad + i * (tile + gap), y = 64
    const r = (n) => Math.round(n)
    return (
      `<text x="${x}" y="44" font-family="Inter" font-size="26" font-weight="600" fill="#f2efe8">${i + 1}</text>` +
      `<image x="${x}" y="${y}" width="${tile}" height="${tile}" href="${png(k, tile * 2)}"/>` +
      `<rect x="${x}" y="${y}" width="${tile}" height="${tile}" fill="none" stroke="#2a2a2a"/>` +
      `<image x="${x}" y="${y + tile + 26}" width="64" height="64" href="${png(k + "-mid", 64)}"/>` +
      `<image x="${x + 84}" y="${y + tile + 26 + 32}" width="32" height="32" href="${png(k + "-small", 32)}"/>` +
      `<text x="${r(x + 136)}" y="${y + tile + 26 + 38}" font-family="Inter" font-size="18" fill="#8a877f">64 · 32</text>`
    )
  })
  .join("")
mkdirSync(`${out}`, { recursive: true })
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#0b0b0b"/>${tiles}</svg>`
writeFileSync(`${out}/sheet.svg`, sheet)
execFileSync("rsvg-convert", ["-w", String(W), `${out}/sheet.svg`, "-o", `${out}/sheet.png`])
rmSync(`${out}/sheet.svg`)
console.log("ok")
