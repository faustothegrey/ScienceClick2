import { test } from "node:test";
import assert from "node:assert/strict";
import { applyAction, initialState, rollover, view } from "./shared.ts";

test("players share draft letters, deletion, guesses, and feedback", () => {
  const state = initialState();
  const id = state.daily.id;
  applyAction(state, { type: "key", key: "D" }, id);
  applyAction(state, { type: "key", key: "X" }, id);
  applyAction(state, { type: "key", key: "BACKSPACE" }, id);
  for (const key of "IETA") applyAction(state, { type: "key", key }, id);
  assert.equal(view(state).input, "DIETA");
  assert.equal(view(state).answer, null);
  applyAction(state, { type: "key", key: "ENTER" }, id);
  assert.deepEqual(view(state).guesses, ["DIETA"]);
  assert.equal(view(state).marks.length, 1);
  assert.equal(view(state).input, "");
});
test("invalid guesses and messages are shared without consuming attempts", () => {
  const state = initialState(); const id = state.daily.id;
  for (const key of "ZZZZZ") applyAction(state, { type: "key", key }, id);
  applyAction(state, { type: "key", key: "ENTER" }, id);
  assert.match(view(state).notice, /vocabolario/);
  assert.equal(view(state).guesses.length, 0);
});
test("mode switches preserve daily progress and ignore stale board actions", () => {
  const state = initialState(); const id = state.daily.id;
  applyAction(state, { type: "key", key: "D" }, id);
  applyAction(state, { type: "mode", mode: "practice" }, id);
  const practiceId = view(state).id;
  applyAction(state, { type: "key", key: "X" }, id);
  assert.equal(view(state).input, "");
  applyAction(state, { type: "new" }, practiceId);
  assert.notEqual(view(state).id, practiceId);
  applyAction(state, { type: "mode", mode: "daily" }, view(state).id);
  assert.equal(view(state).input, "D");
});
test("game completion is shared and locks further guesses", () => {
  const state = initialState(); const id = state.daily.id;
  for (const key of state.daily.answer) applyAction(state, { type: "key", key }, id);
  applyAction(state, { type: "key", key: "ENTER" }, id);
  assert.equal(view(state).won, true);
  assert.equal(view(state).answer, state.daily.answer);
  applyAction(state, { type: "key", key: "A" }, id);
  assert.equal(view(state).input, "");
});
test("daily rollover creates a new shared board without resetting practice", () => {
  const state = initialState("2026-11-01");
  const id = state.daily.id, practiceId = state.practice.id;
  rollover(state, "2026-11-02");
  assert.notEqual(state.daily.id, id);
  assert.equal(state.practice.id, practiceId);
  assert.equal(state.revision, 1);
});
