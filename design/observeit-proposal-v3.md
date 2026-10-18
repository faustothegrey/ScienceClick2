# ObserveIt — smartphone scene exploration proposal

Status: design proposal for independent review; no implementation authorized by this document.
Date: 2026-10-18
Working directory: `/Users/fausto/Software/ScienceClick2-observeit`
Branch: `observeit`

## 1. Purpose and change of direction

ObserveIt is a ScienceClick subapp in which students explore stylized illustrated scenes, recognize shapes and colours, and express what they see in Italian.

The intended learners remain adolescents learning Italian as an additional language. The interface should support limited language proficiency while feeling appropriate for teenagers.

This proposal replaces the earlier teacher-led interactive-whiteboard concept. `fonte-conversazione-sensi.md` remains useful pedagogical background, but the earlier whiteboard-first navigation, tap-to-select answers, class stars, and lesson sequence are not requirements for the new design. Smartphones are now the primary device. ObserveIt should have its own interaction model rather than inherit SnapIt's label-placement workflow.

Core idea: **the student writes the name of a shape, then draws a rectangle tightly enclosing an example of that shape in the scene.** Precision contributes to the score. Teacher arbitration supports valid interpretations absent from the prepared answers.

## 2. Confirmed direction versus proposed details

Agreed in the discussion:

- Attractive stylized scene drawings containing recognizable shapes and colours.
- Open text entry for shape names, rather than choosing from supplied answers.
- A student-drawn bounding rectangle identifying the shape in the scene.
- A closer-fitting rectangle earns a higher precision score.
- Smartphones as the main interaction device.
- Simple illustrations with limited detail to reduce ambiguity.
- An option to ask the teacher to arbitrate an answer.

Proposed below, subject to review:

- Exact screen flow, gestures, scoring formula, spelling handling, persistence, and arbitration implementation.
- A first prototype focused on shapes; colour activities follow after the core interaction is validated.
- Italian-only UI, consistent with the earlier educational direction.

## 3. Student experience

### Main loop

1. Open a scene and explore it by panning and zooming.
2. Choose “Segna una forma”. Enter a shape name, e.g. `cerchio`.
3. Confirm the word. Close the keyboard and enter marking mode.
4. Drag a rectangle around any matching shape in the illustration.
5. Adjust its position and size using large handles; submit explicitly.
6. See recognition feedback and a separate precision result.
7. Continue exploring, retry, or choose “Chiedi all’insegnante”.

The student chooses the target. Objects should not highlight automatically before submission, because that would disclose the prepared answers and undermine discovery.

Example: write `cerchio`, frame a bicycle wheel, submit. The frame is rectangular even when the object is circular or triangular: it marks the location and extent of the recognized shape. A short visual demonstration should explain this distinction.

### Smartphone layout

- The scene occupies the main available area; controls are compact but comfortably touchable.
- A short instruction and the current word remain visible during marking.
- Text entry uses a bottom panel. Drawing starts after the keyboard closes so the canvas does not shift mid-gesture.
- Explore and mark are explicit modes: dragging pans in explore mode and creates a box in mark mode.
- Zooming happens before marking in the first prototype; the view stays fixed while placing and adjusting a box. The student can return to exploration and then resume marking with the box preserved.
- Provide undo/cancel, retry, and a clear submit button. Nothing is submitted merely by lifting a finger.
- Handle hit areas can be larger than their visible markers. They must remain usable at viewport edges and around small boxes.
- Portrait is the primary layout; no forced landscape orientation.

A zoomed-out scene overview and visible submitted markers may help navigation, but should be added only if phone trials demonstrate a need.

## 4. Scene and content design

Use recognizable everyday settings: a street, classroom, kitchen, courtyard, or similar place. The first scene subject is still undecided.

Visual requirements:

- Flat colours, clear silhouettes, limited textures and decorative detail.
- Mostly front-facing objects, with limited overlap and perspective distortion.
- Shapes large enough to frame comfortably after zooming.
- An appealing, age-appropriate illustration style without an infantile aesthetic.
- Multiple examples of each taught shape, distributed across the scene.
- No embedded labels that reveal the vocabulary answers.

For a pilot, propose one scene with approximately 8–12 annotated targets across cerchio, quadrato, triangolo, and rettangolo. These numbers are provisional.

Authoring must address nested and overlapping interpretations. A wheel, its hub, and a nearby circular sign can all be valid circles. Keep the first scene simple, annotate obvious alternatives, and retain arbitration for discoveries we missed.

Adopt a classroom vocabulary convention: accept the most specific taught name for an object, while documenting alternatives explicitly. In particular, whether a square also accepts `rettangolo` is an educational decision, not something the scoring code should decide silently.

## 5. Checking answers and scoring

### Prepared answers

Each scene has an illustration and a data file listing valid targets, accepted shape names, and tight axis-aligned bounding rectangles. No AI image recognition is required for the pilot.

Coordinates use the original image coordinate system or normalized values, independent of display size and zoom. Each drawing operation converts screen coordinates back into this stable space.

### Matching

Normalize case, surrounding spaces, and repeated whitespace. Optional articles and other accepted forms should be explicit vocabulary aliases. Do not use unrestricted fuzzy matching to turn an incorrect shape name into a correct answer.

Proposed matching procedure:

1. Resolve the entered word to an accepted shape label.
2. Compare the submitted box with every annotated target accepting that label.
3. Select the best geometric match, subject to an overlap threshold.
4. If no match is credible, report that the app could not confirm it and offer retry or teacher review.

Multiple annotations may be plausible; the app should avoid claiming certainty where the box covers several objects. Thresholds and tie handling need phone-based calibration. A known word and a tiny accidental overlap must not count as recognition.

For an unknown word, preserve the input and box. Offer a spelling suggestion when appropriate, requiring confirmation rather than silently changing the answer. Never prevent arbitration merely because the word was unrecognized.

### Precision

Proposed baseline metric: intersection over union (IoU).

`IoU = area(student box ∩ target box) / area(student box ∪ target box)`

`precision score = round(100 × IoU)`

Identical boxes score 100. Extra background or cutting off the object lowers the result. Two geometrically similar answers receive the same score at different display zoom levels.

This metric compares enclosing rectangles, not the area of the circle or triangle inside them. That limitation is intentional for this interaction.

Keep recognition and framing feedback distinct. For example, “Cerchio riconosciuto” and “Precisione: 82/100”. The threshold for confirming recognition should be more forgiving than the standard for a high precision score. Exact values, rounding bands, and whether a numerical score motivates these learners remain review questions.

Do not introduce a timer or leaderboard in the pilot. Avoid a cumulative score that can be increased indefinitely by submitting the same target; proposed behavior is to retain the best attempt per target while allowing practice. No total score formula is settled.

## 6. Teacher arbitration

“Chiedi all’insegnante” preserves the scene, submitted word, rectangle, and automatic feedback. The teacher needs to see the student's actual interpretation, not just a failure message.

Proposed minimal pilot workflow: the student shows the same phone to the teacher. A review view overlays the submitted box and offers an explicit manual decision. A teacher-approved answer is labelled as such. Approval of recognition must not invent a precision score when no reference box exists.

This local review is an explicit scope proposal: it does not send a notification or deliver a request to another device. A teacher inbox would require sessions, request transport, identity/access decisions, and persistence; those are separate work.

Questions to resolve before classroom release:

- Is showing the same phone practical, or is a remote teacher queue necessary?
- How are teacher decisions protected from accidental or student activation?
- Can a teacher correct the shape label or just accept/reject the interpretation?
- Should accepted discoveries become future annotations? Proposed pilot: no automatic content edits; changes are reviewed separately.

## 7. Technical approach

Keep ObserveIt under `/observeit`, with content and components separate from SnapIt. Build with the existing Next.js/React/TypeScript stack; do not reuse SnapIt's drag-and-drop model simply because it exists.

Suggested pieces:

- Scene image with an SVG overlay for boxes and resize handles.
- A single view transform shared by image and overlay.
- Pointer-event interaction state: exploring, entering text, marking, adjusting, feedback, teacher review.
- Pure geometry and vocabulary functions independent of rendering.
- Static typed scene content or JSON plus validation; no content editor in the first prototype.

Indicative content model, not a final API:

```ts
interface Box { x: number; y: number; width: number; height: number }
interface Target {
  id: string;
  shape: 'cerchio' | 'quadrato' | 'triangolo' | 'rettangolo';
  acceptedLabels: string[];
  box: Box; // normalized image coordinates, values 0–1
  colour?: string; // future activity support; not scored in shape pilot
}
interface Scene {
  id: string;
  image: string;
  imageWidth: number;
  imageHeight: number;
  targets: Target[];
}
```

An answer record should preserve raw and normalized text, box, matched target if any, precision if available, and any teacher decision. Proposed first prototype: in-memory state only, with no login or server storage. Clearly disclose that refresh loses progress. Whether classroom use requires local persistence remains open.

Potential browser issues include native page scrolling during drawing, interrupted touch gestures, keyboard viewport resizing, image letterboxing, and handle clipping. These are implementation risks to validate on actual phones, not evidence that the interaction needs AI or a complex backend.

## 8. Prototype scope and verification

Build only after review of this proposal.

First prototype:

- One manually annotated illustration.
- Free choice of target and typed shape name.
- Explore/zoom, draw, move, resize, cancel, submit, retry.
- Vocabulary matching and calibrated geometric feedback.
- Same-device teacher review, if accepted as the pilot arbitration workflow.
- No accounts, server-side student records, remote inbox, scene editor, audio, or automatic image recognition.

Validate in this order:

1. Can students understand the enclosing-rectangle task from a brief demonstration?
2. Can they draw and adjust a box comfortably on small phones?
3. Does scoring acknowledge correct recognition while rewarding better framing?
4. Can the teacher resolve an unexpected valid interpretation without losing the answer?
5. Do students stay engaged in observing and naming, rather than repeatedly tweaking boxes for points?

Try representative iOS Safari and Android Chrome devices. Verify coordinate mapping under zoom/pan and viewport changes; drawing in either drag direction; edge targets; tiny/zero-size boxes; nested targets; unknown words; repeat submissions; and interrupted gestures. Geometry and matching merit focused automated tests. Follow repository type-check, build, and lint defaults when implementation begins.

## 9. Later possibilities

Colour identification belongs to the product vision but needs its own interaction design. Possibilities include typing only the colour, or naming both shape and colour. Do not assume a single object has one unambiguous colour.

Other later work: guided challenges, additional scenes, content annotation tools, teacher inbox, durable progress, and optional whiteboard presentation. Freehand contour recognition is unnecessary for the proposed core interaction.

## 10. Requested independent review

Please assess the proposal before implementation, especially:

1. Does the task measure observation and Italian vocabulary, or mostly finger precision?
2. Is the smartphone flow practical, particularly text entry followed by framing?
3. Are IoU, target matching, and the separation of recognition from precision adequate? What failure cases are missing?
4. Can simple scenes sufficiently reduce ambiguity without making discovery trivial?
5. Is same-device teacher arbitration adequate for the first classroom trial?
6. Which open decisions must be settled now, and which should wait for a working phone prototype?
7. Is the proposed implementation scope appropriately independent of SnapIt and small enough to validate quickly?

Do not treat proposed details or unanswered questions as previously approved requirements.
