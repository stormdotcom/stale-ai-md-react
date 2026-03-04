import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Palette } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { themes } from "../data/themes";

interface ThemeSelectorProps {
  /** Compact style for editor toolbar */
  compact?: boolean;
}

export default function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { themeId, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);

  const currentTheme = themes.find((t) => t.id === themeId);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label="Select theme"
          style={{
            display: "flex",
            alignItems: "center",
            gap: compact ? "6px" : "8px",
            padding: compact ? "6px 10px" : "8px 14px",
            fontSize: compact ? "11px" : "13px",
            fontFamily: "inherit",
            background: "var(--s2)",
            color: "var(--dim)",
            border: "1px solid var(--bd2)",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--s3)";
            e.currentTarget.style.color = "var(--text)";
            e.currentTarget.style.borderColor = "var(--bd)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--s2)";
            e.currentTarget.style.color = "var(--dim)";
            e.currentTarget.style.borderColor = "var(--bd2)";
          }}
        >
          <Palette size={compact ? 14 : 16} strokeWidth={2} />
          <span>{currentTheme?.name ?? "Theme"}</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          style={{
            minWidth: "180px",
            padding: "6px",
            background: "var(--s1)",
            border: "1px solid var(--bd)",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            zIndex: 100,
          }}
          sideOffset={6}
          align="end"
        >
          {themes.map((theme) => (
            <DropdownMenu.Item
              key={theme.id}
              onSelect={() => {
                setThemeId(theme.id);
                setOpen(false);
              }}
              style={{
                padding: "8px 12px",
                fontSize: "13px",
                color: theme.id === themeId ? "var(--acc)" : "var(--text)",
                background: "transparent",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                outline: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--s3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: theme.vars["--acc"] ?? "var(--acc)",
                  flexShrink: 0,
                }}
              />
              {theme.name}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
