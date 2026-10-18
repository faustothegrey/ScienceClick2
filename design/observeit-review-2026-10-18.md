# ObserveIt implementation review

Date: 2026-10-18
Branch: `observeit`
Scope: current uncommitted ObserveIt prototype and proposal v4.

This review treats v4's LIM-first direction as intentional, superseding the earlier smartphone proposal. It is a code and document review; browser interactions and physical whiteboard operation have not been tested. Findings below are based on code inspection unless stated otherwise.

## Overall assessment

The prototype has a solid foundation. Scene geometry drives both the illustration and scoring, geometry and vocabulary logic are separated from presentation, and incorrect words are never silently accepted.

Verification completed successfully:

- All 13 automated tests (`npm test`).
- TypeScript (`npx tsc --noEmit`).
- Lint (`npm run lint`).
- Production build (`npm run build`).

The tests cover geometry, vocabulary, and scene invariants, but not the drawing → adjustment → naming interaction workflow.

## Findings

### 1. Medium — Enter can also activate the focused button

Location: `src/components/observeit/ShapeHunt.tsx`, `onKey`, adjustment phase (approximately line 216).

Enter confirms the box without calling `preventDefault()`. The same key can therefore trigger the browser's default activation of a focused button. For example, if “Cancella il riquadro” retains focus from a previous interaction, pressing Enter to confirm a newly drawn box can also activate that button and erase the answer.

Recommendation: consume handled shortcuts and account for focused controls so one key press produces only the intended action. Verify with a browser interaction test, including focus left on cancel and restart controls.

### 2. Medium — Precision feedback can recommend the wrong correction

Location: `src/components/observeit/ShapeHunt.tsx`, `PRECISION` (approximately line 362).

Every one-star result says “Puoi stringere di più il riquadro.” A rectangle that cuts off part of the shape can also receive one star. Tightening that rectangle makes the fit worse.

Recommendation: use neutral feedback such as asking the student to adjust the rectangle around the entire shape, or inspect edge differences and give directional advice. Include oversized, undersized, and offset boxes when verifying feedback.

### 3. Medium — Some visible rectangles are deliberately unanswerable

Location: `src/components/observeit/StreetIllustration.tsx`, sidewalk and road background bands (approximately line 26).

The sidewalk and road are clear rectangles but have no answer annotations. A student who correctly frames one receives “Non trovo una forma qui.” This conflicts with free exploration, especially because the current UI cannot manually accept an unexpected answer.

Recommendation: annotate these shapes, change their silhouettes, or provide a teacher acceptance mechanism. Review the whole illustration for other valid interpretations outside the prepared targets.

## Design observations

### Teacher arbitration is now conversational only

Proposal v4 explicitly removes teacher buttons and leaves arbitration to classroom discussion while the student's box remains visible. This is an intentional scope change from the earlier proposal, rather than an implementation omission relative to v4.

It permits discussion but cannot register an unexpected valid answer, alter the automatic judgment, or count that discovery toward progress. Decide whether that is sufficient for the classroom trial.

### Touch usability remains unverified

The keyboard's ten-letter row divides the sidebar's remaining width among ten keys. At common laptop viewport widths, individual keys are approximately 25–32 CSS pixels wide. The scene's minimum target size of 34 scene units also becomes smaller after scaling to the available screen area.

Scene-unit size checks alone do not establish comfortable touch sizes. Validate the keyboard, target framing, and adjustment handles on the actual board at the laptop's normal resolution and Windows display scaling. Also check whether the panel remains fully usable at shorter viewport heights.

## Suggested next step

Address the three findings, then test the complete draw → adjust → confirm → name → feedback → retry workflow on classroom hardware before adding more content. Add focused interaction coverage for confirmed failures; retain the existing geometry and vocabulary tests.

No implementation files were changed as part of this review.
