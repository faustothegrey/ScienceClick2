import { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Plus, Save, Settings, GripVertical, X } from "lucide-react";
import { Term, getTermLabel, SUPPORTED_LOCALES } from "@/lib/i18n";

interface WordListProps {
  terms: Term[];
  mode: "editor" | "play";
  onAddTerm: (label: string) => void;
  onRemoveTerm: (termId: string) => void;
  locale: string;
  placedTermIds?: Set<string>;
  playKey?: number;
}

function LocaleBadges({ term, activeLocale, onLocaleClick }: { term: Term; activeLocale: string; onLocaleClick: (code: string) => void }) {
  return (
    <div className="flex gap-0.5 ml-auto">
      {SUPPORTED_LOCALES.map((loc) => {
        const hasTranslation = !!term.translations[loc.code];
        const isActive = loc.code === activeLocale;
        return (
          <button
            key={loc.code}
            type="button"
            disabled={!hasTranslation}
            onPointerDown={(e) => { e.stopPropagation(); onLocaleClick(loc.code); }}
            className={`text-[10px] font-semibold uppercase leading-none px-1 py-0.5 rounded transition-colors ${
              isActive && hasTranslation
                ? "text-white bg-blue-600"
                : hasTranslation
                  ? "text-blue-600 bg-blue-50 hover:bg-blue-100 cursor-pointer"
                  : "text-gray-300 bg-gray-50 cursor-default"
            }`}
          >
            {loc.code}
          </button>
        );
      })}
    </div>
  );
}

function DraggableTerm({ term, mode, onRemove, locale, isPlaced }: { term: Term; mode: "editor" | "play"; onRemove: (termId: string) => void; locale: string; isPlaced: boolean }) {
  const [termLocale, setTermLocale] = useState(locale);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: term.id,
  });

  // Reset per-term locale when global locale changes
  useEffect(() => { setTermLocale(locale); }, [locale]);

  return (
    <div className={`flex items-center gap-1 ${isDragging ? "opacity-30" : ""} ${isPlaced ? "opacity-40" : ""}`}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
          isPlaced
            ? "bg-gray-100 border border-gray-100 cursor-default"
            : "bg-gray-50 border border-gray-200 cursor-move hover:border-blue-400"
        }`}
      >
        <GripVertical className={`w-3.5 h-3.5 shrink-0 ${isPlaced ? "text-gray-200" : "text-gray-300"}`} />
        <span className={`text-sm font-medium ${isPlaced ? "text-gray-400 line-through" : "text-gray-700"}`}>{getTermLabel(term, termLocale)}</span>
        {!isPlaced && <LocaleBadges term={term} activeLocale={termLocale} onLocaleClick={setTermLocale} />}
      </div>
      {mode === "editor" && (
        <button
          onClick={() => onRemove(term.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default function WordList({ terms, mode, onAddTerm, onRemoveTerm, locale, placedTermIds, playKey }: WordListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  function handleSaveNew() {
    if (newLabel.trim()) {
      onAddTerm(newLabel.trim());
      setNewLabel("");
      setIsCreating(false);
    }
  }

  function handleCancelNew() {
    setNewLabel("");
    setIsCreating(false);
  }

  return (
    <aside className="w-72 bg-white border-l border-gray-200 flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Word List</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* New Term button (editor only) */}
      {mode === "editor" && (
        <div className="p-3">
          {!isCreating ? (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              New Term
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                autoFocus
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveNew();
                  if (e.key === "Escape") handleCancelNew();
                }}
                placeholder="Enter term label"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-blue-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveNew}
                  disabled={!newLabel.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </button>
                <button
                  onClick={handleCancelNew}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 whitespace-nowrap"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Terms list */}
      <div className="px-4 pt-2 flex-1 overflow-y-auto">
        <div className="border-t border-gray-100 pt-3">
          <div className="space-y-2">
            {terms.map((term) => (
              <DraggableTerm key={`${term.id}-${playKey ?? 0}`} term={term} mode={mode} onRemove={onRemoveTerm} locale={locale} isPlaced={placedTermIds?.has(term.id) ?? false} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
