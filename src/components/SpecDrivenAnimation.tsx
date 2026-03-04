import { useState, useEffect, useCallback } from "react";

type Phase =
  | "files"
  | "multi-user"
  | "merge"
  | "code-gen"
  | "final-output";

const PHASE_DURATION_MS = 4200;

const phases: Phase[] = ["files", "multi-user", "merge", "code-gen", "final-output"];

const phaseLabels: Record<Phase, string> = {
  files: "Project files",
  "multi-user": "2-user editing",
  merge: "Merged output",
  "code-gen": "AI code gen",
  "final-output": "Ship it",
};

const phaseIcons: Record<Phase, string> = {
  files: "📁",
  "multi-user": "👥",
  merge: "📄",
  "code-gen": "🤖",
  "final-output": "🚀",
};

/* ── file tree data ─────────────────────────────────────────────────────── */
const projectFiles = [
  { name: "api-spec.md", icon: "📝", color: "#58a6ff" },
  { name: "schema.md", icon: "📐", color: "#bc8cff" },
  { name: "auth-flow.md", icon: "🔐", color: "#ffa657" },
  { name: "database.md", icon: "🗄️", color: "#3fb950" },
  { name: "deploy.md", icon: "☁️", color: "#39d0ba" },
];

/* ── user cursors ───────────────────────────────────────────────────────── */
const users = [
  { name: "Alice", color: "#58a6ff", initials: "A" },
  { name: "Bob", color: "#3fb950", initials: "B" },
];

/* ── typing content ─────────────────────────────────────────────────────── */
const aliceLines = [
  "## POST /users",
  "Create a new user.",
  "",
  "### Request",
  '```json',
  '{ "name": "string" }',
  '```',
];

const bobLines = [
  "### Response",
  "- **201** Created",
  "- **400** Validation",
  "",
  "### Auth",
  "Bearer token required",
];

const generatedCode = [
  "// AI-generated from api-spec.md",
  "import { Router } from 'express';",
  "import { auth } from './middleware';",
  "",
  "const router = Router();",
  "",
  "router.post('/users', auth, async (req, res) => {",
  "  const { name } = req.body;",
  "  if (!name) return res.status(400)",
  "    .json({ error: 'Name required' });",
  "  const user = await db.users.create({ name });",
  "  return res.status(201).json(user);",
  "});",
];

/* ── hooks ──────────────────────────────────────────────────────────────── */
function usePhase() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % phases.length), PHASE_DURATION_MS);
    return () => clearInterval(id);
  }, []);
  return { phase: phases[idx], idx };
}

function useTyping(lines: string[], active: boolean, speed = 70) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) { setCount(0); return; }
    setCount(0);
    let i = 0;
    const id = setInterval(() => { i++; setCount(i); if (i >= lines.length) clearInterval(id); }, speed);
    return () => clearInterval(id);
  }, [active, lines.length, speed]);
  return lines.slice(0, count);
}

/* ── sub-components ─────────────────────────────────────────────────────── */

function Card3D({ children, rotate, translate, scale = 1, opacity = 1, delay = 0, z = 0 }: {
  children: React.ReactNode;
  rotate?: string;
  translate?: string;
  scale?: number;
  opacity?: number;
  delay?: number;
  z?: number;
}) {
  return (
    <div style={{
      transform: `${translate || ""} ${rotate || ""} translateZ(${z}px) scale(${scale})`.trim(),
      opacity,
      transition: `all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s`,
      transformStyle: "preserve-3d" as const,
      position: "absolute",
      inset: 0,
    }}>
      {children}
    </div>
  );
}

function FileTree({ active }: { active: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 2, padding: "20px 24px",
      height: "100%", justifyContent: "center",
    }}>
      <div style={{
        fontSize: 11, color: "#6e7681", textTransform: "uppercase", letterSpacing: 1.5,
        fontWeight: 600, marginBottom: 8,
      }}>
        Project Files
      </div>
      {projectFiles.map((f, i) => (
        <div key={f.name} style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "8px 12px", borderRadius: 8,
          background: active && i === 0 ? "#1c2128" : "transparent",
          border: `1px solid ${active && i === 0 ? "#30363d" : "transparent"}`,
          transform: active ? "translateX(0)" : `translateX(-${30 + i * 8}px)`,
          opacity: active ? 1 : 0,
          transition: `all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${i * 0.08}s`,
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{f.icon}</span>
          <span style={{ fontSize: 13, color: f.color, fontFamily: "monospace" }}>{f.name}</span>
          <span style={{
            marginLeft: "auto", fontSize: 10, color: "#484f58",
            background: "#21262d", padding: "2px 6px", borderRadius: 4,
          }}>
            .md
          </span>
        </div>
      ))}
    </div>
  );
}

function DualEditor({ active }: { active: boolean }) {
  const aliceVisible = useTyping(aliceLines, active, 90);
  const bobVisible = useTyping(bobLines, active, 110);

  return (
    <div style={{ display: "flex", height: "100%", position: "relative" }}>
      {/* Alice's side */}
      <div style={{
        flex: 1, padding: "12px 16px", borderRight: "1px solid #21262d",
        fontFamily: "monospace", fontSize: 12, lineHeight: 1.7,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
          padding: "4px 8px", background: "#58a6ff18", borderRadius: 6,
          border: "1px solid #58a6ff33",
        }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: users[0].color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>A</div>
          <span style={{ fontSize: 11, color: users[0].color }}>{users[0].name}</span>
          <span style={{ fontSize: 10, color: "#484f58", marginLeft: "auto" }}>editing</span>
        </div>
        {aliceVisible.map((line, i) => (
          <div key={i} style={{ color: line.startsWith("#") ? "#58a6ff" : line.startsWith("`") ? "#484f58" : line.startsWith("-") ? "#3fb950" : "#8b949e", minHeight: 20 }}>
            {line || "\u00A0"}
          </div>
        ))}
        {active && aliceVisible.length < aliceLines.length && <Cursor color={users[0].color} />}
      </div>

      {/* Bob's side */}
      <div style={{
        flex: 1, padding: "12px 16px",
        fontFamily: "monospace", fontSize: 12, lineHeight: 1.7,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
          padding: "4px 8px", background: "#3fb95018", borderRadius: 6,
          border: "1px solid #3fb95033",
        }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: users[1].color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>B</div>
          <span style={{ fontSize: 11, color: users[1].color }}>{users[1].name}</span>
          <span style={{ fontSize: 10, color: "#484f58", marginLeft: "auto" }}>editing</span>
        </div>
        {bobVisible.map((line, i) => (
          <div key={i} style={{ color: line.startsWith("#") ? "#58a6ff" : line.startsWith("-") ? "#3fb950" : "#8b949e", minHeight: 20 }}>
            {line || "\u00A0"}
          </div>
        ))}
        {active && bobVisible.length < bobLines.length && <Cursor color={users[1].color} />}
      </div>

      {/* Live sync indicator */}
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: 32, height: 32, borderRadius: "50%", background: "#161b22",
        border: "2px solid #30363d", display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 2, fontSize: 14,
      }}>
        ⚡
      </div>
    </div>
  );
}

function MergedFile({ active }: { active: boolean }) {
  const merged = [...aliceLines, "", ...bobLines];
  return (
    <div style={{ display: "flex", height: "100%" }}>
      {/* Gutter */}
      <div style={{
        width: 36, padding: "16px 0", textAlign: "right", borderRight: "1px solid #21262d",
        fontSize: 11, color: "#484f58", fontFamily: "monospace", lineHeight: 1.7,
        flexShrink: 0,
      }}>
        {merged.map((_, i) => (
          <div key={i} style={{ paddingRight: 8 }}>{i + 1}</div>
        ))}
      </div>
      {/* Content */}
      <div style={{
        flex: 1, padding: "16px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7,
        overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 12,
          padding: "4px 10px", borderRadius: 6, background: "#0d1117",
          border: "1px solid #21262d",
        }}>
          <span style={{ fontSize: 13 }}>📄</span>
          <span style={{ fontSize: 12, color: "#f0f6fc", fontWeight: 500 }}>api-spec.md</span>
          <span style={{ fontSize: 10, color: "#3fb950", marginLeft: "auto" }}>merged</span>
          <div style={{ display: "flex", gap: 2 }}>
            {users.map(u => (
              <div key={u.name} style={{ width: 14, height: 14, borderRadius: "50%", background: u.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 700, color: "#fff" }}>
                {u.initials}
              </div>
            ))}
          </div>
        </div>
        {merged.map((line, i) => (
          <div key={i} style={{
            color: line.startsWith("#") ? "#58a6ff" : line.startsWith("`") ? "#484f58" : line.startsWith("-") ? "#3fb950" : "#8b949e",
            minHeight: 20,
            opacity: active ? 1 : 0,
            transform: active ? "translateY(0)" : "translateY(6px)",
            transition: `all 0.3s ease ${i * 0.03}s`,
          }}>
            {line || "\u00A0"}
          </div>
        ))}
      </div>
    </div>
  );
}

function CodeGen({ active }: { active: boolean }) {
  const visible = useTyping(generatedCode, active, 80);
  return (
    <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
      {/* AI header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
            borderBottom: "1px solid var(--bd2)", background: "#bc8cff0a",
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: "linear-gradient(135deg, #bc8cff, #58a6ff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12,
        }}>
          ✦
        </div>
        <span style={{ fontSize: 12, color: "#bc8cff", fontWeight: 500 }}>AI generating from api-spec.md</span>
        {active && visible.length < generatedCode.length && (
          <div style={{
            marginLeft: "auto", display: "flex", gap: 3,
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 4, height: 4, borderRadius: "50%", background: "#bc8cff",
                animation: `pulse-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        )}
        {active && visible.length >= generatedCode.length && (
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#3fb950" }}>done</span>
        )}
      </div>
      {/* Code */}
      <div style={{
        flex: 1, padding: "14px 16px", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7,
        overflow: "hidden",
      }}>
        {visible.map((line, i) => (
          <div key={i} style={{
            color: line.startsWith("//") ? "#6e7681"
              : line.includes("import") || line.includes("export") || line.includes("const") ? "#ff7b72"
              : line.includes("async") || line.includes("await") ? "#d2a8ff"
              : line.includes("'") ? "#a5d6ff"
              : line.includes("=>") || line.includes("return") ? "#ff7b72"
              : "#c9d1d9",
            minHeight: 20,
          }}>
            {line || "\u00A0"}
          </div>
        ))}
        {active && visible.length < generatedCode.length && <Cursor color="#bc8cff" />}
      </div>
    </div>
  );
}

function FinalOutput({ active }: { active: boolean }) {
  return (
    <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, height: "100%", justifyContent: "center" }}>
      {/* Project card */}
      <div style={{
        background: "#0d1117", border: "1px solid #21262d", borderRadius: 10, padding: 16,
        opacity: active ? 1 : 0, transform: active ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
        transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: "linear-gradient(135deg, #58a6ff, #3fb950)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>
            📦
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#f0f6fc", fontWeight: 600 }}>my-api-project</div>
            <div style={{ fontSize: 10, color: "#484f58" }}>Generated from 5 spec files</div>
          </div>
          <span style={{
            marginLeft: "auto", fontSize: 10, fontWeight: 600, color: "#3fb950",
            background: "#3fb95018", padding: "3px 8px", borderRadius: 20,
            border: "1px solid #3fb95033",
          }}>
            Ready
          </span>
        </div>
        {/* Output files */}
        {[
          { name: "src/routes/users.ts", size: "1.2kb", icon: "⚡" },
          { name: "src/middleware/auth.ts", size: "0.8kb", icon: "🔐" },
          { name: "src/db/schema.ts", size: "2.1kb", icon: "📐" },
        ].map((f, i) => (
          <div key={f.name} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "5px 0",
            borderTop: i === 0 ? "1px solid #21262d" : "none",
            paddingTop: i === 0 ? 10 : 5,
            opacity: active ? 1 : 0,
            transition: `opacity 0.4s ease ${0.3 + i * 0.12}s`,
          }}>
            <span>{f.icon}</span>
            <span style={{ fontSize: 12, color: "#8b949e", fontFamily: "monospace" }}>{f.name}</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: "#484f58" }}>{f.size}</span>
          </div>
        ))}
      </div>

      {/* API test result */}
      <div style={{
        background: "#0d1117", border: "1px solid #21262d", borderRadius: 10, padding: 14,
        fontFamily: "monospace", fontSize: 12,
        opacity: active ? 1 : 0, transform: active ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.25s",
      }}>
        <div style={{ fontSize: 10, color: "#3fb950", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14 }}>✓</span> POST /users — 201 Created
        </div>
        <pre style={{ margin: 0, color: "#8b949e", lineHeight: 1.6 }}>
          <code>{'{ "id": "usr_a1b2", "name": "Jane" }'}</code>
        </pre>
      </div>
    </div>
  );
}

function Cursor({ color }: { color: string }) {
  return (
    <span style={{
      display: "inline-block", width: 2, height: 15,
      background: color, verticalAlign: "text-bottom",
      animation: "sda-blink 1s step-end infinite",
    }} />
  );
}

/* ── main component ─────────────────────────────────────────────────────── */

export default function SpecDrivenAnimation() {
  const { phase, idx } = usePhase();
  const [hovered, setHovered] = useState(false);

  const rotateY = useCallback((p: Phase) => {
    switch (p) {
      case "files": return -8;
      case "multi-user": return 4;
      case "merge": return 0;
      case "code-gen": return -4;
      case "final-output": return 6;
    }
  }, []);

  const rotateX = useCallback((p: Phase) => {
    switch (p) {
      case "files": return 4;
      case "multi-user": return -2;
      case "merge": return 0;
      case "code-gen": return 3;
      case "final-output": return -3;
    }
  }, []);

  return (
    <section
      className="landing-sda"
      style={{
        maxWidth: "960px",
        margin: "0 auto 80px",
        padding: "0 16px",
      }}
    >
      <style>{`
        @keyframes sda-blink { 50% { opacity: 0; } }
        @keyframes pulse-dot { 0%,100% { opacity: .3; transform: scale(.8); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes sda-glow { 0%,100% { box-shadow: 0 0 20px rgba(88,166,255,0.08); } 50% { box-shadow: 0 0 40px rgba(88,166,255,0.15); } }
        @media (max-width: 640px) {
          .sda-scene { perspective: 600px !important; }
          .sda-shell, .sda-shell-inner { min-height: 340px !important; }
          .sda-content { min-height: 300px !important; }
        }
        .landing-sda { max-width: 960px !important; }
        @media (min-width: 1440px) {
          .landing-sda { max-width: 1120px !important; padding: 0 24px !important; }
          .sda-scene { perspective: 1100px !important; }
          .sda-shell, .sda-shell-inner { min-height: 440px !important; }
          .sda-content { min-height: 400px !important; }
          .sda-pills button { font-size: 12px !important; padding: 7px 14px !important; }
        }
        @media (min-width: 1920px) {
          .landing-sda { max-width: 1280px !important; padding: 0 32px !important; }
          .sda-scene { perspective: 1300px !important; }
          .sda-shell, .sda-shell-inner { min-height: 500px !important; }
          .sda-content { min-height: 460px !important; }
          .sda-pills button { font-size: 13px !important; padding: 8px 16px !important; }
          .sda-progress { max-width: 500px !important; }
        }
        @media (min-width: 2560px) {
          .landing-sda { max-width: 1500px !important; padding: 0 40px !important; }
          .sda-scene { perspective: 1500px !important; }
          .sda-shell, .sda-shell-inner { min-height: 580px !important; }
          .sda-content { min-height: 540px !important; }
          .sda-pills button { font-size: 14px !important; padding: 9px 18px !important; }
          .sda-progress { max-width: 600px !important; }
        }
      `}</style>

      {/* Phase pills */}
      <div className="sda-pills" style={{
        display: "flex", justifyContent: "center", gap: 4, marginBottom: 20,
        flexWrap: "wrap",
      }}>
        {phases.map((p, i) => (
          <button key={p} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 500,
            background: idx === i ? "color-mix(in srgb, var(--acc) 15%, transparent)" : "var(--s1)",
            color: idx === i ? "var(--acc)" : "var(--muted)",
            border: `1px solid ${idx === i ? "color-mix(in srgb, var(--acc) 30%, transparent)" : "var(--bd2)"}`,
            cursor: "default",
            transition: "all 0.4s ease",
            display: "flex", alignItems: "center", gap: 5,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <span style={{ fontSize: 13 }}>{phaseIcons[p]}</span>
            {phaseLabels[p]}
          </button>
        ))}
      </div>

      {/* 3D scene */}
      <div
        className="sda-scene"
        style={{
          perspective: 900,
          perspectiveOrigin: "50% 45%",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="sda-shell" style={{
          transformStyle: "preserve-3d",
          transform: `rotateY(${hovered ? 0 : rotateY(phase)}deg) rotateX(${hovered ? 0 : rotateX(phase)}deg)`,
          transition: "transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          position: "relative",
          minHeight: 380,
        }}>
          {/* Outer shell */}
          <div className="sda-shell-inner" style={{
            background: "var(--s1)",
            border: "1px solid var(--bd)",
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(88,166,255,0.05)",
            animation: "sda-glow 6s ease-in-out infinite",
            minHeight: 380,
            transformStyle: "preserve-3d",
          }}>
            {/* Title bar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "11px 16px", borderBottom: "1px solid #21262d",
              background: "#0d1117",
            }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#f85149" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#d29922" }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#3fb950" }} />
              </div>
              <span style={{
                marginLeft: 10, fontSize: 12, color: "#6e7681",
                fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {phase === "files" && "my-api-project/"}
                {phase === "multi-user" && "api-spec.md — 2 editors"}
                {phase === "merge" && "api-spec.md — merged"}
                {phase === "code-gen" && "AI → src/routes/users.ts"}
                {phase === "final-output" && "Build complete"}
              </span>
              {/* Peer dots in title bar */}
              {(phase === "multi-user" || phase === "merge") && (
                <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
                  {users.map(u => (
                    <div key={u.name} style={{
                      width: 16, height: 16, borderRadius: "50%", background: u.color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 8, fontWeight: 700, color: "#fff",
                    }}>
                      {u.initials}
                    </div>
                  ))}
                </div>
              )}
              {phase === "code-gen" && (
                <div style={{
                  marginLeft: "auto", fontSize: 10, color: "#bc8cff",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <span>✦</span> AI
                </div>
              )}
              {phase === "final-output" && (
                <span style={{
                  marginLeft: "auto", fontSize: 10, color: "#3fb950", fontWeight: 600,
                }}>
                  ✓ Ready
                </span>
              )}
            </div>

            {/* Content — stacked cards in 3D with opacity transitions */}
            <div className="sda-content" style={{ position: "relative", minHeight: 340, transformStyle: "preserve-3d" }}>
              <Card3D
                opacity={phase === "files" ? 1 : 0}
                z={phase === "files" ? 0 : -60}
                scale={phase === "files" ? 1 : 0.92}
              >
                <FileTree active={phase === "files"} />
              </Card3D>

              <Card3D
                opacity={phase === "multi-user" ? 1 : 0}
                z={phase === "multi-user" ? 0 : -60}
                scale={phase === "multi-user" ? 1 : 0.92}
              >
                <DualEditor active={phase === "multi-user"} />
              </Card3D>

              <Card3D
                opacity={phase === "merge" ? 1 : 0}
                z={phase === "merge" ? 0 : -60}
                scale={phase === "merge" ? 1 : 0.92}
              >
                <MergedFile active={phase === "merge"} />
              </Card3D>

              <Card3D
                opacity={phase === "code-gen" ? 1 : 0}
                z={phase === "code-gen" ? 0 : -60}
                scale={phase === "code-gen" ? 1 : 0.92}
              >
                <CodeGen active={phase === "code-gen"} />
              </Card3D>

              <Card3D
                opacity={phase === "final-output" ? 1 : 0}
                z={phase === "final-output" ? 0 : -60}
                scale={phase === "final-output" ? 1 : 0.92}
              >
                <FinalOutput active={phase === "final-output"} />
              </Card3D>
            </div>
          </div>

          {/* 3D shadow plane */}
          <div style={{
            position: "absolute",
            bottom: -18, left: "8%", right: "8%", height: 20,
            background: "radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, transparent 70%)",
            transform: "rotateX(80deg)",
            transformOrigin: "top",
            pointerEvents: "none",
          }} />
        </div>
      </div>

      {/* Progress bar */}
      <div className="sda-progress" style={{
        margin: "18px auto 0", maxWidth: 400, height: 3,
        background: "#21262d", borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", borderRadius: 2,
          background: "linear-gradient(90deg, #58a6ff, #bc8cff)",
          width: `${((idx + 1) / phases.length) * 100}%`,
          transition: "width 0.5s ease",
        }} />
      </div>
    </section>
  );
}
