import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "fs/promises";
import path from "path";

const scenesDir = path.join(process.cwd(), "public", "scenes");

export async function GET() {
  try {
    const entries = await readdir(scenesDir);

    const scenes = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(scenesDir, entry);
        const info = await stat(entryPath);
        if (!info.isDirectory()) return null;

        let termCount = 0;
        let agent: string | null = null;
        let category: string | null = null;
        try {
          const configRaw = await readFile(
            path.join(entryPath, "config.json"),
            "utf-8"
          );
          const config = JSON.parse(configRaw);
          termCount = Array.isArray(config.terms) ? config.terms.length : 0;
          if (typeof config.agent === "string") agent = config.agent;
          if (typeof config.category === "string") category = config.category;
        } catch {
          // No config yet — new scene
        }

        let image: string | null = null;
        for (const name of ["scene.svg", "scene.png", "scene.jpeg", "scene.jpg"]) {
          try {
            await stat(path.join(entryPath, name));
            image = name;
            break;
          } catch {
            // not found
          }
        }

        return { id: entry, termCount, image, agent, category };
      })
    );

    return NextResponse.json(scenes.filter(Boolean));
  } catch {
    return NextResponse.json([]);
  }
}
