# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Markdown Viewer X (package name: `slateai-markdown-studio`) is a client-side React markdown editor/viewer with AI-powered formatting assistance. It supports split-view editing/preview, live markdown rendering, and integrates with Ollama, Gemini, and OpenAI for AI text transformations (improve writing, shorten, expand, fix grammar, etc.). Real-time collaboration is supported via Yjs + WebRTC.

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Lint:** `npm run lint`
- **Format:** `npm run format` (Prettier)
- **Format check:** `npm run format:check`
- **Preview production build:** `npm run preview`

No test framework is configured.

## Architecture

The app is structured as a landing page that transitions to the editor. Session-based routing uses the URL hash (`#session=...`).

**Entry point:** `src/main.tsx` → `App.tsx` → lazy-loaded `MDViewer`

- `App.tsx` — Manages view state (`landing` | `editor`), listens for hash changes to detect session URLs, lazy-loads MDViewer with Suspense.
- `src/components/LandingPage.tsx` — Static marketing/launch page with an `onLaunch` callback.
- `src/components/MDViewer.jsx` (~1,876 lines) — The monolithic core component containing all editor functionality:
  - **Markdown parser** — Custom regex-based parser (no external library). Handles inline formatting and block-level elements. Output is raw HTML strings.
  - **Editor** — Textarea with line number gutter, scroll sync, undo/redo history array, keyboard shortcuts (Ctrl+B/I/K/Z/Y), and text manipulation helpers (`wrapSel()`, `togglePrefix()`, `insertAt()`).
  - **AI integration** — Three provider implementations (`callOllama()`, `callGemini()`, `callOpenAI()`) using streaming SSE. Config persisted in localStorage.
  - **Real-time collaboration** — Yjs documents with WebRTC provider, dynamically imported.
  - **File management** — Multi-file tree with context menus (rename, delete, new file). Export to markdown, HTML, or zip (via JSZip).
  - **Styling** — Large CSS string constant injected via `<style>` element. Uses GitHub dark theme colors.
- `src/components/ui/` — Radix UI-based primitives (dialog, alert-dialog, context-menu, button, input, prompt-dialog, confirm-dialog).
- `src/types/mdviewer.d.ts` — Type declaration to allow importing the `.jsx` component from TypeScript.
- `src/lib/utils.ts` — Utility for merging Tailwind classes (`cn()` using clsx + tailwind-merge).

## Tech Stack

- React 19 + Vite 7 + TypeScript (strict mode)
- Babel React Compiler enabled
- Tailwind CSS 4 (class-based dark mode, custom GitHub dark theme palette in `tailwind.config.js`)
- Radix UI for dialog/menu primitives; lucide-react for icons
- Yjs + y-webrtc for real-time collaboration
- JSZip for zip export
- ESLint (flat config) + Prettier

## Conventions

- CSS class names use short abbreviations (e.g., `fb` = format button, `vb` = view button, `aip` = AI panel)
- Refs use camelCase with "Ref" suffix (`taRef`, `gutRef`, `fileRef`)
- Custom SVG icons defined in an `Ic` object within MDViewer.jsx
- UI primitives in `src/components/ui/` wrap Radix components with project styling
- MDViewer is `.jsx` (not `.tsx`) with a `.d.ts` shim for TypeScript compatibility
