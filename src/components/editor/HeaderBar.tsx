import { ArrowLeft } from "lucide-react";

interface HeaderBarProps {
  mode: "editor" | "play";
  onModeChange: (mode: "editor" | "play") => void;
}

export default function HeaderBar({ mode, onModeChange }: HeaderBarProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 bg-gradient-to-b from-blue-50/80 to-white border-b border-blue-100">
      {/* Left: back link */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <ArrowLeft className="w-4 h-4" />
        <span>Scenes</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-semibold">Demo Scene</span>
      </div>

      {/* Center: title */}
      <h1 className="text-lg font-bold text-gray-900 absolute left-1/2 -translate-x-1/2">
        Demo Scene
      </h1>

      {/* Right: mode toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onModeChange("editor")}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
            mode === "editor"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Editor
        </button>
        <button
          onClick={() => onModeChange("play")}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${
            mode === "play"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Play
        </button>
      </div>
    </header>
  );
}
