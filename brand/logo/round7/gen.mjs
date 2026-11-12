// Round seven: the round-six cord, with the m redrawn as a true three-stem m.
// Rebuild with `bun logo/round7/gen.mjs` from brand/.
import { writeFileSync, rmSync } from "node:fs"
import { path, cord, svg } from "./mizuhiki.mjs"

const out = import.meta.dirname
// one drawing per size range, so no strand drops under about 1.5px; strand counts stay odd, as on a gift
const sizes = {
  // 256px and up
  icon: { geo: {}, strands: { n: 5, gap: 8.5, w: 3 } },
  // 88 to 255px
  "icon-mid": { geo: {}, strands: { n: 3, gap: 17, w: 9 } },
  // 87px and down: one band, a plain m
  "icon-small": { geo: { x: 142, D: 128, a: 64, base: 350, foot: 46, sweep: 150 }, strands: { n: 1, gap: 0, w: 50 } },
}
for (const [name, { geo, strands }] of Object.entries(sizes)) writeFileSync(`${out}/${name}.svg`, svg(cord(path(geo), strands), { id: name }))
rmSync(`${out}/icon-tiny.svg`, { force: true })
console.log("ok")
