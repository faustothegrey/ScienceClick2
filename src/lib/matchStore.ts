import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { findSceneDir, SCENES_ROOT_FS, OTHER_SLUG } from "./scenePaths";

export interface TeamState {
  guesses: Record<string, string> | null;
  submittedAt: number | null;
  liveProgress: string[];
}

export interface MatchState {
  sceneId: string;
  createdAt: number;
  teams: {
    "team-a": TeamState;
    "team-b": TeamState;
  };
}

async function matchPath(sceneId: string): Promise<string> {
  const sceneDir = await findSceneDir(sceneId);
  // Fallback to "other" category if the scene directory doesn't exist yet —
  // getOrCreateMatch will create it on first use.
  const base = sceneDir ?? path.join(SCENES_ROOT_FS, OTHER_SLUG, sceneId);
  return path.join(base, "match.json");
}

export async function getOrCreateMatch(sceneId: string): Promise<MatchState> {
  const filePath = await matchPath(sceneId);
  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    const emptyTeam: TeamState = { guesses: null, submittedAt: null, liveProgress: [] };
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
  await writeFile(await matchPath(sceneId), JSON.stringify(state, null, 2));
  return state;
}

export async function submitTeamProgress(
  sceneId: string,
  team: "team-a" | "team-b",
  liveProgress: string[]
): Promise<MatchState> {
  const state = await getOrCreateMatch(sceneId);
  state.teams[team].liveProgress = liveProgress;
  await writeFile(await matchPath(sceneId), JSON.stringify(state, null, 2));
  return state;
}

export function isMatchComplete(state: MatchState): boolean {
  return (
    state.teams["team-a"].guesses !== null &&
    state.teams["team-b"].guesses !== null
  );
}
