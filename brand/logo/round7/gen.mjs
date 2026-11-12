// Round seven: the round-six cord, with the m redrawn as a true three-stem m.
// Rebuild with `bun logo/round7/gen.mjs` from brand/.
import { writeFileSync } from "node:fs"
import { path, cord, svg } from "./mizuhiki.mjs"

const out = import.meta.dirname
// one drawing per size range, so the strands never drop under about 1.5px
const sizes = {
  // 180px and up
  icon: { geo: {}, strands: { n: 5, gap: 8.5, w: 3, knock: 6 } },
  // 88 to 179px
  "icon-mid": { geo: {}, strands: { n: 3, gap: 17, w: 8, knock: 8 } },
  // 40 to 87px
  "icon-small": { geo: {}, strands: { n: 2, gap: 32, w: 18, knock: 10 } },
  // 39px and down: one band, a plain m
  "icon-tiny": { geo: { x: 142, base: 350, xh: 190, D: 128, a: 64, foot: 46, sweep: 150 }, strands: { n: 1, gap: 0, w: 50, knock: 12 } },
}
for (const [name, { geo, strands }] of Object.entries(sizes)) writeFileSync(`${out}/${name}.svg`, svg(cord(path(geo), strands), { id: name }))
console.log("ok")
