"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { SUPPORTED_LOCALES } from "@/lib/i18n";

interface HeaderBarProps {
  mode: "editor" | "play";
  onModeChange: (mode: "editor" | "play") => void;
  locale: string;
  onLocaleChange: (locale: string) => void;
}

export default function HeaderBar({ mode, onModeChange, locale, onLocaleChange }: HeaderBarProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`relative z-30 flex items-center justify-between h-14 px-4 border-b transition-colors ${
      mode === "editor"
        ? "bg-gradient-to-b from-blue-50/80 to-white border-blue-200"
        : "bg-gradient-to-b from-emerald-50/80 to-white border-emerald-200"
    }`}>
      {/* Left: back link */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <ArrowLeft className="w-4 h-4" />
        <span>Scenes</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-semibold">Demo Scene</span>
      </div>

      {/* Center: title + language switcher */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-900">Demo Scene</h1>

        {/* Language Switcher */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 px-2 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {locale.toUpperCase()}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {open && (
            <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
              {SUPPORTED_LOCALES.map((loc) => (
                <button
                  key={loc.code}
                  onClick={() => { onLocaleChange(loc.code); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors ${locale === loc.code ? "font-semibold text-blue-600" : "text-gray-700"
                    }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: mode toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onModeChange("editor")}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${mode === "editor"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Editor
        </button>
        <button
          onClick={() => onModeChange("play")}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${mode === "play"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Play
        </button>
      </div>
    </header>
  );
}
