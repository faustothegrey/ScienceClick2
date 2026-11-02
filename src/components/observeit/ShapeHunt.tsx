"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import confetti from "canvas-confetti";
import { RotateCcw, UserCheck } from "lucide-react";
import { boxFromPoints, type Box, type Point } from "@/lib/observeit/geometry";
import { MAX_ATTEMPTS, type Discovery } from "@/lib/observeit/game";
import { normalizeWord, type ShapeName } from "@/lib/observeit/vocabulary";
import type { Scene, SceneTarget } from "@/lib/observeit/scene";
import type { HuntAction, Notice, SharedHunt } from "@/lib/observeit/shared";
import LetterKeyboard from "./LetterKeyboard";

type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

// Boxes smaller than this (scene units) are treated as an accidental tap.
const MIN_BOX = 16;
type Drag =
  | { pointerId: number; mode: "draw"; origin: Point }
  | { pointerId: number; mode: "move"; origin: Point; start: Box }
  | { pointerId: number; mode: Corner; start: Box };

interface ShapeHuntProps {
  scene: Scene;
  // SVG content drawn in the scene's viewBox.
  illustration: ReactNode;
  // Authoring aid: outline every target.
  showTargets?: boolean;
}

const shaped = (shape: ShapeName) => `a forma di ${shape}`;

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

// Two-tap guard for actions students shouldn't trigger by accident.
function useArmed(): [boolean, () => boolean] {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  // Returns true on the second tap.
  const tap = () => {
    setArmed(!armed);
    return armed;
  };
  return [armed, tap];
}

export default function ShapeHunt({ scene, illustration, showTargets = false }: ShapeHuntProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [game, setGame] = useState<SharedHunt | null>(null);
  const [connected, setConnected] = useState(false);
  const [preview, setPreview] = useState<Box | null | undefined>(undefined);
  const latest = useRef<SharedHunt | null>(null);
  const queue = useRef(Promise.resolve());
  const previewBox = useRef<Box | null>(null);
  const lastBoxSent = useRef(0);
  const mounted = useRef(false);
  const [error, setError] = useState("");
  function accept(next: SharedHunt) {
    if (!mounted.current) return;
    if (!latest.current || next.revision >= latest.current.revision) {
      if (latest.current && next.turn !== latest.current.turn) { drag.current = null; setPreview(undefined); }
      if (next.phase.name === "finished" && latest.current?.phase.name !== "finished") confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });
      latest.current = next; setGame(next);
    }
    setConnected(true);
  }
  useEffect(() => {
    mounted.current = true;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const response = await fetch("/observeit/api/game", { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]) });
        if (!response.ok) throw new Error();
        const next: SharedHunt = await response.json();
        if (!stopped) accept(next);
      } catch { if (!stopped) { setConnected(false); drag.current = null; setPreview(undefined); } }
      if (!stopped) timer = setTimeout(poll, 300);
    }
    void poll();
    return () => { stopped = true; mounted.current = false; controller.abort(); clearTimeout(timer); };
  }, []);
  function send(action: HuntAction, done?: () => void) {
    const turn = latest.current?.turn;
    if (!turn || !connected) return;
    setError("");
    queue.current = queue.current.then(async () => {
      try {
        const response = await fetch("/observeit/api/game", { method: "POST", signal: AbortSignal.timeout(5000), headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, turn }) });
        if (!response.ok) throw new Error();
        accept(await response.json());
      } catch {
        if (mounted.current) { setConnected(false); drag.current = null; setPreview(undefined); setError("Connessione interrotta. Controlla l’ultima azione."); }
      } finally { if (mounted.current) done?.(); }
    });
  }
  const order = game?.order ?? [];
  const round = game?.round ?? 0;
  const box = preview !== undefined ? preview : game?.box ?? null;
  const phase = game?.phase ?? { name: "draw" };
  const word = game?.word ?? "";
  const notice = game?.notice ?? null;
  const found = new Map(Object.entries(game?.found ?? {}));
  function setBox(next: Box | null) {
    previewBox.current = next; setPreview(next);
    if (Date.now() - lastBoxSent.current > 100) {
      lastBoxSent.current = Date.now(); send({ type: "box", box: next, final: false });
    }
  }
  const [restartArmed, tapRestart] = useArmed();

  const shape = order[round] as ShapeName | undefined;
  const foundOfShape = shape ? scene.targets.filter((t) => t.shape === shape && found.has(t.id)).length : 0;
  const canEditBox = connected && (phase.name === "draw" || phase.name === "name");

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
    previewBox.current = box;
    const handle = (e.target as Element).closest("[data-handle]")?.getAttribute("data-handle") as Corner | null;
    if (box && handle) {
      drag.current = { pointerId: e.pointerId, mode: handle, start: box };
    } else if (box && inside(p, box)) {
      drag.current = { pointerId: e.pointerId, mode: "move", origin: p, start: box };
    } else {
      // Dragging elsewhere redraws the box, keeping whatever was already written.
      drag.current = { pointerId: e.pointerId, mode: "draw", origin: p };
      setBox({ x: p.x, y: p.y, width: 0, height: 0 });

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
    const current = previewBox.current;
    const tooSmall = !current || current.width < MIN_BOX || current.height < MIN_BOX;
    const finalBox = d.mode === "draw" ? (cancelled || tooSmall ? null : current) : (cancelled || tooSmall ? d.start : current);
    previewBox.current = finalBox; setPreview(finalBox);
    send({ type: "box", box: finalBox, final: true }, () => { if (!drag.current) setPreview(undefined); });
  }

  function lookAgain() { send({ type: "clear" }); }
  function submit() { if (!drag.current) send({ type: "submit" }); }
  function teacherAccept() { send({ type: "accept" }); }
  function claimNoneLeft() { send({ type: "none" }); }
  function newGame() { send({ type: "restart" }); }
  const typeLetter = (letter: string) => send({ type: "letter", letter });
  const backspace = () => send({ type: "backspace" });

  // Physical keyboard, for testing on the laptop.
  function onKey(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey || phase.name !== "name") return;
    if (/^[a-zà-ú' ]$/i.test(e.key)) typeLetter(e.key.toLowerCase());
    else if (e.key === "Backspace") backspace();
    // preventDefault below also stops Enter from pressing a focused button.
    else if (e.key === "Enter") { if (!e.repeat) submit(); }
    else if (e.key === "Escape") lookAgain();
    else return;
    e.preventDefault();
  }
  // Re-subscribed every render so the listener always sees the current phase.
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

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
                  {t.shape} · {t.names[0]}
                </text>
              </g>
            ))}

          {scene.targets.map((t) => {
            const discovery = found.get(t.id);
            return discovery && <FoundMarker key={t.id} target={t} discovery={discovery} sceneWidth={scene.width} />;
          })}

          {box && (
            <g>
              <rect x={box.x} y={box.y} width={box.width} height={box.height} fill="#2563eb" fillOpacity={0.12} stroke="#2563eb" strokeWidth={5} style={{ cursor: "move" }} />
              {phase.name === "name" &&
                CORNERS.map((corner) => {
                  const p = cornerPoint(box, corner);
                  return (
                    <g key={corner} data-handle={corner} style={{ cursor: corner === "nw" || corner === "se" ? "nwse-resize" : "nesw-resize" }}>
                      <circle cx={p.x} cy={p.y} r={40} fill="transparent" />
                      <circle cx={p.x} cy={p.y} r={14} fill="#ffffff" stroke="#2563eb" strokeWidth={5} />
                    </g>
                  );
                })}
            </g>
          )}
        </svg>
      </main>

      <aside aria-busy={!connected} className="w-[clamp(340px,30vw,520px)] shrink-0 bg-slate-50 text-slate-800 flex flex-col p-5 gap-3 overflow-y-auto">
        <p role="status" className="text-sm text-slate-500">{connected ? "Partita condivisa · Giochiamo insieme" : "Connessione… Comandi in pausa"}{error && ` · ${error}`}</p>
        <fieldset disabled={!connected} className="contents">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{scene.title}</h1>
            <p className="text-lg text-slate-600 mt-1">
              Oggetti trovati: <span className="font-bold text-slate-900">{found.size}</span> · Forma{" "}
              <span className="font-bold text-slate-900">{Math.min(round + 1, order.length)}</span> di {order.length}
            </p>
          </div>
          <button
            type="button"
            onClick={() => tapRestart() && newGame()}
            className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border touch-manipulation ${
              restartArmed ? "bg-red-600 text-white border-red-600" : "bg-white text-slate-500 border-slate-300"
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {restartArmed ? "Tocca ancora" : "Ricomincia"}
          </button>
        </header>

        {!game ? <p className="text-xl">Caricamento della partita…</p> : phase.name === "finished" || !shape ? (
          <>
            <p className="rounded-xl bg-green-100 text-green-800 text-2xl font-bold p-5 text-center">Hai trovato tutti gli oggetti!</p>
            <p className="text-2xl">
              Oggetti trovati: <b>{found.size}</b>
            </p>
            <button type="button" className={`${primary} mt-auto`} onClick={newGame}>
              Nuova partita
            </button>
          </>
        ) : (
          <>
            <p className="text-3xl leading-tight">
              <b>TROVA</b> {foundOfShape > 0 ? "un altro" : "un"} oggetto a forma di <b className="text-blue-700">{shape}</b>
            </p>
            {notice && <NoticeCard notice={notice} onAccept={teacherAccept} />}
            {phase.name === "draw" ? (
              <>
                <p className="text-2xl leading-snug">
                  <b>DISEGNA</b> un riquadro intorno all&apos;oggetto.
                </p>
                <button type="button" className={`${secondary} mt-auto`} onClick={claimNoneLeft}>
                  Non ci sono altri oggetti {shaped(shape)}
                </button>
              </>
            ) : (
              <>
                <p className="text-2xl leading-snug">
                  <b>SCRIVI</b> il nome dell&apos;oggetto.
                </p>
                <div className="min-h-16 rounded-xl border-2 border-blue-500 bg-white px-4 py-3 text-3xl font-semibold tracking-wide break-all">
                  {word}
                  <span className="inline-block w-0.5 h-8 -mb-1 bg-blue-500 animate-pulse" />
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <LetterKeyboard onLetter={typeLetter} onBackspace={backspace} />
                  <div className="flex gap-3">
                    <button type="button" className={`${secondary} flex-1`} onClick={() => lookAgain()}>
                      Ridisegna
                    </button>
                    <button type="button" className={`${primary} flex-[2]`} disabled={!word.trim()} onClick={submit}>
                      Fatto
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
        </fieldset>
      </aside>
    </div>
  );
}

const primary = "rounded-xl bg-blue-600 text-white text-xl font-bold px-5 py-4 disabled:opacity-40 touch-manipulation";
const secondary = "rounded-xl bg-white text-slate-700 text-lg font-semibold px-5 py-3 border border-slate-300 touch-manipulation";

const TONE: Record<Notice["tone"], string> = {
  good: "bg-green-50 border-green-300 text-green-800",
  bad: "bg-orange-50 border-orange-300 text-orange-800",
  reveal: "bg-amber-50 border-amber-300 text-amber-800",
};

function NoticeCard({ notice, onAccept }: { notice: Notice; onAccept: (accept: NonNullable<Notice["accept"]>) => void }) {
  const { tone, title, text, word, attempt, accept } = notice;
  return (
    <div className={`rounded-xl border-2 px-4 py-3 flex flex-col gap-1 ${TONE[tone]}`} role="status">
      <p className="text-xl">
        <b>{title}</b> {text}
      </p>
      {word && <p className="text-3xl font-bold tracking-wide">{word}</p>}
      {(attempt || accept) && (
        <div className="flex items-center justify-between gap-2 mt-1">
          {attempt ? <Attempts used={attempt} /> : <span />}
          {accept && <TeacherAccept word={accept.written} onAccept={() => onAccept(accept)} />}
        </div>
      )}
    </div>
  );
}

// Found objects stay outlined, with their name, so the class sees the vocabulary.
// Names the app had to reveal are shown in amber.
function FoundMarker({ target, discovery, sceneWidth }: { target: SceneTarget; discovery: Discovery; sceneWidth: number }) {
  const { x, y, width, height } = target.box;
  const color = discovery.how === "revealed" ? "#d97706" : "#16a34a";
  const labelWidth = discovery.label.length * 12 + 24;
  const labelY = y - 40 >= 0 ? y - 40 : y + height + 6;
  const labelX = Math.min(Math.max(0, x + width / 2 - labelWidth / 2), sceneWidth - labelWidth);
  return (
    <g pointerEvents="none">
      <rect x={x - 6} y={y - 6} width={width + 12} height={height + 12} rx={8} fill="none" stroke={color} strokeWidth={5} strokeDasharray="14 8" />
      <rect x={labelX} y={labelY} width={labelWidth} height={32} rx={16} fill={color} />
      <text x={labelX + labelWidth / 2} y={labelY + 22} textAnchor="middle" fontSize={20} fontWeight={600} fill="#fff">
        {discovery.label}
      </text>
    </g>
  );
}

function Attempts({ used }: { used: number }) {
  return (
    <span className="flex items-center gap-2 text-base">
      Tentativo {used} di {MAX_ATTEMPTS}
      <span className="flex gap-1">
        {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
          <span key={i} className={`w-3 h-3 rounded-full ${i < used ? "bg-orange-500" : "bg-slate-300"}`} />
        ))}
      </span>
    </span>
  );
}

function TeacherAccept({ word, onAccept }: { word: string; onAccept: () => void }) {
  const [armed, tap] = useArmed();
  return (
    <button
      type="button"
      onClick={() => tap() && onAccept()}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium border touch-manipulation ${
        armed ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-500 border-slate-300"
      }`}
    >
      <UserCheck className="w-4 h-4" />
      {armed ? `Tocca ancora: accetta «${normalizeWord(word)}»` : "Accetta (insegnante)"}
    </button>
  );
}
