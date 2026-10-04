import type { Dare } from "./dares";

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = current;
  }
  return copy;
}

export function sameProp(a: Dare, b: Dare): boolean {
  return a.prop !== null && a.prop === b.prop;
}

function ensurePlayable(draw: Dare[], discard: Dare[]): boolean {
  if (draw.length >= 2) return false;
  const combined = shuffle([...draw, ...discard]);
  draw.length = 0;
  discard.length = 0;
  draw.push(...combined);
  return true;
}

function takeOne(pile: Dare[], pred: (dare: Dare) => boolean): Dare | undefined {
  const indexes: number[] = [];
  pile.forEach((dare, index) => {
    if (pred(dare)) indexes.push(index);
  });
  if (indexes.length === 0) return undefined;
  const pick = indexes[Math.floor(Math.random() * indexes.length)]!;
  return pile.splice(pick, 1)[0];
}

export function drawPair(
  draw: Dare[],
  discard: Dare[],
  avoid: readonly string[] = [],
): { pair: [Dare, Dare]; reshuffled: boolean } {
  if (draw.length + discard.length < 2) {
    throw new Error("Not enough dares to deal a pair");
  }

  const reshuffled = ensurePlayable(draw, discard);
  const first =
    takeOne(draw, (dare) => !avoid.includes(dare.id)) ?? draw.pop();
  if (!first) throw new Error("Could not draw a dare");

  const second =
    takeOne(draw, (dare) => !sameProp(first, dare) && !avoid.includes(dare.id)) ??
    takeOne(discard, (dare) => !sameProp(first, dare) && !avoid.includes(dare.id)) ??
    takeOne(draw, (dare) => !sameProp(first, dare)) ??
    takeOne(discard, (dare) => !sameProp(first, dare)) ??
    draw.pop() ??
    discard.pop();

  if (!second) throw new Error("Could not draw a second dare");

  const pair: [Dare, Dare] = Math.random() < 0.5 ? [first, second] : [second, first];
  return { pair, reshuffled };
}
