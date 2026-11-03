"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Delete, HelpCircle, RotateCcw, Share2 } from "lucide-react";
import type { Mark } from "@/lib/wordleit/game";
import type { Action, SharedView } from "@/lib/wordleit/shared";
import "./wordleit.css";

const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const colors: Record<Mark, string> = { correct: "🟩", present: "🟨", absent: "⬜" };
export default function WordleGame() {
  const [game, setGame] = useState<SharedView | null>(null);
  const [notice, setNotice] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [retry, setRetry] = useState(0);
  const [connected, setConnected] = useState(false);
  const [help, setHelp] = useState(false);
  const latest = useRef<SharedView | null>(null);
  const queue = useRef(Promise.resolve());
  const mounted = useRef(false);
  function accept(next: SharedView) {
    if (!mounted.current) return;
    if (!latest.current || next.revision >= latest.current.revision) { latest.current = next; setGame(next); }
    setConnected(true);
  }
  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const response = await fetch("/wordleit/api/game", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]) });
        if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Partita non disponibile."); }
        const next: SharedView = await response.json();
        if (!stopped) accept(next);
      } catch (error) { if (!stopped) { setConnected(false); setConnectionError(error instanceof Error && error.name === "Error" ? error.message : "Impossibile connettersi. Riprova tra poco."); } }
      if (!stopped) timer = setTimeout(poll, 400);
    }
    void poll();
    return () => { stopped = true; mounted.current = false; controller.abort(); clearTimeout(timer); };
  }, [retry]);
  const won = !!game?.won;
  const over = !!game?.over;
  const input = game?.input ?? "";
  function send(action: Action) {
    const boardId = latest.current?.id;
    if (!boardId || !connected) return;
    setNotice("");
    queue.current = queue.current.then(async () => {
      try {
        const response = await fetch("/wordleit/api/game", { method: "POST", signal: AbortSignal.timeout(5000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, boardId }) });
        if (!response.ok) { const body = await response.json(); throw new Error(body.error || "Partita non disponibile."); }
        accept(await response.json());
      } catch {
        if (mounted.current) { setConnected(false); setNotice("Connessione interrotta. L’ultima azione potrebbe non essere stata salvata."); }
      }
    });
  }
  function key(key: string) {
    if (!game || over || help || !connected) return;
    send({ type: "key", key });
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
    if (mode !== game?.mode) send({ type: "mode", mode });
  }
  function practice() { send({ type: "new" }); }
  async function share() {
    if (!game) return;
    const text = `WordleIt · ${game.mode === "daily" ? game.date : "Allenamento"} · ${won ? game.guesses.length : "X"}/6\n\n${game.marks.map(row => row.map(m => colors[m]).join("")).join("\n")}`;
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
      <p role="status" className="mt-2 text-center text-xs text-slate-500">{connected ? "● Partita condivisa · Tutti vedono e giocano sulla stessa griglia" : "Connessione alla partita… Comandi in pausa."}</p>
      {!connected && connectionError && <div role="alert" className="mt-3 text-center text-sm text-red-700"><p>{connectionError}</p><button className="mt-2 rounded-lg border border-red-300 px-3 py-2 font-semibold" onClick={() => setRetry(n => n + 1)}>Riprova connessione</button></div>}
      <div className="mt-5 flex rounded-xl bg-slate-200/60 p-1" aria-label="Modalità di gioco">
        {(["daily", "practice"] as const).map(mode => <button key={mode} disabled={!connected} onClick={() => changeMode(mode)} aria-pressed={game?.mode === mode} className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${game?.mode === mode ? "bg-white text-emerald-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{mode === "daily" ? "Parola del giorno" : "Allenamento"}</button>)}
      </div>
      <div role="status" aria-live="polite" className="my-3 min-h-10 flex items-center text-center text-sm font-medium">
        {!game ? "Caricamento…" : notice || game.notice || (won ? `Ottimo! Hai trovato ${game.answer} in ${game.guesses.length} tentativi.` : over ? `La parola era ${game.answer}. Riprova in allenamento!` : game.mode === "daily" ? "Una nuova sfida ogni giorno. Buon divertimento!" : "Fai pratica: una nuova parola quando vuoi.")}
      </div>
      <div role="group" aria-label="Griglia dei tentativi" className="grid gap-1.5">
        {Array.from({ length: 6 }, (_, r) => {
          const guess = game?.guesses[r];
          const marks = game?.marks[r] ?? null;
          const letters = guess || (r === game?.guesses.length ? input : "");
          return <div key={r} className="flex gap-1.5" aria-label={`Tentativo ${r + 1}${guess ? `: ${guess}` : ""}`}>
            {Array.from({ length: 5 }, (_, c) => <div key={c} aria-label={letters[c] ? `${letters[c]}${marks ? `, ${marks[c] === "correct" ? "posizione corretta" : marks[c] === "present" ? "posizione diversa" : "assente"}` : ""}` : "Vuota"} className={`wordleit-tile ${marks ? marks[c] : letters[c] ? "filled" : ""}`}>{letters[c]}</div>)}
          </div>;
        })}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500" aria-label="Legenda"><span className="wordleit-legend"><i className="correct" aria-hidden="true" />Al posto giusto</span><span className="wordleit-legend"><i className="present" aria-hidden="true" />In un altro posto</span><span className="wordleit-legend"><i className="absent" aria-hidden="true" />Non presente</span></div>
      <div className="mt-6 w-full space-y-1.5" role="group" aria-label="Tastiera" data-wordleit-keyboard>
        {rows.map((row, index) => <div key={row} className="flex justify-center gap-1 sm:gap-1.5">
          {index === 2 && <button className="wordleit-key wide" disabled={!game || over || !connected} onClick={() => key("ENTER")}>INVIO</button>}
          {row.split("").map(letter => <button key={letter} aria-label={letter} className="wordleit-key" disabled={!game || over || !connected} onClick={() => key(letter)}>{letter}</button>)}
          {index === 2 && <button className="wordleit-key wide" aria-label="Cancella ultima lettera" disabled={!game || over || !connected} onClick={() => key("BACKSPACE")}><Delete size={21} /></button>}
        </div>)}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {over && <button onClick={share} className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800"><Share2 size={16} />Condividi risultato</button>}
        {(game?.mode === "practice" || over) && <button disabled={!connected} onClick={practice} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"><RotateCcw size={16} />Nuova parola</button>}
      </div>
      {over && game?.mode === "daily" && <p className="mt-4 text-sm text-slate-500">La prossima parola ti aspetta domani.</p>}
      <p className="mt-6 text-center text-xs leading-5 text-slate-400">Un piccolo esercizio di logica e italiano.<br />Dizionario Morph-it! · Nessun account necessario</p>
    </div>
    {help && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-5" onClick={() => setHelp(false)}>
      <section role="dialog" aria-modal="true" aria-labelledby="wordleit-help" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 id="wordleit-help" className="text-2xl font-bold">Come si gioca</h2>
        <p className="mt-3 text-slate-600">Indovina una parola italiana di 5 lettere in 6 tentativi. Scrivi con la tastiera o tocca le lettere, poi premi INVIO.</p>
        <ul className="mt-4 space-y-3 text-sm"><li>🟩 La lettera è nella posizione giusta.</li><li>🟨 La lettera c’è, ma in un’altra posizione.</li><li>⬜ La lettera non c’è, o compare già negli altri indizi.</li></ul>
        <p className="mt-4 text-sm text-slate-500">Le lettere possono ripetersi. Accettiamo le parole di cinque lettere senza accenti del dizionario Morph-it!, incluse forme flesse e coniugazioni. I nomi propri sono esclusi; il dizionario può avere lacune. Le soluzioni sono selezionate tra parole comuni. La partita è condivisa: tutti vedono le stesse lettere e gli stessi tentativi. Chiunque può scrivere, cambiare modalità o iniziare un nuovo allenamento. La parola del giorno cambia a mezzanotte, ora italiana.</p>
        <a href="/wordleit/dictionary/README.md" target="_blank" rel="noreferrer" onKeyDown={e => { if (e.key === "Tab" && e.shiftKey) { e.preventDefault(); (e.currentTarget.nextElementSibling as HTMLElement)?.focus(); } }} className="mt-3 block text-sm text-emerald-700 underline">Fonte e licenza del dizionario</a>
        <button autoFocus onClick={() => setHelp(false)} onKeyDown={e => { if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); if (e.currentTarget.previousElementSibling instanceof HTMLElement) e.currentTarget.previousElementSibling.focus(); } }} className="mt-5 w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white">Ho capito, giochiamo!</button>
      </section>
    </div>}
  </main>;
}
