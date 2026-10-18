import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { listAllScenes, sceneImageUrl } from "@/lib/scenePaths";

export async function GET() {
  try {
    const scenes = await listAllScenes();

    const result = await Promise.all(
      scenes.map(async ({ sceneId, absPath }) => {
        let termCount = 0;
        let agent: string | null = null;
        let category: string | null = null;
        let order: number | null = null;
        try {
          const configRaw = await readFile(path.join(absPath, "config.json"), "utf-8");
          const config = JSON.parse(configRaw);
          termCount = Array.isArray(config.terms) ? config.terms.length : 0;
          if (typeof config.agent === "string") agent = config.agent;
          if (typeof config.category === "string") category = config.category;
          if (typeof config.order === "number") order = config.order;
        } catch {
          // No config yet — new scene
        }

        const image = await sceneImageUrl(sceneId);

        return { id: sceneId, termCount, image, agent, category, order };
      })
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json([]);
  }
}
