# ObserveIt — handoff (updated 2026-10-22)

State of the ObserveIt work for whoever picks it up next (a new Claude Code session, local or cloud). Read this, then `design/observeit-proposal-v5.md` (the current game) and `design/observeit-proposal-v4.md` (device decisions and scene style).

## Where things stand

- ObserveIt is merged on `master` (commit `0a9d056`) and deployed to Vercel production. Pushing to `master` deploys automatically through the Vercel Git integration.
- `/` is a home page (`src/app/page.tsx`) linking to each sub-app; ObserveIt is at `/observeit`, SnapIt at `/snapit`.
- Live: https://science-click2.vercel.app/observeit (debug view, with every target outlined: `/observeit?debug`).
- Checks passing at handoff: `npm test` (16 tests: geometry, vocabulary, scene rules), `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- 2026-10-22: the teacher confirmed that drawing the box works with touch on the **Helgi** LIM. The game was then reworked (v5): the app asks for a shape, the student finds an object with it and writes the object's name.

## Context that is not in the code

- **Users:** a science teacher at CPIA 1 Pisa and a class of minors with very low Italian. They know the Latin alphabet and understand more than they can express.
- **Device:** LIM first, smartphones later. The teacher's Windows laptop drives the board over HDMI + USB touch. Box drawing is verified on the Helgi board; Promethean boards are also in use.
- **Language:** Italian only, for both the UI and the content. Keep instructions short, with imperative verbs (CERCA, DISEGNA, SCRIVI).
- **Scene style (explicit feedback from the teacher):**
  - Realistic **drawings**, where shapes are parts of real objects: a clock face, a wheel, a pediment, a road sign.
  - The first version, built from primitive shapes, was rejected as "too childish".
  - Real photos were rejected as "too much to the other extreme"; drawings are easier to make and control.
  - New scenes follow the street-scene pattern: the target geometry in the data drives both the drawing and the scoring.
- **Out of scope unless asked:** persistence, login, student identity, result tracking, audio, AI image recognition.

## Open items

1. **More LIM feedback:**
   - fingers vs pen, and a palm resting on the board;
   - readability from the back of the room;
   - whether the side panel and on-screen keyboard are big enough at the laptop's resolution and Windows scaling;
   - whether the match threshold feels fair (`src/lib/observeit/geometry.ts`).
2. **Teacher override:** done for names. After a wrong name, "Accetta (insegnante)" counts the student's word for that object, for the current game only. Still open: accepting a valid object that isn't among the prepared targets (Codex review point 3, `design/observeit-review-2026-10-18.md`). Ask the teacher before building it.
3. **Triangles:** only 3 triangle objects remain in the street scene; add more if the class finds that round too short.
4. **Interaction tests:** the game flow has no automated tests yet (Codex's suggestion); the rules in `game.ts`, `vocabulary.ts` and `geometry.ts` are tested.

Codex review points 1 (Enter also pressing the focused button) and 2 (one-star hint pointing the wrong way) were fixed; stars were later dropped in v5.

## Working in this repo

- Follow `PROJECT.md`:
  - use a git worktree for substantial work;
  - run type-check, lint and build before merging;
  - remove the worktree and branch after merging.
- Edit skills only in `skills/`, then run `./scripts/sync-skills.py`.
- Map of the ObserveIt code:
  - `src/lib/observeit/`: pure logic, scene data and tests;
  - `src/components/observeit/`: board UI, keyboard and illustration;
  - `src/app/observeit/`: the route.
