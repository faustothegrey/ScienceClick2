import { useState, useCallback } from "react";
import { useDroppable } from "@dnd-kit/core";
import Toolbar from "./Toolbar";
import type { DropTarget } from "@/app/scenes/[id]/page";
import { Term, getTermLabel } from "@/lib/i18n";

const IMAGE_FORMATS = ["scene.svg", "scene.png", "scene.jpeg", "scene.jpg"];

export type MatchStatus = "playing" | "submitted" | "reveal";

interface CanvasProps {
  sceneId: string;
  dropTargets: DropTarget[];
  terms: Term[];
  mode: "editor" | "play";
  playerGuesses: Record<string, string>;
  showFeedback: boolean;
  placingTermId: string | null;
  onCanvasClick: (xPercent: number, yPercent: number) => void;
  locale: string;
  opaqueTargets?: boolean;
  rivalGuesses?: Record<string, string>;
  matchStatus?: MatchStatus;
  teamLabel?: string;
}

function DropZone({
  target, terms, mode, guessTermId, showFeedback, locale, opaqueTargets,
  rivalGuessTermId, showRivalFeedback,
}: {
  target: DropTarget; terms: Term[]; mode: "editor" | "play";
  guessTermId?: string; showFeedback: boolean; locale: string; opaqueTargets?: boolean;
  rivalGuessTermId?: string; showRivalFeedback?: boolean;
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
    className = "border-2 border-dashed border-blue-400 bg-blue-50 text-blue-400";
  } else {
    className = `border-2 border-dashed border-gray-400 ${emptyBg} text-gray-500 shadow-sm`;
  }

  const showRival = showRivalFeedback && rivalLabel;

  return (
    <div
      ref={setNodeRef}
      className={`absolute z-10 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 w-32 rounded-lg text-sm font-medium transition-colors ${showRival ? "h-16" : "h-10"} ${className}`}
      style={{
        left: `${target.x}%`,
        top: `${target.y}%`,
      }}
    >
      <span>{mode === "editor" ? editorLabel : guessLabel}</span>
      {showRival && (
        <span className={`text-xs mt-0.5 px-1.5 py-0.5 rounded ${rivalCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          vs {rivalLabel}
        </span>
      )}
    </div>
  );
}

export default function Canvas({ sceneId, dropTargets, terms, mode, playerGuesses, showFeedback, placingTermId, onCanvasClick, locale, opaqueTargets, rivalGuesses, matchStatus, teamLabel }: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  const isPlacing = !!placingTermId;
  const placingTerm = isPlacing ? terms.find((t) => t.id === placingTermId) : null;
  const placingLabel = placingTerm ? getTermLabel(placingTerm, locale) : null;
  const [imageIndex, setImageIndex] = useState(0);
  const imageSrc = imageIndex < IMAGE_FORMATS.length
    ? `/scenes/${sceneId}/${IMAGE_FORMATS[imageIndex]}`
    : null;
  const handleImageError = useCallback(() => {
    setImageIndex((i) => i + 1);
  }, []);

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
          className={`bg-white rounded-xl shadow-sm w-full relative border-2 transition-colors ${
            isPlacing
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
              onError={handleImageError}
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
              showRivalFeedback={matchStatus === "reveal"}
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
