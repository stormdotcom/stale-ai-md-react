import {
  createContext,
  useContext,
  useLayoutEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  themes,
  defaultThemeId,
  THEME_STORAGE_KEY,
  type ThemeId,
} from "../data/themes";

interface ThemeContextValue {
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(themeId: ThemeId) {
  const theme = themes.find((t) => t.id === themeId);
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

function loadStoredTheme(): ThemeId {
  return themeIdFromStorage();
}

function themeIdFromStorage(): ThemeId {
  if (typeof window === "undefined") return defaultThemeId;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (!stored) return defaultThemeId;
  const valid = themes.some((t) => t.id === stored);
  return valid ? (stored as ThemeId) : defaultThemeId;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(loadStoredTheme);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    localStorage.setItem(THEME_STORAGE_KEY, id);
    applyTheme(id);
  }, []);

  useLayoutEffect(() => {
    applyTheme(themeId);
  }, [themeId]);

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
