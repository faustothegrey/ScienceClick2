import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import {
  getOrCreateMatch,
  submitTeamGuesses,
  isMatchComplete,
} from "@/lib/matchStore";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const state = await getOrCreateMatch(id);

  if (isMatchComplete(state)) {
    return NextResponse.json({
      status: "complete",
      teams: state.teams,
    });
  }

  return NextResponse.json({
    status: "waiting",
    submitted: {
      "team-a": state.teams["team-a"].guesses !== null,
      "team-b": state.teams["team-b"].guesses !== null,
    },
  });
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { team, guesses } = body;

  if (team !== "team-a" && team !== "team-b") {
    return NextResponse.json({ error: "invalid team" }, { status: 400 });
  }
  if (!guesses || typeof guesses !== "object") {
    return NextResponse.json({ error: "guesses required" }, { status: 400 });
  }

  await submitTeamGuesses(id, team, guesses);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const filePath = path.join(process.cwd(), "public", "scenes", id, "match.json");
  try {
    await unlink(filePath);
  } catch {
    // file may not exist, that's fine
  }
  return NextResponse.json({ ok: true });
}
