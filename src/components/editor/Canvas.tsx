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
  placingTermId: string | null;
  onCanvasClick: (xPercent: number, yPercent: number) => void;
}

function DropZone({ target, terms, mode, guessTermId, allPlaced }: { target: DropTarget; terms: Term[]; mode: "editor" | "play"; guessTermId?: string; allPlaced: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: target.id });
  const editorLabel = terms.find((t) => t.id === target.assignedTerm)?.label ?? null;
  const guessLabel = guessTermId ? terms.find((t) => t.id === guessTermId)?.label ?? null : null;

  const filled = mode === "editor" ? !!editorLabel : !!guessLabel;
  const showFeedback = mode === "play" && allPlaced;
  const isCorrect = showFeedback && guessTermId === target.assignedTerm;
  const isIncorrect = showFeedback && guessTermId !== target.assignedTerm;

  let className: string;
  if (mode === "editor") {
    className = filled
      ? "bg-white border-2 border-blue-400 text-gray-800 shadow-md"
      : "border-2 border-dashed border-gray-400 bg-white/80 text-gray-500 shadow-sm";
  } else if (isCorrect) {
    className = "bg-green-50 border-2 border-green-500 text-green-800 shadow-md";
  } else if (isIncorrect) {
    className = "bg-red-50 border-2 border-red-500 text-red-800 shadow-md";
  } else if (filled) {
    className = "bg-white border-2 border-blue-400 text-gray-800 shadow-md";
  } else if (isOver) {
    className = "border-2 border-dashed border-blue-400 bg-blue-50 text-blue-400";
  } else {
    className = "border-2 border-dashed border-gray-400 bg-white/80 text-gray-500 shadow-sm";
  }

  return (
    <div
      ref={setNodeRef}
      className={`absolute z-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 w-24 h-10 rounded-lg text-sm font-medium transition-colors ${className}`}
      style={{
        left: `${target.x}%`,
        top: `${target.y}%`,
      }}
    >
      {mode === "editor" ? editorLabel : guessLabel}
    </div>
  );
}

export default function Canvas({ dropTargets, terms, mode, playerGuesses, placingTermId, onCanvasClick }: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  const allPlaced = dropTargets.length > 0 && dropTargets.every((t) => playerGuesses[t.id]);
  const isPlacing = !!placingTermId;
  const placingLabel = isPlacing ? terms.find((t) => t.id === placingTermId)?.label : null;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isPlacing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    onCanvasClick(xPercent, yPercent);
  }

  return (
    <div className="flex-1 flex flex-col bg-blue-50/50 relative">
      <Toolbar />

      {/* Placing indicator */}
      {isPlacing && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg shadow-md">
          Click on the image to place &ldquo;{placingLabel}&rdquo;
        </div>
      )}

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          ref={setNodeRef}
          id="canvas-drop-area"
          onClick={handleClick}
          className={`bg-white rounded-xl shadow-sm w-full h-full flex items-center justify-center relative border-2 transition-colors ${
            isPlacing
              ? "border-blue-400 cursor-crosshair"
              : isOver
                ? "border-blue-300 bg-blue-50/30"
                : "border-transparent"
          } ${!isPlacing ? "cursor-default" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scenes/demo/scene.png"
            alt="Water Cycle Diagram"
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Drop Targets */}
          {dropTargets.map((target) => (
            <DropZone key={target.id} target={target} terms={terms} mode={mode} guessTermId={playerGuesses[target.id]} allPlaced={allPlaced} />
          ))}
        </div>
      </div>
    </div>
  );
}
