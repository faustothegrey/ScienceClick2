import { useDroppable } from "@dnd-kit/core";
import Toolbar from "./Toolbar";
import type { DropTarget } from "@/app/scenes/[id]/page";
import { Term, getTermLabel } from "@/lib/i18n"; import { X } from "lucide-react";

export type MatchStatus = "playing" | "submitted" | "reveal";

interface CanvasProps {
  sceneId: string;
  imageFilename: string | null;
  dropTargets: DropTarget[];
  terms: Term[];
  mode: "editor" | "play";
  playerGuesses: Record<string, string>;
  showFeedback: boolean;
  placingTermId: string | null;
  onCanvasClick: (xPercent: number, yPercent: number) => void;
  onRemoveGuess?: (targetId: string) => void;
  locale: string;
  opaqueTargets?: boolean;
  rivalGuesses?: Record<string, string>;
  rivalLiveProgress?: string[];
  matchStatus?: MatchStatus;
  teamLabel?: string;
  isSpectator?: boolean;
}

function DropZone({
  target, terms, mode, guessTermId, showFeedback, locale, opaqueTargets,
  rivalGuessTermId, showRivalFeedback, teamLabel, isRivalLivePlaced,
  indicatorColor, onRemoveGuess
}: {
  target: DropTarget; terms: Term[]; mode: "editor" | "play";
  guessTermId?: string; showFeedback: boolean; locale: string; opaqueTargets?: boolean;
  rivalGuessTermId?: string; showRivalFeedback?: boolean;
  teamLabel?: string; isRivalLivePlaced?: boolean; indicatorColor?: "purple" | "orange";
  isSpectator?: boolean;
  onRemoveGuess?: (targetId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: target.id });
  const assignedTerm = terms.find((t) => t.id === target.assignedTerm);
  const editorLabel = assignedTerm ? getTermLabel(assignedTerm, locale) : null;
  const guessTerm = guessTermId ? terms.find((t) => t.id === guessTermId) : null;
  const guessLabel = guessTerm ? getTermLabel(guessTerm, locale) : null;

  const rivalTerm = rivalGuessTermId ? terms.find((t) => t.id === rivalGuessTermId) : null;
  const rivalLabel = rivalTerm ? getTermLabel(rivalTerm, locale) : null;
  const rivalCorrect = rivalGuessTermId === target.assignedTerm;

  const filled = mode === "editor" ? !!editorLabel : !!guessLabel;
  const isCorrect = showFeedback && guessTermId === target.assignedTerm;
  const isIncorrect = showFeedback && guessTermId !== target.assignedTerm;

  const emptyBg = opaqueTargets ? "bg-white" : "bg-white/80";

  let className: string;
  if (mode === "editor") {
    className = filled
      ? "bg-white border-2 border-blue-400 text-gray-800 shadow-md"
      : `border-2 border-dashed border-gray-400 ${emptyBg} text-gray-500 shadow-sm`;
  } else if (isCorrect) {
    className = "bg-green-50 border-2 border-green-500 text-green-800 shadow-md";
  } else if (isIncorrect) {
    className = "bg-red-50 border-2 border-red-500 text-red-800 shadow-md";
  } else if (filled) {
    className = "bg-white border-2 border-blue-400 text-gray-800 shadow-md";
  } else if (isOver) {
    className = "border-2 border-blue-500 bg-blue-100 text-blue-600 scale-110 shadow-lg ring-4 ring-blue-500/20";
  } else {
    className = `border-2 border-dashed border-gray-400 ${emptyBg} text-gray-500 shadow-sm`;
  }

  // Common transitions to smooth the snap when hovering
  const baseClasses = "transition-all duration-200 ease-out";

  const showRival = showRivalFeedback && rivalLabel;
  const rivalTeamName = teamLabel === "Team A" ? "Team B" : "Team A";
  const rivalThemeColor = indicatorColor === "purple" ? "bg-purple-500" : indicatorColor === "orange" ? "bg-orange-500" : (teamLabel === "Team A" ? "bg-orange-500" : "bg-purple-500");

  return (
    <div
      ref={setNodeRef}
      className={`absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 w-32 rounded-lg text-sm font-medium ${baseClasses} ${showRival ? "h-16" : "h-10"} ${className}`}
      style={{
        left: `${target.x}%`,
        top: `${target.y}%`,
      }}
    >
      <span>{mode === "editor" ? editorLabel : guessLabel}</span>
      {mode === "play" && guessTermId && !showFeedback && onRemoveGuess && (
        <button
          className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 border border-gray-300 text-gray-500 hover:text-red-500 hover:border-red-500 transition-colors shadow-sm"
          onPointerDown={(e) => {
            e.stopPropagation();
            onRemoveGuess(target.id);
          }}
          title="Remove Label"
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {showRival && (
        <span className={`text-xs mt-0.5 px-1.5 py-0.5 rounded ${rivalCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          vs {rivalLabel}
        </span>
      )}
      {/* Live progress indicator when the rival has placed a term but hasn't submitted yet */}
      {isRivalLivePlaced && !showRivalFeedback && (
        <div
          className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full ${rivalThemeColor} shadow-md border border-white animate-pulse`}
          title={`${rivalTeamName} has placed a label here`}
        />
      )}
    </div>
  );
}

export default function Canvas({ sceneId, imageFilename, dropTargets, terms, mode, playerGuesses, showFeedback, placingTermId, onCanvasClick, onRemoveGuess, locale, opaqueTargets, rivalGuesses, rivalLiveProgress, matchStatus, teamLabel, isSpectator }: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  const isPlacing = !!placingTermId;
  const placingTerm = isPlacing ? terms.find((t) => t.id === placingTermId) : null;
  const placingLabel = placingTerm ? getTermLabel(placingTerm, locale) : null;

  const imageSrc = imageFilename ? `/scenes/${sceneId}/${imageFilename}` : null;

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!isPlacing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    onCanvasClick(xPercent, yPercent);
  }

  return (
    <div className="flex-1 flex flex-col bg-blue-50/50 relative">
      <Toolbar />

      {/* Placing indicator */}
      {isPlacing && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg shadow-md">
          Click on the image to place &ldquo;{placingLabel}&rdquo;
        </div>
      )}

      {/* Canvas area — fixed 3:2 aspect ratio (1200×800 standard) */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          ref={setNodeRef}
          id="canvas-drop-area"
          onClick={handleClick}
          className={`bg-white rounded-xl shadow-sm w-full relative border-2 transition-colors ${isPlacing
            ? "border-blue-400 cursor-crosshair"
            : isOver
              ? "border-blue-300 bg-blue-50/30"
              : "border-transparent"
            } ${!isPlacing ? "cursor-default" : ""}`}
          style={{ aspectRatio: "3 / 2" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {imageSrc && (
            <img
              src={imageSrc}
              alt={`${sceneId} scene`}
              className="absolute inset-0 w-full h-full object-cover rounded-lg pointer-events-none select-none"
            />
          )}

          {/* Drop Targets */}
          {dropTargets.map((target) => (
            <DropZone
              key={target.id}
              target={target}
              terms={terms}
              mode={mode}
              guessTermId={playerGuesses[target.id]}
              showFeedback={showFeedback}
              locale={locale}
              opaqueTargets={opaqueTargets}
              rivalGuessTermId={rivalGuesses?.[target.id]}
              showRivalFeedback={matchStatus === "reveal" && !isSpectator}
              teamLabel={teamLabel}
              isRivalLivePlaced={rivalLiveProgress?.includes(target.id)}
              indicatorColor={isSpectator ? (teamLabel === "Team A" ? "purple" : "orange") : undefined}
              onRemoveGuess={onRemoveGuess}
            />
          ))}

          {/* Waiting overlay for match mode */}
          {matchStatus === "submitted" && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-lg font-semibold text-amber-700">
                  {teamLabel ? `${teamLabel} done!` : "Done!"} Waiting for the other team...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
