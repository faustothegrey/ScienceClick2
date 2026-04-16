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
import PracticePanel from "@/components/editor/PracticePanel";
import { Term, migrateTerm, getTermLabel } from "@/lib/i18n";

export interface DropTarget {
  id: string;
  x: number;
  y: number;
  assignedTerm: string | null;
}

type SceneMode = "editor" | "play" | "practice";
type PracticeRound = "main" | "review" | "complete";

interface PracticeState {
  round: PracticeRound;
  queue: string[];
  completed: string[];
  mistakes: Record<string, number>;
  missed: string[];
  hintLevel: number;
  playerGuesses: Record<string, string>;
  statusMessage: string | null;
}

function formatName(id: string) {
  return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTeamLabel(team: string): string {
  return team === "team-a" ? "Team A" : "Team B";
}

function createDefaultPracticeState(targets: DropTarget[]): PracticeState {
  return {
    round: "main",
    queue: targets.map((target) => target.id),
    completed: [],
    mistakes: {},
    missed: [],
    hintLevel: 0,
    playerGuesses: {},
    statusMessage: null,
  };
}

function getPracticeStorageKey(sceneId: string, playerName: string | null) {
  return `sc2:practice:${sceneId}:${playerName ?? "guest"}`;
}

function getAlternateTranslation(term: Term, locale: string): string | null {
  const entries = Object.entries(term.translations);
  const match = entries.find(([code]) => code !== locale) ?? null;
  return match ? `${match[0].toUpperCase()}: ${match[1]}` : null;
}

function sanitizePracticeState(raw: unknown, targets: DropTarget[]): PracticeState {
  const fallback = createDefaultPracticeState(targets);
  if (!raw || typeof raw !== "object") return fallback;

  const targetIds = new Set(targets.map((target) => target.id));
  const source = raw as Partial<PracticeState>;
  const queue = Array.isArray(source.queue) ? source.queue.filter((id): id is string => typeof id === "string" && targetIds.has(id)) : fallback.queue;
  const completed = Array.isArray(source.completed) ? source.completed.filter((id): id is string => typeof id === "string" && targetIds.has(id)) : [];
  const missed = Array.isArray(source.missed) ? source.missed.filter((id): id is string => typeof id === "string" && targetIds.has(id)) : [];
  const mistakes = source.mistakes && typeof source.mistakes === "object"
    ? Object.fromEntries(
        Object.entries(source.mistakes)
          .filter(([key, value]) => targetIds.has(key) && typeof value === "number")
      )
    : {};
  const playerGuesses = source.playerGuesses && typeof source.playerGuesses === "object"
    ? Object.fromEntries(
        Object.entries(source.playerGuesses)
          .filter(([key, value]) => targetIds.has(key) && typeof value === "string")
      )
    : {};

  const nextState: PracticeState = {
    round: source.round === "review" || source.round === "complete" ? source.round : "main",
    queue,
    completed,
    missed,
    mistakes,
    playerGuesses,
    hintLevel: typeof source.hintLevel === "number" ? Math.max(0, Math.min(3, source.hintLevel)) : 0,
    statusMessage: typeof source.statusMessage === "string" ? source.statusMessage : null,
  };

  if (targets.length > 0 && nextState.queue.length === 0 && nextState.completed.length === 0) {
    return fallback;
  }

  return nextState;
}

function SceneEditorPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const teamParam = searchParams.get("team") as "team-a" | "team-b" | null;
  const isMatchMode = !!teamParam;
  const teamLabel = teamParam ? formatTeamLabel(teamParam) : undefined;
  const rivalTeam = teamParam === "team-a" ? "team-b" : "team-a";

  const dndId = useId();
  const [mode, setMode] = useState<SceneMode>(isMatchMode ? "play" : "play");
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
  const [termLocales, setTermLocales] = useState<Record<string, string>>({});
  const [playerName, setPlayerName] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sc2:playerName");
    }
    return null;
  });
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [resultsByScene, setResultsByScene] = useState<Array<{ sceneId: string; correctCount: number; totalCount: number }>>([]);
  const [practiceState, setPracticeState] = useState<PracticeState>(createDefaultPracticeState([]));
  const [practiceLoaded, setPracticeLoaded] = useState(false);
  const lastRecordedPlayKeyRef = useRef<number | null>(null);

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
          setOpaqueTargets(Boolean(data.opaqueTargets));
          if (data.image) setSceneImage(data.image);
        }
      });
  }, [id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (dropTargets.length === 0) {
      setPracticeState(createDefaultPracticeState([]));
      setPracticeLoaded(false);
      return;
    }

    const raw = localStorage.getItem(getPracticeStorageKey(id, playerName));
    let parsed: unknown = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    setPracticeState(sanitizePracticeState(parsed, dropTargets));
    setPracticeLoaded(true);
  }, [dropTargets, id, playerName]);

  useEffect(() => {
    if (typeof window === "undefined" || !practiceLoaded || dropTargets.length === 0) return;
    localStorage.setItem(getPracticeStorageKey(id, playerName), JSON.stringify(practiceState));
  }, [practiceState, id, playerName, practiceLoaded, dropTargets.length]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [playerGuesses, setPlayerGuesses] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [placingTermId, setPlacingTermId] = useState<string | null>(null);

  const activePracticeTargetId = practiceState.queue[0] ?? null;
  const activePracticeTarget = dropTargets.find((target) => target.id === activePracticeTargetId) ?? null;
  const activePracticeTerm = activePracticeTarget?.assignedTerm
    ? availableTerms.find((term) => term.id === activePracticeTarget.assignedTerm) ?? null
    : null;
  const practiceProgressTotal = dropTargets.length + (practiceState.round === "review" ? practiceState.missed.length : 0);
  const practiceStep = practiceState.completed.length;
  const practiceFirstLetterHint = activePracticeTerm ? getTermLabel(activePracticeTerm, locale).charAt(0).toUpperCase() : null;
  const practiceTranslationHint = activePracticeTerm ? getAlternateTranslation(activePracticeTerm, locale) : null;

  const resetPractice = useCallback(() => {
    const next = createDefaultPracticeState(dropTargets);
    setPracticeState(next);
    setPlayerGuesses({});
    setShowFeedback(false);
  }, [dropTargets]);

  function completePracticeTarget(targetId: string, termId: string) {
    setPracticeState((prev) => ({
      ...prev,
      queue: prev.queue.filter((id) => id !== targetId),
      completed: prev.completed.includes(targetId) ? prev.completed : [...prev.completed, targetId],
      playerGuesses: { ...prev.playerGuesses, [targetId]: termId },
      hintLevel: 0,
      statusMessage: null,
    }));
    setPlayerGuesses((prev) => ({ ...prev, [targetId]: termId }));
  }

  function registerPracticeMiss(targetId: string) {
    setPracticeState((prev) => ({
      ...prev,
      mistakes: { ...prev.mistakes, [targetId]: (prev.mistakes[targetId] ?? 0) + 1 },
      missed: prev.missed.includes(targetId) ? prev.missed : [...prev.missed, targetId],
      statusMessage: "Not there yet. Use a hint or try another region.",
    }));
  }

  function skipPracticeTarget() {
    if (!activePracticeTargetId) return;
    setPracticeState((prev) => ({
      ...prev,
      queue: [...prev.queue.slice(1), activePracticeTargetId],
      mistakes: { ...prev.mistakes, [activePracticeTargetId]: (prev.mistakes[activePracticeTargetId] ?? 0) + 1 },
      missed: prev.missed.includes(activePracticeTargetId) ? prev.missed : [...prev.missed, activePracticeTargetId],
      hintLevel: 0,
      statusMessage: "Skipped for now. It will come back later in the session.",
    }));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, activatorEvent, delta } = event;
    const activeIdStr = active.id as string;

    if (activeIdStr.startsWith("drag-target-") && mode === "editor") {
      const targetId = activeIdStr.replace("drag-target-", "");
      const target = dropTargets.find((t) => t.id === targetId);
      const canvasEl = document.getElementById("canvas-drop-area");
      if (target && canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const dxPercent = (delta.x / rect.width) * 100;
        const dyPercent = (delta.y / rect.height) * 100;
        const newX = Math.max(5, Math.min(95, target.x + dxPercent));
        const newY = Math.max(5, Math.min(95, target.y + dyPercent));
        const nextTargets = dropTargets.map((t) =>
          t.id === targetId ? { ...t, x: newX, y: newY } : t
        );
        setDropTargets(nextTargets);
        fetch(`/api/scenes/${id}/config`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ terms: availableTerms, dropTargets: nextTargets }),
        });
      }
      setActiveId(null);
      return;
    }

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
      const pointerEvent = activatorEvent as PointerEvent;
      const finalX = pointerEvent.clientX + delta.x;
      const finalY = pointerEvent.clientY + delta.y;

      const canvasEl = document.getElementById("canvas-drop-area");
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const xPercent = ((finalX - rect.left) / rect.width) * 100;
        const yPercent = ((finalY - rect.top) / rect.height) * 100;

        const existing = dropTargets.find((t) => t.assignedTerm === term.id);
        const nextTargets = existing
          ? dropTargets.map((t) => (t.id === existing.id ? { ...t, x: xPercent, y: yPercent } : t))
          : [...dropTargets, { id: `target-${Date.now()}`, x: xPercent, y: yPercent, assignedTerm: term.id }];

        setDropTargets(nextTargets);
        fetch(`/api/scenes/${id}/config`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ terms: availableTerms, dropTargets: nextTargets }),
        });
      }
    } else if (over.id !== "canvas" && mode === "play") {
      if (isMatchMode && matchStatus !== "playing") {
        setActiveId(null);
        return;
      }

      const targetId = over.id as string;
      const target = dropTargets.find((t) => t.id === targetId);
      if (target) {
        setPlayerGuesses((prev) => {
          const next = { ...prev };
          for (const key of Object.keys(next)) {
            if (next[key] === term.id) delete next[key];
          }
          next[targetId] = term.id;
          return next;
        });
      }
    } else if (over.id !== "canvas" && mode === "practice") {
      if (!activePracticeTargetId || !activePracticeTerm || term.id !== activePracticeTerm.id) {
        setActiveId(null);
        return;
      }

      const targetId = over.id as string;
      if (targetId === activePracticeTargetId) {
        completePracticeTarget(targetId, term.id);
      } else {
        registerPracticeMiss(activePracticeTargetId);
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

    fetch(`/api/scenes/${id}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms: nextTerms, dropTargets: nextTargets }),
    });
  }

  const activeTerm = availableTerms.find((t) => t.id === activeId);
  const dragTargetTerm = activeId?.startsWith("drag-target-")
    ? (() => {
        const targetId = activeId.replace("drag-target-", "");
        const target = dropTargets.find((t) => t.id === targetId);
        return target?.assignedTerm ? availableTerms.find((t) => t.id === target.assignedTerm) : undefined;
      })()
    : undefined;

  const fireConfetti = useCallback(() => {
    const end = Date.now() + 1500;
    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899"];
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  const effectiveGuesses = mode === "practice" ? practiceState.playerGuesses : playerGuesses;
  const placedTermIds = new Set(Object.values(effectiveGuesses));
  const allPlaced = mode === "play" && dropTargets.length > 0 && dropTargets.every((t) => playerGuesses[t.id]);
  const correctCount = allPlaced
    ? dropTargets.filter((t) => playerGuesses[t.id] === t.assignedTerm).length
    : 0;
  const allCorrect = allPlaced && correctCount === dropTargets.length;

  const rivalCorrectCount = rivalGuesses
    ? dropTargets.filter((t) => rivalGuesses[t.id] === t.assignedTerm).length
    : 0;

  useEffect(() => {
    if (!practiceLoaded || mode !== "practice" || dropTargets.length === 0) return;

    if (practiceState.round === "main" && practiceState.queue.length === 0) {
      if (practiceState.missed.length > 0) {
        const reviewQueue = [...practiceState.missed].sort((a, b) => (practiceState.mistakes[b] ?? 0) - (practiceState.mistakes[a] ?? 0));
        const reviewSet = new Set(reviewQueue);
        setPracticeState((prev) => ({
          ...prev,
          round: "review",
          queue: reviewQueue,
          completed: [],
          hintLevel: 0,
          statusMessage: "Review round: retry the labels you missed earlier.",
          playerGuesses: Object.fromEntries(Object.entries(prev.playerGuesses).filter(([key]) => !reviewSet.has(key))),
        }));
        return;
      }

      setPracticeState((prev) => ({ ...prev, round: "complete", statusMessage: "Practice complete. Restart to run it again." }));
      fireConfetti();
      return;
    }

    if (practiceState.round === "review" && practiceState.queue.length === 0) {
      setPracticeState((prev) => ({
        ...prev,
        round: "complete",
        hintLevel: 0,
        statusMessage: "Review complete. You cleared all missed labels.",
      }));
      fireConfetti();
    }
  }, [practiceLoaded, mode, dropTargets.length, practiceState, fireConfetti]);

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

  useEffect(() => {
    if (!allPlaced || showFeedback) return;

    if (isMatchMode) {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      setMatchStatus("submitted");

      fetch(`/api/scenes/${id}/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: teamParam, guesses: playerGuesses }),
      });
    } else {
      setShowFeedback(true);
      if (correctCount === dropTargets.length) fireConfetti();
    }
  }, [allPlaced, showFeedback, isMatchMode, correctCount, dropTargets.length, fireConfetti, id, teamParam, playerGuesses]);

  useEffect(() => {
    if (!isMatchMode || matchStatus !== "playing" || hasSubmittedRef.current) return;

    fetch(`/api/scenes/${id}/match`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team: teamParam, liveProgress: Object.keys(playerGuesses) }),
    }).catch(() => {
      // ignore errors on progress update
    });
  }, [playerGuesses, isMatchMode, matchStatus, teamParam, id]);

  useEffect(() => {
    if (!isMatchMode || (matchStatus !== "playing" && matchStatus !== "submitted")) return;

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
    if (isMatchMode) return;
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
          onModeChange={(nextMode) => {
            if (isMatchMode) return;
            setMode(nextMode);
            if (nextMode === "play") {
              setPlayerGuesses({});
              setShowFeedback(false);
              setPlayKey((k) => k + 1);
            }
            if (nextMode === "practice" && !practiceLoaded) {
              resetPractice();
            }
          }}
          feedback={feedbackProp}
          onRetry={isMatchMode ? undefined : () => {
            setPlayerGuesses({});
            setShowFeedback(false);
            setPlayKey((k) => k + 1);
          }}
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
            playerGuesses={effectiveGuesses}
            showFeedback={showFeedback}
            placingTermId={placingTermId}
            onCanvasClick={handleCanvasClick}
            onRemoveGuess={mode === "play" ? (targetId) => {
              setPlayerGuesses((prev) => {
                const next = { ...prev };
                delete next[targetId];
                return next;
              });
            } : undefined}
            locale={locale}
            termLocales={termLocales}
            opaqueTargets={opaqueTargets}
            rivalGuesses={rivalGuesses ?? undefined}
            rivalLiveProgress={rivalLiveProgress}
            matchStatus={isMatchMode ? matchStatus : undefined}
            teamLabel={teamLabel}
            canvasBg={canvasBg}
            onCanvasBgChange={setCanvasBg}
            practiceHighlightedTargetId={mode === "practice" && practiceState.hintLevel >= 1 ? activePracticeTargetId : null}
          />
          {mode === "practice" ? (
            <PracticePanel
              currentTerm={activePracticeTerm}
              locale={locale}
              step={practiceStep}
              total={practiceProgressTotal}
              round={practiceState.round}
              hintLevel={practiceState.hintLevel}
              currentMistakes={activePracticeTargetId ? (practiceState.mistakes[activePracticeTargetId] ?? 0) : 0}
              missedCount={practiceState.missed.length}
              statusMessage={practiceState.statusMessage}
              firstLetterHint={practiceFirstLetterHint}
              translationHint={practiceTranslationHint}
              onNextHint={() => {
                setPracticeState((prev) => ({
                  ...prev,
                  hintLevel: Math.min(3, prev.hintLevel + 1),
                  statusMessage: prev.hintLevel === 0 ? "Hint revealed on the canvas." : prev.statusMessage,
                }));
              }}
              onRestart={resetPractice}
              onSkip={skipPracticeTarget}
            />
          ) : (
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
          )}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {(activeTerm || dragTargetTerm) ? (
          <div className={`w-32 flex items-center justify-center rounded-lg shadow-lg font-medium text-sm cursor-grabbing ${mode === "practice" ? "h-14 bg-amber-50 border-2 border-amber-400 text-gray-900" : "h-10 bg-white border-2 border-blue-400 text-gray-800"}`}>
            {getTermLabel((activeTerm || dragTargetTerm)!, termLocales[(activeTerm || dragTargetTerm)!.id] || locale)}
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
