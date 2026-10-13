# Digital Archaeologist

> **"Understand existing software before changing it."**

Digital Archaeologist is an intelligent software-maintenance and legacy-code analysis platform built for professional software engineers inheriting unfamiliar or legacy codebases.

Unlike generic AI SaaS dashboards, Digital Archaeologist uses a **restrained, technical, editorial visual language** inspired by serious developer tools (GitHub, Linear, Raycast, and VS Code) with high information density, subtle separators, a dark slate / light theme, and strict semantic status colors.

---

## Key Features

1. **Repository Onboarding & Real Pipeline Tracker**
   - Accept public or authenticated GitHub repository URLs, or load the bundled realistic demo codebase (`legacy-payment-system`).
   - Displays real-time multi-stage pipeline status (Cloning -> AST Generation -> Dependency Extraction -> Git Churn -> Architecture Reconstruction -> Risk Matrix).

2. **Executive Engineering Overview**
   - High-level restrained metric line (Files, Total LOC, Functions, Classes, Contributors, Commits).
   - Composite **68/100 Engineering Health Index** with horizontal breakdowns: Architecture, Maintainability, Test Coverage, Documentation, and Dependency Health.
   - Immediate Attention alerts highlighting circular loops and security deprecations.

3. **Interactive Architecture Canvas**
   - React Flow visual graph mapping Services, Controllers, Repositories, Utilities, and Database Singletons.
   - Animated highlights on circular dependencies (`PaymentService <-> TransactionService`).
   - Search/filter controls and right-side inspector drawer with LOC, cyclomatic complexity, fan-in/fan-out, and change frequency gauges.

4. **Dependency Explorer & Coupling Matrix**
   - Filterable module table showing fan-in (dependents), fan-out (depends-on), and circular loops.
   - Identifies architectural hubs and single points of failure.

5. **Codebase Explorer with Monaco Editor**
   - VS-Code-inspired 3-pane layout: File explorer on the left, full Monaco Editor in the center (syntax highlighting, line numbers, mini-map), and AST symbol metrics on the right.
   - One-click triggers for Blast Radius Analysis and contextual AI explanation.

6. **Git History & Churn Dynamics**
   - Historical milestone timeline across commit years (2021–2024).
   - "Most Volatile Files (Churn)" ranking identifying files modified most frequently in Git history.
   - Full chronological commit log with author signatures and hashes.

7. **Technical Debt Workspace**
   - Structured tabular catalog with severity badges (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - Classifies debt across: High Complexity, Circular Dependencies, Dead Code Candidates, High Coupling, Missing Tests, and Insecure/Deprecated APIs.
   - Concrete remediation advice for each finding.

8. **Risk Analysis: Churn vs. Complexity Matrix**
   - Recharts scatter plot mapping **Historical Change Frequency (X-axis)** against **Cyclomatic Complexity (Y-axis)**.
   - Highlights the Critical Quadrant Hotspot (`PaymentService.ts`).
   - Interactive point selection with module breakdown.

9. **Static Blast Radius & Transitive Impact Analysis**
   - Enter any function or symbol (e.g. `PaymentService.processPayment()` or `AuthController.login()`).
   - Computes transitive caller/dependent call tree, affected module counts, SQL write operations, and external gateway endpoints.
   - Non-dogmatic engineering reasoning and verification advice.

10. **Contextual AI Assistant with Concrete Citations**
    - 3-column layout: Active Index Context | Conversation | Citation Inspector.
    - Cites exact file paths, line numbers, code snippets, and Git commit hashes.
    - Pluggable `LLMProvider` architecture (Local deterministic AST engine vs. OpenAI).

11. **Documentation Generator & Audit Reports**
    - Generates structured Markdown documentation for modules and flows.
    - Executive Assessment Report with instant clipboard copy and printable PDF view.

12. **Settings & Themes**
    - Toggle between Graphite Dark Developer Mode and Light Slate Mode.
    - Configure AI Providers and GitHub Personal Access Tokens.

---

## Bundled Demo Codebase: `legacy-payment-system`

Located at `demo-repo/legacy-payment-system`:
- `src/payment/PaymentService.ts`: Cyclomatic complexity 18 with nested gateway branches; circular dependency to `TransactionService`.
- `src/payment/TransactionService.ts`: Reciprocal import calling `PaymentService.refundPayment`.
- `src/auth/AuthController.ts`: Missing test coverage; invokes deprecated MD5 hasher.
- `src/database/DatabaseConnector.ts`: Global singleton with 6 direct dependents.
- `src/utils/LegacyCryptoUtils.ts`: Dead code candidates (`unused_rot13_obfuscate`, `legacy_xor_cipher`) and deprecated MD5 algorithm (`legacy_v1_encrypt`).
- Real Git repository with multiple historical commits spanning 2021 to 2024 across 4 authors.

---

## Getting Started

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (v3.9+) with `pip`
- **Git**

### 2. Start the Backend API
```bash
cd backend
npm install
npm run dev
```
The backend API starts on `http://localhost:5000/api`.

### 3. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The Next.js UI is accessible at `http://localhost:3000`.

### 4. Run Analysis Engine Standalone
```bash
python analysis-engine/analyzer.py demo-repo/legacy-payment-system
```
Outputs parsed AST symbols, complexity scores, Git churn, circular dependencies, and risk points in JSON.
