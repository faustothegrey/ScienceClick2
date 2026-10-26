// Italian vocabulary: the shapes the app asks for, and judging the object name
// the student writes. No fuzzy matching ever turns a wrong name into a right
// one; near-misses only produce a "check the spelling" message.

export type ShapeName = "cerchio" | "quadrato" | "triangolo" | "rettangolo";

export const SHAPE_NAMES: readonly ShapeName[] = ["cerchio", "quadrato", "triangolo", "rettangolo"];

// Articles a student may naturally write before the noun ("un orologio", "la porta").
const ARTICLES = ["il", "lo", "la", "i", "gli", "le", "l'", "un", "uno", "una", "un'"];

export function normalizeWord(input: string): string {
  // Also joins "dell' auto" into "dell'auto".
  let s = input.toLowerCase().replace(/[’`]/g, "'").replace(/'\s+/g, "'").replace(/\s+/g, " ").trim();
  for (const article of ARTICLES) {
    const prefix = article.endsWith("'") ? article : `${article} `;
    if (s.startsWith(prefix)) {
      s = s.slice(prefix.length).trim();
      break;
    }
  }
  return s;
}

export function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

export type NameVerdict =
  | { kind: "correct" }
  // Close to an accepted name: show its spelling and let them write it again.
  | { kind: "spelling"; closest: string }
  | { kind: "wrong" };

const SPELLING_DISTANCE = 2;

// `accepted` lists the object's accepted names; the first is the main one.
export function judgeName(input: string, accepted: readonly string[]): NameVerdict {
  const word = normalizeWord(input);
  if (!word) return { kind: "wrong" };
  if (accepted.includes(word)) return { kind: "correct" };
  const closest = accepted.find((name) => editDistance(word, name) <= SPELLING_DISTANCE);
  return closest ? { kind: "spelling", closest } : { kind: "wrong" };
}
