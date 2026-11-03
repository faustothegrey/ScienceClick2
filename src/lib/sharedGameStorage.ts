import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export class SharedStorageNotConfigured extends Error {
  constructor() { super("La partita condivisa non è configurata sul server. Contatta l’insegnante."); }
}
const globals = globalThis as typeof globalThis & { sharedGameQueues?: Map<string, Promise<unknown>> };
const CAS = `local old = redis.call('GET', KEYS[1])
if (old or '') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
return 1`;
export type RedisConfig = { url: string; token: string };
export function redisConfig(): RedisConfig | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) return { url, token };
  if (url || token || process.env.VERCEL) throw new SharedStorageNotConfigured();
  return null;
}
async function command(config: RedisConfig, args: (string | number)[]) {
  const response = await fetch(config.url, { method: "POST", headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" }, body: JSON.stringify(args), cache: "no-store", signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error("Shared storage request failed");
  const data = await response.json();
  if (data.error) throw new Error("Shared storage command failed");
  return data.result;
}
// Compare-and-set retries preserve simultaneous actions across Vercel instances.
// Never fall back to instance-local state when the shared database is unavailable.
export async function redisUpdate<T>(config: RedisConfig, key: string, initial: () => T, update: (state: T) => void): Promise<T> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const raw: string | null = await command(config, ["GET", key]);
    const state: T = raw === null ? initial() : JSON.parse(raw);
    update(state);
    const next = JSON.stringify(state);
    if (raw === next) return state;
    if (await command(config, ["EVAL", CAS, 1, key, raw ?? "", next]) === 1) return state;
  }
  throw new Error("Shared game is busy; retry");
}
export function updateSharedGame<T>(name: string, initial: () => T, update: (state: T) => void): Promise<T> {
  const config = redisConfig();
  if (config) return redisUpdate(config, `scienceclick:${process.env.SHARED_GAME_NAMESPACE || "production"}:${name}`, initial, update);
  const queues = globals.sharedGameQueues ??= new Map();
  const task = (queues.get(name) ?? Promise.resolve()).then(async () => {
    const file = path.join(process.cwd(), ".data", `${name}.json`);
    let state: T;
    let created = false;
    try { state = JSON.parse(await readFile(file, "utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; state = initial(); created = true; }
    const before = JSON.stringify(state);
    update(state);
    if (created || before !== JSON.stringify(state)) {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file + ".tmp", JSON.stringify(state));
      await rename(file + ".tmp", file);
    }
    return state;
  });
  queues.set(name, task.catch(() => {}));
  return task;
}
export function sharedStorageError(error: unknown) {
  return error instanceof SharedStorageNotConfigured ? error.message : "Partita non disponibile. Riprova tra poco.";
}
