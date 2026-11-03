# Shared games on Vercel

ObserveIt and WordleIt require one shared database across Vercel instances. Files in the deployed application directory are read-only; temporary files and process memory do not provide reliable shared state.

1. In the ScienceClick2 Vercel project, connect an Upstash Redis database through Storage/Marketplace.
2. Enable the integration's environment variables for Production. The server accepts either `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, or `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Use a read/write token. Never prefix these with `NEXT_PUBLIC_` or commit them.
3. Deploy/redeploy after adding the variables. On Vercel, these games require Redis and will report an explicit configuration error if it is missing.
4. Verify `/observeit/api/game` and `/wordleit/api/game` return HTTP 200. Open the game in two windows, type/draw in one, refresh the other and verify both show the same state.

The database holds only game progress, without student identity. `SHARED_GAME_NAMESPACE` optionally isolates deployment environments (default `production`); preview deployments should use a separate database or namespace to avoid sharing production games. State changes use atomic Redis compare-and-set with conflict retries to prevent overwrites across server instances. Database outages never fall back to a separate local game.

Without database variables, local development still uses `.data/observeit.json` and `.data/wordleit.json`. Existing local progress is preserved; it is not automatically uploaded. The Vercel integration may have usage limits or charges: check the selected plan. Polling uses database requests while game pages are open.
