"""
Convert plug-and-play architecture MD → professional print-ready HTML.
- Mermaid.js CDN renders diagrams live
- Print CSS prevents diagrams/tables from splitting across pages
- Professional spacing, colors, and alignment
"""
import markdown
import pathlib
import re

SRC = pathlib.Path(r"C:\Users\VaishnaviGore\.gemini\antigravity\brain\83a551eb-0bed-47dc-8ebd-c4ee33532e99\plug_and_play_modular_architecture.md")
HTML_OUT = pathlib.Path(r"d:\Projects\LMS\AI_Digital_LMS\docs\Plug_and_Play_Architecture_LMS.html")

md_text = SRC.read_text(encoding="utf-8")

# ── 1. Extract mermaid blocks → <pre class="mermaid"> ──
def capture_mermaid(m):
    code = m.group(1).strip()
    return f'\n<div class="diagram-wrapper"><pre class="mermaid">\n{code}\n</pre></div>\n'

md_text = re.sub(r"```mermaid\n(.*?)```", capture_mermaid, md_text, flags=re.DOTALL)

# ── 2. Convert GH-style alerts ──
for atype, color, icon in [
    ("NOTE", "#1f6feb", "ℹ️"), ("TIP", "#238636", "💡"),
    ("IMPORTANT", "#8957e5", "❗"), ("WARNING", "#d29922", "⚠️"),
    ("CAUTION", "#da3633", "🔴"),
]:
    pat = rf'> \[!{atype}\]\n((?:> .*\n?)+)'
    def mk(c, i, t):
        def r(m):
            txt = "\n".join(l.lstrip("> ").rstrip() for l in m.group(1).strip().split("\n"))
            return f'<div class="alert alert-{t.lower()}" style="border-left:4px solid {c};background:{c}18;padding:14px 18px;margin:18px 0;border-radius:6px;font-size:10.5pt">{i} <strong>{t}</strong><br/>{txt}</div>'
        return r
    md_text = re.sub(pat, mk(color, icon, atype), md_text)

# ── 3. Convert markdown → HTML ──
body = markdown.markdown(
    md_text,
    extensions=["tables", "fenced_code", "codehilite", "toc"],
    extension_configs={"codehilite": {"css_class": "code"}},
)

# ── 4. Wrap tables in a container for page-break control ──
body = body.replace("<table>", '<div class="table-wrapper"><table>').replace("</table>", "</table></div>")

# ── 5. Full HTML ──
html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Plug-and-Play Modular Architecture — AI Digital LMS</title>
<style>
/* ===== PAGE & PRINT ===== */
@page {{
    size: A4;
    margin: 2cm 2cm 2.2cm 2cm;
    @bottom-center {{
        content: "AI Digital LMS — Plug-and-Play Architecture  •  Page " counter(page);
        font-size: 8pt;
        color: #888;
        font-family: 'Segoe UI', sans-serif;
    }}
}}

@media print {{
    .no-print {{ display: none !important; }}
    body {{ font-size: 10pt; padding: 0; margin: 0; }}

    /* ★ CRITICAL: prevent splitting diagrams, tables, code across pages */
    .diagram-wrapper {{ page-break-inside: avoid !important; break-inside: avoid !important; }}
    .table-wrapper  {{ page-break-inside: avoid !important; break-inside: avoid !important; }}
    pre             {{ page-break-inside: avoid !important; break-inside: avoid !important; }}
    .alert          {{ page-break-inside: avoid !important; break-inside: avoid !important; }}

    /* Keep headings with their content */
    h1, h2, h3, h4 {{ page-break-after: avoid !important; break-after: avoid !important; }}

    /* Diagrams scale to fit page */
    .diagram-wrapper {{ max-width: 100%; overflow: hidden; }}
    .mermaid svg {{ max-width: 100% !important; height: auto !important; }}
}}

/* ===== BODY & TYPOGRAPHY ===== */
body {{
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.7;
    color: #1e293b;
    max-width: 860px;
    margin: 0 auto;
    padding: 28px 32px;
    background: #fff;
}}

/* ===== HEADINGS ===== */
h1 {{
    color: #0f172a;
    font-size: 24pt;
    font-weight: 700;
    border-bottom: 3px solid #3b82f6;
    padding-bottom: 10px;
    margin-top: 8px;
    margin-bottom: 20px;
    letter-spacing: -0.5px;
}}
h2 {{
    color: #1e3a5f;
    font-size: 16pt;
    font-weight: 600;
    margin-top: 36px;
    margin-bottom: 14px;
    padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
    letter-spacing: -0.3px;
}}
h3 {{
    color: #334155;
    font-size: 13pt;
    font-weight: 600;
    margin-top: 24px;
    margin-bottom: 10px;
}}
h4 {{
    color: #475569;
    font-size: 11pt;
    font-weight: 600;
    margin-top: 18px;
    margin-bottom: 8px;
}}

/* ===== PARAGRAPHS & LISTS ===== */
p {{ margin: 8px 0 12px 0; text-align: justify; }}
ul, ol {{ margin: 8px 0 12px 0; padding-left: 24px; }}
li {{ margin: 4px 0; }}

/* ===== TABLES ===== */
.table-wrapper {{
    margin: 16px 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}}
table {{
    border-collapse: collapse;
    width: 100%;
    font-size: 10pt;
    line-height: 1.5;
}}
th {{
    background: linear-gradient(135deg, #1e3a5f, #2563eb);
    color: #fff;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 9.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}
td {{
    padding: 9px 14px;
    border-bottom: 1px solid #e8ecf1;
    color: #334155;
    vertical-align: top;
}}
tr:nth-child(even) {{ background: #f8fafc; }}
tr:hover {{ background: #f1f5f9; }}

/* ===== CODE ===== */
code {{
    background: #f1f5f9;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 9.5pt;
    font-family: 'Cascadia Code', 'Fira Code', Consolas, monospace;
    color: #be185d;
}}
pre {{
    background: #0f172a;
    color: #e2e8f0;
    padding: 18px 20px;
    border-radius: 8px;
    font-size: 9pt;
    line-height: 1.55;
    overflow-x: auto;
    margin: 14px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    border-left: 4px solid #3b82f6;
}}
pre code {{
    background: none;
    color: #e2e8f0;
    padding: 0;
    font-size: 9pt;
}}

/* ===== DIAGRAMS ===== */
.diagram-wrapper {{
    margin: 20px 0;
    padding: 20px 16px;
    background: linear-gradient(135deg, #f8faff 0%, #eef2ff 100%);
    border: 1.5px solid #c7d2fe;
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 2px 8px rgba(99,102,241,0.08);
}}
.mermaid {{
    font-size: 14px !important;
}}

/* ===== BLOCKQUOTE ===== */
blockquote {{
    border-left: 4px solid #3b82f6;
    margin: 16px 0;
    padding: 10px 18px;
    background: #f8fafc;
    border-radius: 0 6px 6px 0;
    color: #475569;
    font-style: italic;
}}

/* ===== LINKS ===== */
a {{ color: #2563eb; text-decoration: none; }}
a:hover {{ text-decoration: underline; }}

/* ===== HR ===== */
hr {{
    border: none;
    height: 2px;
    background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
    margin: 32px 0;
}}

/* ===== PRINT BAR ===== */
.print-bar {{
    position: fixed;
    top: 0; left: 0; right: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
    color: #fff;
    padding: 12px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    z-index: 9999;
    box-shadow: 0 3px 16px rgba(0,0,0,0.25);
}}
.print-bar button {{
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    border: none;
    padding: 10px 28px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(16,185,129,0.3);
    transition: all 0.2s;
}}
.print-bar button:hover {{ transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,185,129,0.4); }}
.spacer {{ height: 56px; }}

/* ===== COVER-LIKE HEADER ===== */
.doc-header {{
    text-align: center;
    padding: 32px 20px;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #2563eb 100%);
    border-radius: 12px;
    color: #fff;
}}
.doc-header h1 {{ color: #fff; border: none; font-size: 26pt; margin: 0 0 8px 0; }}
.doc-header .subtitle {{ font-size: 12pt; color: #93c5fd; margin: 4px 0; }}
.doc-header .meta {{ font-size: 9pt; color: #94a3b8; margin-top: 12px; }}
</style>
</head>
<body>

<div class="print-bar no-print">
    <span style="font-size:14px"><strong>📄 Plug-and-Play Architecture — AI Digital LMS</strong></span>
    <div style="display:flex;align-items:center;gap:16px">
        <span style="font-size:11px;opacity:0.7">Wait for diagrams to render, then click →</span>
        <button onclick="handlePrint()">📥 Save as PDF</button>
    </div>
</div>
<div class="spacer no-print"></div>

<div class="doc-header">
    <h1>Plug-and-Play Modular Architecture</h1>
    <div class="subtitle">AI Digital LMS — Technical Planning & Implementation Guide</div>
    <div class="subtitle">FastAPI · React + Vite · PostgreSQL · pgvector</div>
    <div class="meta">Document Date: March 2026 &nbsp;|&nbsp; Version 1.0</div>
</div>

{body}

<!-- Mermaid.js CDN — renders diagrams in-browser -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>
    mermaid.initialize({{
        startOnLoad: true,
        theme: 'base',
        themeVariables: {{
            primaryColor: '#dbeafe',
            primaryTextColor: '#1e293b',
            primaryBorderColor: '#3b82f6',
            lineColor: '#3b82f6',
            secondaryColor: '#dcfce7',
            secondaryBorderColor: '#22c55e',
            secondaryTextColor: '#166534',
            tertiaryColor: '#fef3c7',
            tertiaryBorderColor: '#f59e0b',
            tertiaryTextColor: '#92400e',
            noteBkgColor: '#f0fdf4',
            noteTextColor: '#166534',
            noteBorderColor: '#86efac',
            fontSize: '14px',
            fontFamily: 'Segoe UI, sans-serif',
            nodeBorder: '#3b82f6',
            mainBkg: '#dbeafe',
            clusterBkg: '#f1f5f9',
            clusterBorder: '#94a3b8',
            titleColor: '#0f172a',
            edgeLabelBackground: '#fff',
            actorBkg: '#dbeafe',
            actorBorder: '#3b82f6',
            actorTextColor: '#1e293b',
            signalColor: '#3b82f6',
            labelBoxBkgColor: '#dbeafe',
            labelTextColor: '#1e293b'
        }},
        flowchart: {{
            curve: 'basis',
            padding: 24,
            nodeSpacing: 50,
            rankSpacing: 60,
            htmlLabels: true,
            useMaxWidth: true
        }},
        sequence: {{
            mirrorActors: false,
            messageMargin: 40,
            boxMargin: 12,
            actorMargin: 60,
            useMaxWidth: true
        }}
    }});

    function handlePrint() {{
        // Give diagrams extra time to finalize rendering
        const btn = document.querySelector('.print-bar button');
        btn.textContent = '⏳ Preparing...';
        btn.disabled = true;
        setTimeout(() => {{
            window.print();
            btn.textContent = '📥 Save as PDF';
            btn.disabled = false;
        }}, 1500);
    }}

    window.addEventListener('load', () => {{
        const count = document.querySelectorAll('.mermaid').length;
        console.log(`Rendering ${{count}} Mermaid diagrams...`);
        setTimeout(() => {{
            const rendered = document.querySelectorAll('.mermaid svg').length;
            console.log(`✅ ${{rendered}}/${{count}} diagrams rendered`);
        }}, 2000);
    }});
</script>

</body>
</html>"""

HTML_OUT.parent.mkdir(parents=True, exist_ok=True)
HTML_OUT.write_text(html, encoding="utf-8")
print(f"✅ HTML saved to: {HTML_OUT}")
print(f"📌 Open in Chrome/Edge → wait for diagrams → click Save as PDF")
