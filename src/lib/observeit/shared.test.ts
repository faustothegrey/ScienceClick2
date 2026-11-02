import { test } from "node:test";
import assert from "node:assert/strict";
import { initialHunt, applyHunt, validHuntAction, type HuntAction } from "./shared.ts";
import { streetScene as scene } from "./scenes/street.ts";

function game() {
  const s = initialHunt(scene);
  const act = (action: HuntAction) => applyHunt(s, scene, action, s.turn);
  const target = scene.targets.find(t => t.shape === s.order[0])!;
  function name(word: string) {
    act({ type: "box", box: target.box, final: true });
    while (s.word.length) act({ type: "backspace" });
    for (const letter of word) act({ type: "letter", letter });
    act({ type: "submit" });
  }
  return { s, act, target, name };
}
test("draft box, finalized selection, letters, and discovery are shared", () => {
  const { s, act, target, name } = game();
  act({ type: "box", box: target.box, final: false });
  assert.deepEqual(s.box, target.box);
  assert.equal(s.phase.name, "draw");
  name(target.names[0]);
  assert.equal(s.found[target.id].how, "named");
  assert.equal(s.notice?.title, "Esatto!");
  assert.equal(s.box, null);
  assert.equal(s.word, "");
});
test("wrong names count once; stale submissions and old drawing updates are ignored", () => {
  const { s, act, target } = game();
  act({ type: "box", box: target.box, final: true });
  for (const letter of "zzzz") act({ type: "letter", letter });
  const old = s.turn;
  act({ type: "submit" });
  assert.equal(s.attempts[target.id], 1);
  applyHunt(s, scene, { type: "submit" }, old);
  applyHunt(s, scene, { type: "box", box: null, final: true }, old);
  assert.equal(s.attempts[target.id], 1);
  assert.deepEqual(s.box, target.box);
});
test("three wrong names reveal the object, and teacher can accept the written word", () => {
  const { s, act, target, name } = game();
  for (let i = 0; i < 3; i++) name("zzzz");
  assert.equal(s.found[target.id].how, "revealed");
  assert.equal(s.notice?.attempt, 3);
  act({ type: "accept" });
  assert.deepEqual(s.found[target.id], { how: "accepted", label: "zzzz" });
});
test("wrong shape and empty selections do not consume naming attempts", () => {
  const { s, act } = game();
  const other = scene.targets.find(t => t.shape !== s.order[0])!;
  act({ type: "box", box: other.box, final: true });
  act({ type: "letter", letter: "x" }); act({ type: "submit" });
  assert.equal(Object.keys(s.attempts).length, 0);
  assert.match(s.notice!.title, /non è/);
  act({ type: "box", box: { x: 0, y: 0, width: 5, height: 5 }, final: true });
  assert.equal(s.phase.name, "draw"); assert.equal(s.box, null);
});
test("all-shapes flow ends for everyone and restart clears discoveries and attempts", () => {
  const { s, act } = game();
  act({ type: "none" });
  assert.equal(s.round, 0); assert.match(s.notice!.title, /Guarda/);
  for (const shape of s.order) {
    for (const t of scene.targets.filter(t => t.shape === shape)) {
      act({ type: "box", box: t.box, final: true });
      for (const letter of t.names[0]) act({ type: "letter", letter });
      act({ type: "submit" });
      assert.ok(s.found[t.id], t.id);
    }
    act({ type: "none" });
  }
  assert.equal(s.phase.name, "finished");
  const old = s.turn; act({ type: "restart" });
  assert.notEqual(s.turn, old); assert.equal(s.round, 0);
  assert.deepEqual(s.found, {}); assert.deepEqual(s.attempts, {});
  assert.equal(s.phase.name, "draw");
});
test("API validates box bounds, finite coordinates, letter limits, and action types", () => {
  assert.ok(validHuntAction({ type: "letter", letter: "à" }, scene));
  assert.ok(!validHuntAction({ type: "letter", letter: "hello" }, scene));
  for (const x of [-1, Infinity, NaN, scene.width]) assert.ok(!validHuntAction({ type: "box", box: { x, y: 0, width: 20, height: 20 }, final: true }, scene));
  assert.ok(!validHuntAction({ type: "deleteEverything" }, scene));
});
