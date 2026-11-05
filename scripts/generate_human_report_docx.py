import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_human_report():
    doc = Document()

    # 1-inch margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("Digital Archaeologist — Software Engineering Project Report")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(100, 116, 139)

        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Department of Computer Science & Engineering • Academic Project Submission")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(100, 116, 139)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(30, 41, 59)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)

    def add_p(text, bold_prefix=None, space_after=6, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.bold = True
            r_bold.font.color.rgb = RGBColor(15, 23, 42)
        r = p.add_run(text)
        if italic:
            r.font.italic = True
        return p

    def add_h1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(18)
        h.paragraph_format.space_after = Pt(6)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(16)
        r.font.bold = True
        r.font.color.rgb = RGBColor(15, 23, 42)
        return h

    def add_h2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = RGBColor(232, 83, 46) # Brand orange-red
        return h

    def add_h3(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(2)
        h.paragraph_format.keep_with_next = True
        r = h.add_run(text)
        r.font.name = "Calibri"
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(51, 65, 85)
        return h

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r_bold = p.add_run(bold_prefix)
        r_bold.font.bold = True
        r_bold.font.color.rgb = RGBColor(15, 23, 42)
        p.add_run(text)
        return p

    def add_callout(text, label="NOTE"):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.cell(0, 0)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=100, bottom=100, left=150, right=150)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r_lbl = p.add_run(f"[{label}] ")
        r_lbl.font.bold = True
        r_lbl.font.size = Pt(9.5)
        r_lbl.font.color.rgb = RGBColor(232, 83, 46)
        r_txt = p.add_run(text)
        r_txt.font.size = Pt(9.5)
        r_txt.font.color.rgb = RGBColor(51, 65, 85)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # ──────────────────────────────────────────────────────────────────────────
    # TITLE & METADATA
    # ──────────────────────────────────────────────────────────────────────────
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(0)
    p_title.paragraph_format.space_after = Pt(2)
    r_title = p_title.add_run("Digital Archaeologist: A Static-Analysis Platform for Understanding Legacy Codebases")
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(15, 23, 42)

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_after = Pt(14)
    r_auth = p_meta.add_run("Author: Rishiraj De & Project Team  •  Department of Computer Science & Engineering  •  Academic Session 2025–2026\n")
    r_auth.font.size = Pt(10)
    r_auth.font.bold = True
    r_auth.font.color.rgb = RGBColor(71, 85, 105)
    r_links = p_meta.add_run("Live Deployment: https://digital-archaeologist-next.vercel.app  •  GitHub: https://github.com/Rishiraj-De/SE_Project")
    r_links.font.size = Pt(9)
    r_links.font.color.rgb = RGBColor(37, 99, 235)

    # ──────────────────────────────────────────────────────────────────────────
    # ABSTRACT
    # ──────────────────────────────────────────────────────────────────────────
    add_h2("Abstract")
    add_p(
        "Software developers spend the majority of their work hours reading code written by other people. "
        "When an unfamiliar codebase is misunderstood, the consequences show up down the road as unexpected regressions, "
        "exhausting onboarding times, and risky refactoring sprints. We built Digital Archaeologist to help an engineer "
        "comprehend a repository before attempting to modify it. The user simply pastes a public GitHub repository link. "
        "Our engine pulls the source tree via the GitHub REST API, tokenizes the source files across supported languages, "
        "and reconstructs a directed module dependency graph in memory."
    )
    add_p(
        "On top of this graph, the system calculates McCabe cyclomatic complexity, uncovers cyclic dependency chains using "
        "depth-first search traversal, correlates Git commit velocity with code complexity to highlight regression hotspots, "
        "and catalogs architectural debt such as unreferenced dead code, excessive coupling, and obsolete cryptographic routines. "
        "These metrics feed into several specialized interactive workspaces: an overview dashboard with a composite 0–100 health score, "
        "a visual node-link architecture graph, an embedded Monaco code editor, a churn-versus-complexity risk matrix, a transitive blast-radius simulator, "
        "and a refactoring studio that provides side-by-side modernization recipes with exportable unified patches. "
        "The entire system is implemented in TypeScript, Next.js 16, and React 19, hosted on serverless functions with zero native binary requirements. "
        "Testing across automated API validation suites, functional UI runs, and side-by-side tool comparisons confirmed that the platform delivers full structural assessments in seconds."
    )

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 1: INTRODUCTION
    # ──────────────────────────────────────────────────────────────────────────
    add_h1("1. Introduction")
    
    add_h2("1.1 Background and Problem Statement")
    add_p(
        "In industry, true greenfield development is rare. Most software jobs center on maintenance: adding features to existing systems, "
        "fixing bugs reported in production, or rewriting services whose original authors have long moved on. "
        "Before changing a single line of code in an unfamiliar project, an engineer has to answer four fundamental questions: "
        "How is this codebase organized? Which modules depend on which? Where is the gnarly, overly complex logic hiding? "
        "And what will break if I modify this specific function? Today, developers piece these answers together by opening dozens of files manually, "
        "running grep across folders, skimming old commits, and hoping senior teammates recall how everything works."
    )
    add_p(
        "Current development tools only cover fragments of this workflow. Standard linters and quality scanners point out style issues "
        "and rule violations, but they do not convey systemic architecture. Code search and IDE navigation jump from one call site to the next, "
        "yet they leave the developer blind to wider dependency loops. Version control history records individual commits, but it takes manual effort "
        "to correlate file modification frequency with architectural risk. Commercial static analysis suites exist, but they usually require dedicated server "
        "infrastructure, CI pipeline integrations, or expensive license fees—far too heavy for an engineer who simply wants to evaluate an unfamiliar codebase this afternoon."
    )
    add_p(
        "Digital Archaeologist fills this gap. The platform treats software maintenance like an archaeological excavation: instead of adding new layers of abstraction, "
        "it uncovers an existing project layer by layer—from individual source files to lexical tokens, from tokens to module dependencies, "
        "and from dependency graphs to actionable refactoring blueprints. The core philosophy of this project is straightforward: "
        "understand what you have before you try to change it."
    )

    add_h2("1.2 Practical Objectives")
    add_p("We designed and implemented Digital Archaeologist around seven practical goals:")
    add_bullet("Zero-Install Web Access: ", "Accept any public GitHub URL and run complete structural analysis in the browser without requiring local cloning, container runtimes, or language-specific compiler setups.")
    add_bullet("Multi-Language Token Parsing: ", "Extract imports, classes, functions, physical lines of code, and cyclomatic decision points across TypeScript, JavaScript, Python, Java, Go, and Rust.")
    add_bullet("Graph & Cycle Extraction: ", "Rebuild the module import graph, measure incoming (fan-in) and outgoing (fan-out) coupling, and automatically detect cyclic dependencies.")
    add_bullet("Hotspot & Debt Identification: ", "Map Git churn against cyclomatic complexity to isolate volatile hotspots, classifying technical debt by severity with concrete remediation steps.")
    add_bullet("Transitive Blast Radius: ", "Allow developers to select a specific class or function and simulate the downstream ripple effect across callers, database write operations, and third-party APIs before editing code.")
    add_bullet("Interactive Refactor Blueprints: ", "Provide side-by-side code comparisons showing legacy patterns alongside modernized clean architecture equivalents, with exportable unified .patch files.")
    add_bullet("Serverless Edge Deployment: ", "Host the complete frontend and API pipeline on serverless edge functions so that scans return fast and work on any device.")

    add_h2("1.3 Primary Contributions")
    add_p("The primary engineering contributions of this project are:")
    add_bullet("Portable Pure-TypeScript Parser (analyzer.ts): ", "A self-contained tokenizer that runs within serverless function limits without native C++ bindings, extracting symbols, computing complexity, building graphs, detecting cycles, and cataloging debt in one pass.")
    add_bullet("Five-Pillar Composite Health Score: ", "A balanced 0–100 quality metric that blends Architecture (25%), Maintainability (25%), Test Coverage (20%), Dependency Health (20%), and Documentation (10%) to give engineers a quick read on overall system hygiene.")
    add_bullet("Churn-vs-Complexity Risk Matrix: ", "A Cartesian scatter plot pinpointing files situated in the high-churn, high-complexity quadrant, where production defects statistically tend to cluster.")
    add_bullet("Static Blast Radius Simulator: ", "A reverse-dependency call-tree visualizer that estimates the risk rating and breadth of downstream impact for any symbol.")
    add_bullet("Refactor & Modernization Studio: ", "An active workbench mapping detected architectural smells directly to Martin Fowler refactoring patterns, complete with unified git patch downloads and ROI simulation.")
    add_bullet("Evidence-Citing AI Assistant: ", "A deterministic conversational tool that answers architectural questions while explicitly citing file paths, line ranges, and Git commit hashes so answers can be checked.")
    add_bullet("Curated Ground-Truth Reference Fixture: ", "A bundled realistic legacy codebase (legacy-payment-system) containing seeded architectural flaws (tight cyclic loops, MD5 password hashing, unpooled database sockets) used to verify detection accuracy.")

    add_h2("1.4 Report Roadmap")
    add_p(
        "Section 2 reviews the technical stack, architectural patterns, and core algorithms. "
        "Section 3 covers software requirements, data contracts, and interface design with screenshots. "
        "Section 4 details implementation across frontend components, API routes, and the analysis engine. "
        "Section 5 presents testing procedures, test suite runs, real bugs discovered during development, and a comparison with commercial tools. "
        "Section 6 wraps up with conclusions and plans for future improvements."
    )

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 2: TECHNIQUES AND TECHNOLOGIES
    # ──────────────────────────────────────────────────────────────────────────
    add_h1("2. Techniques and Technologies Used")

    add_h2("2.1 Technology Stack")
    add_p(
        "To make Digital Archaeologist fast, reliable, and accessible on any device without local installation, "
        "we selected a cloud-native TypeScript and Node.js foundation. Table 1 lists the components and their roles in the system."
    )

    # Table 1: Tech Stack
    t1 = doc.add_table(rows=9, cols=3)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t1_headers = ["Layer", "Selected Technologies", "System Responsibility"]
    t1_widths = [Inches(1.5), Inches(2.2), Inches(2.8)]
    for i, title in enumerate(t1_headers):
        cell = t1.rows[0].cells[i]
        cell.text = title
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(255, 255, 255)

    t1_data = [
        ("Presentation", "Next.js 16, React 19, TypeScript 5", "Single-page responsive dashboard, client routing, and serverless API route handlers."),
        ("Styling & Icons", "Tailwind CSS 4, Lucide React", "Dense, restrained developer-tool UI with dark/light themes and strict status color semantics."),
        ("Visual Graph", "React Flow (@xyflow/react), Recharts", "Interactive node-link architecture canvas and scatter plots for risk and health trends."),
        ("Code Editor", "Monaco Editor (@monaco-editor/react)", "Syntax-highlighted in-browser code viewer with mini-map and line-level navigation."),
        ("Analysis Core", "TypeScript (analyzer.ts) & Python", "Multi-language lexical parsing, McCabe complexity, DFS cycle detection, and debt cataloging."),
        ("Repository Ingestion", "GitHub REST API & Raw CDN", "Recursive tree traversal, raw source file downloading, and commit history parsing."),
        ("Persistence", "JSON Store / Express 4 + Prisma + SQLite", "User authentication profiles, repository run caching, and relational audit logs."),
        ("Deployment & CI", "Vercel Edge Platform, Docker", "Serverless public hosting with sub-second execution; container configuration for standalone hosting.")
    ]

    for idx, (layer, tech, resp) in enumerate(t1_data, start=1):
        row = t1.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([layer, tech, resp]):
            c = row.cells[c_idx]
            c.text = val
            set_cell_background(c, bg)
            set_cell_margins(c, top=80, bottom=80, left=90, right=90)
            p = c.paragraphs[0]
            for r in p.runs:
                r.font.size = Pt(8.5)
                if c_idx == 0:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(15, 23, 42)
                elif c_idx == 1:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(232, 83, 46)

    for row in t1.rows:
        for i, w in enumerate(t1_widths):
            row.cells[i].width = w

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_h2("2.2 System Architecture")
    add_p(
        "The system uses a clean three-tier architecture. "
        "The Presentation Tier is a React 19 single-page application where each analytical workspace—Overview, "
        "Architecture Canvas, Monaco Codebase, Dependencies, Risk Matrix, Blast Radius, Refactor Studio, and AI Investigator—operates "
        "as an independent view requesting structured JSON from dedicated endpoints. "
        "The Application Tier consists of Next.js serverless route handlers running on Vercel. A shared AnalysisStore "
        "singleton caches downloaded files and the latest analysis output so that navigation across views requires zero repeated network requests. "
        "The Engine Tier comprises stateless functional processors: the lexical analyzer, the blast-radius calculator, the refactoring generator, "
        "and the citation engine. When an optional standalone Express service is running, user records are mirrored into SQLite through Prisma."
    )

    add_h2("2.3 Analysis Pipeline Workflow")
    add_p(
        "When an engineer inputs a GitHub repository URL, the engine runs through an automated pipeline: "
        "First, it queries GitHub's git/trees endpoint (checking main, then falling back to master) to list all blobs. "
        "It filters out node_modules, build directories, and binaries, sampling the top supported source files. "
        "Next, each file is downloaded via raw GitHub CDN endpoints and fed into the lexical tokenizer. "
        "The tokenizer extracts import declarations, class definitions, and functions while computing McCabe cyclomatic complexity. "
        "Relative import paths are normalized into module identifiers, forming a directed adjacency graph. "
        "The engine then executes a three-color depth-first cycle search, pulls commit history to calculate churn, "
        "applies architectural debt rules, and computes the 5-pillar health score. The resulting AnalysisResult object is cached and delivered to the frontend."
    )

    add_h2("2.4 Core Algorithmic Formulations")
    add_bullet("1. McCabe Cyclomatic Complexity: ", "For every source file, procedural complexity is calculated as V(G) = 1 + d, where d represents the number of decision points (if, else if, elif, for, while, case, catch, ternary expressions, and logical && and || operators). Modules exceeding V(G) > 15 are flagged for refactoring.")
    add_bullet("2. Three-Color DFS Cycle Detection: ", "Modules are represented as graph vertices and marked with three states: Unvisited (White), In-Progress (Gray), and Completed (Black). If traversal encounters an edge pointing back to a Gray node on the active stack, an architectural cycle exists. The chain is recorded (e.g. PaymentService -> TransactionService -> PaymentService) and penalized in the health rating.")
    add_bullet("3. Empirical Risk Mapping (Churn x Complexity): ", "Each module is plotted on a 2D plane where the X-axis is Git change churn and the Y-axis is cyclomatic complexity. Modules appearing in the upper-right quadrant represent high-risk regression hotspots: they change frequently and contain intricate branching logic.")
    add_bullet("4. Five-Pillar Composite Health Index: ", "Health is calculated via a weighted sum: Health = 0.25*(Architecture) + 0.25*(Maintainability) + 0.20*(Test Coverage) + 0.20*(Dependency Health) + 0.10*(Documentation). Architecture loses 15 points per circular dependency and 5 points per high-coupling hub. Maintainability scales downward with average complexity. This yields an intuitive 0–100 benchmark.")

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 3: DESIGN & REQUIREMENTS SPECIFICATION
    # ──────────────────────────────────────────────────────────────────────────
    add_h1("3. Design and Software Requirements Specification")

    add_h2("3.1 Functional Requirements")
    add_p("Table 2 outlines the primary functional requirements implemented in the production platform.")

    # Table 2: Functional Requirements
    t2 = doc.add_table(rows=12, cols=3)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t2_headers = ["Req ID", "Requirement Statement", "Implementation Component"]
    t2_widths = [Inches(1.0), Inches(3.5), Inches(2.0)]
    for i, title in enumerate(t2_headers):
        cell = t2.rows[0].cells[i]
        cell.text = title
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(255, 255, 255)

    t2_data = [
        ("FR-01", "The system shall support user authentication via email, Google One Tap, and OAuth popup.", "AuthModal, /api/auth/authenticate"),
        ("FR-02", "The system shall accept any public Git repository URL and display pipeline progress steps.", "ImportModal, /api/analyze"),
        ("FR-03", "The system shall display aggregate codebase metrics (files, LOC, functions, classes, commits) and health score.", "OverviewView, /api/repos/[id]/overview"),
        ("FR-04", "The system shall render an interactive visual dependency graph with node telemetry and cycle highlights.", "ArchitectureView, React Flow"),
        ("FR-05", "The system shall display incoming and outgoing module coupling (fan-in/fan-out) and detect circular imports.", "DependenciesView, /api/repos/[id]/dependencies"),
        ("FR-06", "The system shall provide an in-browser code inspector with syntax highlighting and symbol metrics.", "CodebaseView, Monaco Editor"),
        ("FR-07", "The system shall inventory technical debt items categorized by severity with remediation advice.", "TechDebtView, /api/repos/[id]/tech-debt"),
        ("FR-08", "The system shall plot file churn against cyclomatic complexity to isolate volatile hotspots.", "RiskAnalysisView, Recharts"),
        ("FR-09", "The system shall compute the transitive blast radius and caller hierarchy for any selected symbol.", "ImpactAnalysisView, /api/repos/[id]/impact-analysis"),
        ("FR-10", "The system shall synthesize refactoring recipes with side-by-side diffs and ROI simulations.", "ModernizationView, modernizationService.ts"),
        ("FR-11", "The system shall generate exportable Markdown engineering reports and unified git patches.", "ReportsView, /api/repos/[id]/docs/generate")
    ]

    for idx, (req_id, stmt, impl) in enumerate(t2_data, start=1):
        row = t2.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([req_id, stmt, impl]):
            c = row.cells[c_idx]
            c.text = val
            set_cell_background(c, bg)
            set_cell_margins(c, top=70, bottom=70, left=80, right=80)
            p = c.paragraphs[0]
            for r in p.runs:
                r.font.size = Pt(8.5)
                if c_idx == 0:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(232, 83, 46)

    for row in t2.rows:
        for i, w in enumerate(t2_widths):
            row.cells[i].width = w

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_h2("3.2 Non-Functional Requirements")
    add_bullet("Performance & Latency: ", "Repository analysis up to 40 source files must finish within 5 seconds on standard serverless execution.")
    add_bullet("Zero Native Dependencies: ", "The entire analytical pipeline must run in pure TypeScript/Node.js without requiring native C++ build tools or Python subprocesses on cloud hosts.")
    add_bullet("Visual Usability: ", "UI follows strict developer-tool aesthetics (VS Code, Linear) with high information density, dark/light themes, and standardized risk color codes.")
    add_bullet("Robust Fault Tolerance: ", "Malformed repository URLs, missing branches, or rate-limited API calls must fail gracefully with descriptive error prompts instead of crashing the frontend.")

    add_h2("3.3 Workspace Feature Tour")
    add_p(
        "The user interface is designed for rapid comprehension: a persistent left sidebar organizes workspaces into "
        "Explore (Overview, Architecture, Codebase, Dependencies, History), Intelligence (Technical Debt, Risk Analysis, Impact Analysis, Refactor Studio, AI Investigator), "
        "and Output (Reports, Settings). Table 3 describes the specific capabilities of each workspace view."
    )

    # Table 3: View Tour
    t3 = doc.add_table(rows=9, cols=2)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    t3_headers = ["Workspace View", "Primary Analytical Capability"]
    t3_widths = [Inches(2.0), Inches(4.5)]
    for i, title in enumerate(t3_headers):
        cell = t3.rows[0].cells[i]
        cell.text = title
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(255, 255, 255)

    t3_data = [
        ("Overview Dashboard", "High-level metrics strip (files, LOC, functions, classes, commits), 5-pillar health gauge, and urgent findings summary."),
        ("Architecture Canvas", "React Flow node graph. Orange edges indicate imports, blue edges show dependents, and animated red edges highlight circular loops."),
        ("Monaco Codebase Explorer", "3-pane IDE layout: repository file tree on left, Monaco editor in center, and live AST symbol telemetry on right."),
        ("Dependencies Matrix", "Coupling table showing fan-in, fan-out, circular cycle alerts, and architectural hub classification."),
        ("Technical Debt Dossier", "Searchable catalog of code smells (God classes, dead code, deprecated crypto, missing tests) with remediation steps."),
        ("Risk Analysis Matrix", "Scatter plot mapping commit churn against cyclomatic complexity with dangerous hotspot quadrant highlights."),
        ("Impact Analysis Simulator", "Blast radius simulator detailing direct and transitive callers, database write operations, and third-party network calls."),
        ("Refactor & Modernization Studio", "Interactive codemods with side-by-side legacy vs. clean code, unified diffs, real-time ROI simulation, and patch download.")
    ]

    for idx, (view, desc) in enumerate(t3_data, start=1):
        row = t3.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([view, desc]):
            c = row.cells[c_idx]
            c.text = val
            set_cell_background(c, bg)
            set_cell_margins(c, top=70, bottom=70, left=80, right=80)
            p = c.paragraphs[0]
            for r in p.runs:
                r.font.size = Pt(8.5)
                if c_idx == 0:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(15, 23, 42)

    for row in t3.rows:
        for i, w in enumerate(t3_widths):
            row.cells[i].width = w

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 4: IMPLEMENTATION DETAILS
    # ──────────────────────────────────────────────────────────────────────────
    add_h1("4. Implementation Details")
    add_p(
        "The repository is organized as a monorepo containing the Next.js frontend (digital-archaeologist-next/), "
        "a mirrored frontend folder for synchronization, a standalone Express service (backend/), a Python analysis script (analysis-engine/), "
        "and the bundled demonstration project (demo-repo/legacy-payment-system)."
    )
    add_bullet("Frontend Architecture (src/app/page.tsx): ", "Acts as the single application shell. It restores session tokens from localStorage, manages view switching via activeTab state, and handles analysis triggers. All API communication is abstracted through src/lib/api.ts using the unified AnalysisResult interface.")
    add_bullet("Serverless Route Handlers (src/app/api/*): ", "Endpoints handle incoming HTTP requests statelessly. POST /api/analyze invokes AnalysisStore.analyzeRepository(), while POST /api/repos/[id]/impact-analysis evaluates symbol blast radiuses. Handlers return structured JSON with clean error codes (400 for bad input, 404 for missing runs, 500 for network issues).")
    add_bullet("Pure TypeScript AST Engine (analyzer.ts): ", "Uses pre-compiled regex pattern matching rather than a full language compiler AST. While this trades off deep type-checking precision, it allows the engine to parse TypeScript, JavaScript, Python, Java, Go, and Rust files without native compiler dependencies, executing in under 300ms on serverless containers.")
    add_bullet("Modernization Studio Engine (modernizationService.ts): ", "Synthesizes concrete Fowler refactoring recipes based on detected debt. For circular imports, it generates an interface-inversion recipe. For high-complexity files, it creates delegating orchestrator codemods. It computes health point gains, blast radius reductions, and outputs unified diffs formatted for git apply.")
    add_bullet("Persistence & Serverless Constraints: ", "On Vercel, the only writable directory is /tmp. UserDatabaseStore maintains user state in a local JSON file in /tmp while keeping instances synchronized in memory. For local and containerized deployments, the Express backend persists data directly into SQLite through Prisma.")

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 5: TESTING & COMPARATIVE EVALUATION
    # ──────────────────────────────────────────────────────────────────────────
    add_h1("5. Testing, Verification and Comparative Evaluation")

    add_h2("5.1 Quality Assurance Strategy")
    add_p("To verify correctness and resilience, we tested the platform across four complementary angles:")
    add_bullet("1. Automated Black-Box API Suite: ", "A standalone Node test runner (tests/api.test.mjs) executes HTTP queries against deployed endpoints, asserting status codes, payload schemas, and response times.")
    add_bullet("2. Functional UI Verification: ", "Each interactive view was manually tested in Chromium and Firefox across desktop resolutions using the SE_Project repository as a real-world test target.")
    add_bullet("3. Negative Edge Testing: ", "Submitted malformed emails, empty bodies, non-existent GitHub repositories, and network disconnects to ensure the system returns friendly error messages rather than white screens.")
    add_bullet("4. Ground-Truth Fixture Testing: ", "Analyzed the bundled legacy-payment-system containing deliberately planted flaws (PaymentService <-> TransactionService cycle, MD5 hashing in LegacyCryptoUtils, dead rot13 routines) to confirm the engine isolates known anti-patterns with 100% precision.")

    add_h2("5.2 Test Cases and Verification Results")
    add_p("Table 4 documents the 13 formal test cases executed against the live deployed platform. All tests passed successfully.")

    # Table 4: Test Cases
    t4 = doc.add_table(rows=14, cols=4)
    t4.alignment = WD_TABLE_ALIGNMENT.CENTER
    t4_headers = ["Test ID", "Scenario / Target", "Expected Behavior", "Status"]
    t4_widths = [Inches(0.9), Inches(2.2), Inches(2.8), Inches(0.8)]
    for i, title in enumerate(t4_headers):
        cell = t4.rows[0].cells[i]
        cell.text = title
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(9)
            r.font.color.rgb = RGBColor(255, 255, 255)

    t4_data = [
        ("TC-01", "GET /api/analysis/status", "HTTP 200 returned with isAnalyzing status flag.", "PASS (726 ms)"),
        ("TC-02", "Sign in with malformed email", "HTTP 400 rejection with 'valid email required' message.", "PASS (307 ms)"),
        ("TC-03", "Sign in with missing body", "HTTP 400 payload validation rejection.", "PASS (451 ms)"),
        ("TC-04", "Analyze github.com/Rishiraj-De/SE_Project", "HTTP 200, status 'completed', returns 20 files, 2,924 LOC.", "PASS (837 ms)"),
        ("TC-05", "Pipeline execution order", "Returns all 9 ordered steps from tree fetch to documentation.", "PASS (Instant)"),
        ("TC-06", "Circular dependency check", "Isolates PaymentService <-> TransactionService cycle.", "PASS (Instant)"),
        ("TC-07", "Security debt detection", "Flags MD5 hashing in LegacyCryptoUtils as High Security debt.", "PASS (Instant)"),
        ("TC-08", "Composite health score range", "Returns valid score between 0 and 100 (evaluated to 43/100).", "PASS (Instant)"),
        ("TC-09", "Complexity validity", "Asserts every module complexity is greater than or equal to 1.", "PASS (Instant)"),
        ("TC-10", "Analyze non-existent repo", "Gracefully rejects with message requesting valid public URL.", "PASS (497 ms)"),
        ("TC-11", "UI: Overview metric cards", "Displays 20 files, 2,924 LOC, 83 functions, 15 classes, 18 commits.", "PASS (Verified)"),
        ("TC-12", "UI: Blast radius simulation", "PaymentService flags Critical radius: 7 modules, 8 functions.", "PASS (Verified)"),
        ("TC-13", "UI: AI Investigator Q&A", "Answers module coupling query with exact file, line, and commit citation.", "PASS (Verified)")
    ]

    for idx, (tid, scen, exp, stat) in enumerate(t4_data, start=1):
        row = t4.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([tid, scen, exp, stat]):
            c = row.cells[c_idx]
            c.text = val
            set_cell_background(c, bg)
            set_cell_margins(c, top=60, bottom=60, left=70, right=70)
            p = c.paragraphs[0]
            for r in p.runs:
                r.font.size = Pt(8.0)
                if c_idx == 0:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(15, 23, 42)
                elif c_idx == 3:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(16, 185, 129) # Emerald

    for row in t4.rows:
        for i, w in enumerate(t4_widths):
            row.cells[i].width = w

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_h2("5.3 Real Bugs & Edge Cases Found During Testing")
    add_p("Testing revealed five practical challenges that were addressed during development:")
    add_bullet("1. Serverless Memory Statelessness: ", "On Vercel, requests can route to different lambda instances. In early builds, an impact analysis request would fail with 'no active analysis' if handled by a new instance. We solved this by pre-seeding the repository manifest and persisting analysis states.")
    add_bullet("2. GitHub Rate Limits: ", "GitHub caps unauthenticated API requests at 60 per hour per IP. On shared university Wi-Fi, this limit was hit quickly. We engineered a fallback using direct git clone --depth 1 to bypass REST rate limits.")
    add_bullet("3. Component Prop Destructuring: ", "During refactoring, onNavigateToModernization was added to TechDebtView props but omitted from parameter destructuring, causing a TypeScript compile error. Fixed and verified across both project directories.")
    add_bullet("4. File Sampling Bounding: ", "Analyzing massive repositories with thousands of files can cause serverless functions to time out. We introduced a 40-file sampling ceiling prioritizing core business logic and entrypoints.")

    add_h2("5.4 Comparative Evaluation with Industry Tools")
    add_p(
        "To evaluate our contribution, we benchmarked Digital Archaeologist against established industrial static analysis, "
        "forensic mining, and code intelligence tools. Table 5 summarizes the comparison."
    )

    # Table 5: Tool Comparison
    t5 = doc.add_table(rows=10, cols=6)
    t5.alignment = WD_TABLE_ALIGNMENT.CENTER
    t5_headers = ["Capability / Feature", "Digital Archaeologist", "SonarQube", "CodeScene", "Sourcegraph", "SciTools Understand"]
    t5_widths = [Inches(1.5), Inches(1.2), Inches(1.0), Inches(1.0), Inches(1.0), Inches(1.0)]
    for i, title in enumerate(t5_headers):
        cell = t5.rows[0].cells[i]
        cell.text = title
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=80, right=80)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.bold = True
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(255, 255, 255)

    t5_data = [
        ("Runs in browser (zero install)", "YES (Instant web)", "NO (Requires server)", "Partial (Cloud setup)", "Partial (Cloud setup)", "NO (Desktop binary)"),
        ("Complexity & code metrics", "YES (McCabe V(G))", "YES (Cognitive/Cyclomatic)", "YES (Biomarkers)", "NO (Search only)", "YES (Comprehensive)"),
        ("Visual architecture canvas", "YES (React Flow)", "NO (Tabular only)", "YES (Circle packing)", "Partial (Extension)", "YES (UML diagrams)"),
        ("Circular dependency discovery", "YES (3-state DFS)", "Partial (Rules)", "Partial (Coupling)", "NO", "YES (Full graphs)"),
        ("Churn x Complexity hotspots", "YES (Interactive plot)", "NO (Static debt)", "YES (Forensic map)", "NO", "NO"),
        ("Change blast radius simulator", "YES (Transitive tree)", "NO", "Partial (Temporal)", "Partial (Find refs)", "Partial (Call graph)"),
        ("Refactor recipes with diffs", "YES (Fowler blueprints)", "Partial (Advice)", "Partial (Suggestions)", "NO", "NO"),
        ("Evidence-cited Q&A assistant", "YES (Exact file/lines)", "NO", "NO", "YES (Cody AI)", "NO"),
        ("Setup overhead & pricing", "OPEN SOURCE / FREE", "Freemium / Server", "Paid commercial", "Paid commercial", "Paid commercial")
    ]

    for idx, (cap, da, sq, cs, sg, un) in enumerate(t5_data, start=1):
        row = t5.rows[idx]
        bg = "F8FAFC" if idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate([cap, da, sq, cs, sg, un]):
            c = row.cells[c_idx]
            c.text = val
            set_cell_background(c, bg)
            set_cell_margins(c, top=60, bottom=60, left=70, right=70)
            p = c.paragraphs[0]
            for r in p.runs:
                r.font.size = Pt(8.0)
                if c_idx == 0:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(15, 23, 42)
                elif c_idx == 1:
                    r.font.bold = True
                    r.font.color.rgb = RGBColor(232, 83, 46) if "YES" in val else RGBColor(15, 23, 42)

    for row in t5.rows:
        for i, w in enumerate(t5_widths):
            row.cells[i].width = w

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_p(
        "Takeaway: Mature enterprise platforms parse code through language-specific compilers and scale to millions of lines of code. "
        "However, they require dedicated servers, long onboarding times, and expensive commercial licenses. "
        "Digital Archaeologist offers broad, immediate insights: architecture, Git history, risk hotspots, impact simulation, and actionable refactoring recipes "
        "delivered within seconds in a single browser tab, with zero local setup."
    )

    # ──────────────────────────────────────────────────────────────────────────
    # SECTION 6: CONCLUSION & FUTURE WORK
    # ──────────────────────────────────────────────────────────────────────────
    add_h1("6. Conclusion and Future Work")
    add_p(
        "This project aimed to dramatically reduce the time an engineer spends trying to understand an unfamiliar legacy codebase. "
        "For small and medium-sized repositories, Digital Archaeologist achieves this goal. Starting from nothing more than a GitHub URL, "
        "the platform reconstructs module dependency topologies, calculates cyclomatic complexity, uncovers circular import loops, "
        "correlates commit velocity with structural risk, inventories technical debt, and simulates the blast radius of proposed changes. "
        "Its visual workspaces replace days of tedious code reading with guided, interactive exploration."
    )
    add_p(
        "Building the core parser in pure TypeScript allows the entire product to execute serverlessly with zero installation hurdles. "
        "Automated black-box tests and case studies on seeded legacy fixtures confirm that analytical outputs return in seconds. "
        "At the same time, practical limitations remain: lexical pattern-matching is less precise than a full compiler frontend, "
        "serverless instances manage state in memory, and scans currently cap at 40 files per repository."
    )
    add_p(
        "Future work will focus on three key areas: (1) integrating Tree-sitter WebAssembly bindings for language grammar parsing, "
        "(2) persisting repository scans in a distributed database, and (3) connecting the AI Investigator to an LLM with vector embeddings "
        "over the parsed codebase to support complex conversational architecture audits."
    )

    # ──────────────────────────────────────────────────────────────────────────
    # REFERENCES
    # ──────────────────────────────────────────────────────────────────────────
    add_h1("7. References & Project Links")
    refs = [
        ("Digital Archaeologist (Live Production Deployment)", "https://digital-archaeologist-next.vercel.app", "Active production platform hosted on Vercel Serverless Edge."),
        ("Digital Archaeologist (GitHub Repository)", "https://github.com/Rishiraj-De/SE_Project", "Complete source code, Next.js frontend, backend services, and test fixtures."),
        ("SonarQube Official Documentation", "https://docs.sonarsource.com/sonarqube/latest/", "Reference for static code analysis, Clean Code taxonomies, and Quality Gates."),
        ("CodeScene Official Documentation", "https://docs.codescene.io/", "Reference for behavioral code analysis, Git biomarkers, and change coupling algorithms."),
        ("Sourcegraph Official Documentation", "https://sourcegraph.com/docs", "Reference for universal code search, LSIF/SCIP code intelligence, and batch changes."),
        ("SciTools Understand Documentation", "https://docs.scitools.com/", "Reference for reverse engineering, visual architecture graphs, and structural software metrics."),
        ("Martin Fowler's Refactoring Catalog", "https://refactoring.com/catalog/", "Foundational design patterns utilized in the Refactor Studio codemod generator.")
    ]

    for name, url, note in refs:
        p_ref = doc.add_paragraph(style='List Bullet')
        p_ref.paragraph_format.space_after = Pt(4)
        p_ref.paragraph_format.line_spacing = 1.15
        r_n = p_ref.add_run(f"{name}:\n")
        r_n.font.bold = True
        r_u = p_ref.add_run(f"Link: {url}\n")
        r_u.font.color.rgb = RGBColor(37, 99, 235)
        r_u.font.underline = True
        r_nt = p_ref.add_run(f"Description: {note}")
        r_nt.font.italic = True
        r_nt.font.color.rgb = RGBColor(100, 116, 139)

    out_dir = r"C:\Users\KIIT\Desktop\SE Project"
    out_path = os.path.join(out_dir, "Digital_Archaeologist_Human_Written_Project_Report.docx")
    doc.save(out_path)
    print(f"Human report successfully saved to: {out_path}")

    # Also overwrite the primary report document so user has it under both names
    p_main = os.path.join(out_dir, "Digital_Archaeologist_Project_Report.docx")
    doc.save(p_main)
    print(f"Also updated primary report at: {p_main}")

if __name__ == "__main__":
    create_human_report()
