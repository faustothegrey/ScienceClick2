"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Scene {
  id: string;
  termCount: number;
  hasImage: boolean;
}

function formatName(id: string) {
  return id
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ScenesGalleryPage() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/scenes")
      .then((res) => res.json())
      .then((data) => setScenes(data))
      .finally(() => setLoading(false));
  }, []);

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
          <button
            onClick={handleCreateScene}
            className="px-4 py-2 bg-amber-500 text-gray-950 font-semibold rounded-lg hover:bg-amber-400 transition-colors"
          >
            Create Scene
          </button>
        </header>

        {loading ? (
          <p className="text-gray-400">Loading scenes...</p>
        ) : scenes.length === 0 ? (
          <p className="text-gray-400">
            No scenes yet. Click &quot;Create Scene&quot; to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenes.map((scene) => (
              <Link
                key={scene.id}
                href={`/scenes/${scene.id}`}
                className="group block rounded-xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-600 transition-colors"
              >
                <div className="h-40 bg-gray-800 flex items-center justify-center">
                  {scene.hasImage ? (
                    <img
                      src={`/scenes/${scene.id}/scene.png`}
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
                  <h2 className="text-lg font-semibold group-hover:text-amber-400 transition-colors">
                    {formatName(scene.id)}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {scene.termCount} {scene.termCount === 1 ? "term" : "terms"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
