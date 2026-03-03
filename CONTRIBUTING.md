# Contributing to SlateAI Markdown Studio

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and constructive. We aim to maintain a welcoming environment for everyone.

## How to Contribute

### Reporting Bugs

- Use the GitHub issue tracker.
- Include steps to reproduce, expected vs actual behavior, and your environment (browser, OS).
- Search existing issues first to avoid duplicates.

### Suggesting Features

- Open an issue with a clear description of the feature.
- Explain the use case and why it would benefit the project.

### Pull Requests

1. **Fork** the repository and create a branch from `main`.
2. **Follow the code style**:
   - Use Prettier (run `npm run format`).
   - Use camelCase for variables/functions, PascalCase for components.
   - Follow existing patterns in the codebase.
3. **Keep changes focused** – one feature or fix per PR when possible.
4. **Test** – ensure the app builds (`npm run build`) and works as expected.
5. **Update docs** – if you change behavior, update README or relevant docs.
6. **Submit** the PR with a clear title and description.

### Development Setup

```bash
git clone https://github.com/stormdotcom/stale-ai-md-react.git
cd stale-ai-md-react
npm install
npm run dev
```

### Scripts

- `npm run dev` – Start dev server
- `npm run build` – Build for production
- `npm run format` – Format code with Prettier
- `npm run format:check` – Check formatting
- `npm run lint` – Run ESLint

### Tech Stack

- React 19, TypeScript, Vite
- Tailwind CSS
- Radix UI (dialogs, context menu)
- Yjs + y-webrtc (real-time collaboration)

### Commit Messages

Use clear, descriptive messages. Prefer present tense (e.g. "Add folder import" not "Added folder import").

## Questions?

Open an issue or reach out to the maintainers. We appreciate your contributions!
