# ScienceClick2 - App Walkthrough

## Overview

ScienceClick2 is an interactive educational tool where teachers create labeled diagram scenes and students learn by dragging terms onto the correct positions. The app has two modes: **Editor** (for teachers) and **Play** (for students).

## Layout

The app is a full-screen single-page interface divided into three areas:

1. **Header Bar** (top) — Shows the scene name with a breadcrumb ("Scenes / Demo Scene") and an Editor/Play mode toggle on the right.
2. **Canvas** (center) — Displays the scene image with positioned drop targets overlaid on it.
3. **Term Bank** (right sidebar, 288px wide) — Lists all terms that can be dragged onto the canvas.

## Editor Mode

Editor mode is the authoring environment where a teacher sets up the scene by creating terms and placing them on the diagram.

### Creating a Term

1. Click the **"New Term"** button in the Term Bank sidebar.
2. An inline text input appears below the button with a placeholder "Enter term label".
3. Type the term name (e.g., "Evaporation").
4. Click **"Save"** or press **Enter** to confirm. The Save button is disabled until text is entered. Press **Escape** or click **"Cancel"** to discard.
5. After saving, the canvas enters **placing mode**:
   - A blue banner appears at the top of the canvas: *'Click on the image to place "Evaporation"'*.
   - The canvas border turns blue and the cursor becomes a crosshair.
   - Click anywhere on the scene image to place the drop target at that position.
6. Once placed, the term and its drop target are **automatically persisted** to the server. No manual save step is needed.

### How Drop Targets Work in Editor Mode

- Each drop target is a rounded rectangle (96x40px) positioned on the canvas at percentage-based coordinates.
- In editor mode, drop targets display their assigned term label with a solid blue border and white background.
- Every drop target must have exactly one assigned term. Empty drop targets cannot exist.
- Each term maps to exactly one drop target (one-to-one relationship).

### Repositioning a Drop Target

- Drag a term from the Term Bank onto the canvas background.
- If that term already has a drop target, it moves to the new position.
- The change is automatically persisted.

### Removing a Term

- In editor mode, each term in the Term Bank has an **X** button on its right side.
- Clicking it removes both the term and its associated drop target from the scene.
- The removal is automatically persisted.

## Play Mode

Play mode is the student-facing experience. Switch to it by clicking **"Play"** in the header bar.

### How It Works

1. All player guesses are **reset** when entering play mode.
2. Drop targets appear as empty dashed-border slots on the canvas (the answer labels are hidden).
3. The Term Bank sidebar lists all terms. Students drag terms from the sidebar onto drop targets on the canvas.
4. When a term is dropped on a drop target, the target fills in with the term label and shows a solid blue border.
5. Each term can only be placed on one target at a time. Dropping a term on a new target removes it from the previous one.

### Feedback

Feedback is **deferred** — no immediate correct/incorrect indication is given while the student is still placing terms. Once **every** drop target has a term placed on it:

- **Correct** placements turn **green** (green border, light green background).
- **Incorrect** placements turn **red** (red border, light red background).

This allows the student to complete the entire exercise before seeing results.

### Drag Overlay

While dragging a term in either mode, a floating overlay follows the cursor showing the term label in a white card with a blue border.

## Data Model

### Terms

```json
{
  "id": "term-1770589156675",
  "label": "Rain"
}
```

- `id`: Unique identifier generated from timestamp.
- `label`: The display text shown in the Term Bank and on drop targets.

### Drop Targets

```json
{
  "id": "target-1770589159230",
  "x": 38.49,
  "y": 31.87,
  "assignedTerm": "term-1770589156675"
}
```

- `id`: Unique identifier generated from timestamp.
- `x`, `y`: Position as percentage of the canvas container (0-100), allowing responsive scaling.
- `assignedTerm`: The `id` of the term assigned to this target (the answer key). Always non-null for persisted targets.

### Player Guesses (runtime only, not persisted)

A `Record<string, string>` mapping drop target id to term id. This tracks what the student has placed where during a play session and is reset each time play mode is entered.

## Persistence

Scene data is stored as JSON files at `public/scenes/{id}/config.json`. A Next.js API route at `/api/scenes/{id}/config` handles reading (GET) and writing (PUT).

Changes are persisted automatically at three points:
1. After a new term's drop target is placed on the canvas.
2. After a term (and its drop target) is removed.
3. After a drop target is repositioned via drag.

## File Structure

| File | Purpose |
|------|---------|
| `src/app/scenes/[id]/page.tsx` | Main page component. Manages state for terms, drop targets, player guesses, and placing mode. Handles drag-and-drop events and persistence. |
| `src/components/editor/HeaderBar.tsx` | Top bar with scene name breadcrumb and Editor/Play mode toggle. |
| `src/components/editor/Canvas.tsx` | Displays the scene image, renders drop targets (DropZone components), handles placing mode click. |
| `src/components/editor/TermBank.tsx` | Right sidebar listing draggable terms, inline term creation form, remove buttons. |
| `src/components/editor/Toolbar.tsx` | Left-side tool palette (placeholder for future tools). |
| `src/app/api/scenes/[id]/config/route.ts` | API route for reading/writing scene config JSON files. |
| `public/scenes/demo/config.json` | Persisted scene data (terms + drop targets) for the demo scene. |
| `public/scenes/demo/scene.png` | The background image for the demo scene (water cycle diagram). |

## Tech Stack

- **Next.js 16** (React 19) with TypeScript
- **Tailwind CSS** for styling
- **@dnd-kit/core** for drag-and-drop
- **lucide-react** for icons
- File-system JSON storage (no database)
