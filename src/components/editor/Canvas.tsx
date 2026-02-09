import { useDroppable } from "@dnd-kit/core";
import Toolbar from "./Toolbar";
import type { DropTarget } from "@/app/scenes/[id]/page";

interface Term {
  id: string;
  label: string;
}

interface CanvasProps {
  dropTargets: DropTarget[];
  terms: Term[];
  mode: "editor" | "play";
  playerGuesses: Record<string, string>;
}

function DropZone({ target, terms, mode, guessTermId }: { target: DropTarget; terms: Term[]; mode: "editor" | "play"; guessTermId?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: target.id });
  const editorLabel = terms.find((t) => t.id === target.assignedTerm)?.label ?? null;
  const guessLabel = guessTermId ? terms.find((t) => t.id === guessTermId)?.label ?? null : null;

  const filled = mode === "editor" ? !!editorLabel : !!guessLabel;

  return (
    <div
      ref={setNodeRef}
      className={`absolute z-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 w-24 h-10 rounded-lg text-sm font-medium transition-colors ${
        filled
          ? "bg-white border-2 border-blue-400 text-gray-800 shadow-md"
          : isOver
            ? "border-2 border-dashed border-blue-400 bg-blue-50 text-blue-400"
            : "border-2 border-dashed border-gray-400 bg-white/80 text-gray-500 shadow-sm"
      }`}
      style={{
        left: `${target.x}%`,
        top: `${target.y}%`,
      }}
    >
      {mode === "editor" ? editorLabel : guessLabel}
    </div>
  );
}

export default function Canvas({ dropTargets, terms, mode, playerGuesses }: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });

  return (
    <div className="flex-1 flex flex-col bg-blue-50/50 relative">
      <Toolbar />

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          ref={setNodeRef}
          id="canvas-drop-area"
          className={`bg-white rounded-xl shadow-sm w-full h-full flex items-center justify-center relative border-2 transition-colors ${
            isOver
              ? "border-blue-300 bg-blue-50/30"
              : "border-transparent"
          } ${mode === "editor" ? "cursor-default" : "cursor-default"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scenes/demo/scene.png"
            alt="Water Cycle Diagram"
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Drop Targets */}
          {dropTargets.map((target) => (
            <DropZone key={target.id} target={target} terms={terms} mode={mode} guessTermId={playerGuesses[target.id]} />
          ))}
        </div>
      </div>
    </div>
  );
}
