import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir, stat, rename } from "fs/promises";
import path from "path";
import {
  findSceneDir,
  categoryToSlug,
  scenePublicUrl,
  isValidSceneId,
  SCENES_ROOT_FS,
} from "@/lib/scenePaths";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidSceneId(id)) {
    return NextResponse.json({ error: "Invalid scene id" }, { status: 400 });
  }

  const sceneDir = await findSceneDir(id);
  if (!sceneDir) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(path.join(sceneDir, "config.json"), "utf-8");
    const config = JSON.parse(data);
    const categorySlug = path.basename(path.dirname(sceneDir));

    let image: string | null = null;
    for (const name of ["scene.svg", "scene.png", "scene.jpeg", "scene.jpg"]) {
      try {
        await stat(path.join(sceneDir, name));
        image = scenePublicUrl(categorySlug, id, name);
        break;
      } catch {
        // not found
      }
    }

    return NextResponse.json({ ...config, image });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidSceneId(id)) {
    return NextResponse.json({ error: "Invalid scene id" }, { status: 400 });
  }

  const body = await request.json();
  // Scenes are created on disk by the create-scene skill; this only edits existing ones.
  const existingDir = await findSceneDir(id);
  if (!existingDir) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const existingSlug = path.basename(path.dirname(existingDir));

  // Target slug: use body.category if provided, else preserve current.
  const targetSlug =
    typeof body?.category === "string" ? categoryToSlug(body.category) : existingSlug;

  const targetDir = path.join(SCENES_ROOT_FS, targetSlug, id);

  if (existingSlug !== targetSlug) {
    await mkdir(path.dirname(targetDir), { recursive: true });
    await rename(existingDir, targetDir);
  }

  await writeFile(path.join(targetDir, "config.json"), JSON.stringify(body, null, 2));
  return NextResponse.json({ success: true });
}
