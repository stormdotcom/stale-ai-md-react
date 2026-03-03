# SlateAI Markdown Studio

SlateAI Markdown Studio is a developer‑focused markdown IDE in the browser.  
It combines a keyboard‑friendly editor, live preview, and an AI assistant that can rewrite or refactor your markdown using Ollama, Gemini, or OpenAI.

## Core UI functionality

- **Markdown editor**
  - Full‑screen, dark UI styled like a code editor.
  - Line‑number gutter, cursor position indicator (`Ln`, `Col`).
  - History with **Undo / Redo** (toolbar buttons + keyboard shortcuts).
  - Formatting toolbar for:
    - Headings (H1–H3)
    - Bold / Italic / Strikethrough
    - Inline code and fenced code blocks
    - Bullet / numbered lists
    - Blockquotes, links, images, tables, horizontal rules
  - Keyboard shortcuts for common actions (e.g. bold, italic, links, undo/redo).

- **Live markdown preview**
  - Split‑view, edit‑only, or preview‑only modes.
  - Rich rendering for:
    - Headings, paragraphs, lists, blockquotes
    - Inline code and syntax‑style code blocks with a header bar
    - Tables, images, horizontal rules
  - “Copy code” button for every code block.
  - Document outline sidebar that lets you jump to headings in the preview.

- **File & drag‑and‑drop support**
  - “Open” button for picking `.md`, `.markdown`, or `.txt` files.
  - Drag‑and‑drop zone and full‑screen drag overlay; drops load the file into the editor.
  - Status bar showing current file name and viewer version.

- **AI assistant panel**
  - Collapsible right‑hand AI panel that works on:
    - Current text selection, or
    - Entire document.
  - Provider tabs:
    - **Ollama** (local)
    - **Gemini**
    - **OpenAI or compatible APIs**
  - Per‑provider configuration:
    - Base URL and model for Ollama.
    - API key + model name for Gemini.
    - API key, model, and optional base URL for OpenAI/compatible.
  - Connection tester with inline status (OK / error / checking).
  - One‑click **quick actions**:
    - Improve writing, make shorter/longer
    - Change tone (formal / casual)
    - Convert to bullets or table
    - Fix grammar, summarize, and more
  - Custom prompt box with “Run” and streaming response view.
  - Buttons to **Accept** (apply) or **Discard** AI results, with:
    - Apply to selection when possible, or
    - Apply to the whole document.

- **Copy & export**
  - Top toolbar actions to:
    - Copy raw markdown.
    - Copy rendered HTML from the preview.
  - Small status badges for word count and line count.

- **Persistent AI configuration**
  - AI provider choice, models, base URLs, and API keys are saved in `localStorage`.
  - Configuration is restored automatically on reload in the same browser.

## Tech stack

- React 19 + TypeScript + Vite.
- Tailwind CSS for layout and utility styling.
- Custom markdown parser + renderer for tight control over output.

This UI is designed to feel like a focused dev tool: everything you need to write, preview, and refactor markdown with AI, in a single screen.
