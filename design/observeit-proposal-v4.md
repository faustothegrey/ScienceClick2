# ObserveIt — interactive-whiteboard (LIM) shape hunt

Status: prototype built on branch `observeit` (`/observeit`); for classroom trial and review.
Date: 2026-10-18. Supersedes v3 (`observeit-proposal-v3.md`), which proposed smartphones first.

## Decisions (2026-10-18)

- **LIM first.** Smartphones come later. The teacher's Windows laptop drives the board (HDMI + USB touch); boards in use are Helgi or Promethean (exact models TBD). The board then behaves as a Windows touchscreen.
- **Box first, then the name.** The student frames a shape, confirms, then writes its name. Observation drives; the app can tell "right shape, wrong word" from "no shape here".
- **Italian only.**
- **Own on-screen keyboard** (letters, space, delete). Identical with mouse, finger or pen; no dependence on the OS touch keyboard. The physical keyboard also works, for testing.
- **Same input code for mouse and touch:** Pointer Events only, `touch-action: none` on the scene, one pointer at a time (a palm or second hand can't distort the box), no hover/right-click/double-click/wheel.
- **No pan/zoom** in the pilot: the scene is large on the board.

## Student flow

1. **CERCA / DISEGNA** — drag a box around a shape.
2. Adjust with corner handles or move it; **Conferma** (Enter on laptop).
3. App matches the box to the prepared targets:
   - none → "Non trovo una forma qui." (box stays visible for discussion);
   - two equally good targets → "Il riquadro prende più forme";
   - one target → step 4.
4. **SCRIVI** the name on the on-screen keyboard; **Fatto**.
5. Feedback:
   - correct → "Esatto! È un cerchio." + 1–3 stars for framing precision; the shape stays marked as found;
   - misspelt (edit distance ≤ 2) → "Quasi! Si scrive: cerchio" → write it again;
   - another shape's name → "No, non è un triangolo. Questa forma è un: cerchio" → write it again;
   - unknown word → "Questa forma si chiama: cerchio" → write it again.

Only the exact word (case, extra spaces and a leading article ignored) counts; a wrong word is never silently accepted. Progress counter, green outlines on found shapes, confetti when all are found. **Ricomincia** needs two taps. No saving, login, audio or teacher buttons: the teacher arbitrates by talking with the class while the box stays on screen.

## Scoring

Scene units (SVG viewBox 1600×900). Each edge within 12 units of the target's edge snaps to it (forgives finger error equally on small and large targets), then IoU against the target's bounding box.

- Match: IoU ≥ 0.5, best target; ambiguous if the runner-up is within 0.1.
- Stars: ≥ 0.85 → 3, ≥ 0.7 → 2, else 1.

All thresholds are to be calibrated on the real board.

## Scene: "Osserva la strada"

An Italian street drawn in SVG, front-on, in a realistic flat style (not photos: drawings keep scenes easy to make and control). Shapes are **parts of real objects**, not objects reduced to shapes: two palazzi and a church, a grocery and a bar, road signs, a bicycle and a car. Each target is drawn from the same geometry data that scoring uses, with its details kept inside that outline, so answers can't drift from the picture. `/observeit?debug` outlines every target.

31 targets: 7 cerchi (orologio, rosone, cartello di divieto, ruote di bici e auto), 7 quadrati (finestrelle, vetrina, cartello pedoni), 6 triangoli (frontone, timpani, cartello di precedenza capovolto, triangolo del cartello pedoni), 11 rettangoli (finestre, porte, insegne, targa della via, vetrina del bar).

Authoring rules, enforced by tests: every target is inside the scene and at least 34 units on its short side; squares and circles are exactly square; rectangles have aspect ratio ≥ 1.6; every target's own box matches itself unambiguously. Details inside a target must still match it (a box around a car rim finds the wheel). Nested targets of different shapes are fine (the triangle inside the square pedestrian sign).

Realism means more valid shapes than prepared ones (façades, arches, inner glass panes). These get "Non trovo una forma qui" and need the teacher; see the open question on a teacher "Accetta" button.

Square vs rectangle: a square accepts only `quadrato` (most specific taught name). Revisit if this frustrates students.

## Code

- `src/lib/observeit/` — `geometry.ts` (boxes, IoU, matching, stars), `vocabulary.ts` (normalizing, judging words), `scene.ts` (types), `scenes/street.ts` (data); tests in `observeit.test.ts` (`npm test`).
- `src/components/observeit/` — `ShapeHunt.tsx` (board UI and flow), `LetterKeyboard.tsx`, `StreetIllustration.tsx`.
- `src/app/observeit/` — route and layout. Independent of SnapIt.

## To check on the real board

- Touch drawing and handles with fingers and pen; palm resting on the board.
- Readability from the back of the room; panel width vs scene size at the laptop's resolution and scaling.
- Whether thresholds and stars feel fair; whether students understand "box around the shape" from a teacher demo.

## Later

Smartphone mode, colours, more scenes, a short animated demo of the task, saving progress, teacher view.
