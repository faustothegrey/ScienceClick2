import { test } from "node:test";
import assert from "node:assert/strict";
import { boxFromPoints, clampBox, iou, matchBox, snapToTarget, type Box } from "./geometry.ts";
import { judgeName, normalizeWord, SHAPE_NAMES } from "./vocabulary.ts";
import { remaining, shapesIn, shuffled } from "./game.ts";
import { streetScene } from "./scenes/street.ts";

const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });

test("boxFromPoints works in any drag direction", () => {
  assert.deepEqual(boxFromPoints({ x: 50, y: 80 }, { x: 10, y: 20 }), box(10, 20, 40, 60));
  assert.deepEqual(boxFromPoints({ x: 10, y: 80 }, { x: 50, y: 20 }), box(10, 20, 40, 60));
});

test("clampBox keeps boxes inside the scene", () => {
  assert.deepEqual(clampBox(box(-20, 850, 100, 100), 1600, 900), box(0, 850, 80, 50));
});

test("iou: identical, disjoint, half", () => {
  assert.equal(iou(box(0, 0, 10, 10), box(0, 0, 10, 10)), 1);
  assert.equal(iou(box(0, 0, 10, 10), box(20, 20, 10, 10)), 0);
  assert.equal(iou(box(0, 0, 10, 10), box(0, 0, 10, 5)), 0.5);
  assert.equal(iou(box(0, 0, 0, 0), box(0, 0, 0, 0)), 0);
});

test("small edge errors snap onto the target", () => {
  const t = box(100, 100, 40, 40);
  assert.deepEqual(snapToTarget(box(95, 108, 50, 30), t), t);
  assert.deepEqual(snapToTarget(box(60, 100, 80, 40), t), box(60, 100, 80, 40));
});

test("a small target framed with finger-sized errors still matches", () => {
  // Street plate: 125×36.
  const match = matchBox(box(407, 463, 140, 50), streetScene.targets);
  assert.equal(match.kind === "match" && match.target.id, "targa-via");
});

test("matching picks the nested target the box actually fits", () => {
  const triangle = matchBox(box(963, 305, 75, 76), streetScene.targets);
  assert.equal(triangle.kind === "match" && triangle.target.id, "triangolo-pedoni");
  const sign = matchBox(box(948, 288, 104, 104), streetScene.targets);
  assert.equal(sign.kind === "match" && sign.target.id, "cartello-pedoni");
});

test("a window framed together with its open shutters still matches", () => {
  const m = matchBox(box(28, 230, 164, 144), streetScene.targets);
  assert.equal(m.kind === "match" && m.target.id, "palazzo-finestra-1");
});

test("a box around a car wheel's rim still finds the wheel", () => {
  const rim = 46 * 0.74;
  const m = matchBox(box(665 - rim, 828 - rim, 2 * rim, 2 * rim), streetScene.targets);
  assert.equal(m.kind === "match" && m.target.id, "auto-ruota-davanti");
});

test("boxes on nothing, or a whole object, don't match", () => {
  assert.equal(matchBox(box(700, 10, 60, 30), streetScene.targets).kind, "none");
  // The whole car is not one shape.
  assert.equal(matchBox(box(290, 676, 482, 200), streetScene.targets).kind, "none");
});

test("a box straddling two equal fits is ambiguous", () => {
  const targets = [
    { id: "a", box: box(0, 0, 100, 100) },
    { id: "b", box: box(100, 0, 100, 100) },
  ];
  // Each overlaps by 1/3: below threshold, so no match rather than a guess.
  assert.equal(matchBox(box(50, 0, 100, 100), targets).kind, "none");
  const close = matchBox(box(0, 0, 100, 100), [
    { id: "a", box: box(0, 0, 100, 100) },
    { id: "b", box: box(0, 0, 100, 95) },
  ]);
  assert.equal(close.kind, "ambiguous");
});

test("normalizeWord strips case, spaces and articles", () => {
  assert.equal(normalizeWord("  Un   OROLOGIO "), "orologio");
  assert.equal(normalizeWord("la porta"), "porta");
  assert.equal(normalizeWord("l'orologio"), "orologio");
  assert.equal(normalizeWord("le finestre"), "finestre");
  assert.equal(normalizeWord("La ruota dell' auto"), "ruota dell'auto");
});

test("judgeName accepts any listed name and never silently accepts a wrong one", () => {
  const names = ["finestra", "finestrella"];
  assert.deepEqual(judgeName("finestra", names), { kind: "correct" });
  assert.deepEqual(judgeName("una finestrella", names), { kind: "correct" });
  assert.deepEqual(judgeName("finesta", names), { kind: "spelling", closest: "finestra" });
  assert.deepEqual(judgeName("finestre", names), { kind: "spelling", closest: "finestra" });
  assert.deepEqual(judgeName("porta", names), { kind: "wrong" });
  assert.deepEqual(judgeName("   ", names), { kind: "wrong" });
});

test("the no-parking sign accepts every reasonable description", () => {
  const sign = streetScene.targets.find((t) => t.id === "cartello-divieto")!;
  for (const answer of ["cartello", "un cartello stradale", "Segnale stradale", "il divieto di sosta", "divieto"]) {
    assert.deepEqual(judgeName(answer, sign.names), { kind: "correct" }, answer);
  }
  assert.deepEqual(judgeName("ruota", sign.names), { kind: "wrong" });
});

test("game: shapes in the scene, shuffling, what is left", () => {
  assert.deepEqual([...shapesIn(streetScene)].sort(), [...SHAPE_NAMES].sort());
  assert.deepEqual([...shuffled(SHAPE_NAMES, () => 0)].sort(), [...SHAPE_NAMES].sort());
  const circles = streetScene.targets.filter((t) => t.shape === "cerchio");
  assert.equal(remaining(streetScene, "cerchio", new Set()).length, circles.length);
  assert.equal(remaining(streetScene, "cerchio", new Set(circles.map((t) => t.id))).length, 0);
});

test("street scene: unique ids, targets inside the scene, shapes look like their names", () => {
  const ids = new Set(streetScene.targets.map((t) => t.id));
  assert.equal(ids.size, streetScene.targets.length);
  for (const t of streetScene.targets) {
    const { x, y, width, height } = t.box;
    assert.ok(x >= 0 && y >= 0 && x + width <= streetScene.width && y + height <= streetScene.height, t.id);
    const ratio = Math.max(width, height) / Math.min(width, height);
    if (t.shape === "quadrato" || t.shape === "cerchio") assert.equal(ratio, 1, t.id);
    if (t.shape === "rettangolo") assert.ok(ratio >= 1.6, `${t.id} is too square (${ratio.toFixed(2)})`);
    // Every target must be big enough to frame comfortably.
    assert.ok(Math.min(width, height) >= 34, t.id);
  }
});

test("street scene: every object has normalized names", () => {
  for (const t of streetScene.targets) {
    assert.ok(t.names.length > 0, t.id);
    for (const name of t.names) assert.equal(normalizeWord(name), name, `${t.id}: ${name}`);
  }
});

test("street scene: every target matches itself unambiguously", () => {
  for (const t of streetScene.targets) {
    const m = matchBox(t.box, streetScene.targets);
    assert.equal(m.kind === "match" && m.target.id, t.id, t.id);
  }
});
