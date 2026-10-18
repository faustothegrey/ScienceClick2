"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import confetti from "canvas-confetti";
import { RotateCcw, Star } from "lucide-react";
import { boxFromPoints, fitHint, matchBox, starsFor, type Box, type FitHint, type Point, type Stars } from "@/lib/observeit/geometry";
import { judgeWord, type WordVerdict } from "@/lib/observeit/vocabulary";
import type { Scene, SceneTarget } from "@/lib/observeit/scene";
import LetterKeyboard from "./LetterKeyboard";

type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

// Boxes smaller than this (scene units) are treated as an accidental tap.
const MIN_BOX = 16;
const MAX_WORD = 20;

type Drag =
  | { pointerId: number; mode: "draw"; origin: Point }
  | { pointerId: number; mode: "move"; origin: Point; start: Box }
  | { pointerId: number; mode: Corner; start: Box };

type Result =
  | { kind: "no-shape" }
  | { kind: "ambiguous" }
  | { kind: "correct"; target: SceneTarget; stars: Stars; hint: FitHint; previous?: Stars }
  | { kind: "word"; target: SceneTarget; score: number; written: string; verdict: Exclude<WordVerdict, { kind: "correct" }> };

type Phase =
  | { name: "draw" }
  | { name: "adjust" }
  | { name: "name"; target: SceneTarget; score: number }
  | { name: "result"; result: Result };

interface ShapeHuntProps {
  scene: Scene;
  // SVG content drawn in the scene's viewBox.
  illustration: ReactNode;
  // Authoring aid: outline every target.
  showTargets?: boolean;
}

function cornerPoint(box: Box, corner: Corner): Point {
  return {
    x: corner.endsWith("w") ? box.x : box.x + box.width,
    y: corner.startsWith("n") ? box.y : box.y + box.height,
  };
}

function opposite(corner: Corner): Corner {
  return ({ nw: "se", ne: "sw", sw: "ne", se: "nw" } as const)[corner];
}

function inside(p: Point, box: Box): boolean {
  return p.x >= box.x && p.x <= box.x + box.width && p.y >= box.y && p.y <= box.y + box.height;
}

export default function ShapeHunt({ scene, illustration, showTargets = false }: ShapeHuntProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [phase, setPhase] = useState<Phase>({ name: "draw" });
  const [word, setWord] = useState("");
  const [found, setFound] = useState<Map<string, Stars>>(new Map());
  const [restartArmed, setRestartArmed] = useState(false);

  const total = scene.targets.length;
  const allFound = found.size === total;
  const canEditBox = phase.name === "draw" || phase.name === "adjust";

  function toScene(e: ReactPointerEvent): Point | null {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return {
      x: Math.max(0, Math.min(scene.width, p.x)),
      y: Math.max(0, Math.min(scene.height, p.y)),
    };
  }

  // --- Pointer handling: one pointer at a time, so a resting palm or a second
  // hand on the board can't distort the box being drawn.

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    // A mouse has a single pointer, so a drag still open here missed its release.
    if (drag.current && (e.pointerType === "mouse" || e.pointerId === drag.current.pointerId)) {
      drag.current = null;
    }
    if (drag.current || !canEditBox) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const p = toScene(e);
    if (!p) return;
    const handle = (e.target as Element).closest("[data-handle]")?.getAttribute("data-handle") as Corner | null;
    if (box && handle) {
      drag.current = { pointerId: e.pointerId, mode: handle, start: box };
    } else if (box && phase.name === "adjust" && inside(p, box)) {
      drag.current = { pointerId: e.pointerId, mode: "move", origin: p, start: box };
    } else {
      drag.current = { pointerId: e.pointerId, mode: "draw", origin: p };
      setBox({ x: p.x, y: p.y, width: 0, height: 0 });
      setPhase({ name: "draw" });
    }
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Pointer already gone (e.g. lifted before capture): lostpointercapture won't fire.
      endDrag(e, true);
    }
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const p = toScene(e);
    if (!p) return;
    if (d.mode === "draw") {
      setBox(boxFromPoints(d.origin, p));
    } else if (d.mode === "move") {
      const { start } = d;
      setBox({
        ...start,
        x: Math.max(0, Math.min(scene.width - start.width, start.x + p.x - d.origin.x)),
        y: Math.max(0, Math.min(scene.height - start.height, start.y + p.y - d.origin.y)),
      });
    } else {
      setBox(boxFromPoints(cornerPoint(d.start, opposite(d.mode)), p));
    }
  }

  function endDrag(e: ReactPointerEvent<SVGSVGElement>, cancelled: boolean) {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    drag.current = null;
    const tooSmall = !box || box.width < MIN_BOX || box.height < MIN_BOX;
    if (d.mode === "draw") {
      if (cancelled || tooSmall) {
        setBox(null);
        setPhase({ name: "draw" });
      } else {
        setPhase({ name: "adjust" });
      }
    } else if (cancelled || tooSmall) {
      setBox(d.start);
    }
  }

  // --- Flow

  function confirmBox() {
    if (!box) return;
    const m = matchBox(box, scene.targets);
    if (m.kind === "none") setPhase({ name: "result", result: { kind: "no-shape" } });
    else if (m.kind === "ambiguous") setPhase({ name: "result", result: { kind: "ambiguous" } });
    else {
      setWord("");
      setPhase({ name: "name", target: m.target, score: m.score });
    }
  }

  function submitWord() {
    if (phase.name !== "name" || !word.trim()) return;
    const { target, score } = phase;
    const verdict = judgeWord(word, target.shape);
    if (verdict.kind !== "correct") {
      setPhase({ name: "result", result: { kind: "word", target, score, written: word, verdict } });
      return;
    }
    const stars = starsFor(score);
    const previous = found.get(target.id);
    const next = new Map(found);
    next.set(target.id, Math.max(stars, previous ?? 0) as Stars);
    setFound(next);
    setPhase({ name: "result", result: { kind: "correct", target, stars, hint: box ? fitHint(box, target.box) : "shift", previous } });
    if (!previous && next.size === total) {
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.6 } });
    }
  }

  function newBox() {
    setBox(null);
    setPhase({ name: "draw" });
  }

  function retryWord(target: SceneTarget, score: number) {
    setWord("");
    setPhase({ name: "name", target, score });
  }

  function restart() {
    if (!restartArmed) {
      setRestartArmed(true);
      return;
    }
    setRestartArmed(false);
    setFound(new Map());
    newBox();
  }

  useEffect(() => {
    if (!restartArmed) return;
    const t = setTimeout(() => setRestartArmed(false), 3000);
    return () => clearTimeout(t);
  }, [restartArmed]);

  const typeLetter = (letter: string) => setWord((w) => (w.length < MAX_WORD ? w + letter : w));
  const backspace = () => setWord((w) => w.slice(0, -1));

  // Physical keyboard, for testing on the laptop.
  function onKey(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (phase.name === "name") {
      if (/^[a-zà-ú' ]$/i.test(e.key)) typeLetter(e.key.toLowerCase());
      else if (e.key === "Backspace") backspace();
      else if (e.key === "Enter") submitWord();
      else if (e.key === "Escape") setPhase({ name: "adjust" });
      else return;
      e.preventDefault();
    } else if (phase.name === "adjust") {
      if (e.key === "Enter") confirmBox();
      else if (e.key === "Escape") newBox();
      else return;
      // Otherwise Enter would also activate whichever button still has focus.
      e.preventDefault();
    }
  }
  // Re-subscribed every render so the listener always sees the current phase.
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  const resultKind = phase.name === "result" ? phase.result.kind : null;
  const boxColor = resultKind === "correct" ? "#16a34a" : resultKind === "no-shape" || resultKind === "ambiguous" ? "#ea580c" : "#2563eb";

  return (
    <div className="h-dvh w-full flex bg-slate-800 overflow-hidden overscroll-none select-none">
      <main className="flex-1 min-w-0 flex items-center justify-center p-3">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${scene.width} ${scene.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full touch-none"
          style={{ cursor: canEditBox ? "crosshair" : "default" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endDrag(e, false)}
          onPointerCancel={(e) => endDrag(e, true)}
          // Safety net: if the browser drops the capture without a pointerup, end the drag.
          onLostPointerCapture={(e) => endDrag(e, true)}
        >
          {illustration}

          {showTargets &&
            scene.targets.map((t) => (
              <g key={t.id} pointerEvents="none">
                <rect x={t.box.x} y={t.box.y} width={t.box.width} height={t.box.height} fill="none" stroke="#e11d48" strokeWidth={2} />
                <text x={t.box.x + 2} y={t.box.y - 3} fontSize={11} fill="#e11d48">
                  {t.shape}
                </text>
              </g>
            ))}

          {scene.targets.filter((t) => found.has(t.id)).map((t) => (
            <rect
              key={t.id}
              x={t.box.x - 6}
              y={t.box.y - 6}
              width={t.box.width + 12}
              height={t.box.height + 12}
              rx={8}
              fill="none"
              stroke="#16a34a"
              strokeWidth={5}
              strokeDasharray="14 8"
              pointerEvents="none"
            />
          ))}

          {box && (
            <g>
              <rect
                x={box.x}
                y={box.y}
                width={box.width}
                height={box.height}
                fill={boxColor}
                fillOpacity={0.12}
                stroke={boxColor}
                strokeWidth={5}
                style={{ cursor: phase.name === "adjust" ? "move" : undefined }}
              />
              {phase.name === "adjust" &&
                CORNERS.map((corner) => {
                  const p = cornerPoint(box, corner);
                  return (
                    <g key={corner} data-handle={corner} style={{ cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize" }}>
                      <circle cx={p.x} cy={p.y} r={40} fill="transparent" />
                      <circle cx={p.x} cy={p.y} r={14} fill="#ffffff" stroke={boxColor} strokeWidth={5} />
                    </g>
                  );
                })}
            </g>
          )}
        </svg>
      </main>

      <aside className="w-[clamp(340px,30vw,520px)] shrink-0 bg-slate-50 text-slate-800 flex flex-col p-5 gap-4">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{scene.title}</h1>
            <p className="text-lg text-slate-600 mt-1">
              Forme trovate: <span className="font-bold text-slate-900">{found.size} / {total}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={restart}
            className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border touch-manipulation ${
              restartArmed ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-500 border-slate-300"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {restartArmed ? "Tocca ancora" : "Ricomincia"}
          </button>
        </header>
        <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-green-500 transition-all" style={{ width: `${(found.size / total) * 100}%` }} />
        </div>

        <section className="flex-1 min-h-0 flex flex-col gap-4">
          {allFound && phase.name !== "name" && (
            <p className="rounded-xl bg-green-100 text-green-800 text-xl font-bold p-4 text-center">Hai trovato tutte le forme!</p>
          )}
          <PhasePanel
            phase={phase}
            word={word}
            onConfirm={confirmBox}
            onNewBox={newBox}
            onAdjust={() => setPhase({ name: "adjust" })}
            onRetryWord={retryWord}
            onSubmitWord={submitWord}
            onLetter={typeLetter}
            onBackspace={backspace}
          />
        </section>
      </aside>
    </div>
  );
}

interface PhasePanelProps {
  phase: Phase;
  word: string;
  onConfirm: () => void;
  onNewBox: () => void;
  onAdjust: () => void;
  onRetryWord: (target: SceneTarget, score: number) => void;
  onSubmitWord: () => void;
  onLetter: (letter: string) => void;
  onBackspace: () => void;
}

const primary = "rounded-xl bg-blue-600 text-white text-xl font-bold px-5 py-4 disabled:opacity-40 touch-manipulation";
const secondary = "rounded-xl bg-white text-slate-700 text-lg font-semibold px-5 py-3 border border-slate-300 touch-manipulation";

function StarRow({ stars }: { stars: Stars }) {
  return (
    <div className="flex gap-1" aria-label={`${stars} stelle su 3`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} className={`w-10 h-10 ${i <= stars ? "fill-amber-400 text-amber-500" : "text-slate-300"}`} />
      ))}
    </div>
  );
}

// One star means the box is loose; the hint says which way to fix it.
const LOOSE_HINT: Record<FitHint, string> = {
  shrink: "Puoi stringere di più il riquadro.",
  grow: "Il riquadro deve prendere tutta la forma.",
  shift: "Sposta il riquadro intorno a tutta la forma.",
};

function precisionText(stars: Stars, hint: FitHint): string {
  if (stars === 3) return "Riquadro perfetto!";
  if (stars === 2) return "Riquadro buono.";
  return LOOSE_HINT[hint];
}

function PhasePanel(p: PhasePanelProps) {
  const { phase } = p;
  const instruction = "text-2xl leading-snug";

  switch (phase.name) {
    case "draw":
      return (
        <p className={instruction}>
          <b>CERCA</b> una forma.
          <br />
          <b>DISEGNA</b> un riquadro intorno alla forma.
        </p>
      );

    case "adjust":
      return (
        <>
          <p className={instruction}>
            Il riquadro va bene? Puoi <b>SPOSTARE</b> gli angoli.
          </p>
          <div className="mt-auto flex flex-col gap-3">
            <button type="button" className={primary} onClick={p.onConfirm}>
              Conferma
            </button>
            <button type="button" className={secondary} onClick={p.onNewBox}>
              Cancella il riquadro
            </button>
          </div>
        </>
      );

    case "name":
      return (
        <>
          <p className={instruction}>
            <b>SCRIVI</b> il nome della forma.
          </p>
          <div className="min-h-16 rounded-xl border-2 border-blue-500 bg-white px-4 py-3 text-3xl font-semibold tracking-wide break-all">
            {p.word}
            <span className="inline-block w-0.5 h-8 -mb-1 bg-blue-500 animate-pulse" />
          </div>
          <div className="mt-auto flex flex-col gap-3">
            <LetterKeyboard onLetter={p.onLetter} onBackspace={p.onBackspace} />
            <div className="flex gap-3">
              <button type="button" className={`${secondary} flex-1`} onClick={p.onAdjust}>
                Indietro
              </button>
              <button type="button" className={`${primary} flex-[2]`} disabled={!p.word.trim()} onClick={p.onSubmitWord}>
                Fatto
              </button>
            </div>
          </div>
        </>
      );

    case "result": {
      const r = phase.result;
      if (r.kind === "no-shape" || r.kind === "ambiguous") {
        return (
          <>
            <p className={instruction}>
              {r.kind === "no-shape" ? (
                <>
                  <b>Non trovo una forma qui.</b>
                  <br />
                  Prova ancora.
                </>
              ) : (
                <>
                  Il riquadro prende <b>più forme</b>.
                  <br />
                  Stringi il riquadro intorno a una forma.
                </>
              )}
            </p>
            <div className="mt-auto flex flex-col gap-3">
              <button type="button" className={primary} onClick={p.onAdjust}>
                Sistema il riquadro
              </button>
              <button type="button" className={secondary} onClick={p.onNewBox}>
                Nuovo riquadro
              </button>
            </div>
          </>
        );
      }
      if (r.kind === "correct") {
        return (
          <>
            <p className="text-3xl font-bold text-green-700">Esatto!</p>
            <p className={instruction}>
              È un <b>{r.target.shape}</b>.
            </p>
            <StarRow stars={r.stars} />
            <p className="text-xl text-slate-600">{precisionText(r.stars, r.hint)}</p>
            {r.previous !== undefined && (
              <p className="text-lg text-slate-500">
                {r.stars > r.previous ? "Meglio di prima!" : "Hai già trovato questa forma."}
              </p>
            )}
            <div className="mt-auto flex flex-col gap-3">
              <button type="button" className={primary} onClick={p.onNewBox}>
                Avanti
              </button>
            </div>
          </>
        );
      }
      const { verdict, target } = r;
      return (
        <>
          <p className="text-lg text-slate-500">
            Hai scritto: <span className="font-semibold text-slate-700">{r.written.trim()}</span>
          </p>
          <p className={instruction}>
            {verdict.kind === "spelling" && <b>Quasi! Si scrive:</b>}
            {verdict.kind === "other-shape" && (
              <>
                No, non è un {verdict.written}.
                <br />
                Questa forma è un:
              </>
            )}
            {verdict.kind === "unknown" && "Questa forma si chiama:"}
          </p>
          <p className="text-4xl font-bold tracking-wide text-blue-700">{target.shape}</p>
          <div className="mt-auto flex flex-col gap-3">
            <button type="button" className={primary} onClick={() => p.onRetryWord(target, r.score)}>
              Scrivi di nuovo
            </button>
            <button type="button" className={secondary} onClick={p.onNewBox}>
              Nuovo riquadro
            </button>
          </div>
        </>
      );
    }
  }
}
