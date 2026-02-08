import { MousePointer2, Image, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const tools: { icon: LucideIcon; label: string }[] = [
  { icon: MousePointer2, label: "Select" },
  { icon: Image, label: "Image" },
  { icon: Play, label: "Play" },
];

export default function Toolbar() {
  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 p-1.5 bg-white rounded-xl shadow-md">
      {tools.map(({ icon: Icon, label }) => (
        <button
          key={label}
          title={label}
          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}
