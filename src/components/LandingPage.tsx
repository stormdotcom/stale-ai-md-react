import { useState } from "react";

const features = [
  {
    icon: "M13.5 4.5 21 12l-7.5 7.5M3 12h18",
    title: "Live Preview",
    desc: "See your markdown rendered instantly as you type with split-view editing.",
  },
  {
    icon: "M12 2a4 4 0 0 0-4 4c0 2 2 3 2 5h4c0-2 2-3 2-5a4 4 0 0 0-4-4ZM10 17h4M11 21h2",
    title: "AI-Powered Formatting",
    desc: "Improve, rewrite, shorten, expand, or fix grammar with a single click.",
  },
  {
    icon: "M21 12a9 9 0 1 1-9-9 7 7 0 0 1 7 7 3 3 0 0 1-3 3h-1",
    title: "Multiple AI Providers",
    desc: "Connect to Ollama (local), Google Gemini, or OpenAI. Your choice.",
  },
  {
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6",
    title: "Drag & Drop Files",
    desc: "Open any .md or .txt file by dragging it into the editor.",
  },
  {
    icon: "M4 6h16M4 12h16M4 18h10",
    title: "Rich Formatting Toolbar",
    desc: "Bold, italic, headings, lists, links, code blocks — all one click away.",
  },
  {
    icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
    title: "Export Anywhere",
    desc: "Download as markdown, HTML, or bundled ZIP with styles included.",
  },
];

const sddSteps = [
  {
    step: "01",
    title: "Write Your Spec",
    desc: "Draft API contracts, feature specs, or technical docs in markdown with live preview.",
    color: "#58a6ff",
  },
  {
    step: "02",
    title: "Let AI Refine It",
    desc: "Use AI to improve clarity, fix grammar, expand details, or shorten verbose sections.",
    color: "#3fb950",
  },
  {
    step: "03",
    title: "Review & Export",
    desc: "Preview the rendered output, iterate fast, then export as HTML or share the spec with your team.",
    color: "#d2a8ff",
  },
  {
    step: "04",
    title: "Build from Spec",
    desc: "Hand off polished specs to developers or AI coding tools. Clear specs mean fewer bugs and faster delivery.",
    color: "#d29922",
  },
];

function FeatureIcon({ path }: { path: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#58a6ff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

export default function LandingPage({ onLaunch }: { onLaunch: () => void }) {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <div
      style={{
        background: "#0d1117",
        color: "#c9d1d9",
        minHeight: "100vh",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid #21262d",
          position: "sticky",
          top: 0,
          background: "#0d1117ee",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="#0d1117" />
            <rect
              x="2"
              y="2"
              width="60"
              height="60"
              rx="12"
              stroke="#58a6ff"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M14 44V20l10 12 10-12v24"
              stroke="#c9d1d9"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M42 32l8-8v24"
              stroke="#c9d1d9"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="50" cy="18" r="8" fill="#1f6feb" />
            <path
              d="M47 18l2 2 4-4"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#f0f6fc" }}>
            Stale AI Markdown Studio
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <a
            href="#spec-driven"
            style={{ color: "#8b949e", textDecoration: "none", fontSize: "14px" }}
          >
            Spec Driven Dev
          </a>
          <a
            href="#features"
            style={{ color: "#8b949e", textDecoration: "none", fontSize: "14px" }}
          >
            Features
          </a>
          <button
            onClick={onLaunch}
            style={{
              background: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Open Editor
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 24px 60px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            gap: "8px",
            marginBottom: "24px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              display: "inline-block",
              background: "#1f6feb22",
              border: "1px solid #1f6feb44",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "13px",
              color: "#58a6ff",
            }}
          >
            Free & Open Source
          </span>
          <span
            style={{
              display: "inline-block",
              background: "#23863622",
              border: "1px solid #23863644",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "13px",
              color: "#3fb950",
            }}
          >
            Built for Spec Driven Development
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 60px)",
            fontWeight: 800,
            color: "#f0f6fc",
            lineHeight: 1.1,
            margin: "0 0 20px",
          }}
        >
          Write Markdown.
          <br />
          <span style={{ color: "#58a6ff" }}>Let AI Polish It.</span>
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#8b949e",
            lineHeight: 1.6,
            maxWidth: "640px",
            margin: "0 auto 36px",
          }}
        >
          Stale AI Markdown Studio is the editor built for modern{" "}
          <strong style={{ color: "#c9d1d9" }}>Spec Driven Development</strong>.
          Write specs, docs, and technical content with live preview — then let
          AI refine it using Ollama, Gemini, or OpenAI. Everything runs
          client-side. Your data never leaves your browser.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onLaunch}
            style={{
              background: "#238636",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M13.5 4.5 21 12l-7.5 7.5M3 12h18" />
            </svg>
            Launch Editor
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "#21262d",
              color: "#c9d1d9",
              border: "1px solid #30363d",
              borderRadius: "8px",
              padding: "14px 32px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
            </svg>
            GitHub
          </a>
        </div>
      </section>

      {/* Editor Preview */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto 80px",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          }}
        >
          {/* Mock title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 16px",
              borderBottom: "1px solid #21262d",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#f85149",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#d29922",
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "#3fb950",
              }}
            />
            <span
              style={{
                marginLeft: "auto",
                fontSize: "13px",
                color: "#484f58",
              }}
            >
              Stale AI Markdown Studio
            </span>
          </div>
          {/* Mock editor content */}
          <div style={{ display: "flex", minHeight: "320px" }}>
            <div
              style={{
                flex: 1,
                padding: "20px",
                fontFamily: "monospace",
                fontSize: "14px",
                lineHeight: 1.7,
                color: "#8b949e",
                borderRight: "1px solid #21262d",
              }}
            >
              <span style={{ color: "#58a6ff" }}># API Spec v2</span>
              <br />
              <br />
              <span style={{ color: "#58a6ff" }}>## POST /users</span>
              <br />
              <span>Create a new user account.</span>
              <br />
              <br />
              <span style={{ color: "#58a6ff" }}>### Request Body</span>
              <br />
              <span style={{ color: "#484f58" }}>{"```json"}</span>
              <br />
              <span>{'{ "name": "string" }'}</span>
              <br />
              <span style={{ color: "#484f58" }}>{"```"}</span>
              <br />
              <br />
              <span style={{ color: "#58a6ff" }}>### Response</span>
              <br />
              <span>- **201** — Created</span>
              <br />
              <span>- **400** — Validation error</span>
            </div>
            <div
              style={{
                flex: 1,
                padding: "20px",
                fontSize: "14px",
                lineHeight: 1.7,
              }}
            >
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#f0f6fc",
                  margin: "0 0 12px",
                  borderBottom: "1px solid #21262d",
                  paddingBottom: "8px",
                }}
              >
                API Spec v2
              </h1>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#f0f6fc",
                  margin: "0 0 4px",
                }}
              >
                POST /users
              </h2>
              <p style={{ margin: "0 0 12px" }}>Create a new user account.</p>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#f0f6fc",
                  margin: "0 0 8px",
                }}
              >
                Request Body
              </h3>
              <pre
                style={{
                  background: "#0d1117",
                  borderRadius: "6px",
                  padding: "12px",
                  fontSize: "13px",
                  margin: "0 0 12px",
                }}
              >
                <code>{'{ "name": "string" }'}</code>
              </pre>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#f0f6fc",
                  margin: "0 0 8px",
                }}
              >
                Response
              </h3>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                <li>
                  <strong style={{ color: "#3fb950" }}>201</strong> — Created
                </li>
                <li>
                  <strong style={{ color: "#f85149" }}>400</strong> — Validation
                  error
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Spec Driven Development */}
      <section
        id="spec-driven"
        style={{
          maxWidth: "1000px",
          margin: "0 auto 80px",
          padding: "0 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-block",
              background: "#d2992222",
              border: "1px solid #d2992244",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "13px",
              color: "#d29922",
              marginBottom: "16px",
            }}
          >
            Modern Workflow
          </div>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "#f0f6fc",
              marginBottom: "12px",
            }}
          >
            Built for Spec Driven Development
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "#8b949e",
              maxWidth: "640px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Stop coding before you think. Modern teams write specs first — API
            contracts, feature requirements, architecture docs — then build from
            a clear blueprint. Stale AI Markdown Studio is designed for this
            workflow.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          {sddSteps.map((s) => (
            <div
              key={s.step}
              style={{
                background: "#161b22",
                border: "1px solid #21262d",
                borderRadius: "12px",
                padding: "24px",
                position: "relative",
              }}
            >
              <div
                style={{
                  fontSize: "40px",
                  fontWeight: 800,
                  color: s.color,
                  opacity: 0.15,
                  position: "absolute",
                  top: "12px",
                  right: "16px",
                  lineHeight: 1,
                }}
              >
                {s.step}
              </div>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: s.color,
                  marginBottom: "16px",
                }}
              />
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#f0f6fc",
                  margin: "0 0 8px",
                }}
              >
                {s.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#8b949e",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Why SDD matters */}
        <div
          style={{
            marginTop: "32px",
            background: "#161b22",
            border: "1px solid #21262d",
            borderRadius: "12px",
            padding: "28px 32px",
            display: "flex",
            gap: "32px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { val: "40%", label: "Fewer bugs with clear specs" },
            { val: "2x", label: "Faster dev with AI-polished docs" },
            { val: "0", label: "Data sent to servers" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{ textAlign: "center", minWidth: "160px" }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#58a6ff",
                }}
              >
                {stat.val}
              </div>
              <div style={{ fontSize: "13px", color: "#484f58" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{
          maxWidth: "1000px",
          margin: "0 auto 80px",
          padding: "0 24px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "32px",
            fontWeight: 700,
            color: "#f0f6fc",
            marginBottom: "48px",
          }}
        >
          Everything you need to write better
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                background: hoveredFeature === i ? "#161b22" : "#0d1117",
                border: `1px solid ${hoveredFeature === i ? "#58a6ff44" : "#21262d"}`,
                borderRadius: "12px",
                padding: "24px",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  background: "#1f6feb18",
                  width: "48px",
                  height: "48px",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <FeatureIcon path={f.icon} />
              </div>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#f0f6fc",
                  margin: "0 0 8px",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#8b949e",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Providers */}
      <section
        style={{
          maxWidth: "800px",
          margin: "0 auto 80px",
          padding: "0 24px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#f0f6fc",
            marginBottom: "12px",
          }}
        >
          Works with your favorite AI
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "#8b949e",
            marginBottom: "36px",
          }}
        >
          Choose your provider. Your API keys stay in your browser.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          {[
            { name: "Ollama", sub: "Local & Private", color: "#3fb950" },
            { name: "Gemini", sub: "Google AI", color: "#58a6ff" },
            { name: "OpenAI", sub: "GPT Models", color: "#d2a8ff" },
          ].map((p) => (
            <div
              key={p.name}
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "12px",
                padding: "24px 40px",
                minWidth: "180px",
              }}
            >
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: p.color,
                  marginBottom: "4px",
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: "13px", color: "#484f58" }}>{p.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SSR & Performance Note */}
      <section
        style={{
          maxWidth: "800px",
          margin: "0 auto 80px",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            background: "#161b22",
            border: "1px solid #21262d",
            borderRadius: "12px",
            padding: "32px",
            display: "flex",
            gap: "20px",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: "#1f6feb18",
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#58a6ff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 600,
                color: "#f0f6fc",
                margin: "0 0 8px",
              }}
            >
              SEO-Ready & Performance-First
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "#8b949e",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              This landing page ships with full Open Graph tags, Twitter Cards,
              structured JSON-LD data, and a{" "}
              <code
                style={{
                  background: "#21262d",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
              >
                &lt;noscript&gt;
              </code>{" "}
              fallback for search engine crawlers. For full server-side rendering
              (SSR), consider migrating to Next.js or Remix — the component
              architecture is already compatible. Currently deployed as a static
              SPA on Vercel with pre-rendered meta tags for optimal SEO.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "60px 24px 80px",
          borderTop: "1px solid #21262d",
        }}
      >
        <h2
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "#f0f6fc",
            marginBottom: "16px",
          }}
        >
          Start writing specs now
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "#8b949e",
            marginBottom: "28px",
          }}
        >
          No sign-up. No server. Everything runs in your browser.
        </p>
        <button
          onClick={onLaunch}
          style={{
            background: "#238636",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "14px 40px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Launch Stale AI Markdown Studio
        </button>
        <p
          style={{
            fontSize: "13px",
            color: "#484f58",
            marginTop: "16px",
          }}
        >
          Live at{" "}
          <a
            href="https://stale-ai.vercel.app"
            style={{ color: "#58a6ff", textDecoration: "none" }}
          >
            stale-ai.vercel.app
          </a>
        </p>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #21262d",
          padding: "24px",
          textAlign: "center",
          fontSize: "13px",
          color: "#484f58",
        }}
      >
        <div>
          Built with React & Vite. Stale AI Markdown Studio is free and
          open-source.
        </div>
        <div style={{ marginTop: "8px" }}>
          <a
            href="https://stale-ai.vercel.app"
            style={{ color: "#484f58", textDecoration: "none" }}
          >
            stale-ai.vercel.app
          </a>
        </div>
      </footer>
    </div>
  );
}
