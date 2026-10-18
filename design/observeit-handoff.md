# ObserveIt — handoff (2026-10-18)

State of the ObserveIt work for whoever picks it up next (a new Claude Code session, local or cloud). Read this, then `design/observeit-proposal-v4.md` (the current spec).

## Where things stand

- ObserveIt is merged on `master` (commit `0a9d056`) and deployed to Vercel production. Pushing to `master` deploys automatically through the Vercel Git integration.
- `DEFAULT_APP` in `next.config.ts` is `/observeit`, so `/` opens it. SnapIt still lives at `/snapit`.
- Live: https://science-click2.vercel.app (debug view, with every target outlined: `/observeit?debug`).
- Checks passing at handoff: `npm test` (16 tests: geometry, vocabulary, scene rules), `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- Tested only with a mouse in desktop Chrome. **Not yet tested on the real interactive whiteboard (LIM).** The teacher is about to try it in class.

## Context that is not in the code

- **Users:** a science teacher at CPIA 1 Pisa and a class of minors with very low Italian. They know the Latin alphabet and understand more than they can express.
- **Device:** LIM first, smartphones later. The teacher's Windows laptop drives the board over HDMI + USB touch. The board is Helgi or Promethean; the exact model is still to come from the teacher.
- **Language:** Italian only, for both the UI and the content. Keep instructions short, with imperative verbs (CERCA, DISEGNA, SCRIVI).
- **Scene style (explicit feedback from the teacher):**
  - Realistic **drawings**, where shapes are parts of real objects: a clock face, a wheel, a pediment, a road sign.
  - The first version, built from primitive shapes, was rejected as "too childish".
  - Real photos were rejected as "too much to the other extreme"; drawings are easier to make and control.
  - New scenes follow the street-scene pattern: the target geometry in the data drives both the drawing and the scoring.
- **Out of scope unless asked:** persistence, login, student identity, result tracking, audio, AI image recognition.

## Open items

1. **Feedback from the LIM trial:**
   - touch with fingers and the pen;
   - a palm resting on the board;
   - readability from the back of the room;
   - whether the side panel and on-screen keyboard are big enough at the laptop's resolution and Windows scaling;
   - whether the match and star thresholds feel fair.

   The thresholds are in `src/lib/observeit/geometry.ts`.
2. **Teacher "Accetta" button: undecided.** It would let the teacher count a valid shape that isn't among the prepared targets (arches, building fronts, inner glass panes), with the word but without stars. The realistic scene makes this more likely to come up. It was raised as point 3 of Codex's review (`design/observeit-review-2026-10-18.md`). Ask the teacher before building it.
3. **Square vs rectangle:** a square accepts only `quadrato`. Revisit if students find this frustrating.
4. **Interaction tests:** the draw → adjust → name → feedback flow has no automated tests yet (Codex's suggestion).

Codex review points 1 (Enter also pressing the focused button) and 2 (one-star hint pointing the wrong way) are fixed.

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
