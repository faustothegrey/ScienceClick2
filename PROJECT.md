# PROJECT.md
This file contains shared project information for all AI agents working on this repository.

## Project Name
ScienceClick

## Project Overview

ScienceClick2 is an interactive educational web application that lets teachers create labeled visual "scenes" and students learn by dragging and dropping terms onto the correct positions within an image.

## Project Purpose

The app targets the education domain. An educator uploads an image (e.g., a diagram of a cell, a map, or a
photograph), places labels at specific coordinates on it, and saves the scene. Students then play the scene
by dragging terms from a sidebar onto the correct drop zones on the image, receiving visual feedback and a
completion indicator.

## Tech Stack

- Frontend: Next.js 16 (React 19) with TypeScript, styled with Tailwind CSS. Drag-and-drop is powered by @dnd-kit/core.
- Backend: Next.js API routes handle CRUD operations for scenes.
- Storage: File-system based. Scenes are stored as JSON files and images under public/scenes/, with a catalog.json index. No external database.

## Agent Workflow Defaults

Use these defaults for future AI agent sessions working in this repository:

- For substantial implementation work, create a dedicated git worktree and branch instead of editing directly in the main working tree.
- Name the temporary worktree after the task, for example `../ScienceClick2-<task>` with a matching branch name.
- Use the main working tree only for final merged results, verification, and the user-visible final state.
- Before merging back, check whether the main working tree already has local edits in overlapping files and merge carefully instead of overwriting them.
- After a successful merge into the main working tree, always clean up the temporary worktree and delete its temporary branch.

- When running inside cmux, use cmux for task-specific execution surfaces:
- Start a separate terminal split for long-running dev servers or isolated task work.
- Open a browser surface for live validation when UI behavior needs to be checked.
- Prefer task-local browser and terminal panes over reusing the user’s main pane.
- After finishing and merging back to main, close the temporary cmux panes/surfaces created for that task.

- Verification defaults:
- Run `npx tsc --noEmit` after code changes when feasible.
- Run `npm run build` before considering the task merged when feasible.
- Run `npm run lint`, but treat pre-existing unrelated lint failures separately from the task-specific outcome.

- Persistence note:
- If a future agent creates temporary worktrees or cmux panes for a task, that cleanup is part of the task and should not be left for the user.
