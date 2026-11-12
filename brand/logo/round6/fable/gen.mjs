// Miyage icon concepts, drawn from geometry. Rebuild: bun logo/round6/fable/gen.mjs
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '../../..')
const S = 512
const C = S / 2
const INK = '#F2EEE6'
const SHADE = '#857F76'

const n2 = (v) => +v.toFixed(2)
const poly = (points, fill) => `<path d="M${points.map(([x, y]) => `${n2(x)} ${n2(y)}`).join('L')}Z" fill="${fill}"/>`
const icon = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}"><rect width="${S}" height="${S}" fill="#000"/>${body}</svg>\n`

// A square of paper, its four corners folded to the middle, the top one left open.
// The side flaps meet point to point as a bow; with the bottom flap they spell M.
function bow({ side = 304, shade = SHADE } = {}) {
  const a = C - side / 2, b = C + side / 2
  const lap = 1.2 // the flaps overlap the bottom one, so no dark seam shows between them
  return (
    poly([[a, b], [C, C], [b, b]], shade) +
    poly([[a, a], [C, C], [b, a], [b, b], [b - lap, b], [C, C + lap], [a + lap, b], [a, b]], INK)
  )
}

// One ribbon wound four times around a box: up the front, down the back, up, down.
// Front passes are bright and cover the box's edge; back passes are shaded and sit behind it.
function wound({ left, right, top, bottom, band, wire = 0, shade = SHADE }) {
  const step = (right - left - band) / 4
  const h = wire / 2
  const lean = (step / (bottom - top)) * h
  const pass = (i) => {
    const xa = left + i * step - lean, xb = left + (i + 1) * step + lean
    const [ya, yb] = i % 2 === 0 ? [bottom + h, top - h] : [top - h, bottom + h]
    return [[xa, ya], [xa + band, ya], [xb + band, yb], [xb, yb]]
  }
  const box = wire
    ? `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" fill="none" stroke="${INK}" stroke-width="${wire}"/>`
    : ''
  return poly(pass(1), shade) + poly(pass(3), shade) + box + poly(pass(0), INK) + poly(pass(2), INK)
}
const square = (side) => ({ left: C - side / 2, right: C + side / 2, top: C - side / 2, bottom: C + side / 2 })

const concepts = {
  bow: { icon: bow() },
  // the box is a wire square
  wound: {
    icon: wound({ ...square(292), band: 28, wire: 3.5 }),
    small: wound({ ...square(336), band: 68, shade: '#9A958B' }),
  },
  // the box is the icon itself
  wrapped: {
    icon: wound({ left: 64, right: 448, top: 0, bottom: S, band: 40 }),
    small: wound({ left: 56, right: 456, top: 0, bottom: S, band: 64, shade: '#9A958B' }),
  },
}

const names = Object.keys(concepts)
for (const name of names) {
  const { icon: body, small } = concepts[name]
  writeFileSync(join(here, `${name}.svg`), icon(body))
  if (small) writeFileSync(join(here, `${name}-small.svg`), icon(small))
  const from = (px) => join(here, small && px < 64 ? `${name}-small.svg` : `${name}.svg`)
  for (const px of [512, 32, 16]) execFileSync('rsvg-convert', ['-w', String(px), from(px), '-o', join(here, `${name}-${px}.png`)])
}

// sheet.png: each icon in the iOS mask, then its 32px and 16px renders at true size and the 16 enlarged
const font = opentype.parse(readFileSync(join(root, 'node_modules/@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff')).buffer)
const text = (s, x, y, size, fill) => `<path d="${font.getPath(s, x, y, size).toPathData(2)}" fill="${fill}"/>`
const tile = 400, gap = 56, pad = 64, zoom = 6
const W = pad * 2 + names.length * tile + (names.length - 1) * gap, H = pad + tile + 28 + 16 * zoom + pad
const scratch = join(root, '.scratch/fable-sheet')
mkdirSync(scratch, { recursive: true })
let body = `<rect width="${W}" height="${H}" fill="#0E0E0E"/>`
names.forEach((name, i) => {
  const x = pad + i * (tile + gap), y = pad, rx = n2(tile * 0.2237)
  const inner = readFileSync(join(here, `${name}.svg`), 'utf8').replace(/<svg[^>]*>/, '').replace('</svg>', '')
  body += `<clipPath id="k${i}"><rect x="${x}" y="${y}" width="${tile}" height="${tile}" rx="${rx}"/></clipPath>`
  body += `<g clip-path="url(#k${i})"><g transform="translate(${x} ${y}) scale(${tile / S})">${inner}</g></g>`
  body += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${tile - 1}" height="${tile - 1}" rx="${rx}" fill="none" stroke="#262626"/>`
  const row = y + tile + 28, mid = row + (16 * zoom) / 2
  body += text(`${i + 1}`, x, mid + 7, 20, '#77736B') + text(name, x + 26, mid + 7, 20, '#D8D4CC')
  let right = x + tile
  for (const [px, scale] of [[16, zoom], [16, 1], [32, 1]]) {
    const png = join(scratch, `${name}-${px}x${scale}.png`)
    execFileSync('magick', [join(here, `${name}-${px}.png`), '-filter', 'point', '-resize', `${scale * 100}%`, png])
    const d = px * scale
    right -= d
    body += `<image href="${png}" x="${right}" y="${mid - d / 2}" width="${d}" height="${d}"/>`
    right -= 20
  }
})
const sheet = join(scratch, 'sheet.svg')
writeFileSync(sheet, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${body}</svg>`)
execFileSync('rsvg-convert', [sheet, '-o', join(here, 'sheet.png')])
