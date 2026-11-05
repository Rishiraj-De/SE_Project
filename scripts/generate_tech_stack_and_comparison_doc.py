import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_background(cell, hex_color):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tc_pr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tc_mar.append(node)
    tc_pr.append(tc_mar)

def create_document():
    doc = docx.Document()

    # Set page margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # ──────────────────────────────────────────────────────────────────────────
    # TITLE & METADATA
    # ──────────────────────────────────────────────────────────────────────────
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    run_title = title_p.add_run("Digital Archaeologist")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(0xE8, 0x53, 0x2E)

    subtitle_p = doc.add_paragraph()
    subtitle_p.paragraph_format.space_before = Pt(0)
    subtitle_p.paragraph_format.space_after = Pt(16)
    run_sub = subtitle_p.add_run("Comprehensive Technology Stack & Industry Benchmark Analysis")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(14)
    run_sub.font.bold = True
    run_sub.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_after = Pt(20)
    meta_run = meta_p.add_run("Document Version: 2.1  |  System: Cloud-Native Next.js / Serverless AST Engine  |  Date: November 2026")
    meta_run.font.size = Pt(9.5)
    meta_run.font.italic = True
    meta_run.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Divider line
    p_div = doc.add_paragraph()
    p_div.paragraph_format.space_after = Pt(18)
    p_div_run = p_div.add_run("―" * 55)
    p_div_run.font.color.rgb = RGBColor(0xCB, 0xD5, 0xE1)

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 1: EXECUTIVE SUMMARY
    # ──────────────────────────────────────────────────────────────────────────
    h1 = doc.add_heading("1. Executive Architecture Summary", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(8)

    p1 = doc.add_paragraph(
        "Digital Archaeologist is an intelligent software-maintenance and legacy-code comprehension platform "
        "designed for professional software engineers inheriting unfamiliar codebases. Operating on the core "
        "principle of 'understand existing software before modifying it,' the platform ingests Git repositories, "
        "reconstructs system architecture graphs from Abstract Syntax Trees (AST), quantifies technical debt, "
        "evaluates change impact (blast radius), and synthesizes automated, actionable Clean Architecture refactoring recipes."
    )
    p1.paragraph_format.space_after = Pt(14)
    p1.paragraph_format.line_spacing = 1.15

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 2: TECHNOLOGY STACK BREAKDOWN
    # ──────────────────────────────────────────────────────────────────────────
    h2 = doc.add_heading("2. Comprehensive Technology Stack Architecture", level=1)
    h2.paragraph_format.space_before = Pt(16)
    h2.paragraph_format.space_after = Pt(8)

    layers = [
        ("A. Presentation & Visual Engineering Layer", [
            ("Next.js 16 (App Router)", "React framework providing Turbopack bundling, server-side rendering, streaming layout transitions, and native edge route handlers."),
            ("React 19 & TypeScript 5", "Modern reactive UI primitives with strict static type safety, custom hook state isolation, and zero-runtime overhead typing."),
            ("Tailwind CSS 4", "High-performance utility-first CSS engine implementing an editorial, VS Code- and Linear-inspired dark/light slate visual language."),
            ("Monaco Editor (@monaco-editor/react)", "The core code editing engine powering VS Code embedded in the browser, featuring full syntax highlighting, AST symbol inspection, and line numbers."),
            ("React Flow (@xyflow/react)", "Interactive visual canvas mapping software modules, controllers, repositories, database singletons, and animated circular dependency edges."),
            ("Recharts", "Data visualization charting suite rendering the Churn vs. Cyclomatic Complexity scatter matrix and interactive composite Architecture Health gauges."),
            ("Lucide React", "Restrained, semantic iconography library strictly color-coded for architectural risk (Critical, High, Medium, Low).")
        ]),
        ("B. Forensic AST Analysis & Algorithmic Engine", [
            ("Pure TypeScript Lexical Tokenizer", "Portable AST tokenizer executing in under 300ms on Vercel Serverless Functions with zero native binary dependencies (Node.js/C++ bindings)."),
            ("McCabe Cyclomatic Complexity Engine", "Calculates decision point density V(G) = 1 + Decision Points across conditional, looping, and branching control-flow expressions."),
            ("Cycle Detection Traversal", "Depth-First Search (DFS) / Tarjan's graph cycle analysis to detect bi-directional and transitive circular module imports."),
            ("Static Blast Radius Calculator", "Breadth-first call-tree traversal evaluating symbol fan-in, fan-out, and downstream impact risk when modifying legacy functions."),
            ("Codemod & Refactor Engine", "Synthesizes automated Martin Fowler refactoring blueprints, side-by-side legacy vs. modern clean comparisons, and unified git patch diffs.")
        ]),
        ("C. Backend, Persistence & Security Layer", [
            ("Next.js Serverless API Routes", "Full-featured JSON REST API endpoints (/api/analyze, /api/repos/[id]/*) hosted as auto-scaling Vercel serverless micro-lambdas."),
            ("Express.js + TypeScript Service", "Alternative standalone backend service (backend/src/server.ts) for containerized enterprise hosting environments."),
            ("Prisma ORM & SQLite", "Type-safe database abstraction client for local persistence, analysis record caching, and repository history."),
            ("Zod Schema Boundary Guards", "Runtime payload validation ensuring compile-time and runtime type alignment and preventing prototype pollution."),
            ("Google Identity Services", "OAuth 2.0 authentication integration with Google One Tap and credential token verification.")
        ]),
        ("D. DevOps, Cloud & CI/CD", [
            ("Vercel Cloud Platform", "Global edge routing, automated branch preview deployments, and sub-second serverless execution."),
            ("Docker Multi-Stage Build", "Portable containerized packaging configured via Dockerfile for independent cloud deployments on Render or AWS ECS.")
        ])
    ]

    for layer_title, items in layers:
        h3 = doc.add_heading(layer_title, level=2)
        h3.paragraph_format.space_before = Pt(10)
        h3.paragraph_format.space_after = Pt(4)
        for tech, desc in items:
            p_item = doc.add_paragraph(style='List Bullet')
            p_item.paragraph_format.space_after = Pt(3)
            p_item.paragraph_format.line_spacing = 1.15
            run_b = p_item.add_run(f"{tech}: ")
            run_b.bold = True
            run_b.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
            p_item.add_run(desc)

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 3: REFACTOR & MODERNIZATION STUDIO
    # ──────────────────────────────────────────────────────────────────────────
    h3_sec = doc.add_heading("3. Refactor & Modernization Studio: Purpose and Industry Impact", level=1)
    h3_sec.paragraph_format.space_before = Pt(16)
    h3_sec.paragraph_format.space_after = Pt(8)

    p_studio = doc.add_paragraph(
        "Traditional static analysis tools (e.g., SonarQube, ESLint) generate 'passive criticism'—flagging "
        "hundreds of complexity warnings without actionable guidance on how to fix them. The Refactor & "
        "Modernization Studio transforms Digital Archaeologist into an active software evolution workbench:"
    )
    p_studio.paragraph_format.space_after = Pt(8)
    p_studio.paragraph_format.line_spacing = 1.15

    studio_points = [
        ("Actionable Martin Fowler Blueprints", "Instead of generic warnings, the studio dynamically synthesizes concrete architectural codemods tailored to the repository's AST (e.g., God Class splitting, Interface Inversion, Async Event-Loop offloading, and Declarative Rule Registries)."),
        ("Real-Time Architecture ROI Simulator", "An interactive simulation engine allowing engineering teams to toggle candidate refactoring recipes and observe projected gains (e.g., Health Index improving from 59/100 to 92/100, Blast Radius reduced by 48%) with estimated sprint velocity (hours/sprints)."),
        ("Side-by-Side Code Diffs", "Displays paired code comparisons contrasting coupled legacy patterns against Clean Architecture implementations with type annotations and dependency injection."),
        ("One-Click Git Patch Export", "Generates standard unified .patch files ready for instant developer execution via 'git apply modernization_plan.patch'.")
    ]

    for title, detail in studio_points:
        p_pt = doc.add_paragraph(style='List Bullet')
        p_pt.paragraph_format.space_after = Pt(4)
        p_pt.paragraph_format.line_spacing = 1.15
        r_title = p_pt.add_run(f"{title}: ")
        r_title.bold = True
        p_pt.add_run(detail)

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 4: COMPETITIVE COMPARISON TABLE
    # ──────────────────────────────────────────────────────────────────────────
    h4 = doc.add_heading("4. Industry Benchmark & Feature Comparison Table", level=1)
    h4.paragraph_format.space_before = Pt(18)
    h4.paragraph_format.space_after = Pt(8)

    p_table_intro = doc.add_paragraph(
        "The following matrix benchmarks Digital Archaeologist against market-leading enterprise "
        "and open-source developer tooling across forensic analysis, static linting, code intelligence, and automated migrations:"
    )
    p_table_intro.paragraph_format.space_after = Pt(10)

    # Table: 10 rows, 6 columns
    table = doc.add_table(rows=10, cols=6)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    headers = [
        "Feature / Metric",
        "Digital Archaeologist\n(Our Platform)",
        "CodeScene\n(Forensics)",
        "SonarQube\n(Static QA)",
        "Sourcegraph\n(Intelligence)",
        "Moderne / Rewrite\n(Batch Migrations)"
    ]

    col_widths = [Inches(1.5), Inches(1.3), Inches(1.1), Inches(1.1), Inches(1.1), Inches(1.1)]

    # Style Header
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "1E293B")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(8.5)
            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

    data_rows = [
        ("Primary Capability", "Legacy architecture comprehension, AST forensics, and interactive refactoring blueprints", "Git behavioral forensics, technical debt biomarkers, and team coordination", "Static rule-based linting, security vulnerability checks, and quality gates", "Universal semantic code search, cross-repo navigation, and batch edits", "Automated framework upgrades and recipe-based AST batch migrations"),
        ("Interactive Refactor Studio", "YES\n(Side-by-side legacy vs. clean code, Fowler patterns, git diffs)", "Partial\n(Identifies targets, no integrated patch editor)", "NO\n(Provides static recommendations without diff editors)", "NO\n(Search and manual edits via batch changes)", "YES\n(Automated Lossless Semantic Tree transforms)"),
        ("Real-Time Architecture ROI Simulator", "YES\n(Interactive slider projecting health score gain & risk reduction)", "NO\n(Monetary tech debt interest estimates, no live simulation)", "NO\n(Displays static remediation estimates in minutes/days)", "NO\n(Search platform without debt ROI modeling)", "NO\n(Focuses on recipe execution without ROI simulation)"),
        ("Interactive Visual Architecture Canvas", "YES\n(React Flow node canvas with animated circular dependency loops)", "YES\n(Enclosure circle-packing and hotspot visualizations)", "NO\n(Tabular module metrics and dependency lists)", "Partial\n(Community extensions for dependency graphs)", "NO\n(Code transformation pipeline without graph canvas)"),
        ("Blast Radius & Impact Analysis", "YES\n(Symbol-level caller/callee transitive risk tree)", "YES\n(Temporal change coupling and co-change analysis)", "NO\n(File-level static analysis only)", "Partial\n(Cross-repository find-references)", "Partial\n(Lists impacted recipe runs)"),
        ("In-Browser IDE & Code Inspection", "YES\n(Embedded Monaco Editor with live AST symbol sidebar)", "NO\n(Deep links to external GitHub/GitLab PRs)", "NO\n(Read-only code snippet viewer)", "YES\n(Custom web-based code viewer)", "NO\n(Generates Git branches and PRs)"),
        ("Exportable Git Patch (.patch)", "YES\n(One-click download ready for local 'git apply')", "NO\n(PR review comments and integrations)", "NO\n(Manual fixes required)", "YES\n(Batch changes via Git PRs)", "YES\n(Direct Git commits and PR branches)"),
        ("Deployment & Operational Footprint", "ZERO-INSTALL\n(Runs in Vercel Serverless / browser in seconds)", "Cloud SaaS or On-Premise Docker Enterprise", "Heavy multi-tier server (Java VM, PostgreSQL/Oracle)", "Enterprise multi-container cluster / Cloud SaaS", "Cloud SaaS / CLI engine"),
        ("Licensing & Cost", "OPEN SOURCE / FREE\n(Academic & Community Access)", "Paid Commercial\n(Subscription per active developer)", "Freemium Community /\nPaid Enterprise Tiers", "Paid Enterprise Commercial", "Paid Enterprise Commercial")
    ]

    for row_idx, data in enumerate(data_rows, start=1):
        row_cells = table.rows[row_idx].cells
        bg_color = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(data):
            row_cells[col_idx].text = cell_value
            set_cell_background(row_cells[col_idx], bg_color)
            set_cell_margins(row_cells[col_idx], top=90, bottom=90, left=80, right=80)
            p = row_cells[col_idx].paragraphs[0]
            for run in p.runs:
                run.font.size = Pt(8.0)
                if col_idx == 0:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)
                elif col_idx == 1:
                    run.font.bold = True
                    run.font.color.rgb = RGBColor(0xE8, 0x53, 0x2E) if "YES" in cell_value or "ZERO" in cell_value else RGBColor(0x33, 0x41, 0x55)
                else:
                    run.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    # Set column widths
    for row in table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 5: KEY COMPETITIVE DIFFERENTIATORS
    # ──────────────────────────────────────────────────────────────────────────
    h5 = doc.add_heading("5. Key Architectural Differentiators", level=1)
    h5.paragraph_format.space_before = Pt(18)
    h5.paragraph_format.space_after = Pt(8)

    diffs = [
        ("Bridging the Diagnostic-Execution Gap", "Traditional static tools criticize code quality but provide no actionable remedy. Digital Archaeologist automatically pairs detected code smells with verified Martin Fowler refactoring blueprints, unified diffs, and validation tests."),
        ("Data-Driven Stakeholder Alignment", "Engineering leaders can leverage the ROI Simulator during sprint planning to prove the business value of refactoring tasks before writing code, calculating explicit point gains and risk reductions."),
        ("Zero-Install Frictionless Access", "Unlike enterprise platforms requiring days of cluster setup or database provisioning, Digital Archaeologist runs immediately on the web through serverless AST tokenization, analyzing public and authenticated Git repositories on demand."),
        ("Context-Aware Cross-View Navigation", "Deep contextual hand-off connects the Architecture Graph, Codebase Monaco Editor, Technical Debt Table, Blast Radius Simulator, and AI Investigator seamlessly.")
    ]

    for title, desc in diffs:
        p_d = doc.add_paragraph(style='List Bullet')
        p_d.paragraph_format.space_after = Pt(4)
        p_d.paragraph_format.line_spacing = 1.15
        r_t = p_d.add_run(f"{title}: ")
        r_t.bold = True
        p_d.add_run(desc)

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 6: OFFICIAL DOCUMENTATION LINKS
    # ──────────────────────────────────────────────────────────────────────────
    h6 = doc.add_heading("6. Official Documentation & Reference Links", level=1)
    h6.paragraph_format.space_before = Pt(18)
    h6.paragraph_format.space_after = Pt(8)

    links = [
        ("Digital Archaeologist (Live Production Deployment)", "https://digital-archaeologist-next.vercel.app", "The live web deployment of our platform running on Vercel Serverless Edge infrastructure."),
        ("Digital Archaeologist (GitHub Repository)", "https://github.com/Rishiraj-De/SE_Project", "Complete source code repository containing Next.js 16 frontend, backend services, and AST engine."),
        ("CodeScene Official Documentation", "https://docs.codescene.io/", "Official reference for behavioral code analysis, Git biomarker metrics, and change coupling algorithms."),
        ("SonarQube Official Documentation", "https://docs.sonarsource.com/sonarqube/latest/", "Documentation covering SonarQube Clean Code taxonomy, Quality Gate enforcement, and Cognitive Complexity."),
        ("Sourcegraph Official Documentation", "https://sourcegraph.com/docs", "Reference guide for universal code search, Precise Code Intelligence (LSIF/SCIP), and Batch Changes."),
        ("Moderne (OpenRewrite) Official Documentation", "https://docs.moderne.io/", "Documentation for large-scale automated code refactoring, recipe catalogs, and Lossless Semantic Trees (LST)."),
        ("Martin Fowler's Refactoring Catalog", "https://refactoring.com/catalog/", "The foundational architectural catalog upon which the Refactor Studio codemod patterns are based.")
    ]

    for name, url, note in links:
        p_link = doc.add_paragraph(style='List Bullet')
        p_link.paragraph_format.space_after = Pt(4)
        p_link.paragraph_format.line_spacing = 1.15
        r_name = p_link.add_run(f"{name}:\n")
        r_name.bold = True
        r_url = p_link.add_run(f"Link: {url}\n")
        r_url.font.color.rgb = RGBColor(0x25, 0x63, 0xEB)
        r_url.font.underline = True
        r_note = p_link.add_run(f"Note: {note}")
        r_note.font.italic = True
        r_note.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Save document
    out_dir = r"C:\Users\KIIT\Desktop\SE Project"
    out_path = os.path.join(out_dir, "Digital_Archaeologist_Tech_Stack_and_Competitive_Analysis.docx")
    doc.save(out_path)
    print(f"Document successfully created at: {out_path}")

if __name__ == "__main__":
    create_document()

