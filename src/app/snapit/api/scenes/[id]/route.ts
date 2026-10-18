import { NextRequest, NextResponse } from "next/server";
import { rm } from "fs/promises";
import { findSceneDir, isValidSceneId } from "@/lib/scenePaths";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidSceneId(id)) {
    return NextResponse.json({ error: "Invalid scene id" }, { status: 400 });
  }

  const sceneDir = await findSceneDir(id);
  if (!sceneDir) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  try {
    await rm(sceneDir, { recursive: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }
}
