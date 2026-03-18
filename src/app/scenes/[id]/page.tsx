"use client";

import { Suspense, useId, useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { useParams, useSearchParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import HeaderBar from "@/components/editor/HeaderBar";
import Canvas from "@/components/editor/Canvas";
import type { MatchStatus } from "@/components/editor/Canvas";
import type { CanvasBg } from "@/components/editor/Toolbar";
import WordList from "@/components/editor/WordList";
import { Term, migrateTerm, getTermLabel } from "@/lib/i18n";

export interface DropTarget {
  id: string;
  x: number; // percentage of container width (0-100)
  y: number; // percentage of container height (0-100)
  assignedTerm: string | null;
}

function formatName(id: string) {
  return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTeamLabel(team: string): string {
  return team === "team-a" ? "Team A" : "Team B";
}

function SceneEditorPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const teamParam = searchParams.get("team") as "team-a" | "team-b" | null;
  const isMatchMode = !!teamParam;
  const teamLabel = teamParam ? formatTeamLabel(teamParam) : undefined;
  const rivalTeam = teamParam === "team-a" ? "team-b" : "team-a";

  const dndId = useId();
  const [mode, setMode] = useState<"editor" | "play">(isMatchMode ? "play" : "play");
  const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
  const [dropTargets, setDropTargets] = useState<DropTarget[]>([]);
  const [opaqueTargets, setOpaqueTargets] = useState(false);
  const [canvasBg, setCanvasBg] = useState<CanvasBg>("default");
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [locale, setLocale] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`sc2:scene:${id}:locale`) ?? "en";
    }
    return "en";
  });
  // Per-term locale overrides (termId → locale code)
  const [termLocales, setTermLocales] = useState<Record<string, string>>({});
  const [playerName, setPlayerName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sc2:playerName");
    }
    return null;
  });
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [resultsByScene, setResultsByScene] = useState<Array<{ sceneId: string; correctCount: number; totalCount: number }>>([]);
  const lastRecordedPlayKeyRef = useRef<number | null>(null);

  // Match mode state
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("playing");
  const [rivalGuesses, setRivalGuesses] = useState<Record<string, string> | null>(null);
  const [rivalLiveProgress, setRivalLiveProgress] = useState<string[]>([]);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSubmittedRef = useRef(false);

  function handleLocaleChange(newLocale: string) {
    setLocale(newLocale);
    setTermLocales({});
    localStorage.setItem(`sc2:scene:${id}:locale`, newLocale);
  }

  function handleTermLocaleChange(termId: string, loc: string) {
    setTermLocales((prev) => ({ ...prev, [termId]: loc }));
  }

  async function handleLogin() {
    const name = window.prompt("Enter your name (optional):", playerName ?? "");
    if (!name) {
      localStorage.removeItem("sc2:playerName");
      setPlayerName(null);
      setResultSummary(null);
      return;
    }
    localStorage.setItem("sc2:playerName", name);
    setPlayerName(name);
    setResultSummary(null);
    await fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", name }),
    });
  }

  function handleLogout() {
    localStorage.removeItem("sc2:playerName");
    setPlayerName(null);
    setResultSummary(null);
  }

  useEffect(() => {
    fetch(`/api/scenes/${id}/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAvailableTerms(data.terms.map((t: Record<string, unknown>) => migrateTerm(t)));
          setDropTargets(data.dropTargets);
          if (data.opaqueTargets) setOpaqueTargets(true);
          if (data.image) setSceneImage(data.image);
        }
      });
  }, [id]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Play mode: player's guesses, mapping drop target id → term id
  const [playerGuesses, setPlayerGuesses] = useState<Record<string, string>>({});
  // Whether to reveal correct/incorrect feedback on drop zones
  const [showFeedback, setShowFeedback] = useState(false);
  // Incremented on each play reset to re-mount term components
  const [playKey, setPlayKey] = useState(0);
  // Editor mode: term awaiting placement on canvas
  const [placingTermId, setPlacingTermId] = useState<string | null>(null);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, activatorEvent, delta } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const term = availableTerms.find((t) => t.id === active.id);
    if (!term) {
      setActiveId(null);
      return;
    }

    if (over.id === "canvas" && mode === "editor") {
      // Dropped on canvas background — create or reposition drop target
      const pointerEvent = activatorEvent as PointerEvent;
      const finalX = pointerEvent.clientX + delta.x;
      const finalY = pointerEvent.clientY + delta.y;

      const canvasEl = document.getElementById("canvas-drop-area");
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const xPercent = ((finalX - rect.left) / rect.width) * 100;
        const yPercent = ((finalY - rect.top) / rect.height) * 100;

        const existing = dropTargets.find((t) => t.assignedTerm === term.id);
        let nextTargets: DropTarget[];
        if (existing) {
          nextTargets = dropTargets.map((t) =>
            t.id === existing.id ? { ...t, x: xPercent, y: yPercent } : t
          );
        } else {
          nextTargets = [
            ...dropTargets,
            {
              id: `target-${Date.now()}`,
              x: xPercent,
              y: yPercent,
              assignedTerm: term.id,
            },
          ];
        }
        setDropTargets(nextTargets);

        // Persist reposition
        fetch(`/api/scenes/${id}/config`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ terms: availableTerms, dropTargets: nextTargets }),
        });
      }
    } else if (over.id !== "canvas" && mode === "play") {
      // Don't allow dragging after submission in match mode
      if (isMatchMode && matchStatus !== "playing") return;

      // Dropped on an existing drop target in play mode
      const targetId = over.id as string;
      const target = dropTargets.find((t) => t.id === targetId);
      if (target) {
        setPlayerGuesses((prev) => {
          const next = { ...prev };
          // Remove this term from any other target (one-to-one)
          for (const key of Object.keys(next)) {
            if (next[key] === term.id) delete next[key];
          }
          next[targetId] = term.id;
          return next;
        });
      }
    }

    setActiveId(null);
  }

  function handleAddTerm(label: string) {
    const termId = `term-${Date.now()}`;
    setAvailableTerms((terms) => [
      ...terms,
      { id: termId, translations: { [locale]: label }, defaultLocale: locale },
    ]);
    setPlacingTermId(termId);
  }

  function handleCanvasClick(xPercent: number, yPercent: number) {
    if (!placingTermId) return;
    const newTarget: DropTarget = {
      id: `target-${Date.now()}`,
      x: xPercent,
      y: yPercent,
      assignedTerm: placingTermId,
    };
    const nextTargets = [...dropTargets, newTarget];
    setDropTargets(nextTargets);
    setPlacingTermId(null);

    // Persist now that both term and drop target are defined
    fetch(`/api/scenes/${id}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms: availableTerms, dropTargets: nextTargets }),
    });
  }

  function handleRemoveTerm(termId: string) {
    const nextTerms = availableTerms.filter((t) => t.id !== termId);
    const nextTargets = dropTargets.filter((t) => t.assignedTerm !== termId);
    setAvailableTerms(nextTerms);
    setDropTargets(nextTargets);

    // Persist removal
    fetch(`/api/scenes/${id}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms: nextTerms, dropTargets: nextTargets }),
    });
  }

  const activeTerm = availableTerms.find((t) => t.id === activeId);

  const fireConfetti = useCallback(() => {
    const end = Date.now() + 1500;
    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899"];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  const placedTermIds = new Set(Object.values(playerGuesses));
  const allPlaced = mode === "play" && dropTargets.length > 0 && dropTargets.every((t) => playerGuesses[t.id]);
  const correctCount = allPlaced
    ? dropTargets.filter((t) => playerGuesses[t.id] === t.assignedTerm).length
    : 0;
  const allCorrect = allPlaced && correctCount === dropTargets.length;

  // Compute rival score when available
  const rivalCorrectCount = rivalGuesses
    ? dropTargets.filter((t) => rivalGuesses[t.id] === t.assignedTerm).length
    : 0;

  useEffect(() => {
    if (!playerName) return;
    fetch(`/api/results?name=${encodeURIComponent(playerName)}&sceneId=${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const result = data?.result;
        if (result && typeof result.correctCount === "number" && typeof result.totalCount === "number") {
          setResultSummary(`Last result: ${result.correctCount}/${result.totalCount}`);
        } else {
          setResultSummary(null);
        }
      });
  }, [playerName, id]);

  useEffect(() => {
    if (!playerName) {
      setResultsByScene([]);
      return;
    }
    fetch(`/api/results?name=${encodeURIComponent(playerName)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const scenes = data?.result?.scenes ?? null;
        if (!scenes || typeof scenes !== "object") {
          setResultsByScene([]);
          return;
        }
        const list = Object.entries(scenes).map(([sceneId, result]) => ({
          sceneId,
          correctCount: (result as { correctCount: number }).correctCount,
          totalCount: (result as { totalCount: number }).totalCount,
        }));
        setResultsByScene(list);
      });
  }, [playerName]);

  // Auto-check as soon as the last term is placed
  useEffect(() => {
    if (!allPlaced || showFeedback) return;

    if (isMatchMode) {
      // Match mode: submit guesses and start polling
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      setMatchStatus("submitted");

      fetch(`/api/scenes/${id}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: teamParam, guesses: playerGuesses }),
      });
    } else {
      // Single player: show feedback immediately
      setShowFeedback(true);
      if (correctCount === dropTargets.length) fireConfetti();
    }
  }, [allPlaced, showFeedback, isMatchMode, correctCount, dropTargets.length, fireConfetti, id, teamParam, playerGuesses]);

  // Sync live progress with server in match mode
  useEffect(() => {
    if (!isMatchMode || matchStatus !== "playing" || hasSubmittedRef.current) return;

    // Only send the target IDs that have been filled so far
    const placedTargetIds = Object.keys(playerGuesses);

    fetch(`/api/scenes/${id}/match`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: teamParam, liveProgress: placedTargetIds }),
    }).catch(() => {
      // ignore errors on progress update
    });
  }, [playerGuesses, isMatchMode, matchStatus, teamParam, id]);

  // Match mode polling
  useEffect(() => {
    if (!isMatchMode || matchStatus !== "playing" && matchStatus !== "submitted") return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/scenes/${id}/match`);
        const data = await res.json();

        if (data.status === "waiting" && data.progress && data.progress[rivalTeam]) {
          setRivalLiveProgress(data.progress[rivalTeam]);
        }

        if (data.status === "complete") {
          clearInterval(pollIntervalRef.current!);
          setRivalGuesses(data.teams[rivalTeam].guesses);
          setMatchStatus("reveal");
          setShowFeedback(true);
          // Fire confetti if this team won
          const ownScore = dropTargets.filter((t) => playerGuesses[t.id] === t.assignedTerm).length;
          const otherScore = dropTargets.filter((t) => data.teams[rivalTeam].guesses[t.id] === t.assignedTerm).length;
          if (ownScore > otherScore || ownScore === dropTargets.length) {
            fireConfetti();
          }
        }
      } catch {
        // ignore poll errors
      }
    }, 2000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isMatchMode, matchStatus, id, rivalTeam, dropTargets, playerGuesses, fireConfetti]);

  useEffect(() => {
    if (isMatchMode) return; // Skip result recording in match mode
    if (!playerName || !showFeedback || !allPlaced) return;
    if (lastRecordedPlayKeyRef.current === playKey) return;
    lastRecordedPlayKeyRef.current = playKey;
    fetch("/api/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "record",
        name: playerName,
        sceneId: id,
        correctCount,
        totalCount: dropTargets.length,
        allCorrect,
      }),
    }).then(() => {
      setResultSummary(`Last result: ${correctCount}/${dropTargets.length}`);
      setResultsByScene((prev) => {
        const next = prev.filter((r) => r.sceneId !== id);
        next.unshift({ sceneId: id, correctCount, totalCount: dropTargets.length });
        return next;
      });
    });
  }, [isMatchMode, playerName, showFeedback, allPlaced, playKey, correctCount, dropTargets.length, allCorrect, id]);

  // Build feedback prop
  const feedbackProp = showFeedback
    ? {
      allCorrect,
      correctCount,
      totalCount: dropTargets.length,
      ...(isMatchMode && rivalGuesses
        ? {
          rivalScore: {
            correctCount: rivalCorrectCount,
            totalCount: dropTargets.length,
            teamLabel: formatTeamLabel(rivalTeam),
          },
        }
        : {}),
    }
    : undefined;

  return (
    <DndContext
      id={dndId}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="flex flex-col h-screen">
        <HeaderBar
          sceneName={formatName(id)}
          mode={mode}
          onModeChange={(m) => {
            if (isMatchMode) return; // Don't allow mode switching in match mode
            setMode(m);
            if (m === "play") { setPlayerGuesses({}); setShowFeedback(false); setPlayKey((k) => k + 1); }
          }}
          feedback={feedbackProp}
          onRetry={isMatchMode ? undefined : () => { setPlayerGuesses({}); setShowFeedback(false); setPlayKey((k) => k + 1); }}
          onNewMatch={isMatchMode && matchStatus === "reveal" ? async () => {
            await fetch(`/api/scenes/${id}/match`, { method: "DELETE" });
            setPlayerGuesses({});
            setShowFeedback(false);
            setRivalGuesses(null);
            setRivalLiveProgress([]);
            setMatchStatus("playing");
            hasSubmittedRef.current = false;
            setPlayKey((k) => k + 1);
          } : undefined}
          playerName={playerName}
          onLogin={handleLogin}
          onLogout={handleLogout}
          resultSummary={resultSummary}
          resultsByScene={resultsByScene}
          matchStatus={isMatchMode ? matchStatus : undefined}
          teamLabel={teamLabel}
        />
        <div className="flex flex-1 overflow-hidden">
          <Canvas
            sceneId={id}
            imageFilename={sceneImage}
            dropTargets={dropTargets}
            terms={availableTerms}
            mode={mode}
            playerGuesses={playerGuesses}
            showFeedback={showFeedback}
            placingTermId={placingTermId}
            onCanvasClick={handleCanvasClick}
            onRemoveGuess={(targetId) => {
              setPlayerGuesses((prev) => {
                const next = { ...prev };
                delete next[targetId];
                return next;
              });
            }}
            locale={locale}
            termLocales={termLocales}
            opaqueTargets={opaqueTargets}
            rivalGuesses={rivalGuesses ?? undefined}
            rivalLiveProgress={rivalLiveProgress}
            matchStatus={isMatchMode ? matchStatus : undefined}
            teamLabel={teamLabel}
            canvasBg={canvasBg}
            onCanvasBgChange={setCanvasBg}
          />
          <WordList
            terms={availableTerms}
            mode={mode}
            onAddTerm={handleAddTerm}
            onRemoveTerm={handleRemoveTerm}
            locale={locale}
            onLocaleChange={handleLocaleChange}
            termLocales={termLocales}
            onTermLocaleChange={handleTermLocaleChange}
            placedTermIds={placedTermIds}
            playKey={playKey}
          />
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTerm ? (
          <div className="w-32 h-10 flex items-center justify-center bg-white border-2 border-blue-400 rounded-lg shadow-lg font-medium text-sm text-gray-800 cursor-move">
            {getTermLabel(activeTerm, termLocales[activeTerm.id] || locale)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default function SceneEditorPageWrapper() {
  return (
    <Suspense>
      <SceneEditorPage />
    </Suspense>
  );
}
