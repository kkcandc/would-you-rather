import { DARES } from "../src/dares";
import { drawPair, sameProp } from "../src/deck";
import type { Dare } from "../src/dares";

function fail(message: string): never {
  throw new Error(message);
}

const ids = new Set<string>();
for (const dare of DARES) {
  if (ids.has(dare.id)) fail(`duplicate id ${dare.id}`);
  ids.add(dare.id);
  if (dare.prop && !dare.propLabel) fail(`${dare.id} is missing a prop label`);
  if (!dare.prop && dare.propLabel) fail(`${dare.id} has a label without a prop`);
  if (dare.prop === "board") {
    if (dare.seconds < 30 || dare.seconds > 60) fail(`${dare.id} board time ${dare.seconds}`);
  } else if (dare.seconds < 10 || dare.seconds > 20) {
    fail(`${dare.id} time ${dare.seconds} is outside 10–20s`);
  }
}

if (DARES.length < 40) fail(`only ${DARES.length} dares`);
const gross = DARES.filter((dare) => dare.gross).length;
const ratio = gross / DARES.length;
if (ratio < 0.28 || ratio > 0.4) fail(`gross ratio ${ratio.toFixed(2)} is outside about a third`);

const props = ["pillow", "paper", "board", "footwear"];
for (const prop of props) {
  const group = DARES.filter((dare) => dare.prop === prop);
  const others = DARES.filter((dare) => dare.prop !== prop);
  if (group.length < 2) fail(`${prop} should have a pair to avoid`);
  const draw = [...group];
  const discard = [...others];
  const { pair } = drawPair(draw, discard);
  if (sameProp(pair[0], pair[1])) fail(`paired two ${prop} dares while others were available`);
}

const seen = new Map<string, number>();
const draw: Dare[] = [];
const discard: Dare[] = [...DARES];
let avoidableSameProp = 0;
for (let deal = 0; deal < 400; deal += 1) {
  const available = [...draw, ...discard];
  const { pair } = drawPair(draw, discard);
  if (pair[0].id === pair[1].id) fail("dealt the same dare twice");
  if (sameProp(pair[0], pair[1])) {
    const prop = pair[0].prop;
    const alternatives = available.filter((dare) => dare.id !== pair[0].id && dare.prop !== prop);
    if (alternatives.length > 0) avoidableSameProp += 1;
  }
  for (const dare of pair) seen.set(dare.id, (seen.get(dare.id) ?? 0) + 1);
  discard.push(pair[0], pair[1]);
}

if (avoidableSameProp > 0) fail(`${avoidableSameProp} avoidable same-prop pairs`);
const missing = DARES.filter((dare) => !seen.has(dare.id)).map((dare) => dare.id);
if (missing.length > 0) fail(`never dealt: ${missing.join(", ")}`);

console.log(`${DARES.length} dares, ${gross} silly-gross (${Math.round(ratio * 100)}%)`);
