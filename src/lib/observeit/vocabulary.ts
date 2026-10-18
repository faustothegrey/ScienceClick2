// Italian shape vocabulary: normalizing what the student writes and judging it
// against the shape their box found. No fuzzy matching ever turns a wrong word
// into a right one; near-misses only produce a "check the spelling" message.

export type ShapeName = "cerchio" | "quadrato" | "triangolo" | "rettangolo";

export const SHAPE_NAMES: readonly ShapeName[] = ["cerchio", "quadrato", "triangolo", "rettangolo"];

// Articles a student may naturally write before the noun ("un cerchio", "il quadrato").
const ARTICLES = ["il", "lo", "la", "l'", "un", "uno", "una", "un'"];

export function normalizeWord(input: string): string {
  let s = input.toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, " ").trim();
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

export type WordVerdict =
  | { kind: "correct" }
  // Close to the right word: show the correct spelling and let them write it again.
  | { kind: "spelling" }
  // Another shape's name (e.g. "triangolo" for a circle).
  | { kind: "other-shape"; written: ShapeName }
  // Not a shape name we know.
  | { kind: "unknown" };

const SPELLING_DISTANCE = 2;

export function judgeWord(input: string, expected: ShapeName): WordVerdict {
  const word = normalizeWord(input);
  if (word === expected) return { kind: "correct" };
  const other = SHAPE_NAMES.find((name) => name === word);
  if (other) return { kind: "other-shape", written: other };
  if (editDistance(word, expected) <= SPELLING_DISTANCE) return { kind: "spelling" };
  return { kind: "unknown" };
}
