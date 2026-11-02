import { NextRequest, NextResponse } from "next/server";
import { sharedGame } from "@/lib/wordleit/sharedStore";
import type { Action } from "@/lib/wordleit/shared";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  try { return NextResponse.json(await sharedGame(), { headers }); }
  catch { return NextResponse.json({ error: "Partita non disponibile." }, { status: 503, headers }); }
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Origine non valida." }, { status: 403 });
    const body = await request.json();
    const a = body?.action;
    const valid = a && ((a.type === "key" && typeof a.key === "string" && /^(?:[A-Z]|ENTER|BACKSPACE)$/.test(a.key)) || (a.type === "mode" && ["daily", "practice"].includes(a.mode)) || a.type === "new");
    if (!valid || typeof body.boardId !== "string" || body.boardId.length > 100) return NextResponse.json({ error: "Azione non valida." }, { status: 400 });
    return NextResponse.json(await sharedGame(a as Action, body.boardId), { headers });
  } catch (error) {
    return NextResponse.json({ error: "Impossibile aggiornare la partita." }, { status: error instanceof SyntaxError ? 400 : 503, headers });
  }
}
