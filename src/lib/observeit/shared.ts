import { randomUUID } from "node:crypto";
import { matchBox, type Box } from "./geometry.ts";
import { MAX_ATTEMPTS, remaining, shapesIn, shuffled, type Discovery } from "./game.ts";
import { judgeName, normalizeWord, type ShapeName } from "./vocabulary.ts";
import type { Scene, SceneTarget } from "./scene.ts";
export type Phase = { name: "draw" | "name" | "finished" };
export interface Notice {
  tone: "good" | "bad" | "reveal";
  title: string; text?: string; word?: string; attempt?: number;
  accept?: { target: SceneTarget; written: string };
}
export interface SharedHunt {
  revision: number; turn: string; order: ShapeName[]; round: number;
  box: Box | null; phase: Phase; word: string; notice: Notice | null;
  found: Record<string, Discovery>; attempts: Record<string, number>;
}
export type HuntAction =
  | { type: "box"; box: Box | null; final: boolean }
  | { type: "letter"; letter: string }
  | { type: "backspace" | "submit" | "accept" | "none" | "clear" | "restart" };
export function initialHunt(scene: Scene): SharedHunt {
  return { revision: 0, turn: randomUUID(), order: shuffled(shapesIn(scene)), round: 0, box: null, phase: { name: "draw" }, word: "", notice: null, found: {}, attempts: {} };
}
const shaped = (s: ShapeName) => `a forma di ${s}`;
export function applyHunt(state: SharedHunt, scene: Scene, action: HuntAction, turn: string) {
  if (turn !== state.turn) return;
  function again(notice: Notice | null) {
    state.box = null; state.word = ""; state.phase = { name: "draw" }; state.notice = notice; state.turn = randomUUID();
  }
  function discover(target: SceneTarget, discovery: Discovery) { state.found[target.id] = discovery; }
  function submit() {
    const shape = state.order[state.round];
    if (state.phase.name !== "name" || !state.box || !shape || !state.word.trim()) return;
    const m = matchBox(state.box, scene.targets);
    if (m.kind === "none") return again({ tone: "bad", title: "Non trovo un oggetto qui." });
    if (m.kind === "ambiguous") { state.notice = { tone: "bad", title: "Il riquadro prende più oggetti.", text: "Stringi il riquadro intorno a un oggetto." }; return; }
    const target = m.target;
    if (target.shape !== shape) return again({ tone: "bad", title: `Questo oggetto non è ${shaped(shape)}.` });
    if (state.found[target.id]) return again({ tone: "bad", title: "Hai già trovato questo oggetto." });
    const verdict = judgeName(state.word, target.names);
    if (verdict.kind === "correct") {
      const label = normalizeWord(state.word);
      discover(target, { label, how: "named" }); return again({ tone: "good", title: "Esatto!", word: label });
    }
    const attempt = (state.attempts[target.id] ?? 0) + 1;
    state.attempts[target.id] = attempt;
    const accept = { target, written: state.word };
    if (attempt >= MAX_ATTEMPTS) { discover(target, { label: target.names[0], how: "revealed" }); return again({ tone: "reveal", title: "Questo oggetto si chiama:", word: target.names[0], attempt, accept }); }
    state.notice = verdict.kind === "spelling" ? { tone: "bad", title: "Quasi!", text: "Controlla come si scrive.", attempt, accept } : { tone: "bad", title: "No.", text: "Prova un'altra parola.", attempt, accept };
    // A stale second submission cannot consume another attempt.
    state.turn = randomUUID();
  }
  if (action.type === "restart") { const revision = state.revision; Object.assign(state, initialHunt(scene)); state.revision = revision + 1; return; }
  if (state.phase.name === "finished") return;
  switch (action.type) {
    case "box":
      state.box = action.box; state.notice = null;
      if (action.final) {
        if (!action.box || action.box.width < 16 || action.box.height < 16) { state.box = null; state.phase = { name: "draw" }; }
        else { if (state.phase.name === "draw") state.word = ""; state.phase = { name: "name" }; }
      }
      break;
    case "letter": if (state.phase.name === "name" && state.word.length < 30) state.word += action.letter; break;
    case "backspace": if (state.phase.name === "name") state.word = state.word.slice(0, -1); break;
    case "clear": again(null); break;
    case "submit": submit(); break;
    case "accept": {
      const accept = state.notice?.accept;
      if (accept) { const label = normalizeWord(accept.written); discover(accept.target, { label, how: "accepted" }); again({ tone: "good", title: "Accettato dall'insegnante", word: label }); }
      break;
    }
    case "none": {
      const shape = state.order[state.round];
      if (!shape) break;
      if (remaining(scene, shape, new Map(Object.entries(state.found))).length) { again({ tone: "bad", title: "Guarda bene!", text: `C'è ancora almeno un oggetto ${shaped(shape)}.` }); break; }
      state.round++;
      again(state.round >= state.order.length ? null : { tone: "good", title: "Giusto!", text: `Hai trovato tutti gli oggetti ${shaped(shape)}.` });
      if (state.round >= state.order.length) state.phase = { name: "finished" };
      break;
    }
  }
  state.revision++;
}
export function validHuntAction(value: unknown, scene: Scene): value is HuntAction {
  if (!value || typeof value !== "object") return false;
  const a = value as Record<string, unknown>;
  if (a.type === "box") {
    if (typeof a.final !== "boolean") return false;
    if (a.box === null) return true;
    if (!a.box || typeof a.box !== "object") return false;
    const b = a.box as Box;
    return [b.x, b.y, b.width, b.height].every(n => typeof n === "number" && Number.isFinite(n) && n >= 0) && b.x + b.width <= scene.width + .001 && b.y + b.height <= scene.height + .001;
  }
  if (a.type === "letter") return typeof a.letter === "string" && /^[a-zà-ú' ]$/.test(a.letter);
  return ["backspace", "submit", "accept", "none", "clear", "restart"].includes(a.type as string);
}
