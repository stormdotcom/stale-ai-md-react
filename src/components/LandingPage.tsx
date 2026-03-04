import { useState } from "react";
import { Server, Sparkles, Bot } from "lucide-react";
import SpecDrivenAnimation from "./SpecDrivenAnimation";
import ThemeSelector from "./ThemeSelector";

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

const faqs = [
  {
    q: "Do my API keys or documents ever leave my machine?",
    a: "No. SlateAI Markdown Studio runs entirely in your browser. Provider settings are stored in localStorage and requests go directly from your browser to Ollama, Gemini, or OpenAI. There is no custom backend in this app.",
  },
  {
    q: "Can I use Ollama completely offline?",
    a: "Yes. As long as your Ollama server is running on your machine and reachable at the configured base URL, the editor can format your markdown with no external network calls.",
  },
  {
    q: "Where are my markdown files saved?",
    a: "Files you create in the left sidebar are stored in localStorage as a small virtual file tree. You can also drag in existing .md files and export them as .md, .html, or a ZIP bundle at any time.",
  },
  {
    q: "How does session sharing work?",
    a: "Click \"Start session\" in the toolbar to begin a real-time collaboration session. Copy the link and share it with others — they can join and edit the same document with you. No backend server is required; it uses WebRTC for peer-to-peer sync.",
  },
  {
    q: "Is it mobile and tablet friendly?",
    a: "Yes. The editor adapts to smaller screens: the sidebar and AI panel become overlays, the layout stacks vertically, and touch-friendly controls are available. You can write and preview markdown on phones and tablets.",
  },
];

function FeatureIcon({ path }: { path: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--acc)"
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
      className="landing-page"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        minHeight: "100vh",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      <style>{`
        .landing-page .nav-brand-text { display: none; }
        @media (min-width: 480px) { .landing-page .nav-brand-text { display: inline; } .landing-page .nav-brand-short { display: none; } }
        .nav-features-link { display: none; }
        @media (min-width: 400px) { .nav-features-link { display: inline; } }
        .landing-nav { padding: 12px 16px !important; }
        @media (min-width: 640px) { .landing-nav { padding: 16px 24px !important; } }
        @media (min-width: 1024px) { .landing-nav { padding: 16px 32px !important; } }
        .landing-hero { padding: 48px 16px 40px !important; }
        @media (min-width: 640px) { .landing-hero { padding: 64px 24px 50px !important; } }
        @media (min-width: 1024px) { .landing-hero { padding: 80px 24px 60px !important; } }
        .landing-hero-desc { font-size: 16px !important; }
        @media (min-width: 640px) { .landing-hero-desc { font-size: 18px !important; } }
        .landing-section { padding: 0 16px !important; }
        @media (min-width: 640px) { .landing-section { padding: 0 24px !important; } }
        .landing-page { overflow-x: hidden; }
        .landing-section h2 { font-size: 24px !important; }
        @media (min-width: 640px) { .landing-section h2 { font-size: 28px !important; } }
        @media (min-width: 1024px) { .landing-section h2 { font-size: 32px !important; } }
        .landing-stats-item { min-width: 120px !important; }
        @media (min-width: 480px) { .landing-stats-item { min-width: 160px !important; } }
        .landing-sdd-title { font-size: 24px !important; }
        @media (min-width: 640px) { .landing-sdd-title { font-size: 28px !important; } }
        @media (min-width: 1024px) { .landing-sdd-title { font-size: 32px !important; } }
        .landing-cta { padding: 40px 16px 60px !important; }
        @media (min-width: 640px) { .landing-cta { padding: 60px 24px 80px !important; } }
        .landing-footer { padding: 20px 16px !important; font-size: 12px !important; }
        @media (min-width: 640px) { .landing-footer { padding: 24px !important; font-size: 13px !important; } }
        .landing-hero { max-width: 800px !important; }
        @media (min-width: 1440px) { .landing-hero { max-width: 960px !important; padding: 96px 32px 80px !important; } }
        @media (min-width: 1920px) { .landing-hero { max-width: 1100px !important; padding: 120px 48px 100px !important; } }
        .landing-section { max-width: 1000px !important; }
        @media (min-width: 1440px) { .landing-section { max-width: 1200px !important; padding: 0 48px !important; } }
        @media (min-width: 1920px) { .landing-section { max-width: 1400px !important; padding: 0 64px !important; } }
        .landing-spec-driven { max-width: 1000px !important; }
        @media (min-width: 1440px) { .landing-spec-driven { max-width: 1200px !important; } }
        @media (min-width: 1920px) { .landing-spec-driven { max-width: 1400px !important; } }
        .landing-features { max-width: 1000px !important; }
        @media (min-width: 1440px) { .landing-features { max-width: 1200px !important; } }
        @media (min-width: 1920px) { .landing-features { max-width: 1400px !important; } }
        .landing-ai-providers { max-width: 800px !important; }
        @media (min-width: 1440px) { .landing-ai-providers { max-width: 1000px !important; } }
        .landing-faq { max-width: 900px !important; }
        @media (min-width: 1440px) { .landing-faq { max-width: 1100px !important; } }
      `}</style>
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--bd2)",
          position: "sticky",
          top: 0,
          background: "color-mix(in srgb, var(--bg) 93%, transparent)",
          backdropFilter: "blur(12px)",
          zIndex: 50,
        }}
        className="landing-nav"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
            <rect width="64" height="64" rx="14" fill="var(--bg)" />
            <rect
              x="2"
              y="2"
              width="60"
              height="60"
              rx="12"
              stroke="var(--acc)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M14 44V20l10 12 10-12v24"
              stroke="var(--text)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M42 32l8-8v24"
              stroke="var(--text)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="50" cy="18" r="8" fill="var(--acc)" />
            <path
              d="M47 18l2 2 4-4"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="nav-brand-short" style={{ fontSize: "16px", fontWeight: 700, color: "var(--bright)" }}>
            MD Studio
          </span>
          <span className="nav-brand-text" style={{ fontSize: "18px", fontWeight: 700, color: "var(--bright)" }}>
            Stale AI Markdown Studio
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <ThemeSelector />
          <a
            href="#features"
            className="nav-features-link"
            style={{ color: "var(--dim)", textDecoration: "none", fontSize: "14px" }}
          >
            Features
          </a>
          <button
            onClick={onLaunch}
            style={{
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 18px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: "44px",
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
          padding: "48px 16px 40px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
        className="landing-hero"
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
              background: "color-mix(in srgb, var(--acc) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--acc) 30%, transparent)",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "13px",
              color: "var(--acc)",
            }}
          >
            Free & Open Source
          </span>
          <span
            style={{
              display: "inline-block",
              background: "color-mix(in srgb, var(--green) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--green) 30%, transparent)",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "13px",
              color: "var(--green)",
            }}
          >
            Built for Spec Driven Development
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(36px, 6vw, 60px)",
            fontWeight: 800,
            color: "var(--bright)",
            lineHeight: 1.1,
            margin: "0 0 20px",
          }}
        >
          Write Markdown.
          <br />
          <span style={{ color: "var(--acc)" }}>Let AI Polish It.</span>
        </h1>
        <p
          style={{
            fontSize: "16px",
            color: "var(--dim)",
            lineHeight: 1.6,
            maxWidth: "640px",
            margin: "0 auto 28px",
          }}
          className="landing-hero-desc"
        >
          Stale AI Markdown Studio is the editor built for modern{" "}
          <strong style={{ color: "var(--text)" }}>Spec Driven Development</strong>.
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
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "14px 24px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minHeight: "48px",
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
            href="https://github.com/stormdotcom/stale-ai-md-react"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: "var(--s2)",
              color: "var(--text)",
              border: "1px solid var(--bd)",
              borderRadius: "8px",
              padding: "14px 24px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minHeight: "48px",
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

      {/* Spec Driven Development Animation */}
      <SpecDrivenAnimation />

      {/* Spec Driven Development */}
      <section
        id="spec-driven"
        className="landing-section landing-spec-driven"
        style={{
          maxWidth: "1000px",
          margin: "0 auto 80px",
          padding: "0 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              display: "inline-block",
              background: "color-mix(in srgb, var(--orange) 15%, transparent)",
              border: "1px solid color-mix(in srgb, var(--orange) 30%, transparent)",
              borderRadius: "20px",
              padding: "4px 14px",
              fontSize: "13px",
              color: "var(--orange)",
              marginBottom: "16px",
            }}
          >
            Modern Workflow
          </div>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 700,
              color: "var(--bright)",
              marginBottom: "12px",
            }}
            className="landing-sdd-title"
          >
            Built for Spec Driven Development
          </h2>
          <p
            style={{
              fontSize: "16px",
              color: "var(--dim)",
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
              background: "var(--s1)",
              border: "1px solid var(--bd2)",
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
            background: "var(--s1)",
            border: "1px solid var(--bd2)",
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
              className="landing-stats-item"
              style={{ textAlign: "center", minWidth: "160px" }}
            >
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "var(--acc)",
                }}
              >
                {stat.val}
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="landing-section landing-features"
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
            color: "var(--bright)",
            marginBottom: "32px",
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
                background: hoveredFeature === i ? "var(--s1)" : "var(--bg)",
                border: `1px solid ${hoveredFeature === i ? "color-mix(in srgb, var(--acc) 30%, transparent)" : "var(--bd2)"}`,
                borderRadius: "12px",
                padding: "24px",
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  background: "color-mix(in srgb, var(--acc) 10%, transparent)",
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
                  color: "var(--bright)",
                  margin: "0 0 8px",
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--dim)",
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
        className="landing-section landing-ai-providers"
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
            color: "var(--bright)",
            marginBottom: "12px",
          }}
        >
          Works with your favorite AI
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "var(--dim)",
            marginBottom: "36px",
          }}
        >
          Choose your provider. Your API keys stay in your browser.
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {[
            { name: "Ollama", sub: "Local & Private", color: "#3fb950", Icon: Server },
            { name: "Gemini", sub: "Google AI", color: "#58a6ff", Icon: Sparkles },
            { name: "OpenAI", sub: "GPT Models", color: "#d2a8ff", Icon: Bot },
          ].map((p) => (
            <div
              key={p.name}
            style={{
              background: "var(--s1)",
              border: "1px solid var(--bd)",
                borderRadius: "12px",
                padding: "20px 24px",
                minWidth: "140px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "12px",
                  background: `${p.color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p.Icon size={24} color={p.color} strokeWidth={2} />
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: p.color,
                  marginBottom: "0",
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: "13px", color: "var(--muted)" }}>{p.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="landing-section landing-faq"
        style={{
          maxWidth: "900px",
          margin: "0 auto 80px",
          padding: "0 24px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--bright)",
            marginBottom: "24px",
          }}
        >
          Frequently asked questions
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {faqs.map((item) => (
            <div
              key={item.q}
            style={{
              background: "var(--s1)",
              border: "1px solid var(--bd2)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--bright)",
                  margin: "0 0 8px",
                }}
              >
                {item.q}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--dim)",
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "40px 16px 60px",
          borderTop: "1px solid var(--bd2)",
        }}
        className="landing-cta"
      >
        <h2
          style={{
            fontSize: "32px",
            fontWeight: 700,
            color: "var(--bright)",
            marginBottom: "16px",
          }}
        >
          Start writing specs now
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "var(--dim)",
            marginBottom: "28px",
          }}
        >
          No sign-up. No server. Everything runs in your browser.
        </p>
        <button
          onClick={onLaunch}
          style={{
            background: "var(--primary)",
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
       
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--bd2)",
          padding: "20px 16px",
          textAlign: "center",
          fontSize: "12px",
          color: "var(--muted)",
        }}
        className="landing-footer"
      >
        <div>
          Stale AI Markdown Studio is free and
          open-source. Crafted by{" "}
          <a
            href="https://ajmalnasumudeen.in/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--acc)", textDecoration: "none" }}
          >
            Ajmal Nasumudeen
          </a>
          .
        </div>
  
      </footer>
    </div>
  );
}
