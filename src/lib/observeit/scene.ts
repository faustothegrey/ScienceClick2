import type { Box, BoxTarget } from "./geometry";
import type { ShapeName } from "./vocabulary";

// Outer outline of a target in scene units. The illustration draws each object
// from this same geometry (details stay inside it), so the answer boxes can
// never drift from what is on screen.
export type Geometry =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number }
  | { kind: "polygon"; points: ReadonlyArray<readonly [number, number]> };

export interface SceneTarget extends BoxTarget {
  shape: ShapeName;
  geometry: Geometry;
}

export interface Scene {
  id: string;
  title: string;
  width: number;
  height: number;
  targets: SceneTarget[];
}

export function boundsOf(g: Geometry): Box {
  switch (g.kind) {
    case "circle":
      return { x: g.cx - g.r, y: g.cy - g.r, width: 2 * g.r, height: 2 * g.r };
    case "rect":
      return { x: g.x, y: g.y, width: g.width, height: g.height };
    case "polygon": {
      const xs = g.points.map(([x]) => x);
      const ys = g.points.map(([, y]) => y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);
      return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
    }
  }
}

export function target(id: string, shape: ShapeName, geometry: Geometry): SceneTarget {
  return { id, shape, geometry, box: boundsOf(geometry) };
}

export const circle = (cx: number, cy: number, r: number): Geometry => ({ kind: "circle", cx, cy, r });
export const rect = (x: number, y: number, width: number, height: number): Geometry => ({ kind: "rect", x, y, width, height });
export const polygon = (...points: Array<[number, number]>): Geometry => ({ kind: "polygon", points });
