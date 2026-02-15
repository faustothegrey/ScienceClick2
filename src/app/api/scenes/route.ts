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
        try {
          const configRaw = await readFile(
            path.join(entryPath, "config.json"),
            "utf-8"
          );
          const config = JSON.parse(configRaw);
          termCount = Array.isArray(config.terms) ? config.terms.length : 0;
        } catch {
          // No config yet — new scene
        }

        let hasImage = false;
        for (const name of ["scene.png", "scene.jpeg", "scene.jpg"]) {
          try {
            await stat(path.join(entryPath, name));
            hasImage = true;
            break;
          } catch {
            // not found
          }
        }

        return { id: entry, termCount, hasImage };
      })
    );

    return NextResponse.json(scenes.filter(Boolean));
  } catch {
    return NextResponse.json([]);
  }
}
