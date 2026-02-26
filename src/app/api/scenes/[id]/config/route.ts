import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir, stat } from "fs/promises";
import path from "path";

function configPath(id: string) {
  return path.join(process.cwd(), "public", "scenes", id, "config.json");
}

function sceneDir(id: string) {
  return path.join(process.cwd(), "public", "scenes", id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await readFile(configPath(id), "utf-8");
    const config = JSON.parse(data);

    // Discover image format
    let image: string | null = null;
    for (const name of ["scene.svg", "scene.png", "scene.jpeg", "scene.jpg"]) {
      try {
        await stat(path.join(sceneDir(id), name));
        image = name;
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
  const body = await request.json();
  const filePath = configPath(id);

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(body, null, 2));

  return NextResponse.json({ success: true });
}
