import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import JSZip from "jszip";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE = `# AI-Powered MD Viewer

This is a **markdown editor** with live preview and AI formatting assistance.

## Features

- Rich formatting toolbar
- Connect to **Ollama** (local), **Gemini**, or **OpenAI**
- Ask AI to rewrite, improve, or transform your text
- Drag & drop file support

## Getting Started

Select some text and use the **AI panel** on the right to format it. Or ask the AI to improve the whole document.

> Try selecting this blockquote and asking the AI to make it more inspiring.

## Code Example

\`\`\`javascript
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("World"));
\`\`\`

## Lists

- Item one
- Item two
- Item three

1. First step
2. Second step
3. Third step
`;

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN PARSER
// ─────────────────────────────────────────────────────────────────────────────
function inline(s) {
  if (!s) return "";
  return s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/`([^`]+)`/g, '<code class="ic">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function parseMarkdown(md) {
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let html = md;
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const l = lang.trim() || "code";
    return `<pre><div class="ch"><span class="cl">${l}</span><button class="cc" data-code="${esc(code.trimEnd()).replace(/"/g,"&quot;")}">Copy</button></div><code>${esc(code.trimEnd())}</code></pre>`;
  });
  html = html.replace(/(\|.+\|\n\|[-| :]+\|\n(?:\|.+\|\n?)*)/g, block => {
    const rows = block.trim().split("\n");
    const ths = rows[0].split("|").filter(Boolean).map(c => `<th>${inline(c.trim())}</th>`).join("");
    const tds = rows.slice(2).map(r => "<tr>" + r.split("|").filter(Boolean).map(c => `<td>${inline(c.trim())}</td>`).join("") + "</tr>").join("");
    return `<table><thead><tr>${ths}</tr></thead><tbody>${tds}</tbody></table>`;
  });
  html = html.replace(/^---$/gm, "<hr>");
  [6,5,4,3,2,1].forEach(n => {
    html = html.replace(new RegExp(`^${"#".repeat(n)} (.+)$`, "gm"), (_, t) => `<h${n}>${inline(t)}</h${n}>`);
  });
  html = html.replace(/(^> .+\n?)+/gm, b => `<blockquote><p>${inline(b.replace(/^> ?/gm,"").trim())}</p></blockquote>`);
  html = html.replace(/(^[-*] .+\n?)+/gm, b => `<ul>${b.trim().split("\n").map(l=>`<li>${inline(l.replace(/^[-*] /,""))}</li>`).join("")}</ul>`);
  html = html.replace(/(^\d+\. .+\n?)+/gm, b => `<ol>${b.trim().split("\n").map(l=>`<li>${inline(l.replace(/^\d+\. /,""))}</li>`).join("")}</ol>`);
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, (_, t) => `<p>${inline(t)}</p>`);
  return html;
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function wrapSel(ta, before, after = before) {
  const s = ta.selectionStart, e = ta.selectionEnd;
  const sel = ta.value.slice(s, e);
  const rep = before + sel + after;
  return { val: ta.value.slice(0,s)+rep+ta.value.slice(e), ns: s+before.length, ne: s+before.length+sel.length };
}
function togglePrefix(ta, prefix) {
  const val = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
  const lines = val.split("\n"); let pos = 0;
  const result = lines.map(line => { const st=pos; pos+=line.length+1; if(st>e||pos-1<s) return line; return line.startsWith(prefix)?line.slice(prefix.length):prefix+line; });
  const newVal = result.join("\n"), delta = newVal.length - val.length;
  return { val: newVal, ns: s+delta, ne: e+delta };
}
function insertAt(ta, text) {
  const s = ta.selectionStart;
  return { val: ta.value.slice(0,s)+text+ta.value.slice(s), ns: s+text.length, ne: s+text.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI PROVIDERS
// ─────────────────────────────────────────────────────────────────────────────
async function callOllama(baseUrl, model, systemPrompt, userPrompt, onChunk) {
  const url = `${baseUrl.replace(/\/$/, "")}/api/chat`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value);
    for (const line of chunk.split("\n")) {
      if (!line.trim()) continue;
      try {
        const j = JSON.parse(line);
        if (j.message?.content) { full += j.message.content; onChunk(full); }
        if (j.done) return full;
      } catch {}
    }
  }
  return full;
}

async function callGemini(apiKey, model, systemPrompt, userPrompt, onChunk) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    }),
  });
  if (!res.ok) throw new Error(`Gemini error: ${res.status} ${await res.text()}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "", buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value);
    const lines = buf.split("\n"); buf = lines.pop();
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const j = JSON.parse(line.slice(6));
        const text = j.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) { full += text; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

async function callOpenAI(apiKey, model, baseUrl, systemPrompt, userPrompt, onChunk) {
  const url = `${(baseUrl||"https://api.openai.com").replace(/\/$/, "")}/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      stream: true,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${await res.text()}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = dec.decode(value);
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ") || line.includes("[DONE]")) continue;
      try {
        const j = JSON.parse(line.slice(6));
        const t = j.choices?.[0]?.delta?.content || "";
        if (t) { full += t; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI QUICK ACTIONS
// ─────────────────────────────────────────────────────────────────────────────
const AI_ACTIONS = [
  { id: "improve",   label: "✨ Improve writing",     prompt: "Improve the writing quality of this markdown text. Keep all markdown formatting. Return only the improved markdown, nothing else." },
  { id: "shorter",   label: "✂️ Make shorter",         prompt: "Make this markdown text more concise. Keep all markdown formatting. Return only the shortened markdown, nothing else." },
  { id: "longer",    label: "📝 Expand content",       prompt: "Expand this markdown text with more detail and examples. Keep all markdown formatting. Return only the expanded markdown, nothing else." },
  { id: "bullets",   label: "• Convert to bullets",   prompt: "Convert this text to a well-structured markdown bullet list. Return only the markdown, nothing else." },
  { id: "formal",    label: "👔 Make formal",          prompt: "Rewrite this in a formal, professional tone. Keep markdown formatting. Return only the rewritten markdown, nothing else." },
  { id: "casual",    label: "😊 Make casual",          prompt: "Rewrite this in a friendly, casual tone. Keep markdown formatting. Return only the rewritten markdown, nothing else." },
  { id: "table",     label: "⊞ Convert to table",     prompt: "Convert this data to a well-structured markdown table. Return only the markdown table, nothing else." },
  { id: "fix",       label: "🔧 Fix grammar",          prompt: "Fix grammar and spelling in this markdown text. Keep all markdown formatting intact. Return only the corrected markdown, nothing else." },
  { id: "summarize", label: "📋 Summarize",            prompt: "Summarize this markdown text. Keep markdown formatting. Return only the summary in markdown, nothing else." },
  { id: "custom",    label: "💬 Custom prompt…",       prompt: "" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;1,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0d1117; --s1:#161b22; --s2:#1c2128; --s3:#21262d;
  --bd:#30363d; --bd2:#21262d;
  --acc:#58a6ff; --teal:#39d0ba; --green:#3fb950; --orange:#ffa657; --red:#f85149; --purple:#bc8cff;
  --text:#c9d1d9; --dim:#8b949e; --muted:#484f58; --bright:#f0f6fc;
  --sel:#1c3a5e;
}
body{font-family:'JetBrains Mono',monospace;background:var(--bg);color:var(--text);height:100vh;overflow:hidden;font-size:13px}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#30363d;border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:#484f58}

/* titlebar */
.titlebar{height:32px;background:var(--s1);border-bottom:1px solid var(--bd2);display:flex;align-items:center;justify-content:center;padding:0 14px;gap:10px;flex-shrink:0;user-select:none;position:relative;z-index:10}
.tc{font-size:11.5px;color:var(--dim);display:flex;align-items:center;gap:6px;pointer-events:none}
.gem{width:14px;height:14px;background:linear-gradient(135deg,var(--acc) 40%,var(--purple));border-radius:3px;flex-shrink:0}

/* root layout */
.root{display:flex;height:calc(100vh - 32px - 22px)}

/* activity bar */
.actbar{width:46px;background:var(--s1);border-right:1px solid var(--bd2);display:flex;flex-direction:column;align-items:center;padding:6px 0;gap:2px;flex-shrink:0}
.ab{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:6px;cursor:pointer;color:var(--muted);border:none;background:transparent;transition:color .15s,background .15s;position:relative}
.ab:hover{color:var(--text);background:var(--s3)}
.ab.on{color:var(--bright)}
.ab.on::after{content:'';position:absolute;left:-2px;top:50%;transform:translateY(-50%);width:2px;height:20px;background:var(--acc);border-radius:0 2px 2px 0}
.ab.bot{margin-top:auto}

/* file sidebar */
.filesb{background:var(--s1);border-right:1px solid var(--bd);display:flex;flex-direction:column;overflow:hidden;transition:width .18s ease;flex-shrink:0}
.sb-hd{padding:12px 14px 7px;font-size:10px;font-weight:600;color:var(--dim);letter-spacing:1.5px;text-transform:uppercase;flex-shrink:0}
.sb-sc{flex:1;overflow-y:auto;padding:2px 0 8px}
.fe{display:flex;align-items:center;gap:7px;padding:5px 14px 5px 18px;font-size:12px;color:var(--dim);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .1s,color .1s}
.fe:hover{background:var(--s3);color:var(--text)}
.fe.on{background:var(--s2);color:var(--bright)}
.oi{padding:3px 14px 3px 20px;font-size:11px;color:var(--muted);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .1s}
.oi:hover{color:var(--text)}
.oi.h1{padding-left:20px;color:var(--dim);font-size:11.5px}
.oi.h2{padding-left:28px}
.oi.h3{padding-left:36px;font-size:10.5px}

/* center — editor + preview */
.center{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}

/* tabs */
.tabs{height:36px;background:var(--s2);border-bottom:1px solid var(--bd);display:flex;align-items:flex-end;overflow-x:auto;flex-shrink:0}
.tabs::-webkit-scrollbar{height:0}
.tab{display:flex;align-items:center;gap:7px;padding:0 14px;height:35px;font-size:12px;cursor:pointer;border-right:1px solid var(--bd2);white-space:nowrap;flex-shrink:0;color:var(--dim);position:relative;background:var(--s2);top:1px;border:none;font-family:inherit;transition:background .1s}
.tab.on{background:var(--bg);color:var(--bright);border-top:1.5px solid var(--acc);border-bottom:1px solid var(--bg);border-left:none;border-right:1px solid var(--bd2)}
.tab:not(.on):hover{background:var(--s3);color:var(--text)}
.tdot{width:6px;height:6px;border-radius:50%;background:var(--acc);opacity:.6;flex-shrink:0}
.tx{opacity:0;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border-radius:3px;font-size:13px;color:var(--dim);cursor:pointer;border:none;background:transparent;transition:opacity .1s}
.tab:hover .tx{opacity:1}
.tx:hover{background:var(--s1)}

/* fmt toolbar */
.fmtbar{height:36px;background:var(--s1);border-bottom:1px solid var(--bd);display:flex;align-items:center;padding:0 10px;gap:1px;flex-shrink:0;overflow-x:auto}
.fmtbar::-webkit-scrollbar{height:0}
.fb{min-width:28px;height:26px;display:flex;align-items:center;justify-content:center;padding:0 5px;font-size:12px;font-weight:500;font-family:'JetBrains Mono',monospace;background:transparent;color:var(--dim);border:none;border-radius:4px;cursor:pointer;transition:background .12s,color .12s;white-space:nowrap;flex-shrink:0;gap:3px;position:relative}
.fb:hover{background:var(--s3);color:var(--text)}
.fb.on{background:var(--s3);color:var(--acc)}
.fb:disabled{opacity:.3;cursor:default}
.fb:disabled:hover{background:transparent;color:var(--dim)}
.fb[data-tip]:hover::after{content:attr(data-tip);position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);background:#111827;color:var(--text);font-size:10px;padding:3px 8px;border-radius:4px;white-space:nowrap;border:1px solid var(--bd);z-index:100;pointer-events:none}
.fsep{width:1px;height:16px;background:var(--bd);margin:0 5px;flex-shrink:0}
.fsel{background:var(--s2);color:var(--dim);border:1px solid var(--bd2);border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11px;padding:2px 6px;cursor:pointer;outline:none;height:24px;flex-shrink:0}
.fsel:hover{border-color:var(--acc);color:var(--text)}

/* view toolbar */
.vtbar{height:30px;background:var(--bg);border-bottom:1px solid var(--bd2);display:flex;align-items:center;padding:0 8px;gap:2px;flex-shrink:0}
.vb{padding:3px 10px;font-size:11px;font-family:'JetBrains Mono',monospace;background:transparent;color:var(--dim);border:none;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:background .12s,color .12s}
.vb:hover{background:var(--s3);color:var(--text)}
.vb.on{background:var(--s3);color:var(--acc)}
.vsep{width:1px;height:14px;background:var(--bd);margin:0 4px;flex-shrink:0}
.badge{font-size:10px;color:var(--muted);padding:2px 7px;background:var(--s2);border:1px solid var(--bd2);border-radius:10px}

/* editor area */
.ea{flex:1;display:flex;overflow:hidden;position:relative}
.sw{flex:1;display:flex;overflow:hidden}
.rz{width:4px;background:var(--bd2);cursor:col-resize;flex-shrink:0;transition:background .15s}
.rz:hover,.rz.drag{background:var(--acc)}
.pane{display:flex;flex-direction:column;overflow:hidden;min-width:60px}
.pt{height:24px;background:var(--s2);border-bottom:1px solid var(--bd2);display:flex;align-items:center;padding:0 12px;gap:6px;font-size:9.5px;font-weight:600;color:var(--muted);letter-spacing:1.4px;text-transform:uppercase;flex-shrink:0}
.pp{width:7px;height:7px;border-radius:50%}
.es{flex:1;display:flex;overflow:hidden}
.gut{width:48px;background:var(--bg);padding:12px 0;font-size:11.5px;line-height:1.65;color:var(--muted);text-align:right;user-select:none;overflow:hidden;flex-shrink:0;border-right:1px solid var(--bd2)}
.gl{padding:0 10px 0 6px}.gl.cur{color:var(--dim)}
textarea.raw{flex:1;background:var(--bg);color:var(--text);border:none;outline:none;resize:none;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.65;padding:12px 18px;overflow-y:auto;white-space:pre;tab-size:2;caret-color:var(--acc)}
textarea.raw::selection{background:var(--sel)}

/* preview */
.ps{flex:1;overflow-y:auto;background:var(--bg);padding:32px 44px 60px}
.pb{max-width:700px;margin:0 auto;font-family:'Fraunces',serif;font-size:17px;line-height:1.9;color:#bdc3cd}
.pb h1{font-family:'Fraunces',serif;font-size:2.1em;font-weight:600;color:var(--bright);line-height:1.2;margin:0 0 10px;letter-spacing:-.5px}
.pb h2{font-size:1.45em;font-weight:600;color:#e8edf2;margin:2.2em 0 .5em;padding-bottom:6px;border-bottom:1px solid var(--bd2);font-family:'Fraunces',serif}
.pb h3{font-size:1.15em;font-weight:600;color:#d9dfe6;margin:1.8em 0 .4em}
.pb h4,.pb h5,.pb h6{font-size:.95em;font-weight:600;color:var(--text);margin:1.4em 0 .35em;text-transform:uppercase;letter-spacing:.8px}
.pb p{margin:0 0 1em}
.pb a{color:var(--acc);text-decoration:none;border-bottom:1px solid rgba(88,166,255,.3);transition:border-color .15s}
.pb a:hover{border-color:var(--acc)}
.pb strong{color:var(--bright);font-weight:600}
.pb em{color:#d7ba7d;font-style:italic}
.pb del{color:var(--muted);text-decoration:line-through}
.pb code.ic{font-family:'JetBrains Mono',monospace;font-size:.8em;background:#161d2a;color:#79c0ff;padding:2px 7px;border-radius:4px;border:1px solid #1c3154}
.pb pre{background:#0a0d12;border:1px solid var(--bd);border-radius:8px;margin:1.3em 0;overflow:hidden}
.ch{display:flex;align-items:center;justify-content:space-between;background:var(--s2);padding:5px 14px;border-bottom:1px solid var(--bd2)}
.cl{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase}
.cc{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);background:none;border:none;cursor:pointer;padding:2px 8px;border-radius:3px;transition:background .1s}
.cc:hover{background:var(--s3);color:var(--text)}
.pb pre code{display:block;padding:14px 18px;overflow-x:auto;font-size:12.5px;line-height:1.6;color:var(--text);font-family:'JetBrains Mono',monospace}
.pb blockquote{border-left:3px solid var(--acc);margin:1.2em 0;padding:10px 18px;background:#0d1420;border-radius:0 6px 6px 0;color:var(--dim);font-style:italic}
.pb blockquote p{margin:0}
.pb ul,.pb ol{padding-left:1.5em;margin:.5em 0 1em}
.pb li{margin:.3em 0}
.pb li::marker{color:var(--acc)}
.pb hr{border:none;height:1px;background:var(--bd2);margin:2em 0}
.pb table{width:100%;border-collapse:collapse;margin:1.2em 0;font-family:'JetBrains Mono',monospace;font-size:12.5px}
.pb th{background:var(--s2);color:var(--bright);font-weight:600;padding:8px 14px;text-align:left;border:1px solid var(--bd);font-size:11px;letter-spacing:.5px;text-transform:uppercase}
.pb td{padding:7px 14px;border:1px solid var(--bd2);color:var(--text)}
.pb tr:nth-child(even) td{background:#0a0f16}
.pb tr:hover td{background:#111820}
.pb img{max-width:100%;border-radius:6px;border:1px solid var(--bd);display:block;margin:1em 0}

/* ── AI PANEL ── */
.aipanel{width:300px;background:var(--s1);border-left:1px solid var(--bd);display:flex;flex-direction:column;flex-shrink:0;overflow:hidden;transition:width .2s ease}
.aipanel.closed{width:0;border:none;display:none}

@media (max-width: 960px){
  .aipanel{
    position:absolute;
    right:0;
    top:32px;
    bottom:22px;
    z-index:40;
    box-shadow:0 0 0 1px var(--bd);
  }
}

/* Responsive layout tweaks */
@media (max-width: 960px){
  .root{
    height:calc(100vh - 32px);
  }
  .sw{
    flex-direction:column;
  }
  .rz{
    display:none;
  }
  .vtbar{
    flex-wrap:wrap;
    row-gap:4px;
  }
  .ps{
    padding:20px 16px 40px;
  }
}

@media (max-width: 640px){
  .filesb{
    position:absolute;
    top:32px;
    bottom:22px;
    left:0;
    z-index:30;
  }
  .actbar{
    width:40px;
  }
  .fmtbar{
    overflow-x:auto;
  }
}

.aip-header{padding:14px 14px 10px;border-bottom:1px solid var(--bd2);flex-shrink:0}
.aip-title{font-size:11px;font-weight:600;color:var(--dim);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.aip-title-dot{width:6px;height:6px;border-radius:50%;background:var(--purple)}

/* provider selector */
.prov-tabs{display:flex;gap:2px;background:var(--s2);border-radius:6px;padding:2px}
.ptab{flex:1;padding:5px 4px;font-size:10px;font-family:'JetBrains Mono',monospace;border:none;border-radius:4px;cursor:pointer;background:transparent;color:var(--dim);transition:background .15s,color .15s;text-align:center;letter-spacing:.3px}
.ptab:hover{color:var(--text)}
.ptab.on{background:var(--s3);color:var(--bright)}

/* config fields */
.cfg{padding:10px 14px;border-bottom:1px solid var(--bd2);display:flex;flex-direction:column;gap:6px;flex-shrink:0}
.cfg-row{display:flex;flex-direction:column;gap:3px}
.cfg-label{font-size:9.5px;color:var(--muted);letter-spacing:.8px;text-transform:uppercase}
.cfg-input{background:var(--s2);color:var(--text);border:1px solid var(--bd2);border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:11px;padding:5px 8px;outline:none;width:100%;transition:border-color .15s}
.cfg-input:focus{border-color:var(--acc)}
.cfg-input::placeholder{color:var(--muted)}
.cfg-status{display:flex;align-items:center;gap:5px;font-size:10px;padding:4px 8px;border-radius:4px}
.cfg-status.ok{background:rgba(63,185,80,.1);color:var(--green)}
.cfg-status.err{background:rgba(248,81,73,.1);color:var(--red)}
.cfg-status.checking{background:rgba(88,166,255,.1);color:var(--acc)}
.test-btn{padding:4px 10px;font-size:10px;font-family:'JetBrains Mono',monospace;background:var(--s2);color:var(--dim);border:1px solid var(--bd2);border-radius:4px;cursor:pointer;transition:all .15s;width:100%}
.test-btn:hover{border-color:var(--acc);color:var(--acc)}

/* actions */
.aip-actions{flex:1;overflow-y:auto;padding:10px 10px 6px}
.actions-hd{font-size:9.5px;color:var(--muted);letter-spacing:.8px;text-transform:uppercase;padding:4px 4px 8px}

.scope-row{display:flex;gap:4px;padding:0 4px 8px}
.scope-btn{flex:1;padding:4px 6px;font-size:10px;font-family:'JetBrains Mono',monospace;border:1px solid var(--bd2);border-radius:4px;cursor:pointer;background:transparent;color:var(--dim);transition:all .15s;text-align:center}
.scope-btn:hover{border-color:var(--acc);color:var(--acc)}
.scope-btn.on{background:rgba(88,166,255,.12);border-color:var(--acc);color:var(--acc)}

.action-btn{display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;font-size:11.5px;font-family:'JetBrains Mono',monospace;background:transparent;color:var(--dim);border:none;border-radius:5px;cursor:pointer;transition:background .12s,color .12s;text-align:left;margin-bottom:1px}
.action-btn:hover{background:var(--s2);color:var(--text)}
.action-btn.running{color:var(--acc);background:rgba(88,166,255,.08)}

/* custom prompt */
.custom-area{padding:8px 10px;border-top:1px solid var(--bd2)}
.custom-ta{width:100%;background:var(--s2);color:var(--text);border:1px solid var(--bd2);border-radius:5px;font-family:'JetBrains Mono',monospace;font-size:11px;padding:7px 10px;outline:none;resize:none;min-height:60px;transition:border-color .15s}
.custom-ta:focus{border-color:var(--acc)}
.custom-ta::placeholder{color:var(--muted)}
.run-btn{margin-top:6px;width:100%;padding:7px;font-size:11.5px;font-family:'JetBrains Mono',monospace;background:var(--acc);color:#fff;border:none;border-radius:5px;cursor:pointer;transition:opacity .2s;display:flex;align-items:center;justify-content:center;gap:6px}
.run-btn:hover{opacity:.88}
.run-btn:disabled{opacity:.4;cursor:not-allowed}

/* streaming result */
.aip-result{flex-shrink:0;border-top:1px solid var(--bd2);max-height:220px;overflow:hidden;display:flex;flex-direction:column}
.result-hd{display:flex;align-items:center;justify-content:space-between;padding:6px 14px;background:var(--s2);border-bottom:1px solid var(--bd2);flex-shrink:0}
.result-label{font-size:9.5px;color:var(--dim);letter-spacing:.8px;text-transform:uppercase;display:flex;align-items:center;gap:5px}
.result-actions{display:flex;gap:4px}
.ra-btn{padding:2px 8px;font-size:10px;font-family:'JetBrains Mono',monospace;border:1px solid var(--bd2);border-radius:3px;cursor:pointer;background:transparent;color:var(--dim);transition:all .15s}
.ra-btn:hover{border-color:var(--acc);color:var(--acc)}
.ra-btn.accept{background:rgba(63,185,80,.15);border-color:var(--green);color:var(--green)}
.ra-btn.accept:hover{background:rgba(63,185,80,.25)}
.result-text{flex:1;overflow-y:auto;padding:10px 14px;font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;color:var(--text);white-space:pre-wrap;background:var(--bg)}
.cursor-blink{display:inline-block;width:2px;height:12px;background:var(--acc);margin-left:1px;animation:blink .7s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

/* streaming dot */
.streaming-dot{width:6px;height:6px;border-radius:50%;background:var(--acc);animation:blink .7s ease-in-out infinite}

/* error toast */
.toast{position:fixed;bottom:36px;right:16px;background:var(--s2);border:1px solid var(--red);border-radius:6px;padding:8px 14px;font-size:11px;color:var(--red);z-index:300;animation:slideUp .2s ease;max-width:280px}
.toast.ok{border-color:var(--green);color:var(--green)}
@keyframes slideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

/* drop zone */
.dz{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:var(--bg);z-index:20;transition:background .2s}
.dz.drag{background:#0d1622}
.dzring{width:84px;height:84px;border-radius:50%;border:2px dashed var(--bd);display:flex;align-items:center;justify-content:center;color:var(--dim);animation:pulse 2.5s ease-in-out infinite}
@keyframes pulse{0%,100%{border-color:var(--bd);color:var(--muted)}50%{border-color:var(--acc);color:var(--acc)}}
.dztitle{font-family:'Fraunces',serif;font-size:20px;color:var(--text);font-weight:300}
.dzsub{font-size:11px;color:var(--muted)}
.dzbtn{padding:7px 20px;background:var(--acc);color:#fff;font-family:'JetBrains Mono',monospace;font-size:11.5px;border:none;border-radius:6px;cursor:pointer;margin-top:4px;transition:opacity .2s}
.dzbtn:hover{opacity:.85}

/* drag overlay */
.dgo{position:fixed;inset:0;background:rgba(13,17,23,.9);border:2px solid var(--acc);z-index:200;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;font-family:'Fraunces',serif;font-size:22px;font-weight:300;color:var(--acc);pointer-events:none}

/* status bar */
.sbar{height:22px;background:var(--acc);display:flex;align-items:center;padding:0 12px;flex-shrink:0;font-size:11px;color:rgba(255,255,255,.92);user-select:none}
.si{display:flex;align-items:center;gap:4px;padding:0 8px;height:100%;cursor:default;transition:background .12s;white-space:nowrap}
.si:hover{background:rgba(0,0,0,.15)}
.sg{flex:1}
.sd{width:1px;height:12px;background:rgba(255,255,255,.25);margin:0 2px}
.ai-indicator{display:flex;align-items:center;gap:5px;padding:0 10px;background:rgba(188,140,255,.2);border-radius:3px}
.ai-dot{width:5px;height:5px;border-radius:50%;background:var(--purple);animation:blink .7s ease-in-out infinite}

@keyframes fu{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.pb > *{animation:fu .18s ease both}

/* file tree */
.ft-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 14px 7px;flex-shrink:0}
.ft-hd-label{font-size:10px;font-weight:600;color:var(--dim);letter-spacing:1.5px;text-transform:uppercase}
.ft-hd-actions{display:flex;gap:2px}
.ft-hd-btn{width:22px;height:22px;display:flex;align-items:center;justify-content:center;border-radius:4px;cursor:pointer;color:var(--muted);border:none;background:transparent;font-size:14px;transition:color .12s,background .12s}
.ft-hd-btn:hover{color:var(--text);background:var(--s3)}
.ft-item{display:flex;align-items:center;gap:6px;padding:4px 8px;font-size:12px;color:var(--dim);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:background .1s,color .1s;position:relative;user-select:none}
.ft-item:hover{background:var(--s3);color:var(--text)}
.ft-item.on{background:var(--s2);color:var(--bright)}
.ft-item .ft-actions{display:none;margin-left:auto;gap:2px;flex-shrink:0}
.ft-item:hover .ft-actions{display:flex}
.ft-act{width:18px;height:18px;display:flex;align-items:center;justify-content:center;border-radius:3px;cursor:pointer;color:var(--muted);border:none;background:transparent;font-size:11px;transition:color .1s,background .1s;padding:0}
.ft-act:hover{color:var(--text);background:var(--s2)}
.ft-act.del:hover{color:var(--red)}
.ft-input{background:var(--s2);color:var(--text);border:1px solid var(--acc);border-radius:3px;font-family:'JetBrains Mono',monospace;font-size:11px;padding:3px 6px;outline:none;width:calc(100% - 24px);margin:2px 8px}
.ft-chevron{width:14px;height:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .15s;font-size:10px;color:var(--muted)}
.ft-chevron.open{transform:rotate(90deg)}
.ft-icon{flex-shrink:0;display:flex;align-items:center}
.ft-name{overflow:hidden;text-overflow:ellipsis}
`;

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const Ic = {
  folder:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7c0-1.1.9-2 2-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
  lines:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>,
  sparkle: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>,
  cog:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  file:    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  upload:  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  eye:     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  pencil:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  undo:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>,
  redo:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg>,
  link:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>,
  img:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  tbl:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>,
  hr:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="2" y1="12" x2="22" y2="12"/></svg>,
  open:    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v1"/><rect x="3" y="13" width="18" height="8" rx="1"/></svg>,
  check:   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x:       <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  share:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="12" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 11l8-4"/><path d="M8 13l8 4"/></svg>,
  whatsapp:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 19l-1 4 4-1a9 9 0 1015-7 9 9 0 10-18 0z"/><path d="M9 9c0 3 3 6 6 6 .5 0 1-.1 1.4-.3l1.1.3-.3-1.1c.2-.4.3-.9.3-1.4 0-.3-.1-.5-.4-.7l-1.1-.4a.7.7 0 00-.7.1l-.6.6a.4.4 0 01-.4.1c-1-.3-1.8-1.1-2.1-2.1a.4.4 0 01.1-.4l.6-.6a.7.7 0 00.1-.7L12.7 7a.7.7 0 00-.7-.4H12c-.9 0-1.7.8-1.7 1.7z"/></svg>,
  chevron: <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>,
  folderOpen: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 19H3a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v1"/><path d="M5 19l2.5-7h14l-2.5 7H5z"/></svg>,
  folderClosed: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7c0-1.1.9-2 2-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>,
  fileMd: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  plus:  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  trash: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  edit:  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
};

// ─────────────────────────────────────────────────────────────────────────────
// FILE TREE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function buildTree(fileTree) {
  const root = { name: "", type: "folder", path: "", children: [] };
  const folders = {};
  folders[""] = root;

  const ensureFolder = (folderPath) => {
    if (folders[folderPath]) return folders[folderPath];
    const parts = folderPath.split("/");
    const name = parts.pop();
    const parentPath = parts.join("/");
    const parent = ensureFolder(parentPath);
    const node = { name, type: "folder", path: folderPath, children: [] };
    parent.children.push(node);
    folders[folderPath] = node;
    return node;
  };

  // First pass: create explicit folders (entries ending with /)
  for (const path of Object.keys(fileTree)) {
    if (path.endsWith("/")) {
      ensureFolder(path.slice(0, -1));
    }
  }

  // Second pass: add files
  for (const path of Object.keys(fileTree)) {
    if (path.endsWith("/")) continue;
    const parts = path.split("/");
    const name = parts.pop();
    const parentPath = parts.join("/");
    const parent = ensureFolder(parentPath);
    parent.children.push({ name, type: "file", path, children: [] });
  }

  // Sort: folders first, then alphabetical
  const sortChildren = (node) => {
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(c => { if (c.type === "folder") sortChildren(c); });
  };
  sortChildren(root);
  return root.children;
}

// ─────────────────────────────────────────────────────────────────────────────
// AI PANEL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function loadAIConfig() {
  try {
    const raw = window.localStorage.getItem("mdviewer.aiConfig");
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveAIConfig(cfg) {
  try {
    window.localStorage.setItem("mdviewer.aiConfig", JSON.stringify(cfg));
  } catch {
    // ignore storage errors
  }
}

function AIPanel({ md, selection, onApply }) {
  const defaultProvider = "ollama";
  const defaultCfg = {
    ollama_url:   "http://localhost:11434",
    ollama_model: "qwen2.5-coder:3b",
    gemini_key:   "",
    gemini_model: "gemini-1.5-flash",
    openai_key:   "",
    openai_model: "gpt-4o-mini",
    openai_base:  "https://api.openai.com",
  };
  const persisted = typeof window !== "undefined" ? loadAIConfig() : null;

  const [provider, setProvider] = useState(persisted?.provider || defaultProvider); // ollama | gemini | openai
  const [cfg, setCfg] = useState({
    ...defaultCfg,
    ...(persisted?.cfg || {}),
  });
  const [connStatus, setConnStatus] = useState(null); // null | checking | ok | err
  const [connMsg, setConnMsg]       = useState("");
  const [scope, setScope]           = useState("selection"); // selection | full
  const [running, setRunning]       = useState(null);
  const [result, setResult]         = useState("");
  const [streaming, setStreaming]   = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const abortRef = useRef(null);

  const update = (k, v) => setCfg(c => ({ ...c, [k]: v }));

  useEffect(() => {
    saveAIConfig({ provider, cfg });
  }, [provider, cfg]);

  // ── Test connection
  const testConn = async () => {
    setConnStatus("checking"); setConnMsg("Connecting…");
    try {
      if (provider === "ollama") {
        const r = await fetch(`${cfg.ollama_url.replace(/\/$/, "")}/api/tags`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        const models = d.models?.map(m => m.name).join(", ") || "no models found";
        setConnStatus("ok"); setConnMsg(`Connected · ${models}`);
      } else if (provider === "gemini") {
        if (!cfg.gemini_key) throw new Error("API key required");
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${cfg.gemini_key}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setConnStatus("ok"); setConnMsg("Connected to Gemini");
      } else {
        if (!cfg.openai_key) throw new Error("API key required");
        const r = await fetch(`${cfg.openai_base.replace(/\/$/, "")}/v1/models`, {
          headers: { Authorization: `Bearer ${cfg.openai_key}` },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setConnStatus("ok"); setConnMsg("Connected to OpenAI");
      }
    } catch (e) {
      setConnStatus("err"); setConnMsg(e.message);
    }
  };

  // ── Run action
  const runAction = async (action) => {
    const target = scope === "selection" && selection ? selection : md;
    if (!target.trim()) return;
    const sysPrompt = "You are a markdown text formatter. Follow the user's instruction precisely. Return ONLY the formatted markdown text — no explanations, no preamble, no code fences around the output.";
    const userPrompt = `${action.id === "custom" ? customPrompt : action.prompt}\n\nText:\n${target}`;

    setRunning(action.id);
    setResult("");
    setStreaming(true);

    try {
      let final = "";
      const onChunk = t => setResult(t);

      if (provider === "ollama") {
        final = await callOllama(cfg.ollama_url, cfg.ollama_model, sysPrompt, userPrompt, onChunk);
      } else if (provider === "gemini") {
        final = await callGemini(cfg.gemini_key, cfg.gemini_model, sysPrompt, userPrompt, onChunk);
      } else {
        final = await callOpenAI(cfg.openai_key, cfg.openai_model, cfg.openai_base, sysPrompt, userPrompt, onChunk);
      }
      setResult(final);
    } catch (e) {
      setResult(`Error: ${e.message}`);
    } finally {
      setStreaming(false);
      setRunning(null);
    }
  };

  const acceptResult = () => {
    if (!result) return;
    const clean = result.replace(/^```(?:markdown)?\n?/, "").replace(/\n?```$/, "");
    onApply(clean, scope === "selection" ? selection : null);
    setResult("");
  };

  const discardResult = () => setResult("");

  const providerColor = { ollama: "var(--teal)", gemini: "var(--orange)", openai: "var(--green)" }[provider];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", overflow:"hidden" }}>
      {/* Header */}
      <div className="aip-header">
        <div className="aip-title">
          <div className="aip-title-dot" style={{ background: providerColor }}/>
          AI Assistant
        </div>
        {/* Provider tabs */}
        <div className="prov-tabs">
          {[["ollama","🦙 Ollama"],["gemini","✦ Gemini"],["openai","⬡ OpenAI"]].map(([id, label]) => (
            <button key={id} className={`ptab${provider===id?" on":""}`}
              style={provider===id ? { color: providerColor } : {}}
              onClick={() => { setProvider(id); setConnStatus(null); }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Config */}
      <div className="cfg">
        {provider === "ollama" && <>
          <div className="cfg-row">
            <div className="cfg-label">Base URL</div>
            <input className="cfg-input" value={cfg.ollama_url} onChange={e=>update("ollama_url",e.target.value)} placeholder="http://localhost:11434"/>
          </div>
          <div className="cfg-row">
            <div className="cfg-label">Model</div>
            <select className="cfg-input" value={cfg.ollama_model} onChange={e=>update("ollama_model",e.target.value)} style={{cursor:"pointer",paddingRight:8}}>
              <optgroup label="Your Local Models">
                <option value="qwen2.5-coder:3b">qwen2.5-coder:3b (1.9 GB)</option>
                <option value="qwen3-vl:4b">qwen3-vl:4b (3.3 GB)</option>
                <option value="deepseek-r1:7b">deepseek-r1:7b (4.7 GB)</option>
              </optgroup>
              <optgroup label="Other">
                <option value="llama3">llama3</option>
                <option value="mistral">mistral</option>
                <option value="phi3">phi3</option>
              </optgroup>
            </select>
          </div>
        </>}
        {provider === "gemini" && <>
          <div className="cfg-row">
            <div className="cfg-label">API Key</div>
            <input className="cfg-input" type="password" value={cfg.gemini_key} onChange={e=>update("gemini_key",e.target.value)} placeholder="AIza…"/>
          </div>
          <div className="cfg-row">
            <div className="cfg-label">Model</div>
            <input className="cfg-input" value={cfg.gemini_model} onChange={e=>update("gemini_model",e.target.value)} placeholder="gemini-1.5-flash"/>
          </div>
        </>}
        {provider === "openai" && <>
          <div className="cfg-row">
            <div className="cfg-label">API Key</div>
            <input className="cfg-input" type="password" value={cfg.openai_key} onChange={e=>update("openai_key",e.target.value)} placeholder="sk-…"/>
          </div>
          <div className="cfg-row">
            <div className="cfg-label">Model</div>
            <input className="cfg-input" value={cfg.openai_model} onChange={e=>update("openai_model",e.target.value)} placeholder="gpt-4o-mini"/>
          </div>
          <div className="cfg-row">
            <div className="cfg-label">Base URL (optional)</div>
            <input className="cfg-input" value={cfg.openai_base} onChange={e=>update("openai_base",e.target.value)} placeholder="https://api.openai.com"/>
          </div>
        </>}

        <button className="test-btn" onClick={testConn}>Test Connection</button>

        {connStatus && (
          <div className={`cfg-status ${connStatus}`}>
            {connStatus === "ok" && Ic.check}
            {connStatus === "err" && Ic.x}
            {connStatus === "checking" && <div className="streaming-dot"/>}
            <span style={{fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{connMsg}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="aip-actions">
        <div className="actions-hd">Apply to…</div>
        <div className="scope-row">
          <button className={`scope-btn${scope==="selection"?" on":""}`} onClick={()=>setScope("selection")}>
            Selection {selection ? `(${selection.split(" ").length}w)` : "(none)"}
          </button>
          <button className={`scope-btn${scope==="full"?" on":""}`} onClick={()=>setScope("full")}>
            Full doc
          </button>
        </div>

        <div className="actions-hd" style={{paddingTop:4}}>Quick Actions</div>
        {AI_ACTIONS.filter(a => a.id !== "custom").map(action => (
          <button key={action.id}
            className={`action-btn${running===action.id?" running":""}`}
            onClick={() => runAction(action)}
            disabled={!!running}>
            {running === action.id ? <div className="streaming-dot"/> : null}
            {action.label}
          </button>
        ))}
      </div>

      {/* Custom prompt */}
      <div className="custom-area">
        <div className="cfg-label" style={{marginBottom:5}}>Custom Instruction</div>
        <textarea
          className="custom-ta"
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          placeholder="e.g. Convert to a FAQ format…"
          rows={3}
          onKeyDown={e => { if (e.key==="Enter" && (e.ctrlKey||e.metaKey) && customPrompt.trim()) runAction(AI_ACTIONS.find(a=>a.id==="custom")); }}
        />
        <button
          className="run-btn"
          onClick={() => runAction(AI_ACTIONS.find(a=>a.id==="custom"))}
          disabled={!customPrompt.trim() || !!running}>
          {running === "custom" ? <><div className="streaming-dot"/> Generating…</> : <>✦ Run Prompt</>}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="aip-result">
          <div className="result-hd">
            <div className="result-label">
              {streaming && <div className="streaming-dot"/>}
              {streaming ? "Generating…" : "Result"}
            </div>
            {!streaming && (
              <div className="result-actions">
                <button className="ra-btn" onClick={discardResult}>Discard</button>
                <button className="ra-btn accept" onClick={acceptResult}>Accept ↩</button>
              </div>
            )}
          </div>
          <div className="result-text">
            {result}
            {streaming && <span className="cursor-blink"/>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────────────────
export default function MDViewer() {
  const [fileTree, setFileTree] = useState(() => {
    if (typeof window === "undefined") return { "welcome.md": SAMPLE };
    try {
      const saved = window.localStorage.getItem("mdviewer.fileTree");
      if (saved) return JSON.parse(saved);
    } catch {}
    return { "welcome.md": SAMPLE };
  });
  const [activeFile, setActiveFile] = useState(() => {
    if (typeof window === "undefined") return "welcome.md";
    try {
      return window.localStorage.getItem("mdviewer.activeFile") || "welcome.md";
    } catch {
      return "welcome.md";
    }
  });
  const initialContent = fileTree[activeFile] ?? SAMPLE;
  const [md, setMd]             = useState(initialContent);
  const [fileName, setFileName] = useState(activeFile.split("/").pop() || "welcome.md");
  const [view, setView]         = useState("split");
  const [sidebar, setSidebar]   = useState("files");
  const [aiOpen, setAiOpen]     = useState(true);
  const [editorW, setEditorW]   = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cursor, setCursor]     = useState({ ln:1, col:1 });
  const [selection, setSelection] = useState("");
  const [copied, setCopied]     = useState(null);
  const [toast, setToast]       = useState(null);
  const [hist, setHist]         = useState([SAMPLE]);
  const [hIdx, setHIdx]         = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [wordWrap, setWordWrap] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    if (typeof window === "undefined") return null;
    const m = window.location.hash.match(/session=([^&]+)/);
    return m ? m[1] : null;
  });
  const [sessionPeers, setSessionPeers] = useState(1);

  const taRef   = useRef(null);
  const gutRef  = useRef(null);
  const fileRef = useRef(null);
  const prevRef = useRef(null);
  const styleRef = useRef(null);
  const rzDrag  = useRef({ on:false, x0:0, w0:0 });
  const dc      = useRef(0);
  const clientIdRef = useRef(typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : String(Date.now()));
  const isRemoteUpdate = useRef(false);
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);
  const webrtcRef = useRef(null);
  const mdRef = useRef(md);

  useEffect(() => {
    if (styleRef.current) return;
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    styleRef.current = el;
  }, []);

  useEffect(() => {
    mdRef.current = md;
  }, [md]);

  // Persist file tree + active file
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("mdviewer.fileTree", JSON.stringify(fileTree));
        window.localStorage.setItem("mdviewer.activeFile", activeFile);
      }
    } catch {}
  }, [fileTree, activeFile]);

  // When active file changes, load its content
  useEffect(() => {
    const content = fileTree[activeFile] ?? "";
    setMd(content);
    setHist([content]);
    setHIdx(0);
    setFileName(activeFile.split("/").pop() || activeFile);
  }, [activeFile, fileTree]);

  useEffect(() => {
    if (!sessionId) return;

    const doc = new Y.Doc();
    const text = doc.getText("md");
    if (text.length === 0 && mdRef.current) {
      text.insert(0, mdRef.current);
    }

    const room = `slateai-md-${sessionId}`;
    const provider = new WebrtcProvider(room, doc);

    const updatePeers = () => {
      try {
        const states = provider.awareness.getStates();
        setSessionPeers(states ? states.size : 1);
      } catch {
        setSessionPeers(1);
      }
    };

    provider.awareness.setLocalStateField("id", clientIdRef.current);
    updatePeers();
    provider.awareness.on("change", updatePeers);

    const handleTextChange = () => {
      if (isRemoteUpdate.current) return;
      const next = text.toString();
      if (next === mdRef.current) return;
      isRemoteUpdate.current = true;
      setHist((h) => {
        const nextHist = [...h, next];
        setHIdx(nextHist.length - 1);
        return nextHist;
      });
      setMd(next);
      isRemoteUpdate.current = false;
    };

    text.observe(handleTextChange);

    ydocRef.current = doc;
    ytextRef.current = text;
    webrtcRef.current = provider;

    return () => {
      text.unobserve(handleTextChange);
      provider.awareness.off("change", updatePeers);
      provider.destroy();
      doc.destroy();
      if (webrtcRef.current === provider) webrtcRef.current = null;
      if (ydocRef.current === doc) ydocRef.current = null;
      if (ytextRef.current === text) ytextRef.current = null;
      setSessionPeers(1);
    };
  }, [sessionId, setHist, setMd, setHIdx]);

  useEffect(() => {
    prevRef.current?.querySelectorAll(".cc").forEach(btn => {
      btn.onclick = () => {
        const raw = btn.dataset.code.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">");
        navigator.clipboard.writeText(raw).then(() => { btn.textContent="Copied!"; setTimeout(()=>btn.textContent="Copy",1400); });
      };
    });
  });

  const showToast = (msg, type="err") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 3000); };

  // ── History
  const commit = useCallback(newMd => {
    setHist(h => { const next=[...h.slice(0,hIdx+1),newMd]; setHIdx(next.length-1); return next; });
    setMd(newMd);
    setFileTree(tree => ({
      ...tree,
      [activeFile]: newMd,
    }));
    if (sessionId && ytextRef.current && !isRemoteUpdate.current) {
      const ytext = ytextRef.current;
      isRemoteUpdate.current = true;
      ytext.delete(0, ytext.length);
      ytext.insert(0, newMd);
      isRemoteUpdate.current = false;
    }
  }, [hIdx, sessionId, activeFile]);
  const undo = useCallback(() => { if(hIdx>0){const ni=hIdx-1;setHIdx(ni);setMd(hist[ni]);} }, [hIdx,hist]);
  const redo = useCallback(() => { if(hIdx<hist.length-1){const ni=hIdx+1;setHIdx(ni);setMd(hist[ni]);} }, [hIdx,hist]);

  // ── Fmt toolbar
  const applyFmt = useCallback(type => {
    const ta = taRef.current; if (!ta) return;
    let res;
    const m = { bold:"**", italic:"*", strike:"~~", inlinecode:"`" };
    if (m[type])          res = wrapSel(ta, m[type]);
    else if (type==="ul") res = togglePrefix(ta,"- ");
    else if (type==="ol") res = togglePrefix(ta,"1. ");
    else if (type==="quote") res = togglePrefix(ta,"> ");
    else if (type==="h1") res = togglePrefix(ta,"# ");
    else if (type==="h2") res = togglePrefix(ta,"## ");
    else if (type==="h3") res = togglePrefix(ta,"### ");
    else if (type==="hr") res = insertAt(ta,"\n\n---\n\n");
    else if (type==="link") {
      const sel=ta.value.slice(ta.selectionStart,ta.selectionEnd)||"link text";
      const s=ta.selectionStart, rep=`[${sel}](url)`;
      res={val:ta.value.slice(0,s)+rep+ta.value.slice(ta.selectionEnd),ns:s+sel.length+3,ne:s+rep.length-1};
    } else if (type==="img") {
      const s=ta.selectionStart,rep="![alt text](image-url)";
      res={val:ta.value.slice(0,s)+rep+ta.value.slice(s),ns:s+2,ne:s+10};
    } else if (type==="codeblock") {
      const sel=ta.value.slice(ta.selectionStart,ta.selectionEnd);
      const s=ta.selectionStart,rep="```\n"+(sel||"your code here")+"\n```";
      res={val:ta.value.slice(0,s)+rep+ta.value.slice(ta.selectionEnd),ns:s+4,ne:s+4+(sel||"your code here").length};
    } else if (type==="table") {
      res=insertAt(ta,"\n| Col 1 | Col 2 | Col 3 |\n|-------|-------|-------|\n| Cell  | Cell  | Cell  |\n");
    }
    if (!res) return;
    commit(res.val);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(res.ns,res.ne); });
  }, [commit]);

  // ── Keyboard shortcuts
  useEffect(() => {
    const h = e => {
      if (!(e.ctrlKey||e.metaKey)) return;
      if (e.key==="b") { e.preventDefault(); applyFmt("bold"); }
      if (e.key==="i") { e.preventDefault(); applyFmt("italic"); }
      if (e.key==="k") { e.preventDefault(); applyFmt("link"); }
      if (e.key==="z"&&!e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key==="z"&&e.shiftKey)  { e.preventDefault(); redo(); }
      if (e.key==="y") { e.preventDefault(); redo(); }
      if (e.key === "f") {
        e.preventDefault();
        setShowSearch(s => !s);
      }
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  }, [applyFmt,undo,redo]);

  // ── Track cursor + selection
  const trackCursor = () => {
    const ta = taRef.current; if (!ta) return;
    const before = ta.value.substr(0,ta.selectionStart).split("\n");
    setCursor({ ln:before.length, col:before[before.length-1].length+1 });
    const sel = ta.value.slice(ta.selectionStart,ta.selectionEnd).trim();
    setSelection(sel);
    if (gutRef.current) gutRef.current.scrollTop = ta.scrollTop;
  };

  const handleTabKey = e => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = taRef.current;
      if (!ta) return;
      const s = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = md.slice(0, s) + "  " + md.slice(end);
      commit(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = s + 2;
      });
    }
  };

  // ── AI apply result
  const handleAIApply = useCallback((result, selText) => {
    const ta = taRef.current;
    if (selText && ta) {
      const idx = md.indexOf(selText);
      if (idx !== -1) {
        const newMd = md.slice(0, idx) + result + md.slice(idx + selText.length);
        commit(newMd);
        showToast("AI result applied to selection", "ok");
        return;
      }
    }
    commit(result);
    showToast("AI result applied to document", "ok");
  }, [md, commit]);

  // ── File
  const loadFile = file => {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => {
      const name = normalizeFileName(file.name);
      setFileTree(tree => ({
        ...tree,
        [name]: e.target.result,
      }));
      setActiveFile(name);
    };
    r.readAsText(file);
  };

  // ── DnD
  const onDE = e => { e.preventDefault(); dc.current++; setIsDragging(true); };
  const onDL = () => { dc.current--; if(dc.current<=0){dc.current=0;setIsDragging(false);} };
  const onDrop = e => { e.preventDefault(); dc.current=0; setIsDragging(false); loadFile(e.dataTransfer.files[0]); };

  // ── Resizer
  useEffect(() => {
    const mv = e => { if(!rzDrag.current.on) return; setEditorW(Math.max(120,rzDrag.current.w0+e.clientX-rzDrag.current.x0)); };
    const up = () => { rzDrag.current.on=false; };
    window.addEventListener("mousemove",mv); window.addEventListener("mouseup",up);
    return ()=>{ window.removeEventListener("mousemove",mv); window.removeEventListener("mouseup",up); };
  }, []);

  // ── Copy / download export
  const copyOut = type => {
    const txt = type==="md" ? md : (prevRef.current?.innerHTML ?? "");
    navigator.clipboard.writeText(txt).then(()=>{ setCopied(type); setTimeout(()=>setCopied(null),1400); });
  };

  const downloadFile = type => {
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
    } else if (type === "zip") {
      const base = fileName.replace(/\.[^.]+$/, "") || "document";
      const zip = new JSZip();
      const folder = zip.folder(base);
      if (folder) {
        folder.file(`${base}.md`, md);
        const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${fileName}</title>
</head>
<body>${htmlOut}</body>
</html>`;
        folder.file(`${base}.html`, fullHtml);
      }
      zip.generateAsync({ type: "blob" }).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
      return;
    }
    if (!content) return;
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.replace(/\.[^.]+$/, "") + extension;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const normalizeFileName = raw => {
    if (!raw) return "untitled.md";
    const trimmed = raw.trim();
    const parts = trimmed.split("/").filter(Boolean);
    let base = parts.pop() || "untitled";
    base = base.replace(/\s+/g, "-").toLowerCase();
    if (!base.endsWith(".md")) base += ".md";
    const folder = parts.map(p => p.replace(/\s+/g, "-").toLowerCase()).join("/");
    return folder ? `${folder}/${base}` : base;
  };

  // ── Sidebar
  const toggleSB = mode => setSidebar(s=>s===mode?"closed":mode);

  // ── Outline
  const outline = useMemo(() =>
    md.split("\n").filter(l=>/^#{1,3} /.test(l)).map(l=>({ level:l.match(/^(#+)/)[1].length, text:l.replace(/^#+\s/,"") }))
  , [md]);

  const jumpTo = text => {
    if (!prevRef.current) return;
    for (const el of prevRef.current.querySelectorAll("h1,h2,h3"))
      if (el.textContent.trim()===text) { el.scrollIntoView({behavior:"smooth",block:"start"}); break; }
  };

  const words = md.trim() ? md.trim().split(/\s+/).length : 0;
  const lines = md.split("\n").length;
  const sbOpen = sidebar !== "closed";
  const htmlOut = useMemo(()=>parseMarkdown(md), [md]);
  const canUndo = hIdx > 0, canRedo = hIdx < hist.length-1;

  const epStyle = view==="edit"    ? { width:"100%", display:"flex" }
                : view==="preview" ? { width:0, display:"none" }
                : { width: editorW ? `${editorW}px` : "50%", display:"flex" };
  const ppStyle = view==="edit" ? { display:"none" } : { flex:1, display:"flex" };

  const handleShareSession = () => {
    if (typeof window === "undefined") return;
    let id = sessionId;
    if (!id) {
      id = (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID().slice(0, 8) : String(Date.now()));
      setSessionId(id);
      const url = new URL(window.location.href);
      url.hash = `session=${id}`;
      window.history.replaceState({}, "", url.toString());
    }
    const shareUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      showToast("Session link copied to clipboard", "ok");
    } else {
      showToast("Session active – copy URL to share", "ok");
    }
  };

  const handleWhatsAppShare = () => {
    if (!sessionId || typeof window === "undefined") {
      showToast("Start a session first to share", "err");
      return;
    }
    const url = window.location.href;
    const text = encodeURIComponent(`Join my SlateAI Markdown Studio session: ${url}`);
    const waUrl = `https://wa.me/?text=${text}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col h-screen"
      onDragEnter={onDE} onDragLeave={onDL} onDragOver={e=>e.preventDefault()} onDrop={onDrop}>

      {/* Title bar */}
      <div className="titlebar">
        <div className="tc"><div className="gem"/><span>{fileName} — MD Viewer</span></div>
      </div>

      <div className="root">
        {/* Activity bar */}
        <div className="actbar">
          <button className={`ab${sidebar==="files"?" on":""}`} onClick={()=>toggleSB("files")} title="Files">{Ic.folder}</button>
          <button className={`ab${sidebar==="outline"?" on":""}`} onClick={()=>toggleSB("outline")} title="Outline">{Ic.lines}</button>
          <button className={`ab${aiOpen?" on":""}`} onClick={()=>setAiOpen(o=>!o)} title="AI Assistant"
            style={aiOpen?{color:"var(--purple)"}:{}}>{Ic.sparkle}</button>
          <button className="ab bot" title="Settings">{Ic.cog}</button>
        </div>

        {/* File sidebar */}
        <div className="filesb" style={{width:sbOpen?220:0,borderRight:sbOpen?undefined:"none"}}>
          <div className="sb-hd">
            {sidebar==="outline"?"Outline":"Open Files"}
          </div>
          <div className="sb-sc">
            {sidebar==="files" && (
              <>
                {Object.keys(fileTree).sort().map(path => {
                  const segments = path.split("/");
                  const depth = segments.length - 1;
                  const label = segments[segments.length-1];
                  const isActive = path === activeFile;
                  return (
                    <div
                      key={path}
                      className={`fe${isActive ? " on" : ""}`}
                      style={{ paddingLeft: 18 + depth * 10 }}
                      onClick={() => setActiveFile(path)}
                      onContextMenu={e => {
                        e.preventDefault();
                        const choice = (window.prompt("File actions: (n) new file here, (r) rename, (d) delete", "n/r/d") || "").toLowerCase();
                        if (choice.startsWith("n")) {
                          const name = window.prompt("New file name", "untitled.md") || "untitled.md";
                          const folder = segments.slice(0,-1).join("/");
                          const norm = normalizeFileName(folder ? `${folder}/${name}` : name);
                          setFileTree(tree => ({
                            ...tree,
                            [norm]: "",
                          }));
                          setActiveFile(norm);
                        } else if (choice.startsWith("r")) {
                          const name = window.prompt("Rename file", path) || path;
                          const norm = normalizeFileName(name);
                          setFileTree(tree => {
                            const next = {...tree};
                            const content = next[path];
                            delete next[path];
                            next[norm] = content;
                            return next;
                          });
                          if (activeFile === path) setActiveFile(norm);
                        } else if (choice.startsWith("d")) {
                          if (!window.confirm(`Delete ${path}?`)) return;
                          setFileTree(tree => {
                            const next = {...tree};
                            delete next[path];
                            return Object.keys(next).length ? next : { "welcome.md": SAMPLE };
                          });
                          if (activeFile === path) {
                            const remaining = Object.keys(fileTree).filter(p => p !== path);
                            setActiveFile(remaining[0] || "welcome.md");
                          }
                        }
                      }}
                    >
                      <span style={{fontSize:13}}>📄</span>{label}
                    </div>
                  );
                })}
              </>
            )}
            {sidebar==="outline" && (outline.length
              ? outline.map((o,i)=>(
                  <div key={i} className={`oi h${o.level}`} onClick={()=>jumpTo(o.text)}>
                    {"  ".repeat(o.level-1)}{o.level===1?"◈":o.level===2?"◇":"○"} {o.text}
                  </div>))
              : <div style={{padding:"12px 14px",fontSize:11,color:"var(--muted)"}}>No headings found.</div>
            )}
          </div>
        </div>

        {/* Center */}
        <div className="center">
          {/* Tabs */}
          <div className="tabs">
            <button className="tab on">
              <div className="tdot"/>
              <span>{fileName}</span>
              <span className="tx" onClick={()=>{commit("");setFileName("untitled.md");}}>×</span>
            </button>
          </div>

          {/* Formatting bar */}
          <div className="fmtbar">
            <button className="fb" data-tip="Undo ⌘Z" onClick={undo} disabled={!canUndo}>{Ic.undo}</button>
            <button className="fb" data-tip="Redo ⌘⇧Z" onClick={redo} disabled={!canRedo}>{Ic.redo}</button>
            <div className="fsep"/>
            <select className="fsel" value="" onChange={e=>{applyFmt(`h${e.target.value}`);}}>
              <option value="" disabled>Heading</option>
              <option value="1">H1</option><option value="2">H2</option><option value="3">H3</option>
            </select>
            <div className="fsep"/>
            <button className="fb" data-tip="Bold ⌘B" onClick={()=>applyFmt("bold")}><strong>B</strong></button>
            <button className="fb" data-tip="Italic ⌘I" onClick={()=>applyFmt("italic")} style={{fontStyle:"italic",fontFamily:"'Fraunces',serif",fontSize:14}}>I</button>
            <button className="fb" data-tip="Strikethrough" onClick={()=>applyFmt("strike")} style={{textDecoration:"line-through"}}>S</button>
            <button className="fb" data-tip="Inline code" onClick={()=>applyFmt("inlinecode")} style={{fontFamily:"monospace",fontSize:13}}>`</button>
            <div className="fsep"/>
            <button className="fb" data-tip="Bullet list" onClick={()=>applyFmt("ul")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
            </button>
            <button className="fb" data-tip="Numbered list" onClick={()=>applyFmt("ol")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinecap="round"/></svg>
            </button>
            <button className="fb" data-tip="Blockquote" onClick={()=>applyFmt("quote")} style={{fontSize:17,paddingBottom:2}}>"</button>
            <button className="fb" data-tip="Code block" onClick={()=>applyFmt("codeblock")} style={{fontFamily:"monospace",fontSize:11}}>{"</>"}</button>
            <div className="fsep"/>
            <button className="fb" data-tip="Link ⌘K" onClick={()=>applyFmt("link")}>{Ic.link}</button>
            <button className="fb" data-tip="Image" onClick={()=>applyFmt("img")}>{Ic.img}</button>
            <button className="fb" data-tip="Table" onClick={()=>applyFmt("table")}>{Ic.tbl}</button>
            <button className="fb" data-tip="HR" onClick={()=>applyFmt("hr")}>{Ic.hr}</button>
          </div>

          {/* View toolbar */}
          <div className="vtbar">
            <button className="vb" onClick={()=>fileRef.current.click()}>{Ic.open} Open</button>
            <div className="vsep"/>
            <button className={`vb${view==="split"?" on":""}`}   onClick={()=>setView("split")}>⊟ Split</button>
            <button className={`vb${view==="preview"?" on":""}`} onClick={()=>setView("preview")}>{Ic.eye} Preview</button>
            <button className={`vb${view==="edit"?" on":""}`}    onClick={()=>setView("edit")}>{Ic.pencil} Edit</button>
            <div className="vsep"/>
            <button className="vb" onClick={()=>copyOut("md")}>{copied==="md"?"✓ Copied":"⎘ MD"}</button>
            <button className="vb" onClick={()=>copyOut("html")}>{copied==="html"?"✓ Done":"⎘ HTML"}</button>
            <div className="vsep"/>
            <button className="vb" onClick={()=>downloadFile("md")}>↓ Save .md</button>
            <button className="vb" onClick={()=>downloadFile("html")}>↓ Save .html</button>
            <div className="vsep"/>
            <button className={`vb${wordWrap ? " on" : ""}`} onClick={()=>setWordWrap(w=>!w)}>
              ↩ Wrap
            </button>
            <div className="vsep"/>
            <button
              className={`vb${sessionId ? " on" : ""}`}
              onClick={handleShareSession}
            >
              {Ic.share}
              {sessionId ? "Copy link" : "Start session"}
            </button>
            {sessionId && (
              <button className="vb" onClick={handleWhatsAppShare}>
                {Ic.whatsapp} WhatsApp
              </button>
            )}
            <div style={{flex:1}}/>
            <span className="badge">{words}w</span>
            <span className="badge" style={{marginLeft:4}}>{lines}L</span>
          </div>

          {/* Editor area */}
          <div className="ea">
            {showSearch && (
              <div style={{
                position:"absolute",
                top:0,
                left:0,
                right:0,
                height:36,
                background:"var(--s1)",
                borderBottom:"1px solid var(--bd)",
                display:"flex",
                alignItems:"center",
                padding:"0 10px",
                gap:6,
                zIndex:5,
              }}>
                <input
                  style={{
                    background:"var(--s2)",
                    color:"var(--text)",
                    border:"1px solid var(--bd2)",
                    borderRadius:4,
                    fontFamily:"'JetBrains Mono',monospace",
                    fontSize:11,
                    padding:"4px 8px",
                    outline:"none",
                    width:180,
                  }}
                  placeholder="Search…"
                  value={searchText}
                  onChange={e=>setSearchText(e.target.value)}
                  autoFocus
                />
                <input
                  style={{
                    background:"var(--s2)",
                    color:"var(--text)",
                    border:"1px solid var(--bd2)",
                    borderRadius:4,
                    fontFamily:"'JetBrains Mono',monospace",
                    fontSize:11,
                    padding:"4px 8px",
                    outline:"none",
                    width:180,
                  }}
                  placeholder="Replace…"
                  value={replaceText}
                  onChange={e=>setReplaceText(e.target.value)}
                />
                <button
                  className="fb"
                  onClick={()=>{
                    if (!searchText) return;
                    commit(md.replaceAll(searchText, replaceText));
                    showToast("Replaced all occurrences", "ok");
                  }}
                >
                  Replace All
                </button>
                <button className="fb" onClick={()=>setShowSearch(false)}>✕</button>
              </div>
            )}
            {md==="" ? (
              <div className={`dz${isDragging?" drag":""}`}>
                <div className="dzring">{Ic.upload}</div>
                <div className="dztitle">Open a Markdown file</div>
                <div className="dzsub">Drag & drop .md or click below</div>
                <button className="dzbtn" onClick={()=>fileRef.current.click()}>Choose File</button>
              </div>
            ) : (
              <div className="sw">
                {/* Editor */}
                <div className="pane" style={epStyle}>
                  <div className="pt"><div className="pp" style={{background:"var(--acc)"}}/>Source</div>
                  <div className="es">
                    <div className="gut" ref={gutRef}>
                      {md.split("\n").map((_,i)=>(
                        <div key={i} className={`gl${i+1===cursor.ln?" cur":""}`}>{i+1}</div>
                      ))}
                    </div>
                    <textarea ref={taRef} className="raw" value={md}
                      onChange={e=>commit(e.target.value)}
                      onKeyDown={handleTabKey}
                      onKeyUp={trackCursor} onClick={trackCursor} onMouseUp={trackCursor}
                      onScroll={()=>{ if(gutRef.current&&taRef.current) gutRef.current.scrollTop=taRef.current.scrollTop; }}
                      spellCheck={false} placeholder="# Start writing…"
                      style={{ whiteSpace: wordWrap ? "pre-wrap" : "pre", wordBreak: wordWrap ? "break-word" : "normal" }}
                    />
                  </div>
                </div>

                {view==="split" && (
                  <div className="rz" onMouseDown={e=>{rzDrag.current={on:true,x0:e.clientX,w0:e.currentTarget.previousSibling.offsetWidth};}}/>
                )}

                {/* Preview */}
                <div className="pane" style={ppStyle}>
                  <div className="pt"><div className="pp" style={{background:"var(--teal)"}}/>Preview</div>
                  <div className="ps">
                    <div ref={prevRef} className="pb" dangerouslySetInnerHTML={{__html:htmlOut}}/>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Panel */}
        {aiOpen && (
          <div className="aipanel">
            <AIPanel md={md} selection={selection} onApply={handleAIApply}/>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="sbar">
        <div className="si">{Ic.file} Markdown</div>
        <div className="sd"/>
        <div className="si">{fileName}</div>
        <div className="sg"/>
        {sessionId && (
          <>
            <div className="sd"/>
            <div className="si" style={{ fontSize:10 }}>
              Session {sessionId} · {sessionPeers} tab{sessionPeers!==1?"s":""}
            </div>
          </>
        )}
        {selection && <div className="si" style={{color:"rgba(255,255,255,.7)",fontSize:10}}>"{selection.slice(0,30)}{selection.length>30?"…":""}" selected</div>}
        {selection && <div className="sd"/>}
        <div className="si" style={{gap:5}}>
          <span style={{opacity:canUndo?.9:.35,cursor:canUndo?"pointer":"default"}} onClick={undo}>{Ic.undo}</span>
          <span style={{opacity:canRedo?.9:.35,cursor:canRedo?"pointer":"default"}} onClick={redo}>{Ic.redo}</span>
        </div>
        <div className="sd"/>
        <div className="si">Ln {cursor.ln}, Col {cursor.col}</div>
        <div className="sd"/>
        <div className="si">
          <div className="ai-indicator">
            <div className="ai-dot" style={{animationPlayState:aiOpen?"running":"paused",opacity:aiOpen?1:.4}}/>
            AI
          </div>
        </div>
        <div className="sd"/>
        <div className="si">MD Viewer v3</div>
      </div>

      {isDragging && <div className="dgo">{Ic.upload} Drop to open</div>}
      {toast && <div className={`toast${toast.type==="ok"?" ok":""}`}>{toast.type==="ok"?"✓ ":"⚠ "}{toast.msg}</div>}

      <input ref={fileRef} type="file" accept=".md,.markdown,.txt" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])}/>
    </div>
  );
}
