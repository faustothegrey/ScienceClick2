import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Plus, Save, GripVertical, X } from "lucide-react";
import { Term, getTermLabel } from "@/lib/i18n";

interface WordListProps {
  terms: Term[];
  mode: "editor" | "play" | "practice";
  onAddTerm: (label: string) => void;
  onRemoveTerm: (termId: string) => void;
  locale: string;
  termLocales: Record<string, string>;
  placedTermIds?: Set<string>;
  playKey?: number;
}

function DraggableTerm({ term, mode, onRemove, termLocale, isPlaced }: { term: Term; mode: "editor" | "play" | "practice"; onRemove: (termId: string) => void; termLocale: string; isPlaced: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: term.id,
  });

  return (
    <div className={`flex items-center gap-1 shrink-0 ${isDragging ? "opacity-30" : ""} ${isPlaced ? "opacity-40" : ""}`}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`relative flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors select-none ${
          isPlaced
            ? "bg-gray-100 border border-gray-100 cursor-default"
            : "bg-gray-50 border border-gray-200 cursor-move hover:border-blue-400"
        }`}
      >
        {/* Hanging hole — top center */}
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-gray-200 ring-1 ring-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] pointer-events-none" />
        <GripVertical className={`w-3.5 h-3.5 shrink-0 ${isPlaced ? "text-gray-200" : "text-gray-300"}`} />
        <span className={`text-sm font-medium whitespace-nowrap ${isPlaced ? "text-gray-400 line-through" : "text-gray-700"}`}>{getTermLabel(term, termLocale)}</span>
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

export default function WordList({ terms, mode, onAddTerm, onRemoveTerm, locale, termLocales, placedTermIds, playKey }: WordListProps) {
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
    <aside className="shrink-0 w-52 bg-white border-l border-gray-200 flex flex-col z-20">
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

      {/* Terms list — vertical column */}
      <div className="flex-1 overflow-y-auto px-4 pt-2">
        <div className="border-t border-gray-100 pt-3">
          <div className="flex flex-col gap-2">
            {terms.map((term) => (
              <DraggableTerm key={`${term.id}-${playKey ?? 0}`} term={term} mode={mode} onRemove={onRemoveTerm} termLocale={termLocales[term.id] || locale} isPlaced={placedTermIds?.has(term.id) ?? false} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
