"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Delete, HelpCircle, RotateCcw, Share2 } from "lucide-react";
import { ANSWERS, WORDS, dailyAnswer, scoreGuess, type Mark } from "@/lib/wordleit/game";
import "./wordleit.css";

type Game = { date: string; mode: "daily" | "practice"; answer: string; guesses: string[] };
const STORAGE = "scienceclick-wordleit-v1";
const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const colors: Record<Mark, string> = { correct: "🟩", present: "🟨", absent: "⬜" };
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function newDaily(): Game { const date = today(); return { date, mode: "daily", answer: dailyAnswer(date), guesses: [] }; }
function readDaily(): Game {
  const fresh = newDaily();
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (saved?.date === fresh.date && saved.mode === "daily" && saved.answer === fresh.answer && Array.isArray(saved.guesses) && saved.guesses.length <= 6 && saved.guesses.every((g: unknown) => typeof g === "string" && WORDS.includes(g))) return saved;
  } catch { /* Storage may be unavailable. The game still works. */ }
  return fresh;
}

export default function WordleGame() {
  const [game, setGame] = useState<Game | null>(null);
  const [input, setInput] = useState("");
  const [notice, setNotice] = useState("");
  const [help, setHelp] = useState(false);
  useEffect(() => { setGame(readDaily()); }, []);
  const won = !!game?.guesses.includes(game.answer);
  const over = won || game?.guesses.length === 6;
  useEffect(() => {
    if (game?.mode === "daily") try { localStorage.setItem(STORAGE, JSON.stringify(game)); } catch { /* Optional persistence. */ }
  }, [game]);

  function key(key: string) {
    if (!game || over || help) return;
    setNotice("");
    if (key === "BACKSPACE") { setInput(value => value.slice(0, -1)); return; }
    if (key === "ENTER") {
      if (input.length !== 5) { setNotice("Scrivi una parola di 5 lettere."); return; }
      if (!WORDS.includes(input)) { setNotice("Parola non nel nostro vocabolario. Provane un’altra!"); return; }
      if (game.guesses.includes(input)) { setNotice("Hai già provato questa parola."); return; }
      setGame({ ...game, guesses: [...game.guesses, input] }); setInput(""); return;
    }
    if (/^[A-Z]$/.test(key)) setInput(value => value.length < 5 ? value + key : value);
  }
  useEffect(() => {
    function handle(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "Enter" && event.repeat) { event.preventDefault(); return; }
      if ((event.target instanceof HTMLButtonElement || event.target instanceof HTMLAnchorElement) && event.key === "Enter" && !event.target.closest("[data-wordleit-keyboard]")) return;
      if (/^[a-z]$/i.test(event.key) || ["Enter", "Backspace"].includes(event.key)) { event.preventDefault(); key(event.key.toUpperCase()); }
      if (event.key === "Escape") setHelp(false);
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });

  function changeMode(mode: "daily" | "practice") {
    if (mode === game?.mode) return;
    setGame(mode === "daily" ? readDaily() : { date: today(), mode, answer: ANSWERS[Math.floor(Math.random() * ANSWERS.length)], guesses: [] });
    setInput(""); setNotice("");
  }
  function practice() {
    setGame({ date: today(), mode: "practice", answer: ANSWERS.filter(w => w !== game?.answer)[Math.floor(Math.random() * (ANSWERS.length - 1))], guesses: [] });
    setInput(""); setNotice("");
  }
  async function share() {
    if (!game) return;
    const text = `WordleIt · ${game.mode === "daily" ? game.date : "Allenamento"} · ${won ? game.guesses.length : "X"}/6\n\n${game.guesses.map(g => scoreGuess(g, game.answer).map(m => colors[m]).join("")).join("\n")}`;
    try { await navigator.clipboard.writeText(text); setNotice("Risultato copiato!"); }
    catch { setNotice("Copia non disponibile in questo browser."); }
  }

  return <main lang="it" className="wordleit min-h-dvh bg-[#f8faf8] text-slate-800">
    <header className="mx-auto flex max-w-3xl items-center justify-between border-b border-slate-200 px-4 py-4">
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft size={17} /><span>ScienceClick</span></Link>
      <button onClick={() => setHelp(true)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100"><HelpCircle size={19} />Come si gioca</button>
    </header>
    <div className="mx-auto flex max-w-xl flex-col items-center px-3 pb-8 pt-6 sm:pt-8">
      <span className="text-xs font-bold tracking-[.2em] text-emerald-700">CINQUE LETTERE. UNA SCOPERTA.</span>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">Wordle<span className="text-emerald-600">It</span></h1>
      <p className="mt-2 text-sm text-slate-500">Trova la parola italiana in 6 tentativi.</p>
      <div className="mt-5 flex rounded-xl bg-slate-200/60 p-1" aria-label="Modalità di gioco">
        {(["daily", "practice"] as const).map(mode => <button key={mode} onClick={() => changeMode(mode)} aria-pressed={game?.mode === mode} className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${game?.mode === mode ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{mode === "daily" ? "Parola del giorno" : "Allenamento"}</button>)}
      </div>
      <div role="status" aria-live="polite" className="my-3 min-h-10 flex items-center text-center text-sm font-medium">
        {!game ? "Caricamento…" : notice || (won ? `Ottimo! Hai trovato ${game.answer} in ${game.guesses.length} tentativi.` : over ? `La parola era ${game.answer}. Riprova in allenamento!` : game.mode === "daily" ? "Una nuova sfida ogni giorno. Buon divertimento!" : "Fai pratica: una nuova parola quando vuoi.")}
      </div>
      <div role="group" aria-label="Griglia dei tentativi" className="grid gap-1.5">
        {Array.from({ length: 6 }, (_, r) => {
          const guess = game?.guesses[r];
          const marks = guess && game ? scoreGuess(guess, game.answer) : null;
          const letters = guess || (r === game?.guesses.length ? input : "");
          return <div key={r} className="flex gap-1.5" aria-label={`Tentativo ${r + 1}${guess ? `: ${guess}` : ""}`}>
            {Array.from({ length: 5 }, (_, c) => <div key={c} aria-label={letters[c] ? `${letters[c]}${marks ? `, ${marks[c] === "correct" ? "posizione corretta" : marks[c] === "present" ? "posizione diversa" : "assente"}` : ""}` : "Vuota"} className={`wordleit-tile ${marks ? marks[c] : letters[c] ? "filled" : ""}`}>{letters[c]}</div>)}
          </div>;
        })}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500" aria-label="Legenda"><span className="wordleit-legend"><i className="correct" aria-hidden="true" />Al posto giusto</span><span className="wordleit-legend"><i className="present" aria-hidden="true" />In un altro posto</span><span className="wordleit-legend"><i className="absent" aria-hidden="true" />Non presente</span></div>
      <div className="mt-6 w-full space-y-1.5" role="group" aria-label="Tastiera" data-wordleit-keyboard>
        {rows.map((row, index) => <div key={row} className="flex justify-center gap-1 sm:gap-1.5">
          {index === 2 && <button className="wordleit-key wide" disabled={!game || over} onClick={() => key("ENTER")}>INVIO</button>}
          {row.split("").map(letter => <button key={letter} aria-label={letter} className="wordleit-key" disabled={!game || over} onClick={() => key(letter)}>{letter}</button>)}
          {index === 2 && <button className="wordleit-key wide" aria-label="Cancella ultima lettera" disabled={!game || over} onClick={() => key("BACKSPACE")}><Delete size={21} /></button>}
        </div>)}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {over && <button onClick={share} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"><Share2 size={16} />Condividi risultato</button>}
        {(game?.mode === "practice" || over) && <button onClick={practice} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"><RotateCcw size={16} />Nuova parola</button>}
      </div>
      {over && game?.mode === "daily" && <p className="mt-4 text-sm text-slate-500">La prossima parola ti aspetta domani.</p>}
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">Un piccolo esercizio di logica e italiano.<br />Vocabolario selezionato · Nessun account necessario</p>
    </div>
    {help && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-5" onClick={() => setHelp(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="wordleit-help" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 id="wordleit-help" className="text-2xl font-bold">Come si gioca</h2>
        <p className="mt-3 text-slate-600">Indovina una parola italiana di 5 lettere in 6 tentativi. Scrivi con la tastiera o tocca le lettere, poi premi INVIO.</p>
        <ul className="mt-4 space-y-3 text-sm"><li>🟩 La lettera è nella posizione giusta.</li><li>🟨 La lettera c’è, ma in un’altra posizione.</li><li>⬜ La lettera non c’è, o compare già negli altri indizi.</li></ul>
        <p className="mt-4 text-sm text-slate-500">Le lettere possono ripetersi. Usiamo un vocabolario selezionato di parole comuni senza accenti: alcune parole potrebbero non essere accettate. La parola del giorno è uguale per tutti; in allenamento puoi giocare quanto vuoi.</p>
        <button autoFocus onClick={() => setHelp(false)} onKeyDown={e => { if (e.key === "Tab") e.preventDefault(); }} className="mt-5 w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white">Ho capito, giochiamo!</button>
      </section>
    </div>}
  </main>;
}
