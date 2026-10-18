import { defineConfig, devices } from "@playwright/test";

// Browser tests for the interactive flows (`npm run test:e2e`). Unit tests stay
// on node:test (`npm test`).
const PORT = Number(process.env.E2E_PORT ?? 3100);

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    // 1280×720 is a common laptop resolution driving the board.
    viewport: { width: 1280, height: 720 },
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/observeit`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
