// Round six: one cord of strands, like the mizuhiki cord tied on a Japanese gift, written as a cursive m.
// It comes up through the floor of the square and sweeps out through its right side.
// Rebuild with `bun logo/round6/gen.mjs` from brand/.
import { writeFileSync } from "node:fs"
import { path, cord, band, svg } from "./mizuhiki.mjs"

const out = import.meta.dirname
// one drawing per size range, so the strands never drop under about 1.5px
const sizes = {
  // 180px and up
  icon: { geo: { x: 146, base: 330, r: 21 }, strands: { n: 5, gap: 8.5, w: 3 } },
  // 65 to 179px
  "icon-mid": { geo: { x: 140, base: 336, xh: 200, R: 50, r: 30, foot: 44 }, strands: { n: 3, gap: 20, w: 10 } },
  // 64px and down: one band, a plain m
  "icon-small": { geo: { x: 150, base: 344, xh: 210, R: 62, r: 0, foot: 46, sweep: 150 }, w: 46 },
}
const draw = ({ geo, strands, w }) => (strands ? cord(path(geo), strands) : band(path(geo), w))

for (const [name, spec] of Object.entries(sizes)) writeFileSync(`${out}/${name}.svg`, svg(draw(spec), { id: name }))
writeFileSync(`${out}/mark.svg`, svg(draw(sizes.icon), { id: "mark", bg: null }))
writeFileSync(`${out}/mark-ink.svg`, svg(draw(sizes.icon), { id: "mark-ink", bg: null, ink: "#000000" }))
writeFileSync(`${out}/mark-mid.svg`, svg(draw(sizes["icon-mid"]), { id: "mark-mid", bg: null }))
writeFileSync(`${out}/mark-mid-ink.svg`, svg(draw(sizes["icon-mid"]), { id: "mark-mid-ink", bg: null, ink: "#000000" }))
console.log("ok")
