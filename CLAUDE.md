# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Markdown Viewer X is a client-side React markdown editor/viewer with AI-powered formatting assistance. It supports split-view editing/preview, live markdown rendering, and integrates with Ollama, Gemini, and OpenAI for AI text transformations (improve writing, shorten, expand, fix grammar, etc.).

## Commands

- **Dev server:** `npm run dev`
- **Build:** `npm run build` (runs `tsc -b && vite build`)
- **Lint:** `npm run lint`
- **Preview production build:** `npm run preview`

No test framework is configured.

## Architecture

The entire application lives in a single monolithic component: `src/components/MDViewer.jsx` (~1,095 lines). There is no component decomposition — editor, markdown parser, AI integration, toolbar, and all UI logic are in this one file.

**Key subsystems within MDViewer.jsx:**

- **Markdown parser** — Custom regex-based parser (no external library). Handles inline formatting (bold, italic, links, code) and block-level elements (headings, lists, tables, code blocks, blockquotes). Output is raw HTML strings.
- **Editor** — Textarea with line number gutter, scroll sync, undo/redo history array, keyboard shortcuts (Ctrl+B/I/K/Z/Y), and text manipulation helpers (`wrapSel()`, `togglePrefix()`, `insertAt()`).
- **AI integration** — Three provider implementations (`callOllama()`, `callGemini()`, `callOpenAI()`) all using streaming SSE. Config persisted in localStorage.
- **Styling** — A large CSS string constant injected into a `<style>` element on mount. Uses GitHub dark theme colors. Tailwind is configured but the component mostly uses the injected CSS.

**Entry point:** `src/main.tsx` → `App.tsx` → `MDViewer`

## Tech Stack

- React 19 + Vite 7 + TypeScript (strict mode)
- Babel React Compiler enabled
- Tailwind CSS 4 (class-based dark mode, custom GitHub dark theme palette in `tailwind.config.js`)
- ESLint with modern flat config

## Conventions

- CSS class names use short abbreviations (e.g., `fb` = format button, `vb` = view button, `aip` = AI panel)
- Refs use camelCase with "Ref" suffix (`taRef`, `gutRef`, `fileRef`)
- Custom SVG icons defined in an `Ic` object within MDViewer.jsx
- No component library — all UI is hand-built
