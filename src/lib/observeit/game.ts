import type { Scene, SceneTarget } from "./scene.ts";
import { SHAPE_NAMES, type ShapeName } from "./vocabulary.ts";

// Rules of the hunt: one shape at a time, in a random order; a shape is done
// when the student says "there are no more" and every target of it is found.

export function shapesIn(scene: Scene): ShapeName[] {
  return SHAPE_NAMES.filter((shape) => scene.targets.some((t) => t.shape === shape));
}

export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function remaining(scene: Scene, shape: ShapeName, found: { has(id: string): boolean }): SceneTarget[] {
  return scene.targets.filter((t) => t.shape === shape && !found.has(t.id));
}

// Wrong names allowed per object before the app reveals it.
export const MAX_ATTEMPTS = 3;

// How an object came to be found: named by the student, accepted by the
// teacher (with the student's own word), or revealed after the last attempt.
export interface Discovery {
  label: string;
  how: "named" | "accepted" | "revealed";
}
