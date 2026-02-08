# PROJECT.md
This file contains shared project information for all AI agents working on this repository.

## Project Name
ScienceClick2

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