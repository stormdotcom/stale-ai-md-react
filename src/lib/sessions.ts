const SESSIONS_KEY = "mdviewer.sessions";

export interface SavedSession {
  id: string;
  label: string;
  createdAt: number;
}

export function getSavedSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSession(id: string, label?: string): void {
  try {
    const sessions = getSavedSessions();
    const existing = sessions.find((s) => s.id === id);
    if (existing) {
      if (label) existing.label = label;
      existing.createdAt = Date.now();
    } else {
      sessions.unshift({
        id,
        label: label || `Session ${id.slice(0, 8)}`,
        createdAt: Date.now(),
      });
    }
    // Keep last 20 sessions
    const trimmed = sessions.slice(0, 20);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function removeSession(id: string): void {
  try {
    const sessions = getSavedSessions().filter((s) => s.id !== id);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}
