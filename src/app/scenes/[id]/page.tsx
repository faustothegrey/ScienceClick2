"use client";

import { useState } from "react";
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

export default function SceneEditorPage() {
  const [availableTerms, setAvailableTerms] = useState([
    { id: "term-1", label: "Rain" },
    { id: "term-2", label: "Sun" },
    { id: "term-3", label: "Cloud" },
  ]);
  const [placedItems, setPlacedItems] = useState<
    Array<{ id: string; label: string; x: number; y: number }>
  >([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over, activatorEvent, delta } = event;

    if (over && over.id === "canvas") {
      const term = availableTerms.find((t) => t.id === active.id);
      if (term) {
        const pointerEvent = activatorEvent as PointerEvent;
        const canvasRect = over.rect;

        // Cursor position at drop = initial pointer + delta, relative to canvas
        const x = pointerEvent.clientX + delta.x - canvasRect.left;
        const y = pointerEvent.clientY + delta.y - canvasRect.top;

        setPlacedItems((items) => [
          ...items,
          {
            id: `${term.id}-${Date.now()}`,
            label: term.label,
            x,
            y,
          },
        ]);
      }
    }
    setActiveId(null);
  }

  const activeTerm = availableTerms.find((t) => t.id === activeId);

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className="flex flex-col h-screen">
        <HeaderBar />
        <div className="flex flex-1 overflow-hidden">
          <Canvas placedItems={placedItems} />
          <TermBank terms={availableTerms} />
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
