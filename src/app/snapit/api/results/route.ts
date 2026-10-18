import { NextResponse } from "next/server";
import { getResult, loginUser, recordResult } from "@/lib/resultsStore";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  const sceneId = url.searchParams.get("sceneId") ?? undefined;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const result = getResult(name, sceneId);
  return NextResponse.json({ result });
}

type ActionBody =
  | { action: "login"; name: string }
  | {
      action: "record";
      name: string;
      sceneId: string;
      correctCount: number;
      totalCount: number;
      allCorrect: boolean;
    };

export async function POST(req: Request) {
  const body = (await req.json()) as ActionBody;

  if (body.action === "login") {
    if (!body.name) return NextResponse.json({ error: "name required" }, { status: 400 });
    loginUser(body.name);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "record") {
    if (!body.name || !body.sceneId) {
      return NextResponse.json({ error: "name and sceneId required" }, { status: 400 });
    }
    recordResult(body.name, body.sceneId, {
      correctCount: body.correctCount,
      totalCount: body.totalCount,
      allCorrect: body.allCorrect,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "invalid action" }, { status: 400 });
}
