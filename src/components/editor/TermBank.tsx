import { useDraggable } from "@dnd-kit/core";
import { Plus, Save, Settings, GripVertical, X } from "lucide-react";

interface Term {
  id: string;
  label: string;
}

interface TermBankProps {
  terms: Term[];
  mode: "editor" | "play";
  onAddTerm: (label: string) => void;
  onRemoveTerm: (termId: string) => void;
  onSave: () => void;
}

function DraggableTerm({ term, mode, onRemove }: { term: Term; mode: "editor" | "play"; onRemove: (termId: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: term.id,
  });

  return (
    <div className={`flex items-center gap-1 ${isDragging ? "opacity-30" : ""}`}>
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="flex-1 flex items-center gap-2 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg cursor-move hover:border-blue-400 transition-colors"
      >
        <GripVertical className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-sm font-medium text-gray-700">{term.label}</span>
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

export default function TermBank({ terms, mode, onAddTerm, onRemoveTerm, onSave }: TermBankProps) {
  function handleNewTerm() {
    const label = window.prompt("Enter term label:");
    if (label?.trim()) {
      onAddTerm(label.trim());
    }
  }

  return (
    <aside className="w-72 bg-white border-l border-gray-200 flex flex-col z-20">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Term Bank</h2>
        <button className="text-gray-400 hover:text-gray-600">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* New Term + Save buttons (editor only) */}
      {mode === "editor" && (
        <div className="p-3 flex gap-2">
          <button
            onClick={handleNewTerm}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            New Term
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      )}

      {/* Category */}
      <div className="px-4 pt-2 flex-1 overflow-y-auto">
        <div className="border-t border-gray-100 pt-3">
          <div className="space-y-2">
            {terms.map((term) => (
              <DraggableTerm key={term.id} term={term} mode={mode} onRemove={onRemoveTerm} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
