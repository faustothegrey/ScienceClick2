import { useDraggable } from "@dnd-kit/core";
import { Lightbulb, RotateCcw, SkipForward, Sparkles, Target } from "lucide-react";
import { Term, getTermLabel } from "@/lib/i18n";

interface PracticePanelProps {
  currentTerm: Term | null;
  locale: string;
  step: number;
  total: number;
  round: "main" | "review" | "complete";
  hintLevel: number;
  currentMistakes: number;
  missedCount: number;
  statusMessage: string | null;
  firstLetterHint: string | null;
  translationHint: string | null;
  onNextHint: () => void;
  onRestart: () => void;
  onSkip: () => void;
}

function DraggablePracticeTerm({ term, locale }: { term: Term; locale: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: term.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`rounded-2xl border border-amber-300 bg-amber-50 px-4 py-5 shadow-sm transition-all ${isDragging ? "opacity-30" : "cursor-move hover:border-amber-400 hover:shadow-md"}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
        <Target className="h-3.5 w-3.5" />
        Drag This Label
      </div>
      <div className="mt-3 text-2xl font-bold text-gray-900">{getTermLabel(term, locale)}</div>
    </div>
  );
}

export default function PracticePanel({
  currentTerm,
  locale,
  step,
  total,
  round,
  hintLevel,
  currentMistakes,
  missedCount,
  statusMessage,
  firstLetterHint,
  translationHint,
  onNextHint,
  onRestart,
  onSkip,
}: PracticePanelProps) {
  const remainingHints = Math.max(0, 3 - hintLevel);

  return (
    <aside className="w-80 border-l border-amber-100 bg-gradient-to-b from-amber-50 via-white to-orange-50 p-5 flex flex-col gap-5 overflow-y-auto">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Practice Mode</div>
        <h2 className="mt-2 text-2xl font-bold text-gray-950">
          {round === "complete" ? "Session complete" : round === "review" ? "Review missed labels" : "Guided practice"}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {round === "complete"
            ? "You finished the practice round."
            : "One term at a time. Drag the active label to its matching target."}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-600">Progress</span>
          <span className="font-semibold text-gray-900">{Math.min(step, total)}/{total}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-amber-500 transition-all"
            style={{ width: `${total === 0 ? 0 : (Math.min(step, total) / total) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>{missedCount} missed labels</span>
          <span>{currentMistakes} mistakes on current label</span>
        </div>
      </div>

      {currentTerm ? <DraggablePracticeTerm term={currentTerm} locale={locale} /> : null}

      {statusMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-100/70 px-4 py-3 text-sm font-medium text-amber-900">
          {statusMessage}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Hints
        </div>
        <div className="mt-3 space-y-3 text-sm text-gray-600">
          <p>Hints unlock progressively so the learner still has to make the final match.</p>
          {hintLevel >= 1 ? <p><span className="font-semibold text-gray-900">Region:</span> the correct target is highlighted on the scene.</p> : null}
          {hintLevel >= 2 && firstLetterHint ? <p><span className="font-semibold text-gray-900">First letter:</span> {firstLetterHint}</p> : null}
          {hintLevel >= 3 && translationHint ? <p><span className="font-semibold text-gray-900">Translation:</span> {translationHint}</p> : null}
        </div>
        <button
          onClick={onNextHint}
          disabled={!currentTerm || hintLevel >= 3}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
        >
          <Sparkles className="h-4 w-4" />
          {remainingHints > 0 ? `Reveal hint ${hintLevel + 1}` : "All hints revealed"}
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={onRestart}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
        >
          <RotateCcw className="h-4 w-4" />
          Restart practice
        </button>
        <button
          onClick={onSkip}
          disabled={!currentTerm}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <SkipForward className="h-4 w-4" />
          Skip for now
        </button>
      </div>
    </aside>
  );
}
