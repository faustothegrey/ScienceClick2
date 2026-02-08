"use client";

import { useId, useState, useEffect } from "react";
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
import TermBank from "@/components/editor/TermBank";

export interface DropTarget {
  id: string;
  x: number; // percentage of container width (0-100)
  y: number; // percentage of container height (0-100)
  assignedTerm: string | null;
}

export default function SceneEditorPage() {
  const { id } = useParams<{ id: string }>();
  const dndId = useId();
  const [mode, setMode] = useState<"editor" | "play">("editor");
  const [availableTerms, setAvailableTerms] = useState<{ id: string; label: string }[]>([]);
  const [dropTargets, setDropTargets] = useState<DropTarget[]>([]);

  useEffect(() => {
    fetch(`/api/scenes/${id}/config`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAvailableTerms(data.terms);
          setDropTargets(data.dropTargets);
        }
      });
  }, [id]);
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleCanvasClick(xPercent: number, yPercent: number) {
    setDropTargets((targets) => [
      ...targets,
      {
        id: `target-${Date.now()}`,
        x: xPercent,
        y: yPercent,
        assignedTerm: null,
      },
    ]);
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over) {
      const targetId = over.id as string;
      const target = dropTargets.find((t) => t.id === targetId);
      if (target) {
        const term = availableTerms.find((t) => t.id === active.id);
        if (term) {
          setDropTargets((targets) =>
            targets.map((t) =>
              t.id === targetId ? { ...t, assignedTerm: term.label } : t
            )
          );
        }
      }
    }
    setActiveId(null);
  }

  function handleAddTerm(label: string) {
    setAvailableTerms((terms) => [
      ...terms,
      { id: `term-${Date.now()}`, label },
    ]);
  }

  function handleSave() {
    fetch(`/api/scenes/${id}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terms: availableTerms, dropTargets }),
    });
  }

  const activeTerm = availableTerms.find((t) => t.id === activeId);

  return (
    <DndContext
      id={dndId}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="flex flex-col h-screen">
        <HeaderBar mode={mode} onModeChange={setMode} />
        <div className="flex flex-1 overflow-hidden">
          <Canvas
            dropTargets={dropTargets}
            onCanvasClick={handleCanvasClick}
            mode={mode}
          />
          <TermBank
            terms={availableTerms}
            mode={mode}
            onAddTerm={handleAddTerm}
            onSave={handleSave}
          />
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTerm ? (
          <div className="px-3 py-2.5 bg-white border border-blue-400 rounded-lg shadow-lg font-medium text-sm text-gray-700 cursor-move">
            {activeTerm.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
