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
}

function DropZone({ target, terms, mode }: { target: DropTarget; terms: Term[]; mode: "editor" | "play" }) {
  const { setNodeRef, isOver } = useDroppable({ id: target.id });
  const termLabel = terms.find((t) => t.id === target.assignedTerm)?.label ?? null;

  return (
    <div
      ref={setNodeRef}
      className={`absolute z-10 flex items-center justify-center -translate-x-1/2 -translate-y-1/2 w-24 h-10 rounded-lg text-sm font-medium transition-colors ${
        mode === "editor"
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
      {mode === "editor" ? termLabel : null}
    </div>
  );
}

export default function Canvas({ dropTargets, terms, mode }: CanvasProps) {
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
            <DropZone key={target.id} target={target} terms={terms} mode={mode} />
          ))}
        </div>
      </div>
    </div>
  );
}
