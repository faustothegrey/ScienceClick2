import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import Toolbar from "./Toolbar";

interface PlacedItem {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface CanvasProps {
  placedItems: PlacedItem[];
}

export default function Canvas({ placedItems }: CanvasProps) {
  const { setNodeRef } = useDroppable({
    id: "canvas",
  });

  return (
    <div className="flex-1 flex flex-col bg-blue-50/50 relative">
      <Toolbar />

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          ref={setNodeRef}
          className="bg-white rounded-xl shadow-sm w-full h-full flex items-center justify-center relative border-2 border-transparent transition-colors hover:border-blue-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scenes/demo/scene.png"
            alt="Water Cycle Diagram"
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Placed Items */}
          {placedItems.map((item) => (
            <div
              key={item.id}
              className="absolute px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 font-medium text-sm text-gray-800 -translate-x-1/2 -translate-y-1/2"
              style={{
                left: item.x,
                top: item.y,
              }}
            >
              {item.label}
            </div>
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
