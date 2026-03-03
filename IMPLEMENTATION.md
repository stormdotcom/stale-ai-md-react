# Implementation Plan — Markdown Viewer X

This document provides step-by-step instructions to implement the following features:

1. **Improve the editor** (better UX, missing features)
2. **Download as file** (export .md / .html / .pdf)
3. **Make it public** (deploy, shareable links)
4. **Collaborative editing** (2 users edit simultaneously via WebSocket)

---

## Current Codebase Summary

- Single-page React 19 + Vite 7 app, no backend
- Entire app is one file: `src/components/MDViewer.jsx` (~1095 lines)
- Custom regex-based markdown parser (no library)
- Styling is a CSS string injected into `<style>` on mount
- AI integration via fetch to Ollama/Gemini/OpenAI streaming APIs
- State: React hooks only, undo/redo via history array
- No router, no auth, no database, no WebSocket server

---

## Phase 1: Improve the Editor

### 1.1 Add Download Button to the View Toolbar

**File:** `src/components/MDViewer.jsx`

**Where:** Inside the `<div className="vtbar">` block (around line 999-1011), add a download button next to the existing "MD" and "HTML" copy buttons.

**Add this function** inside `MDViewer()` component, after the `copyOut` function (around line 896):

```jsx
const downloadFile = (type) => {
  let content, mimeType, extension;
  if (type === "md") {
    content = md;
    mimeType = "text/markdown";
    extension = ".md";
  } else if (type === "html") {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fileName}</title>
<style>
body { font-family: system-ui, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; line-height: 1.8; color: #222; }
pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
code { font-family: monospace; font-size: 0.9em; }
blockquote { border-left: 3px solid #ccc; margin: 1em 0; padding: 0.5em 1em; color: #555; }
table { border-collapse: collapse; width: 100%; margin: 1em 0; }
th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
th { background: #f5f5f5; }
img { max-width: 100%; }
</style>
</head>
<body>${htmlOut}</body>
</html>`;
    content = fullHtml;
    mimeType = "text/html";
    extension = ".html";
  }
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.replace(/\.[^.]+$/, "") + extension;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

**Add buttons** in the vtbar JSX, right after the existing copy buttons:

```jsx
<div className="vsep"/>
<button className="vb" onClick={() => downloadFile("md")}>↓ Save .md</button>
<button className="vb" onClick={() => downloadFile("html")}>↓ Save .html</button>
```

### 1.2 Add Tab Key Support (Insert 2 Spaces)

**Where:** On the `<textarea>` element (around line 1033), add an `onKeyDown` handler.

**Add this function** inside MDViewer(), near the `trackCursor` function:

```jsx
const handleTabKey = (e) => {
  if (e.key === "Tab") {
    e.preventDefault();
    const ta = taRef.current;
    const s = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = md.slice(0, s) + "  " + md.slice(end);
    commit(newVal);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = s + 2;
    });
  }
};
```

**Add to textarea:** `onKeyDown={handleTabKey}` on the `<textarea>` element.

### 1.3 Add Search & Replace

**Add state** near other state declarations (around line 748-760):

```jsx
const [showSearch, setShowSearch] = useState(false);
const [searchText, setSearchText] = useState("");
const [replaceText, setReplaceText] = useState("");
```

**Add keyboard shortcut** in the keydown handler (around line 831-842):

```jsx
if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
  e.preventDefault();
  setShowSearch(s => !s);
}
```

**Add search bar JSX** — render it right above the editor area (`<div className="ea">`), conditionally:

```jsx
{showSearch && (
  <div style={{
    height: 36, background: "var(--s1)", borderBottom: "1px solid var(--bd)",
    display: "flex", alignItems: "center", padding: "0 10px", gap: 6
  }}>
    <input
      style={{
        background: "var(--s2)", color: "var(--text)", border: "1px solid var(--bd2)",
        borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        padding: "4px 8px", outline: "none", width: 180
      }}
      placeholder="Search…"
      value={searchText}
      onChange={e => setSearchText(e.target.value)}
      autoFocus
    />
    <input
      style={{
        background: "var(--s2)", color: "var(--text)", border: "1px solid var(--bd2)",
        borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
        padding: "4px 8px", outline: "none", width: 180
      }}
      placeholder="Replace…"
      value={replaceText}
      onChange={e => setReplaceText(e.target.value)}
    />
    <button className="fb" onClick={() => {
      if (!searchText) return;
      commit(md.replaceAll(searchText, replaceText));
      showToast(`Replaced all occurrences`, "ok");
    }}>Replace All</button>
    <button className="fb" onClick={() => setShowSearch(false)}>✕</button>
  </div>
)}
```

### 1.4 Add Word Wrap Toggle

**Add state:**

```jsx
const [wordWrap, setWordWrap] = useState(false);
```

**Add button** in vtbar:

```jsx
<button className={`vb${wordWrap ? " on" : ""}`} onClick={() => setWordWrap(w => !w)}>
  ↩ Wrap
</button>
```

**Apply to textarea:** Add this style prop to the `<textarea>` element:

```jsx
style={{ whiteSpace: wordWrap ? "pre-wrap" : "pre", wordBreak: wordWrap ? "break-word" : "normal" }}
```

---

## Phase 2: Backend Server for Collaboration & Public Sharing

Collaborative editing and public sharing require a backend. We will use:

- **Express.js** — HTTP server for the API
- **Socket.IO** — WebSocket library for real-time collaboration
- **nanoid** — Generate short unique document IDs
- **A JSON file or SQLite** — Simple document storage (no heavy database needed)

### 2.1 Create the Backend

**Install dependencies** (run from project root):

```bash
npm install express socket.io nanoid cors
npm install -D @types/express nodemon concurrently
```

**Create folder structure:**

```
server/
  index.js        ← Express + Socket.IO server
  store.js        ← Document storage (JSON file)
```

### 2.2 Document Store — `server/store.js`

This file handles reading/writing documents to a JSON file on disk.

```js
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, "documents.json");

function readDB() {
  if (!existsSync(DB_PATH)) return {};
  try {
    return JSON.parse(readFileSync(DB_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function writeDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

export function getDoc(id) {
  const db = readDB();
  return db[id] || null;
}

export function saveDoc(id, doc) {
  const db = readDB();
  db[id] = { ...doc, updatedAt: Date.now() };
  writeDB(db);
}

export function createDoc(id, title, content) {
  const db = readDB();
  db[id] = { id, title, content, createdAt: Date.now(), updatedAt: Date.now() };
  writeDB(db);
  return db[id];
}

export function deleteDoc(id) {
  const db = readDB();
  delete db[id];
  writeDB(db);
}

export function listDocs() {
  const db = readDB();
  return Object.values(db).map(d => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt,
  }));
}
```

### 2.3 Server — `server/index.js`

```js
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import cors from "cors";
import { getDoc, saveDoc, createDoc, listDocs, deleteDoc } from "./store.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// ── REST API ──

// Create a new document, returns { id, title, content }
app.post("/api/docs", (req, res) => {
  const id = nanoid(10);
  const title = req.body.title || "untitled.md";
  const content = req.body.content || "";
  const doc = createDoc(id, title, content);
  res.json(doc);
});

// Get a document by ID
app.get("/api/docs/:id", (req, res) => {
  const doc = getDoc(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

// Update a document
app.put("/api/docs/:id", (req, res) => {
  const existing = getDoc(req.params.id);
  if (!existing) return res.status(404).json({ error: "Document not found" });
  const updated = {
    ...existing,
    title: req.body.title ?? existing.title,
    content: req.body.content ?? existing.content,
  };
  saveDoc(req.params.id, updated);
  res.json(updated);
});

// List all documents
app.get("/api/docs", (req, res) => {
  res.json(listDocs());
});

// Delete a document
app.delete("/api/docs/:id", (req, res) => {
  deleteDoc(req.params.id);
  res.json({ ok: true });
});

// ── WebSocket for real-time collaboration ──

// Track which users are in which document room
// rooms = { docId: { socketId: { name, color, cursor } } }
const rooms = {};

// Assign a random color to each user
const COLORS = ["#58a6ff", "#3fb950", "#ffa657", "#f85149", "#bc8cff", "#39d0ba", "#f778ba", "#79c0ff"];
let colorIdx = 0;

io.on("connection", (socket) => {
  let currentRoom = null;
  let userName = "User " + Math.floor(Math.random() * 1000);
  let userColor = COLORS[colorIdx++ % COLORS.length];

  // User joins a document room
  socket.on("join-doc", ({ docId, name }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      if (rooms[currentRoom]) {
        delete rooms[currentRoom][socket.id];
        io.to(currentRoom).emit("users-changed", Object.values(rooms[currentRoom]));
      }
    }

    currentRoom = docId;
    if (name) userName = name;
    socket.join(docId);

    if (!rooms[docId]) rooms[docId] = {};
    rooms[docId][socket.id] = { id: socket.id, name: userName, color: userColor, cursor: null };

    // Send current document content to the joining user
    const doc = getDoc(docId);
    if (doc) {
      socket.emit("doc-loaded", { content: doc.content, title: doc.title });
    }

    // Notify all users in the room about the updated user list
    io.to(docId).emit("users-changed", Object.values(rooms[docId]));
  });

  // User sends a text change
  // `change` object: { from, to, text } — describes what changed
  socket.on("doc-change", ({ docId, content, change }) => {
    // Save to disk
    const doc = getDoc(docId);
    if (doc) {
      saveDoc(docId, { ...doc, content });
    }

    // Broadcast to all OTHER users in the room
    socket.to(docId).emit("doc-changed", { content, change, userId: socket.id });
  });

  // User moves their cursor
  socket.on("cursor-move", ({ docId, cursor }) => {
    if (rooms[docId] && rooms[docId][socket.id]) {
      rooms[docId][socket.id].cursor = cursor;
      socket.to(docId).emit("cursor-moved", {
        userId: socket.id,
        name: userName,
        color: userColor,
        cursor,
      });
    }
  });

  // User disconnects
  socket.on("disconnect", () => {
    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom][socket.id];
      io.to(currentRoom).emit("users-changed", Object.values(rooms[currentRoom]));
      if (Object.keys(rooms[currentRoom]).length === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### 2.4 Add Scripts to `package.json`

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"nodemon server/index.js\"",
    "dev:client": "vite",
    "dev:server": "nodemon server/index.js",
    "build": "tsc -b && vite build",
    "start": "node server/index.js",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

### 2.5 Vite Proxy Config

**Update `vite.config.ts`** to proxy API and WebSocket requests to the backend during development:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
});
```

---

## Phase 3: Frontend — Collaborative Editing

### 3.1 Install Socket.IO Client

```bash
npm install socket.io-client
```

### 3.2 Create a Collaboration Hook — `src/hooks/useCollab.js`

This hook manages the WebSocket connection, syncing document changes, and tracking remote user cursors.

```jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

export function useCollab(docId, onRemoteChange) {
  const socketRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!docId) return;

    const socket = io(window.location.origin, {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-doc", { docId });
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("doc-loaded", ({ content, title }) => {
      onRemoteChange(content, title, true); // true = initial load
    });

    socket.on("doc-changed", ({ content, userId }) => {
      onRemoteChange(content, null, false);
    });

    socket.on("users-changed", (userList) => {
      setUsers(userList);
    });

    socket.on("cursor-moved", ({ userId, name, color, cursor }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { name, color, cursor },
      }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [docId]);

  const sendChange = useCallback(
    (content) => {
      if (socketRef.current && docId) {
        socketRef.current.emit("doc-change", { docId, content });
      }
    },
    [docId]
  );

  const sendCursor = useCallback(
    (cursor) => {
      if (socketRef.current && docId) {
        socketRef.current.emit("cursor-move", { docId, cursor });
      }
    },
    [docId]
  );

  return { users, remoteCursors, connected, sendChange, sendCursor };
}
```

### 3.3 Create an API Helper — `src/api.js`

```js
const BASE = "/api";

export async function createDocument(title, content) {
  const res = await fetch(`${BASE}/docs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });
  return res.json();
}

export async function getDocument(id) {
  const res = await fetch(`${BASE}/docs/${id}`);
  if (!res.ok) return null;
  return res.json();
}

export async function updateDocument(id, data) {
  const res = await fetch(`${BASE}/docs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function listDocuments() {
  const res = await fetch(`${BASE}/docs`);
  return res.json();
}

export async function deleteDocument(id) {
  await fetch(`${BASE}/docs/${id}`, { method: "DELETE" });
}
```

### 3.4 Integrate Collaboration into MDViewer.jsx

**Step 1: Add imports** at the top of `MDViewer.jsx`:

```jsx
import { useCollab } from "../hooks/useCollab";
import { createDocument } from "../api";
```

**Step 2: Extract docId from URL.** Add this near the top of `MDViewer()`:

```jsx
const [docId, setDocId] = useState(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get("doc") || null;
});
```

**Step 3: Add collab hook.** Add this after the docId state, inside `MDViewer()`:

```jsx
const isRemoteUpdate = useRef(false);

const handleRemoteChange = useCallback((content, title, isInitial) => {
  isRemoteUpdate.current = true;
  if (content !== undefined && content !== null) {
    setMd(content);
    setHist(h => [...h, content]);
    setHIdx(h => h + 1);
  }
  if (title) setFileName(title);
  isRemoteUpdate.current = false;
}, []);

const { users, remoteCursors, connected, sendChange, sendCursor } = useCollab(docId, handleRemoteChange);
```

**Step 4: Modify the `commit` function** to also send changes to the server. Replace the existing `commit` function:

```jsx
const commit = useCallback((newMd) => {
  setHist(h => {
    const next = [...h.slice(0, hIdx + 1), newMd];
    setHIdx(next.length - 1);
    return next;
  });
  setMd(newMd);

  // Send to collaborators if in a shared doc and this is a local change
  if (docId && !isRemoteUpdate.current) {
    sendChange(newMd);
  }
}, [hIdx, docId, sendChange]);
```

**Step 5: Send cursor position.** Modify the `trackCursor` function to also broadcast cursor:

```jsx
const trackCursor = () => {
  const ta = taRef.current;
  if (!ta) return;
  const before = ta.value.substr(0, ta.selectionStart).split("\n");
  const ln = before.length;
  const col = before[before.length - 1].length + 1;
  setCursor({ ln, col });
  const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
  setSelection(sel);
  if (gutRef.current) gutRef.current.scrollTop = ta.scrollTop;

  // Broadcast cursor to collaborators
  if (docId) {
    sendCursor({ ln, col, selStart: ta.selectionStart, selEnd: ta.selectionEnd });
  }
};
```

**Step 6: Add "Share" button.** Add a share/publish button in the vtbar. This creates a document on the server and updates the URL:

```jsx
<div className="vsep"/>
<button className="vb" onClick={async () => {
  if (docId) {
    // Already shared — copy link
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied!", "ok");
  } else {
    // Create a new shared document
    const doc = await createDocument(fileName, md);
    setDocId(doc.id);
    const newUrl = `${window.location.origin}?doc=${doc.id}`;
    window.history.pushState({}, "", newUrl);
    navigator.clipboard.writeText(newUrl);
    showToast("Published! Link copied.", "ok");
  }
}}>
  {docId ? "🔗 Copy Link" : "📤 Share"}
</button>
```

**Step 7: Show connected users** in the status bar. Add this inside the `<div className="sbar">`, before the "MD Viewer v3" text:

```jsx
{docId && (
  <>
    <div className="sd"/>
    <div className="si" style={{ gap: 4 }}>
      <div style={{
        width: 6, height: 6, borderRadius: "50%",
        background: connected ? "var(--green)" : "var(--red)",
      }}/>
      {connected ? `${users.length} online` : "Disconnected"}
    </div>
    <div style={{ display: "flex", gap: 2, marginLeft: 4 }}>
      {users.slice(0, 5).map((u) => (
        <div key={u.id} title={u.name} style={{
          width: 18, height: 18, borderRadius: "50%",
          background: u.color, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 600,
        }}>
          {u.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  </>
)}
```

### 3.5 Show Remote Cursors in the Editor

Remote cursors are shown as colored indicators in the editor. Since we use a plain `<textarea>`, we overlay cursor indicators on top.

**Add this component** above the MDViewer export:

```jsx
function RemoteCursors({ cursors, md }) {
  // Calculate pixel position from line/col
  return (
    <div style={{ position: "absolute", top: 0, left: 48, right: 0, bottom: 0, pointerEvents: "none", overflow: "hidden" }}>
      {Object.entries(cursors).map(([userId, { name, color, cursor }]) => {
        if (!cursor) return null;
        const top = (cursor.ln - 1) * 21.45 + 12; // line-height 1.65 * 13px = ~21.45px, plus 12px padding
        return (
          <div key={userId} style={{ position: "absolute", top, left: 18, zIndex: 5 }}>
            <div style={{
              width: 2, height: 18, background: color, borderRadius: 1, position: "relative",
            }}>
              <span style={{
                position: "absolute", top: -16, left: 0, background: color,
                color: "#fff", fontSize: 9, padding: "1px 5px", borderRadius: 3,
                whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace",
              }}>
                {name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

**Render it** inside the editor `<div className="es">`, after the `<textarea>`:

```jsx
{docId && <RemoteCursors cursors={remoteCursors} md={md} />}
```

---

## Phase 4: Deployment (Make It Public)

### 4.1 Production Build Setup

The app needs to serve both the Vite-built frontend and the Express backend from one process in production.

**Add to `server/index.js`**, before the `httpServer.listen()` call:

```js
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __serverDir = dirname(fileURLToPath(import.meta.url));
const distPath = join(__serverDir, "..", "dist");

// Serve the built frontend in production
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // Fallback to index.html for SPA routing
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) return next();
    res.sendFile(join(distPath, "index.html"));
  });
}
```

### 4.2 Deploy to a Cloud Provider

**Option A: Deploy to Render.com (free tier)**

1. Push code to a GitHub repository
2. Go to https://render.com → New → Web Service
3. Connect the repo
4. Set build command: `npm install && npm run build`
5. Set start command: `node server/index.js`
6. Set environment variable: `PORT=3001` (Render provides its own PORT)
7. Deploy

**Option B: Deploy to Railway.app**

1. Push code to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Railway auto-detects Node.js
4. Set start command: `node server/index.js`
5. Add build command in settings: `npm install && npm run build`
6. Deploy

**Option C: Deploy with Docker**

Create `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["node", "server/index.js"]
```

Create `.dockerignore`:

```
node_modules
dist
server/documents.json
```

Run:

```bash
docker build -t md-viewer-x .
docker run -p 3001:3001 md-viewer-x
```

### 4.3 Environment-Aware API URLs

**Update `src/api.js`** to work in both dev and production:

```js
const BASE = import.meta.env.VITE_API_URL || "/api";
```

No change needed for Socket.IO — it auto-detects the host from `window.location.origin`.

---

## Phase 5: Polish & Edge Cases

### 5.1 Debounce Saves During Collaboration

Sending every keystroke over WebSocket can be expensive. Add a debounce.

**In the `commit` function**, debounce the `sendChange` call:

```jsx
const saveTimerRef = useRef(null);

const commit = useCallback((newMd) => {
  setHist(h => {
    const next = [...h.slice(0, hIdx + 1), newMd];
    setHIdx(next.length - 1);
    return next;
  });
  setMd(newMd);

  if (docId && !isRemoteUpdate.current) {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      sendChange(newMd);
    }, 150); // 150ms debounce
  }
}, [hIdx, docId, sendChange]);
```

### 5.2 Prevent Cursor Jump on Remote Changes

When a remote user edits the document, the local user's cursor can jump to the start. To fix this:

**In `handleRemoteChange`**, save and restore cursor position:

```jsx
const handleRemoteChange = useCallback((content, title, isInitial) => {
  isRemoteUpdate.current = true;
  const ta = taRef.current;
  const prevStart = ta?.selectionStart;
  const prevEnd = ta?.selectionEnd;

  if (content !== undefined && content !== null) {
    setMd(content);
    setHist(h => [...h, content]);
    setHIdx(h => h + 1);
  }
  if (title) setFileName(title);

  // Restore cursor after state update
  if (ta && !isInitial) {
    requestAnimationFrame(() => {
      ta.selectionStart = prevStart;
      ta.selectionEnd = prevEnd;
    });
  }
  isRemoteUpdate.current = false;
}, []);
```

### 5.3 Auto-save Indicator

**Add state:**

```jsx
const [saveStatus, setSaveStatus] = useState("saved"); // "saved" | "saving" | "unsaved"
```

Show in status bar:

```jsx
<div className="si" style={{ fontSize: 10, color: saveStatus === "saved" ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.9)" }}>
  {saveStatus === "saved" ? "✓ Saved" : saveStatus === "saving" ? "Saving…" : "● Unsaved"}
</div>
```

---

## Summary of New Files to Create

| File | Purpose |
|------|---------|
| `server/index.js` | Express + Socket.IO server |
| `server/store.js` | JSON file-based document storage |
| `src/hooks/useCollab.js` | WebSocket collaboration hook |
| `src/api.js` | REST API helper functions |

## Summary of Files to Modify

| File | Changes |
|------|---------|
| `src/components/MDViewer.jsx` | Download buttons, search/replace, tab key, share button, collab integration, remote cursors, user avatars in status bar |
| `vite.config.ts` | Add dev proxy for `/api` and `/socket.io` |
| `package.json` | Add new dependencies and scripts |

## New Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `socket.io` | WebSocket server |
| `socket.io-client` | WebSocket client |
| `nanoid` | Short unique IDs for documents |
| `cors` | Cross-origin support for dev |
| `concurrently` | Run client + server together |
| `nodemon` | Auto-restart server on changes |
