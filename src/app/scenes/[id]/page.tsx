"use client";

import { useId, useState, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { useParams } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
} from "@dnd-kit/core";
import HeaderBar from "@/components/editor/HeaderBar";
import Canvas from "@/components/editor/Canvas";
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

export default function SceneEditorPage() {
  const { id } = useParams<{ id: string }>();
  const dndId = useId();
  const [mode, setMode] = useState<"editor" | "play">("play");
  const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
  const [dropTargets, setDropTargets] = useState<DropTarget[]>([]);
  const [locale, setLocale] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`sc2:scene:${id}:locale`) ?? "en";
    }
    return "en";
  });

  function handleLocaleChange(newLocale: string) {
    setLocale(newLocale);
    localStorage.setItem(`sc2:scene:${id}:locale`, newLocale);
  }

  useEffect(() => {
    fetch(`/api/scenes/${id}/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAvailableTerms(data.terms.map((t: Record<string, unknown>) => migrateTerm(t)));
          setDropTargets(data.dropTargets);
        }
      });
  }, [id]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Play mode: player's guesses, mapping drop target id → term id
  const [playerGuesses, setPlayerGuesses] = useState<Record<string, string>>({});
  // Whether to reveal correct/incorrect feedback on drop zones
  const [showFeedback, setShowFeedback] = useState(false);
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

  // Auto-check as soon as the last term is placed
  useEffect(() => {
    if (allPlaced && !showFeedback) {
      setShowFeedback(true);
      if (correctCount === dropTargets.length) fireConfetti();
    }
  }, [allPlaced, showFeedback, correctCount, dropTargets.length, fireConfetti]);

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
          onModeChange={(m) => { setMode(m); if (m === "play") { setPlayerGuesses({}); setShowFeedback(false); } }}
          locale={locale}
          onLocaleChange={handleLocaleChange}
          feedback={showFeedback ? { allCorrect, correctCount, totalCount: dropTargets.length } : undefined}
          onRetry={() => { setPlayerGuesses({}); setShowFeedback(false); }}
        />
        <div className="flex flex-1 overflow-hidden">
          <Canvas
            sceneId={id}
            dropTargets={dropTargets}
            terms={availableTerms}
            mode={mode}
            playerGuesses={playerGuesses}
            showFeedback={showFeedback}
            placingTermId={placingTermId}
            onCanvasClick={handleCanvasClick}
            locale={locale}
          />
          <WordList
            terms={availableTerms}
            mode={mode}
            onAddTerm={handleAddTerm}
            onRemoveTerm={handleRemoveTerm}
            locale={locale}
            placedTermIds={placedTermIds}
          />
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTerm ? (
          <div className="px-3 py-2.5 bg-white border border-blue-400 rounded-lg shadow-lg font-medium text-sm text-gray-700 cursor-move">
            {getTermLabel(activeTerm, locale)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
