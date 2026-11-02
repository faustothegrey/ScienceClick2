import { test } from "node:test";
import assert from "node:assert/strict";
import { ANSWERS, WORDS, dailyAnswer, scoreGuess } from "./game.ts";

test("correct positions consume letters before misplaced duplicates", () => {
  assert.deepEqual(scoreGuess("MAMMA", "CAMPO"), ["absent", "correct", "correct", "absent", "absent"]);
  assert.deepEqual(scoreGuess("PAPPA", "PALLA"), ["correct", "correct", "absent", "absent", "correct"]);
  assert.deepEqual(scoreGuess("TETTO", "NOTTE"), ["absent", "present", "correct", "correct", "present"]);
});
test("answers are valid five-letter words and daily selection is deterministic", () => {
  for (const word of ANSWERS) { assert.match(word, /^[A-Z]{5}$/); assert.ok(WORDS.includes(word), word); }
  assert.equal(dailyAnswer("2026-11-02"), dailyAnswer("2026-11-02"));
  assert.notEqual(dailyAnswer("2026-11-02"), dailyAnswer("2026-11-03"));
});
