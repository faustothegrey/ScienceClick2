---
name: create-scene
description: Create a new ScienceClick2 scene with SVG illustration, config, and translations
---

# Create a New Scene

You are building a scene for **ScienceClick2**, an educational drag-and-drop labeling app. The user will describe a topic (e.g., "solar system", "human skeleton", "parts of a flower"). You must generate all assets for a fully playable scene.

## Arguments

The user provides a short description of the scene topic (e.g., "parts of a flower").

---

## Step 1 — Confirm Topic & Terms

Before generating anything:

1. Read `public/scenes/volcano/config.json` as a reference for config structure.
2. Propose the **scene ID** (kebab-case, ASCII only, derived from the topic).
3. Propose **5–8 terms** with their English labels and a brief note on what each represents visually.
4. Ask the user to confirm or adjust the term list before proceeding.

---

## Step 2 — Generate the SVG Illustration

Create `public/scenes/<scene-id>/scene.svg`.

### Canvas & Dimensions
- `viewBox="0 0 1200 800"` with `width="1200" height="800"`
- The SVG must be self-contained: no external images, fonts, or references

### Visual Style
- Flat, colorful, educational illustration style (like a textbook diagram or infographic)
- Use gradients and layered shapes to add depth — avoid flat single-color fills for major elements
- Pleasant, saturated colors with strong contrast between adjacent elements
- **No text labels** anywhere in the SVG — all labeling is done by the app's drop targets

### Layout & Composition
- **Spread elements across the full canvas** — use the entire 1200×800 area, avoid clustering everything in the center
- Each labeled element must be **visually distinct and recognizable** at the scale it appears
- Minimum element size: at least **80×80px** in SVG units so it's clearly visible
- Leave **breathing room** around each element — drop targets are 96×40px overlays and must not overlap each other
- For cross-section diagrams (e.g., volcano, earth layers), clearly separate above-ground and underground areas
- For map/layout diagrams, space elements with clear visual boundaries

### Complexity & File Size
- Target **80–150 lines** of SVG markup
- Keep the file **under 15 KB** — avoid overly detailed paths or excessive decorative elements
- Use basic shapes (`rect`, `circle`, `ellipse`, `polygon`, `path`) — avoid complex bezier paths when simpler shapes work
- Group related elements with `<g>` tags and use comments to label sections (e.g., `<!-- Magma Chamber -->`)

### Color Guidelines
- **Avoid pure white (#ffffff) backgrounds** — the drop-target labels are white, so they'd be invisible
- Use a colored sky, gradient, or tinted background as the base
- Ensure each labeled element has enough color contrast against its neighbors that a student can distinguish them
- Prefer a consistent color palette of 5–8 main colors

### SVG Structure Pattern

Follow this structure:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800">
  <defs>
    <!-- Gradients and reusable definitions -->
  </defs>

  <!-- Background (sky, water, ground, etc.) -->

  <!-- Major structural elements (largest to smallest, back to front) -->

  <!-- Individual labeled elements, each in a comment-delimited section -->
  <!-- Element Name -->
  <g>...</g>

  <!-- Decorative details (trees, particles, textures) -->
</svg>
```

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
- Cross-check each target's (x, y) against the SVG: the percentage should correspond to where the element actually appears in the 1200×800 canvas

#### How to Calculate Position

For an SVG element centered at pixel coordinates (px, py):
- `x = (px / 1200) × 100`
- `y = (py / 800) × 100`

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
- [ ] Each target's position matches the visual location of its element in the SVG

### SVG Quality
- [ ] File starts with `<svg xmlns=...>` and has the correct viewBox
- [ ] No `<text>` elements present (labels come from the app, not the SVG)
- [ ] No external references (xlink:href to URLs, external fonts, etc.)
- [ ] File is under 15 KB

### Final Verification
Read back both generated files and report a summary:
- Scene ID
- Number of terms
- List of term labels (English)
- Any validation issues found

---

## Reference

For a working example of a well-structured scene, read:
- `public/scenes/volcano/config.json` — config with 6 terms and kebab-case IDs
- `public/scenes/volcano/scene.svg` — ~114-line SVG with gradients, layered shapes, and clear structure
