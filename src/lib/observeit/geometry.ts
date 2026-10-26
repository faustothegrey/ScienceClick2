// Pure geometry for ObserveIt: boxes, overlap and matching.
// All values are in scene units (the SVG viewBox), never screen pixels.

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BoxTarget {
  id: string;
  box: Box;
}

// A box counts as "on" a target from this overlap upwards (the usual detection threshold).
export const MATCH_IOU = 0.5;
// A second target this close to the best one makes the box ambiguous.
export const AMBIGUITY_MARGIN = 0.1;
// Edges this close to the target's edges count as exact, so tiny finger errors
// don't count. Absolute, so small targets aren't punished more than big ones.
export const EDGE_SLACK = 12;

export function boxFromPoints(a: Point, b: Point): Box {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    width: Math.abs(a.x - b.x),
    height: Math.abs(a.y - b.y),
  };
}

export function clampBox(box: Box, width: number, height: number): Box {
  const x1 = Math.max(0, Math.min(width, box.x));
  const y1 = Math.max(0, Math.min(height, box.y));
  const x2 = Math.max(0, Math.min(width, box.x + box.width));
  const y2 = Math.max(0, Math.min(height, box.y + box.height));
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

export function area(box: Box): number {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

export function iou(a: Box, b: Box): number {
  const ix = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const inter = ix * iy;
  const union = area(a) + area(b) - inter;
  return union > 0 ? inter / union : 0;
}

// Moves each edge of `box` onto the matching edge of `target` when within `slack`.
export function snapToTarget(box: Box, target: Box, slack = EDGE_SLACK): Box {
  const snap = (v: number, t: number) => (Math.abs(v - t) <= slack ? t : v);
  const x1 = snap(box.x, target.x);
  const y1 = snap(box.y, target.y);
  const x2 = snap(box.x + box.width, target.x + target.width);
  const y2 = snap(box.y + box.height, target.y + target.height);
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

// Overlap after forgiving small edge errors.
export function fitScore(box: Box, target: Box): number {
  return iou(snapToTarget(box, target), target);
}

export type BoxMatch<T extends BoxTarget> =
  | { kind: "none" }
  | { kind: "ambiguous"; candidates: T[] }
  | { kind: "match"; target: T; score: number };

export function matchBox<T extends BoxTarget>(box: Box, targets: readonly T[]): BoxMatch<T> {
  const ranked = targets
    .map((target) => ({ target, score: fitScore(box, target.box) }))
    .filter((r) => r.score >= MATCH_IOU)
    .sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return { kind: "none" };
  const [best, second] = ranked;
  if (second && best.score - second.score < AMBIGUITY_MARGIN) {
    return { kind: "ambiguous", candidates: ranked.filter((r) => best.score - r.score < AMBIGUITY_MARGIN).map((r) => r.target) };
  }
  return { kind: "match", target: best.target, score: best.score };
}
