import { NextRequest, NextResponse } from "next/server";
import { rm } from "fs/promises";
import path from "path";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Prevent path traversal
  if (id.includes("..") || id.includes("/")) {
    return NextResponse.json({ error: "Invalid scene id" }, { status: 400 });
  }

  const sceneDir = path.join(process.cwd(), "public", "scenes", id);

  try {
    await rm(sceneDir, { recursive: true });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }
}
