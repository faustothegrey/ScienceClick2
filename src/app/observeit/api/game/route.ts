import { NextRequest, NextResponse } from "next/server";
import { sharedHunt } from "@/lib/observeit/sharedStore";
import { validHuntAction } from "@/lib/observeit/shared";
import { streetScene } from "@/lib/observeit/scenes/street";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET() {
  try { return NextResponse.json(await sharedHunt(), { headers }); }
  catch { return NextResponse.json({ error: "Partita non disponibile." }, { status: 503, headers }); }
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin && new URL(origin).host !== request.headers.get("host")) return NextResponse.json({ error: "Origine non valida." }, { status: 403 });
    const body = await request.json();
    if (!validHuntAction(body?.action, streetScene) || typeof body?.turn !== "string" || body.turn.length > 100) return NextResponse.json({ error: "Azione non valida." }, { status: 400 });
    return NextResponse.json(await sharedHunt(body.action, body.turn), { headers });
  } catch (e) { return NextResponse.json({ error: "Impossibile aggiornare la partita." }, { status: e instanceof SyntaxError ? 400 : 503, headers }); }
}
