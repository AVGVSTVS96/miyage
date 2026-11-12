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
  // 88 to 179px: same stems, tail and box
  "icon-mid": { geo: { x: 146, base: 330, R: 40.5, r: 24 }, strands: { n: 3, gap: 17, w: 8 } },
  // 87px and down: two strands, rounder arches so the counters stay open
  "icon-small": { geo: { x: 146, base: 330, R: 46, r: 30 }, strands: { n: 2, gap: 36, w: 22 } },
}
const draw = ({ geo, strands }) => cord(path(geo), strands)

for (const [name, spec] of Object.entries(sizes)) writeFileSync(`${out}/${name}.svg`, svg(draw(spec), { id: name }))
console.log("ok")
