import { Plus } from "lucide-react";
import Toolbar from "./Toolbar";

export default function Canvas() {
  return (
    <div className="flex-1 flex flex-col bg-blue-50/50 relative">
      <Toolbar />

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden w-full h-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/scenes/demo/water-cycle.svg"
            alt="Water Cycle Diagram"
            className="w-full h-full object-contain"
          />
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
