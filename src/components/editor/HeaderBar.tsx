"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface FeedbackInfo {
  allCorrect: boolean;
  correctCount: number;
  totalCount: number;
  rivalScore?: { correctCount: number; totalCount: number; teamLabel: string };
}

interface HeaderBarProps {
  sceneName: string;
  mode: "editor" | "play" | "practice";
  onModeChange: (mode: "editor" | "play" | "practice") => void;
  feedback?: FeedbackInfo;
  onRetry?: () => void;
  playerName: string | null;
  onLogin: () => void;
  onLogout: () => void;
  resultSummary?: string | null;
  resultsByScene?: Array<{ sceneId: string; correctCount: number; totalCount: number }>;
  matchStatus?: "playing" | "submitted" | "reveal";
  teamLabel?: string;
  onNewMatch?: () => void;
  isSpectator?: boolean;
}

function getTeamColors(teamLabel?: string, isSpectator?: boolean) {
  if (isSpectator) return "bg-amber-100 text-amber-800 border-amber-200";
  if (teamLabel === "Team A") return "bg-orange-100 text-orange-800 border-orange-200";
  if (teamLabel === "Team B") return "bg-purple-100 text-purple-800 border-purple-200";
  return "bg-green-100 text-green-800 border-green-200"; // Single Player
}

export default function HeaderBar({
  sceneName,
  mode,
  onModeChange,
  feedback,
  onRetry,
  playerName,
  onLogin,
  onLogout,
  resultSummary,
  resultsByScene,
  matchStatus,
  teamLabel,
  onNewMatch,
  isSpectator,
}: HeaderBarProps) {
  const [resultsOpen, setResultsOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setResultsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`relative z-30 flex items-center justify-between h-14 px-4 border-b transition-colors ${mode === "editor"
        ? "bg-gradient-to-b from-blue-50/80 to-white border-blue-200"
        : mode === "practice"
          ? "bg-gradient-to-b from-amber-50/90 to-white border-amber-200"
          : "bg-gradient-to-b from-emerald-50/80 to-white border-emerald-200"
      }`}>
      {/* Left: back link */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/scenes" className="flex items-center gap-2 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Scenes</span>
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-semibold">{sceneName}</span>
        {isSpectator ? (
          <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${getTeamColors(undefined, true)}`}>
            Spectator
          </span>
        ) : teamLabel ? (
          <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${getTeamColors(teamLabel, false)}`}>
            {teamLabel}
          </span>
        ) : mode === "play" ? (
          <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${getTeamColors(undefined, false)}`}>
            Single Player
          </span>
        ) : mode === "practice" ? (
          <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Practice
          </span>
        ) : null}
      </div>

      {/* Center: feedback or title + language switcher */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        {matchStatus === "submitted" ? (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-amber-700">
              {teamLabel} done! Waiting for the other team...
            </span>
          </div>
        ) : feedback?.rivalScore ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-700">
              {teamLabel}: {feedback.correctCount}/{feedback.totalCount}
            </span>
            <span className="text-sm text-gray-400">vs</span>
            <span className="text-sm font-semibold text-purple-700">
              {feedback.rivalScore.teamLabel}: {feedback.rivalScore.correctCount}/{feedback.rivalScore.totalCount}
            </span>
            {feedback.correctCount > feedback.rivalScore.correctCount && (
              <span className="text-sm font-bold text-green-600">{teamLabel} wins!</span>
            )}
            {feedback.correctCount < feedback.rivalScore.correctCount && (
              <span className="text-sm font-bold text-red-600">{feedback.rivalScore.teamLabel} wins!</span>
            )}
            {feedback.correctCount === feedback.rivalScore.correctCount && (
              <span className="text-sm font-bold text-amber-600">Tie!</span>
            )}
            {onNewMatch && (
              <button
                onClick={onNewMatch}
                className="px-3 py-1 rounded-md text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors"
              >
                New Match
              </button>
            )}
          </div>
        ) : feedback ? (
          <div className="flex items-center gap-3">
            <span className={`text-sm font-semibold ${feedback.allCorrect ? "text-green-700" : "text-amber-700"}`}>
              {feedback.allCorrect
                ? "All correct! Well done!"
                : `${feedback.correctCount} of ${feedback.totalCount} correct`}
            </span>
            <button
              onClick={onRetry}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${feedback.allCorrect
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-amber-600 text-white hover:bg-amber-700"
                }`}
            >
              {feedback.allCorrect ? "Play Again" : "Retry"}
            </button>
          </div>
        ) : (
          <h1 className="text-lg font-bold text-gray-900">{sceneName}</h1>
        )}
      </div>

      {/* Right: mode toggle */}
      <div className="flex items-center gap-3">
        {playerName ? (
          <div ref={resultsRef} className="relative flex items-center gap-2 text-sm text-gray-600">
            <button
              onClick={() => setResultsOpen((v) => !v)}
              className="px-2.5 py-1 rounded-full bg-white/70 border border-gray-200 hover:bg-white transition-colors"
            >
              Player: <span className="font-semibold text-gray-900">{playerName}</span>
            </button>
            {resultSummary ? (
              <span className="text-xs text-gray-500">{resultSummary}</span>
            ) : null}
            <button
              onClick={onLogout}
              className="text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
            {resultsOpen ? (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg p-3 z-50">
                <div className="text-xs font-semibold text-gray-500 mb-2">Results by scene</div>
                {resultsByScene && resultsByScene.length > 0 ? (
                  <div className="space-y-1">
                    {resultsByScene.map((r) => (
                      <div key={r.sceneId} className="flex items-center justify-between text-sm text-gray-700">
                        <span className="truncate pr-2">{r.sceneId.replace(/[-_]/g, " ")}</span>
                        <span className="text-xs text-gray-500">{r.correctCount}/{r.totalCount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No results yet.</div>
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="px-3 py-1.5 text-sm font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Login
          </button>
        )}
        <button
          onClick={() => onModeChange("practice")}
          className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${mode === "practice"
            ? "bg-amber-500 text-gray-950 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          Practice
        </button>
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
