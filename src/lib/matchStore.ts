import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

export interface TeamState {
  guesses: Record<string, string> | null;
  submittedAt: number | null;
}

export interface MatchState {
  sceneId: string;
  createdAt: number;
  teams: {
    "team-a": TeamState;
    "team-b": TeamState;
  };
}

function matchPath(sceneId: string) {
  return path.join(process.cwd(), "public", "scenes", sceneId, "match.json");
}

export async function getOrCreateMatch(sceneId: string): Promise<MatchState> {
  const filePath = matchPath(sceneId);
  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    const emptyTeam: TeamState = { guesses: null, submittedAt: null };
    const state: MatchState = {
      sceneId,
      createdAt: Date.now(),
      teams: {
        "team-a": { ...emptyTeam },
        "team-b": { ...emptyTeam },
      },
    };
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(state, null, 2));
    return state;
  }
}

export async function submitTeamGuesses(
  sceneId: string,
  team: "team-a" | "team-b",
  guesses: Record<string, string>
): Promise<MatchState> {
  const state = await getOrCreateMatch(sceneId);
  state.teams[team].guesses = guesses;
  state.teams[team].submittedAt = Date.now();
  await writeFile(matchPath(sceneId), JSON.stringify(state, null, 2));
  return state;
}

export function isMatchComplete(state: MatchState): boolean {
  return (
    state.teams["team-a"].guesses !== null &&
    state.teams["team-b"].guesses !== null
  );
}
