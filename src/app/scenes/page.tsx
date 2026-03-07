"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export type PlayMode = "single" | "team-a" | "team-b" | "spectator";

interface Scene {
  id: string;
  termCount: number;
  image: string | null;
  agent: string | null;
  category: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  "Universe & Earth": "🌍",
  "The Matter": "🔬",
  "Biology & Human Body": "🧬",
  "Everyday Scenes": "🏘️",
};

function formatName(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SceneCard({ scene, playMode, isMatchMode, onDelete }: { scene: Scene; playMode: PlayMode; isMatchMode: boolean; onDelete: (id: string) => void }) {
  const getHref = () => {
    if (!isMatchMode) {
      return `/scenes/${scene.id}`;
    }
    switch (playMode) {
      case "team-a":
        return `/scenes/${scene.id}?team=team-a`;
      case "team-b":
        return `/scenes/${scene.id}?team=team-b`;
      case "spectator":
        return `/scenes/${scene.id}/spectator`;
      default:
        return `/scenes/${scene.id}`;
    }
  };

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-700 transition-colors">
      <button
        onClick={(e) => {
          e.preventDefault();
          if (confirm(`Delete "${formatName(scene.id)}"? This cannot be undone.`)) {
            onDelete(scene.id);
          }
        }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-gray-900/80 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-gray-900 transition-all"
        title="Delete Scene"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <Link href={getHref()} className="block relative h-40 bg-gray-800 flex items-center justify-center overflow-hidden">
        {scene.image ? (
          <img
            src={`/scenes/${scene.id}/${scene.image}`}
            alt={formatName(scene.id)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <span className="text-4xl text-gray-600 transition-transform duration-500 ease-out group-hover:scale-110">
            {formatName(scene.id).charAt(0)}
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link href={getHref()} className="block">
          <h3 className="text-lg font-semibold text-gray-100 group-hover:text-amber-400 transition-colors">
            {formatName(scene.id)}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {scene.termCount} {scene.termCount === 1 ? "term" : "terms"}
            {scene.agent && <span className="ml-2 text-xs text-gray-500">by {scene.agent}</span>}
          </p>
        </Link>

        <div className="mt-4 pt-4 border-t border-gray-800/60 mt-auto flex justify-end">
          <Link
            href={getHref()}
            className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {isMatchMode ? "Start Match" : "Play Scene"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ScenesGalleryPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [playMode, setPlayMode] = useState<PlayMode>("team-a");
  const [isMatchMode, setIsMatchMode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/scenes")
      .then((res) => res.json())
      .then((data) => setScenes(data))
      .finally(() => setLoading(false));
  }, []);

  function handleDeleteScene(sceneId: string) {
    fetch(`/api/scenes/${sceneId}`, { method: "DELETE" })
      .then((res) => {
        if (res.ok) setScenes((prev) => prev.filter((s) => s.id !== sceneId));
      });
  }

  function handleCreateScene() {
    const name = prompt("Enter a name for the new scene:")?.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!id) return;
    router.push(`/scenes/${id}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Scenes</h1>
          <div className="flex items-center gap-4">
            {isMatchMode && (
              <select
                value={playMode}
                onChange={(e) => setPlayMode(e.target.value as PlayMode)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
              >
                <option value="single">Single Player</option>
                <option value="team-a">Team A</option>
                <option value="team-b">Team B</option>
                <option value="spectator">Spectator View</option>
              </select>
            )}
            <button
              onClick={() => setIsMatchMode(!isMatchMode)}
              className={`px-4 py-2 font-semibold rounded-lg transition-colors border ${isMatchMode
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30"
                  : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
                }`}
            >
              {isMatchMode ? "Disable Match Mode" : "Enable Match Mode"}
            </button>
            <button
              onClick={handleCreateScene}
              className="px-4 py-2 bg-amber-500 text-gray-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
            >
              Create Scene
            </button>
          </div>
        </header>

        {loading ? (
          <p className="text-gray-400">Loading scenes...</p>
        ) : scenes.length === 0 ? (
          <p className="text-gray-400">
            No scenes yet. Click &quot;Create Scene&quot; to get started.
          </p>
        ) : (
          <div className="space-y-12">
            {(() => {
              const knownOrder = Object.keys(CATEGORY_ICONS);
              const grouped = new Map<string, Scene[]>();
              for (const scene of scenes) {
                const key = scene.category || "Other";
                if (!grouped.has(key)) grouped.set(key, []);
                grouped.get(key)!.push(scene);
              }
              const sortedKeys = [...grouped.keys()].sort((a, b) => {
                const ai = knownOrder.indexOf(a);
                const bi = knownOrder.indexOf(b);
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return -1;
                if (bi !== -1) return 1;
                return a.localeCompare(b);
              });
              return sortedKeys.map((label) => {
                const catScenes = grouped.get(label)!;
                const icon = CATEGORY_ICONS[label] || "📁";
                return (
                  <section key={label}>
                    <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                      <span>{icon}</span>
                      {label}
                      <span className="text-sm font-normal text-gray-500">({catScenes.length})</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {catScenes.map((scene) => (
                        <SceneCard key={scene.id} scene={scene} playMode={playMode} isMatchMode={isMatchMode} onDelete={handleDeleteScene} />
                      ))}
                    </div>
                  </section>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
