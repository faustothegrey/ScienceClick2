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
}

interface Category {
  label: string;
  icon: string;
  sceneIds: string[];
}

const CATEGORIES: Category[] = [
  {
    label: "Universe & Earth",
    icon: "🌍",
    sceneIds: [
      "solar-system",
      "atmosphere",
      "earth-interior",
      "earth-motions",
      "earthquake",
      "hydrosphere",
      "mineral-properties",
      "plate-boundaries",
      "rock-cycle",
      "tectonic-plates",
      "volcano",
      "struttura-vulcano",
      "water-distribution",
      "water-cycle",
      "tipi-di-rocce",
      "grotta-carsica",
    ],
  },
  {
    label: "The Matter",
    icon: "🔬",
    sceneIds: [
      "states-of-matter",
      "passaggi-di-stato",
      "proprieta-della-materia",
      "molecole",
    ],
  },
  {
    label: "Biology & Human Body",
    icon: "🧬",
    sceneIds: [
      "animal-cell",
      "dna-structure",
      "food-chain",
      "human-body",
      "scheletric-apparatus",
      "digestive-system",
      "photosynthesis",
      "doctor-studio",
    ],
  },
  {
    label: "Everyday Scenes",
    icon: "🏘️",
    sceneIds: [
      "grocery-store",
      "park",
      "rooms-of-a-house",
    ],
  },
];

function getCategoryForScene(id: string): string | null {
  for (const cat of CATEGORIES) {
    if (cat.sceneIds.includes(id)) return cat.label;
  }
  return null;
}

function formatName(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SceneCard({ scene, playMode, onDelete }: { scene: Scene; playMode: PlayMode; onDelete: (id: string) => void }) {
  const getHref = () => {
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
    <div className="group relative rounded-xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-600 transition-colors">
      <button
        onClick={(e) => {
          e.preventDefault();
          if (confirm(`Delete "${formatName(scene.id)}"? This cannot be undone.`)) {
            onDelete(scene.id);
          }
        }}
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-gray-900/80 text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-gray-900 transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      <Link href={getHref()} className="block">
        <div className="h-40 bg-gray-800 flex items-center justify-center">
          {scene.image ? (
            <img
              src={`/scenes/${scene.id}/${scene.image}`}
              alt={formatName(scene.id)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl text-gray-600">
              {formatName(scene.id).charAt(0)}
            </span>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold group-hover:text-amber-400 transition-colors">
            {formatName(scene.id)}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {scene.termCount} {scene.termCount === 1 ? "term" : "terms"}
            {scene.agent && <span className="ml-2 text-xs text-gray-500">by {scene.agent}</span>}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function ScenesGalleryPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [playMode, setPlayMode] = useState<PlayMode>("single");
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
            <select
              value={playMode}
              onChange={(e) => setPlayMode(e.target.value as PlayMode)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="single">Single Player</option>
              <option value="team-a">Team A</option>
              <option value="team-b">Team B</option>
              <option value="spectator">Spectator View</option>
            </select>
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
            {CATEGORIES.map((cat) => {
              const catScenes = scenes.filter((s) => cat.sceneIds.includes(s.id));
              if (catScenes.length === 0) return null;
              return (
                <section key={cat.label}>
                  <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                    <span>{cat.icon}</span>
                    {cat.label}
                    <span className="text-sm font-normal text-gray-500">({catScenes.length})</span>
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catScenes.map((scene) => (
                      <SceneCard key={scene.id} scene={scene} playMode={playMode} onDelete={handleDeleteScene} />
                    ))}
                  </div>
                </section>
              );
            })}
            {/* Uncategorized scenes */}
            {scenes.filter((s) => !getCategoryForScene(s.id)).length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                  <span>📁</span>
                  Other
                  <span className="text-sm font-normal text-gray-500">
                    ({scenes.filter((s) => !getCategoryForScene(s.id)).length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scenes.filter((s) => !getCategoryForScene(s.id)).map((scene) => (
                    <SceneCard key={scene.id} scene={scene} playMode={playMode} onDelete={handleDeleteScene} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
