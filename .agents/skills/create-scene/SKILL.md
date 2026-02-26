---
name: create-scene
description: Create a new ScienceClick2 scene with illustration, config, and translations
---

# Create a New Scene

You are building a scene for **ScienceClick2**, an educational drag-and-drop labeling app. The user will describe a topic (e.g., "solar system", "human skeleton", "parts of a flower"). You must generate all assets for a fully playable scene.

**Critical: Language Level.** This app is designed for students at **A2 language level or below**. All terms must be **simple, everyday vocabulary** that a beginner language learner can understand. Avoid technical jargon, specialist terminology, or compound phrases that require domain expertise. If a topic naturally involves complex terms, simplify them or choose a different topic.

## Arguments

The user provides a short description of the scene topic (e.g., "parts of a flower").

---

## Step 1 — Confirm Topic & Terms

Before generating anything:

1. Read the example configs in the `examples/` directory next to this file as a reference for config structure.
2. Propose the **scene ID** (kebab-case, ASCII only, derived from the topic).
3. Propose **5–8 terms** with their English labels and a brief note on what each represents visually. **Remember: A2 level or below** — use simple, common words (e.g., "Rain", "River", "Sea", not "Continental Shelf", "Abyssal Plain", "Mid-Ocean Ridge").
4. Ask the user to confirm or adjust the term list before proceeding.

---

## Step 2 — Find and Download the Illustration

Find a suitable image and save it as `public/scenes/<scene-id>/scene.png`.

### Image Requirements
- **No text, labels, numbers, or annotations** — the app renders labels via drop targets; text in the image gives away answers
- **No pure white background** — drop-target labels are white boxes and would be invisible
- **Elements visually distinct and spread out** — each labeled element must be recognizable
- **Free to use** — prefer Wikimedia Commons (Creative Commons / public domain)

### How to Find the Image

1. **Search Wikimedia** using the Wikipedia API to find relevant images:
   ```bash
   curl -s "https://en.wikipedia.org/w/api.php?action=query&titles=<Article_Title>&prop=images&format=json"
   ```

2. **Get the direct download URL** for a candidate image:
   ```bash
   curl -s "https://en.wikipedia.org/w/api.php?action=query&titles=File:<Filename>&prop=imageinfo&iiprop=url|size|mime&format=json"
   ```

3. **Download the image**:
   ```bash
   mkdir -p public/scenes/<scene-id>
   curl -sL "<direct-url>" -o public/scenes/<scene-id>/scene.png
   ```

4. **Inspect the image** to verify it meets the requirements (no text, no white background, elements are distinct). If the image has text labels baked in, reject it and search for another.

### Tips for Finding Good Images
- Search for diagram/illustration articles on Wikipedia (e.g., "Internal structure of Earth", "Water cycle", "Solar System")
- Look for filenames containing words like "diagram", "structure", "cutaway", "illustration"
- Avoid filenames containing "labeled", "annotated", "English", "text"
- SVG files on Wikimedia can be downloaded as PNG via the thumbnail API: use the `url` field from the imageinfo response
- If no suitable Wikimedia image exists, ask the user for an alternative source

---

## Step 3 — Generate the Config

Create `public/scenes/<scene-id>/config.json`.

### Structure

```json
{
  "terms": [
    {
      "id": "term-<slug>",
      "translations": {
        "en": "English Label",
        "it": "Italian",
        "es": "Spanish",
        "fr": "French",
        "wo": "Wolof"
      },
      "defaultLocale": "en"
    }
  ],
  "dropTargets": [
    {
      "id": "target-<slug>",
      "x": 50,
      "y": 30,
      "assignedTerm": "term-<slug>"
    }
  ],
  "agent": "<agent-name>"
}
```

### ID Rules
- Use **kebab-case slugs** derived from the English term (e.g., `term-left-ventricle`, `target-left-ventricle`)
- Each term's slug must match its corresponding drop target's slug
- Include `"agent"` at the top level with your agent/model name (e.g., `"claude"`, `"gemini"`, `"codex"`)

### Translation Rules
- Every term must have translations in all **5 locales**: `en`, `it`, `es`, `fr`, `wo`
- Translations must be **real and accurate** — not the English word repeated or transliterated
- For Wolof: use commonly accepted terms; if a scientific term has no standard Wolof translation, use a descriptive phrase (e.g., "Magma Chamber" → "Nëgu magma")
- Keep labels concise: 1–3 words per translation

### Drop Target Positioning Rules

This is critical — poorly positioned targets ruin the scene:

- `x` and `y` are **percentages** (0–100) of the image dimensions
- Position each target **near its visual element** — adjacent to or slightly overlapping, not randomly placed
- **Minimum spacing**: any two drop targets must be at least **8 percentage points apart** in either x or y (ideally both). This prevents overlapping 96×40px target boxes.
- **Stay away from edges**: keep all targets within the **5–95% range** for both x and y
- **Spread targets across the canvas**: if elements are distributed around the image, targets should be too — avoid stacking multiple targets in a vertical or horizontal line at the same coordinate
- Cross-check each target's (x, y) against the downloaded image: the percentage should correspond to where the element actually appears

#### How to Calculate Position

After inspecting the downloaded image, for an element visually centered at pixel coordinates (px, py) in an image of width W and height H:
- `x = (px / W) × 100`
- `y = (py / H) × 100`

Round to the nearest integer.

---

## Step 4 — Validate

After generating both files, perform these checks:

### Config Integrity
- [ ] Every term has a matching drop target (and vice versa) — IDs correspond via shared slug
- [ ] Every term has all 5 locale translations filled in (no empty strings, no nulls)
- [ ] `"agent"` field is present
- [ ] JSON is valid (read back the file and verify)

### Target Positioning
- [ ] No two drop targets are within 8% of each other on both axes simultaneously
- [ ] All x values are between 5 and 95
- [ ] All y values are between 5 and 95
- [ ] Each target's position plausibly matches where its element appears in the image

### Image Quality
- [ ] File exists at `public/scenes/<scene-id>/scene.png`
- [ ] Image contains no text, labels, or annotations
- [ ] Background is not pure white
- [ ] Elements are visually distinct and spread across the canvas

### Final Verification
Read back the config file and report a summary:
- Scene ID
- Number of terms
- List of term labels (English)
- Any validation issues found

---

## Bad Examples — Common Mistakes to Avoid

### ❌ Clustered drop targets

All targets bunched in the center of the canvas. Students can't tell which zone belongs to which element.

```json
"dropTargets": [
  { "id": "target-core", "x": 48, "y": 45, "assignedTerm": "term-core" },
  { "id": "target-mantle", "x": 50, "y": 50, "assignedTerm": "term-mantle" },
  { "id": "target-crust", "x": 52, "y": 47, "assignedTerm": "term-crust" }
]
```

**Why it's wrong:** Targets are within 4% of each other — the 96×40px boxes overlap completely.
**Fix:** Space them to match where each element actually appears in the image, with at least 8% separation.

### ❌ Text or labels in the image

The downloaded image has labels like "Magma", "Crater", etc. baked into it.

**Why it's wrong:** The app renders labels via drop targets. Text in the image means the answer is always visible, defeating the exercise.
**Fix:** Inspect every candidate image before using it. Reject images with text and search for unlabeled alternatives. Look for filenames without "labeled", "annotated", or "English".

### ❌ Fake or repeated translations

```json
{
  "id": "term-magma-chamber",
  "translations": {
    "en": "Magma Chamber",
    "it": "Magma Chamber",
    "es": "Magma Chamber",
    "fr": "Magma Chamber",
    "wo": "Magma Chamber"
  }
}
```

**Why it's wrong:** Every locale has the English text repeated. Students using Italian or Wolof see nonsense.
**Fix:** Use real translations: `"it": "Camera magmatica"`, `"es": "Cámara magmática"`, `"fr": "Chambre magmatique"`, `"wo": "Nëgu magma"`.

### ❌ White background in image

The image has a pure white background.

**Why it's wrong:** Drop target labels are white boxes — they become invisible against a white background.
**Fix:** Reject images with white backgrounds. Search for illustrations with colored or gradient backgrounds.

### ❌ Terms too complex for A2 language level

A scene about ocean floor features with these terms:

```json
"terms": [
  { "id": "term-continental-shelf", "translations": { "en": "Continental Shelf", "it": "Piattaforma continentale", ... } },
  { "id": "term-continental-slope", "translations": { "en": "Continental Slope", "it": "Scarpata continentale", ... } },
  { "id": "term-abyssal-plain", "translations": { "en": "Abyssal Plain", "it": "Pianura abissale", ... } },
  { "id": "term-mid-ocean-ridge", "translations": { "en": "Mid-Ocean Ridge", "it": "Dorsale medio-oceanica", ... } },
  { "id": "term-ocean-trench", "translations": { "en": "Ocean Trench", "it": "Fossa oceanica", ... } }
]
```

**Why it's wrong:** These are specialist geology terms that A2 language learners would never encounter. "Continental Shelf", "Abyssal Plain", and "Mid-Ocean Ridge" are C1/C2 vocabulary. The app is meant for beginner learners — terms should be simple, everyday words like "Mountain", "River", "Rain", "Forest", "Sea".
**Fix:** Choose topics where the vocabulary is naturally simple (water cycle, farm animals, parts of the body, rooms of a house), or simplify the terms to basic words the student already knows.

### ❌ Mismatched term and target IDs

```json
{
  "terms": [
    { "id": "term-1", "translations": { "en": "Crater" }, "defaultLocale": "en" }
  ],
  "dropTargets": [
    { "id": "target-crater", "x": 50, "y": 15, "assignedTerm": "term-crater" }
  ]
}
```

**Why it's wrong:** The term ID is `term-1` but the target references `term-crater`. The drop target will never match, so the scene is unplayable.
**Fix:** Use consistent slugs — `term-crater` in both the term and the target's `assignedTerm`.

---

## Reference

Good examples are bundled in the `examples/` directory next to this file:
- `examples/water-cycle-config.json` — config with 5 terms, kebab-case IDs, all 5 locale translations, and well-spaced drop targets
