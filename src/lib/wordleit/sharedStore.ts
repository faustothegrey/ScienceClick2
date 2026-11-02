import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { applyAction, initialState, rollover, view, type Action, type SharedState } from "./shared.ts";

// A single queue is shared across route reloads. Every action reads the latest
// state inside this queue, so simultaneous clients cannot overwrite each other.
const globalStore = globalThis as typeof globalThis & { wordleitQueue?: Promise<unknown> };
const file = () => path.join(process.cwd(), ".data", "wordleit.json");
export async function sharedGame(action?: Action, boardId?: string) {
  const task = (globalStore.wordleitQueue ?? Promise.resolve()).then(async () => {
    let state: SharedState;
    let created = false;
    try { state = JSON.parse(await readFile(file(), "utf8")); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      state = initialState();
      created = true;
    }
    const before = JSON.stringify(state);
    rollover(state);
    if (action && boardId) applyAction(state, action, boardId);
    if (before !== JSON.stringify(state) || created) {
      await mkdir(path.dirname(file()), { recursive: true });
      await writeFile(file() + ".tmp", JSON.stringify(state));
      await rename(file() + ".tmp", file());
    }
    return view(state);
  });
  globalStore.wordleitQueue = task.catch(() => {});
  return task;
}
