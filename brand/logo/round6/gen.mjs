// Round six: one cord of strands, like the mizuhiki cord tied on a Japanese gift, written as a cursive m.
// It comes up through the floor of the square and sweeps out through its right side.
// Rebuild with `bun logo/round6/gen.mjs` from brand/.
import { writeFileSync } from "node:fs"
import { path, cord, svg } from "./mizuhiki.mjs"

const out = import.meta.dirname
// one drawing per size range, so the strands never drop under about 1.5px
const sizes = {
  // 180px and up
  icon: { geo: { x: 146, base: 330, r: 21 }, strands: { n: 5, gap: 8.5, w: 3 } },
  // 88 to 179px: same stems, baseline and tail
  "icon-mid": { geo: { x: 146, base: 330, R: 39, r: 27 }, strands: { n: 3, gap: 17, w: 8 } },
  // 40 to 87px: two strands, rounder arches so the counters stay open
  "icon-small": { geo: { x: 146, base: 330, R: 46, r: 33 }, strands: { n: 2, gap: 34, w: 18 } },
  // 39px and down: one band, a plain m
  "icon-tiny": { geo: { x: 150, base: 344, xh: 210, R: 62, r: 0, foot: 46, sweep: 150 }, strands: { n: 1, gap: 0, w: 48 } },
}
const draw = ({ geo, strands }) => cord(path(geo), strands)

for (const [name, spec] of Object.entries(sizes)) writeFileSync(`${out}/${name}.svg`, svg(draw(spec), { id: name }))
console.log("ok")
