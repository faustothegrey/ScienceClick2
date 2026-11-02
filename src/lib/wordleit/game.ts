import { DICTIONARY_WORDS } from "./dictionary.ts";

export type Mark = "correct" | "present" | "absent";
export const ANSWERS = `ACQUA AMICO AMORE ASTRO ATOMO AVENA BACIO BARCA BOSCO CAMPO CAPRA CARTA CIELO CLIMA CORDA CORPO CREMA CUORE DENTE DOLCE FALCO FELCE FERRO FIBRA FIORE FIUME FORMA FORNO FUNGO FUOCO GATTO GELSO GERME GHIRO GIOCO GRANO ISOLA LAMPO LATTE LIBRO LINEA MADRE MAGIA MIELE MONDO MONTE MOSCA MUCCA NOTTE ODORE OMBRA PADRE PAESE PALMA PANDA PARCO PASTA PAURA PELLE PENNA PERLA PESCA PESCE PIEDE PIOVE PIZZA PONTE PORTA PRATO PUNTO RADIO RAGNO REGNO RITMO ROSSO RUOTA SASSO SCALA SCENA SCOPA SEDIA SELVA SERRA SIEPE SOGNO SONDA SPINA SUOLO SUONO TALEA TEMPO TENDA TERRA TIGRE TONNO TORRE TORTA TRENO TROTA TUONO VALLE VASCA VENTO VERDE VETRO VIOLA VOLPE ZAINO ZAMPA ZEBRA ZOLLA ZUPPA`.split(" ");
// Answers remain curated; guesses use the broader lexicon.
export const WORDS = Array.from(new Set([...DICTIONARY_WORDS, ...ANSWERS]));
export function scoreGuess(guess: string, answer: string): Mark[] {
  const marks: Mark[] = Array(5).fill("absent");
  const remaining = answer.split("");
  for (let i = 0; i < 5; i++) if (guess[i] === answer[i]) { marks[i] = "correct"; remaining[i] = ""; }
  for (let i = 0; i < 5; i++) if (marks[i] !== "correct") { const index = remaining.indexOf(guess[i]); if (index !== -1) { marks[i] = "present"; remaining[index] = ""; } }
  return marks;
}
export function dailyAnswer(date: string) {
  return ANSWERS[Math.floor(Date.parse(date + "T00:00:00Z") / 86400000) % ANSWERS.length];
}
