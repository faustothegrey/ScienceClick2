import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import Toolbar from "./Toolbar";
import type { DropTarget } from "@/app/scenes/[id]/page";

interface CanvasProps {
  dropTargets: DropTarget[];
  onCanvasClick: (xPercent: number, yPercent: number) => void;
  mode: "editor" | "play";
}

function DropZone({ target }: { target: DropTarget }) {
  const { setNodeRef, isOver } = useDroppable({ id: target.id });

  const filled = target.assignedTerm !== null;

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
      {filled ? target.assignedTerm : <Plus className="w-4 h-4" />}
    </div>
  );
}

export default function Canvas({ dropTargets, onCanvasClick, mode }: CanvasProps) {
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "editor") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    onCanvasClick(xPercent, yPercent);
  }

  return (
    <div className="flex-1 flex flex-col bg-blue-50/50 relative">
      <Toolbar />

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          onClick={handleClick}
          className={`bg-white rounded-xl shadow-sm w-full h-full flex items-center justify-center relative border-2 border-transparent transition-colors ${
            mode === "editor"
              ? "hover:border-blue-200 cursor-crosshair"
              : "cursor-default"
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scenes/demo/scene.png"
            alt="Water Cycle Diagram"
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Drop Targets */}
          {dropTargets.map((target) => (
            <DropZone key={target.id} target={target} />
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white rounded-lg shadow-sm px-3 py-1.5 text-sm text-gray-500">
        <button className="hover:text-gray-700">
          <Plus className="w-4 h-4" />
        </button>
        <span>Fit</span>
        <span className="text-gray-300">|</span>
        <span>100%</span>
      </div>
    </div>
  );
}
