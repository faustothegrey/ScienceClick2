import { randomUUID } from "node:crypto";
import { ANSWERS, WORDS, dailyAnswer, scoreGuess, type Mark } from "./game.ts";

export type Action = { type: "key"; key: string } | { type: "mode"; mode: "daily" | "practice" } | { type: "new" };
export type Board = { id: string; date: string; mode: "daily" | "practice"; answer: string; guesses: string[]; input: string; notice: string };
export type SharedState = { revision: number; active: "daily" | "practice"; daily: Board; practice: Board };
export type SharedView = Omit<Board, "answer"> & { revision: number; answer: string | null; marks: Mark[][]; won: boolean; over: boolean };
export function serverDate() { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function board(mode: Board["mode"], date: string, previous?: string): Board {
  const options = ANSWERS.filter(w => w !== previous);
  return { id: randomUUID(), date, mode, answer: mode === "daily" ? dailyAnswer(date) : options[Math.floor(Math.random() * options.length)], guesses: [], input: "", notice: "" };
}
export function initialState(date = serverDate()): SharedState { return { revision: 0, active: "daily", daily: board("daily", date), practice: board("practice", date) }; }
export function rollover(state: SharedState, date = serverDate()) {
  if (state.daily.date !== date) { state.daily = board("daily", date); state.revision++; }
}
export function view(state: SharedState): SharedView {
  const b = state[state.active];
  const won = b.guesses.includes(b.answer);
  const over = won || b.guesses.length === 6;
  return { ...b, answer: over ? b.answer : null, revision: state.revision, marks: b.guesses.map(g => scoreGuess(g, b.answer)), won, over };
}
export function applyAction(state: SharedState, action: Action, boardId: string) {
  const b = state[state.active];
  // Ignore keys still in flight from a board that another player has replaced.
  if (boardId !== b.id) return;
  if (action.type === "mode") { state.active = action.mode; state.revision++; return; }
  if (action.type === "new") { state.practice = board("practice", serverDate(), b.answer); state.active = "practice"; state.revision++; return; }
  if (view(state).over) return;
  b.notice = "";
  if (action.key === "BACKSPACE") b.input = b.input.slice(0, -1);
  else if (action.key === "ENTER") {
    if (b.input.length !== 5) b.notice = "Scrivi una parola di 5 lettere.";
    else if (!WORDS.includes(b.input)) b.notice = "Parola non nel nostro vocabolario. Provane un’altra!";
    else if (b.guesses.includes(b.input)) b.notice = "Hai già provato questa parola.";
    else { b.guesses.push(b.input); b.input = ""; }
  } else if (/^[A-Z]$/.test(action.key) && b.input.length < 5) b.input += action.key;
  state.revision++;
}
