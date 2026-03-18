import { Sun, Moon, Monitor } from "lucide-react";

export type CanvasBg = "default" | "light" | "dark";

const bgOptions: { value: CanvasBg; icon: typeof Sun; label: string }[] = [
  { value: "default", icon: Monitor, label: "Default" },
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
];

interface ToolbarProps {
  canvasBg: CanvasBg;
  onCanvasBgChange: (bg: CanvasBg) => void;
}

export default function Toolbar({ canvasBg, onCanvasBgChange }: ToolbarProps) {
  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-1 p-1.5 bg-white rounded-xl shadow-md">
      {bgOptions.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          title={`${label} background`}
          onClick={() => onCanvasBgChange(value)}
          className={`p-2 rounded-lg transition-colors ${
            canvasBg === value
              ? "bg-blue-100 text-blue-600"
              : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          }`}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
}
