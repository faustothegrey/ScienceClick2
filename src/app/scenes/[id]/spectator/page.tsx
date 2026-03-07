"use client";

import { use, useState, useEffect, useRef } from "react";
import { DndContext, pointerWithin } from "@dnd-kit/core";
import HeaderBar from "@/components/editor/HeaderBar";
import Canvas from "@/components/editor/Canvas";
import type { MatchStatus } from "@/components/editor/Canvas";
import { Term, migrateTerm } from "@/lib/i18n";
import type { DropTarget } from "@/app/scenes/[id]/page";

function formatName(id: string) {
    return id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SpectatorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const [availableTerms, setAvailableTerms] = useState<Term[]>([]);
    const [dropTargets, setDropTargets] = useState<DropTarget[]>([]);
    const [opaqueTargets, setOpaqueTargets] = useState(false);
    const [sceneImage, setSceneImage] = useState<string | null>(null);

    const [locale, setLocale] = useState("en");

    // Match state
    const [matchStatus, setMatchStatus] = useState<MatchStatus>("playing");
    const [progressA, setProgressA] = useState<string[]>([]);
    const [progressB, setProgressB] = useState<string[]>([]);
    const [guessesA, setGuessesA] = useState<Record<string, string> | null>(null);
    const [guessesB, setGuessesB] = useState<Record<string, string> | null>(null);
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load config
    useEffect(() => {
        if (typeof window !== "undefined") {
            setLocale(localStorage.getItem(`sc2:scene:${id}:locale`) ?? "en");
        }

        fetch(`/api/scenes/${id}/config`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data) {
                    setAvailableTerms(data.terms.map((t: Record<string, unknown>) => migrateTerm(t)));
                    setDropTargets(data.dropTargets);
                    if (data.opaqueTargets) setOpaqueTargets(true);
                    if (data.image) setSceneImage(data.image);
                }
            });
    }, [id]);

    // Polling
    useEffect(() => {
        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/scenes/${id}/match`);
                const data = await res.json();

                if (data.status === "waiting" && data.progress) {
                    setProgressA(data.progress["team-a"] || []);
                    setProgressB(data.progress["team-b"] || []);
                } else if (data.status === "complete") {
                    setGuessesA(data.teams["team-a"].guesses);
                    setGuessesB(data.teams["team-b"].guesses);
                    setMatchStatus("reveal");
                }
            } catch {
                // ignore errors
            }
        }, 2000);

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        };
    }, [id]);

    return (
        <DndContext collisionDetection={pointerWithin}>
            <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
                <HeaderBar
                    sceneName={formatName(id)}
                    mode="play"
                    onModeChange={() => { }}
                    teamLabel="Spectator View"
                    matchStatus={matchStatus}
                    onNewMatch={matchStatus === "reveal" ? async () => {
                        await fetch(`/api/scenes/${id}/match`, { method: "DELETE" });
                        setMatchStatus("playing");
                        setProgressA([]);
                        setProgressB([]);
                        setGuessesA(null);
                        setGuessesB(null);
                    } : undefined}
                    onLogin={() => { }}
                    onLogout={() => { }}
                    playerName={null}
                    resultSummary={null}
                    resultsByScene={[]}
                />

                {/* Dual Canvas Layout for Spectator */}
                <div className="flex flex-col lg:flex-row flex-1 p-4 gap-4 overflow-y-auto lg:overflow-hidden">

                    {/* Team A Canvas */}
                    <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg border-2 border-orange-200 overflow-hidden">
                        <div className="bg-orange-100 text-orange-900 px-4 py-2 font-bold text-center border-b border-orange-200">
                            Team A
                        </div>
                        <div className="flex-1 relative overflow-hidden pointer-events-none">
                            <Canvas
                                sceneId={id}
                                imageFilename={sceneImage}
                                dropTargets={dropTargets}
                                terms={availableTerms}
                                mode="play"
                                // The spectator has no guesses during play, only final guesses at reveal
                                playerGuesses={guessesA || {}}
                                showFeedback={matchStatus === "reveal"}
                                placingTermId={null}
                                onCanvasClick={() => { }}
                                locale={locale}
                                opaqueTargets={opaqueTargets}
                                rivalLiveProgress={matchStatus === "playing" ? progressA : []}
                                matchStatus={matchStatus}
                                teamLabel="Team A"
                                isSpectator={true} /* Passes spectator flag down to apply proper indicator colors */
                            />
                        </div>
                    </div>

                    {/* Team B Canvas */}
                    <div className="flex-1 flex flex-col bg-white rounded-xl shadow-lg border-2 border-purple-200 overflow-hidden">
                        <div className="bg-purple-100 text-purple-900 px-4 py-2 font-bold text-center border-b border-purple-200">
                            Team B
                        </div>
                        <div className="flex-1 relative overflow-hidden pointer-events-none">
                            <Canvas
                                sceneId={id}
                                imageFilename={sceneImage}
                                dropTargets={dropTargets}
                                terms={availableTerms}
                                mode="play"
                                playerGuesses={guessesB || {}}
                                showFeedback={matchStatus === "reveal"}
                                placingTermId={null}
                                onCanvasClick={() => { }}
                                locale={locale}
                                opaqueTargets={opaqueTargets}
                                rivalLiveProgress={matchStatus === "playing" ? progressB : []}
                                matchStatus={matchStatus}
                                teamLabel="Team B"
                                isSpectator={true} /* Passes spectator flag down to apply proper indicator colors */
                            />
                        </div>
                    </div>

                </div>
            </div>
        </DndContext>
    );
}
