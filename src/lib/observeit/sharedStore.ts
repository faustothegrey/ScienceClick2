import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { applyHunt, initialHunt, type HuntAction, type SharedHunt } from "./shared.ts";
import { streetScene } from "./scenes/street.ts";
const globalStore = globalThis as typeof globalThis & { observeitQueue?: Promise<unknown> };
export function sharedHunt(action?: HuntAction, turn?: string) {
  const task = (globalStore.observeitQueue ?? Promise.resolve()).then(async () => {
    const file = path.join(process.cwd(), ".data", "observeit.json");
    let state: SharedHunt;
    let created = false;
    try { state = JSON.parse(await readFile(file, "utf8")); }
    catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; state = initialHunt(streetScene); created = true; }
    const before = JSON.stringify(state);
    if (action && turn) applyHunt(state, streetScene, action, turn);
    if (created || JSON.stringify(state) !== before) {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file + ".tmp", JSON.stringify(state));
      await rename(file + ".tmp", file);
    }
    return state;
  });
  globalStore.observeitQueue = task.catch(() => {});
  return task;
}
