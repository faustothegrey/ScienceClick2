import { test } from "node:test";
import assert from "node:assert/strict";
import { redisUpdate, redisConfig, SharedStorageNotConfigured } from "./sharedGameStorage.ts";

test("shared Redis updates retry conflicts without losing another player's action", async () => {
  const original = globalThis.fetch;
  let stored: string | null = null;
  let conflicts = 0;
  globalThis.fetch = async (_url, init) => {
    const args = JSON.parse(init!.body as string);
    let result;
    if (args[0] === "GET") result = stored;
    else {
      assert.equal(args[0], "EVAL");
      const [, , , , before, next] = args;
      if ((stored ?? "") === before) { stored = next; result = 1; }
      else { conflicts++; result = 0; }
    }
    return Response.json({ result });
  };
  try {
    const config = { url: "https://redis.example", token: "test" };
    await Promise.all(Array.from({ length: 5 }, () => redisUpdate(config, "game", () => ({ count: 0 }), s => { s.count++; })));
    assert.equal(JSON.parse(stored!).count, 5);
    assert.ok(conflicts > 0);
    assert.equal((await redisUpdate(config, "game", () => ({ count: 0 }), () => {})).count, 5);
  } finally { globalThis.fetch = original; }
});
test("database failures do not silently create a separate instance-local game", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response("unavailable", { status: 503 });
  try { await assert.rejects(redisUpdate({ url: "https://redis.example", token: "test" }, "game", () => ({}), () => {})); }
  finally { globalThis.fetch = original; }
});
test("Vercel requires shared storage; local development can use files", () => {
  const names = ["VERCEL", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_URL", "KV_REST_API_TOKEN"];
  const saved = names.map(name => process.env[name]);
  try {
    names.forEach(name => delete process.env[name]);
    assert.equal(redisConfig(), null);
    process.env.VERCEL = "1";
    assert.throws(redisConfig, SharedStorageNotConfigured);
    process.env.KV_REST_API_URL = "https://redis.example";
    process.env.KV_REST_API_TOKEN = "test";
    assert.deepEqual(redisConfig(), { url: "https://redis.example", token: "test" });
  } finally { names.forEach((name, i) => { if (saved[i] === undefined) delete process.env[name]; else process.env[name] = saved[i]; }); }
});
