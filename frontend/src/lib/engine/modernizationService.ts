import { AnalysisResult, RefactoringRecipe } from "../types";

/**
 * Modernization & Refactor Studio Engine
 * Dynamically synthesizes actionable refactoring recipes, architectural codemods,
 * and unified .patch diffs from the analyzed repository (AST, cycles, debt, and files).
 * Tailored specifically to the GitHub repository provided by the user.
 */
export function generateModernizationPlan(analysis: AnalysisResult | null): RefactoringRecipe[] {
  const recipes: RefactoringRecipe[] = [];

  const repoUrl = analysis?.repoUrl || "https://github.com/Rishiraj-De/SE_Project";
  const repoName = analysis?.repoName || "SE_Project";
  const isDefaultSEProject =
    !analysis ||
    repoUrl.includes("SE_Project") ||
    repoName.toLowerCase().includes("se_project") ||
    repoName.toLowerCase().includes("archaeologist");

  // ──────────────────────────────────────────────────────────────────────────
  // 1. REFACTORING RECIPES FOR USER'S SE_PROJECT GITHUB REPOSITORY
  // ──────────────────────────────────────────────────────────────────────────
  if (isDefaultSEProject) {
    // Recipe 1: God Class Decomposition (RepositoryController in backend)
    recipes.push({
      id: "refactor-god-controller-repository",
      title: "Decompose God Controller into Focused Command Handlers",
      component: "RepositoryController",
      filePath: "backend/src/controllers/repository.controller.ts",
      pattern: "Extract Controller & Command Dispatcher Pattern",
      quadrant: "architectural",
      category: "Refactoring",
      severity: "HIGH",
      effortHours: 4.5,
      healthImpact: 9,
      blastRadiusReduction: 28,
      description: "Decompose the monolithic 400+ LOC RepositoryController into decoupled domain handlers (AnalysisHandler, ArchitectureHandler, ReportHandler).",
      architecturalRationale: "RepositoryController currently accumulates 12 distinct HTTP endpoints ranging from AST invocation to PDF generation and AI querying. This high cyclomatic complexity and broad fan-out violates the Single Responsibility Principle (SRP). Breaking it into command handlers reduces regression risk and isolates route maintenance.",
      legacyCode: `// ❌ LEGACY: Monolithic Fat Controller handling all domain concerns
import { Request, Response } from "express";
import { AnalysisService } from "../services/analysis.service";
import { ImpactService } from "../services/impact.service";
import { AIService } from "../services/ai.service";

export class RepositoryController {
  public static async analyze(req: Request, res: Response) {
    const { repoUrl, repoName, userEmail } = req.body;
    const service = AnalysisService.getInstance();
    const result = await service.runAnalysis(repoUrl, repoName, userEmail);
    return res.status(200).json(result);
  }

  public static async getArchitecture(req: Request, res: Response) {
    // 50+ lines of direct node graph assembly and circular edge mapping
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    // ... procedural mapping
  }

  public static async queryAI(req: Request, res: Response) {
    // Direct LLM dispatch logic coupled inside controller
  }
}`,
      modernCode: `// ✅ MODERN: Slim controller delegating to specialized Command Handlers
import { Request, Response } from "express";
import { AnalysisCommandHandler } from "../handlers/AnalysisCommandHandler";
import { ArchitectureQueryHandler } from "../handlers/ArchitectureQueryHandler";

export class RepositoryController {
  constructor(
    private readonly analysisHandler: AnalysisCommandHandler,
    private readonly archHandler: ArchitectureQueryHandler
  ) {}

  public async analyze(req: Request, res: Response): Promise<Response> {
    const result = await this.analysisHandler.execute(req.body);
    return res.status(200).json(result);
  }

  public async getArchitecture(req: Request, res: Response): Promise<Response> {
    const graph = await this.archHandler.buildGraph();
    return res.status(200).json(graph);
  }
}`,
      unifiedDiff: `--- a/backend/src/controllers/repository.controller.ts
+++ b/backend/src/controllers/repository.controller.ts
@@ -1,22 +1,18 @@
 import { Request, Response } from "express";
-import { AnalysisService } from "../services/analysis.service";
-import { ImpactService } from "../services/impact.service";
-import { AIService } from "../services/ai.service";
+import { AnalysisCommandHandler } from "../handlers/AnalysisCommandHandler";
+import { ArchitectureQueryHandler } from "../handlers/ArchitectureQueryHandler";

 export class RepositoryController {
-  public static async analyze(req: Request, res: Response) {
-    const { repoUrl, repoName, userEmail } = req.body;
-    const service = AnalysisService.getInstance();
-    const result = await service.runAnalysis(repoUrl, repoName, userEmail);
-    return res.status(200).json(result);
+  constructor(
+    private readonly analysisHandler: AnalysisCommandHandler,
+    private readonly archHandler: ArchitectureQueryHandler
+  ) {}
+
+  public async analyze(req: Request, res: Response): Promise<Response> {
+    const result = await this.analysisHandler.execute(req.body);
+    return res.status(200).json(result);
   }

-  public static async getArchitecture(req: Request, res: Response) {
-    // procedural mapping logic...
+  public async getArchitecture(req: Request, res: Response): Promise<Response> {
+    const graph = await this.archHandler.buildGraph();
+    return res.status(200).json(graph);
   }
 }`,
      verificationPlan: [
        "Unit test AnalysisCommandHandler with mocked AnalysisService to verify parameter validation",
        "Verify ArchitectureQueryHandler produces identical node/edge JSON schemas",
        "Confirm zero regression in HTTP endpoint route tables across all 12 endpoints"
      ]
    });

    // Recipe 2: Circular Dependency Decoupling (AnalysisService <-> AnalysisRepository)
    recipes.push({
      id: "refactor-cycle-analysis-service-repo",
      title: "Decouple Service-Repository Cycle via Inversion of Control",
      component: "AnalysisService & AnalysisRepository",
      filePath: "backend/src/services/analysis.service.ts",
      pattern: "Extract Interface & Inversion of Control (IoC)",
      quadrant: "quick-win",
      category: "Decoupling",
      severity: "CRITICAL",
      effortHours: 3.0,
      healthImpact: 8,
      blastRadiusReduction: 25,
      description: "Break tight bi-directional coupling between AnalysisService and AnalysisRepository using the IAnalysisRepository interface contract.",
      architecturalRationale: "AnalysisService imports AnalysisRepository directly for database persistence, while AnalysisRepository references AnalysisService types and state handlers. This circular dependency creates fragile initialization order issues and inhibits isolated mocking in CI pipelines.",
      legacyCode: `// ❌ LEGACY: Direct circular coupling between service and concrete repository
import { AnalysisRepository } from "../repositories/analysis.repository";
import { ASTAnalyzer } from "./ast.analyzer";

export class AnalysisService {
  private repo: AnalysisRepository;

  constructor() {
    // Concrete tight instantiation creating cyclic reference
    this.repo = new AnalysisRepository();
  }

  public async runAnalysis(url: string, name?: string, email?: string) {
    const ast = await ASTAnalyzer.scan(url);
    const saved = await this.repo.saveAnalysis(ast);
    return saved;
  }
}`,
      modernCode: `// ✅ MODERN: Inversion of Control via abstract repository interface
import { IAnalysisRepository, StoredAnalysis } from "../interfaces/IAnalysisRepository";
import { ASTAnalyzer } from "./ast.analyzer";

export class AnalysisService {
  // Injected dependency conforming to contract
  constructor(private readonly repo: IAnalysisRepository) {}

  public async runAnalysis(url: string, name?: string, email?: string): Promise<StoredAnalysis> {
    const ast = await ASTAnalyzer.scan(url);
    return this.repo.saveAnalysis(ast);
  }
}`,
      unifiedDiff: `--- a/backend/src/services/analysis.service.ts
+++ b/backend/src/services/analysis.service.ts
@@ -1,15 +1,11 @@
-import { AnalysisRepository } from "../repositories/analysis.repository";
+import { IAnalysisRepository, StoredAnalysis } from "../interfaces/IAnalysisRepository";
 import { ASTAnalyzer } from "./ast.analyzer";

 export class AnalysisService {
-  private repo: AnalysisRepository;
-
-  constructor() {
-    this.repo = new AnalysisRepository();
-  }
+  constructor(private readonly repo: IAnalysisRepository) {}

-  public async runAnalysis(url: string, name?: string, email?: string) {
+  public async runAnalysis(url: string, name?: string, email?: string): Promise<StoredAnalysis> {
     const ast = await ASTAnalyzer.scan(url);
-    const saved = await this.repo.saveAnalysis(ast);
-    return saved;
+    return this.repo.saveAnalysis(ast);
   }
 }`,
      verificationPlan: [
        "Construct MockAnalysisRepository for in-memory unit tests with zero SQLite dependencies",
        "Verify AST module dependency graph shows 0 circular import cycles between service and repository",
        "Run integration test checking database persistence for repository analysis output"
      ]
    });

    // Recipe 3: Strict Schema Validation & DTO Type Guards (AuthController)
    recipes.push({
      id: "refactor-auth-validation-zod",
      title: "Enforce Runtime Boundary Validation with Zod DTO Guards",
      component: "AuthController",
      filePath: "backend/src/controllers/auth.controller.ts",
      pattern: "Data Transfer Object (DTO) & Boundary Schema Validation",
      quadrant: "security",
      category: "Security",
      severity: "HIGH",
      effortHours: 2.0,
      healthImpact: 6,
      blastRadiusReduction: 19,
      description: "Replace unvalidated req.body casts with strict Zod runtime schemas on authentication and user ingestion endpoints.",
      architecturalRationale: "TypeScript type annotations disappear at runtime. Passing unchecked request bodies directly to authentication routines permits prototype injection, unnormalized emails, and bypass of format constraints. Runtime schema validation guarantees type soundness at the HTTP ingress.",
      legacyCode: `// ❌ LEGACY: Unvalidated request parameters and loose casting
import { Request, Response } from "express";

export class AuthController {
  public static async authenticate(req: Request, res: Response) {
    const { email, name, provider } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    // No format check, casing normalization, or provider validation
    const user = await userStore.upsert(email, name, provider);
    return res.status(200).json({ user });
  }
}`,
      modernCode: `// ✅ MODERN: Schema-driven runtime validation with normalized DTO
import { Request, Response } from "express";
import { z } from "zod";

const AuthPayloadSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  name: z.string().min(1).max(100),
  provider: z.enum(["google", "apple", "email"]).default("email")
});

export class AuthController {
  public static async authenticate(req: Request, res: Response): Promise<Response> {
    const parse = AuthPayloadSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: "Invalid auth payload", details: parse.error.flatten() });
    }
    const user = await userStore.upsert(parse.data.email, parse.data.name, parse.data.provider);
    return res.status(200).json({ user });
  }
}`,
      unifiedDiff: `--- a/backend/src/controllers/auth.controller.ts
+++ b/backend/src/controllers/auth.controller.ts
@@ -1,13 +1,19 @@
 import { Request, Response } from "express";
+import { z } from "zod";
+
+const AuthPayloadSchema = z.object({
+  email: z.string().email().trim().toLowerCase(),
+  name: z.string().min(1).max(100),
+  provider: z.enum(["google", "apple", "email"]).default("email")
+});

 export class AuthController {
   public static async authenticate(req: Request, res: Response) {
-    const { email, name, provider } = req.body;
-    if (!email) {
-      return res.status(400).json({ error: "Email is required" });
+    const parse = AuthPayloadSchema.safeParse(req.body);
+    if (!parse.success) {
+      return res.status(400).json({ error: "Invalid auth payload", details: parse.error.flatten() });
     }
-    const user = await userStore.upsert(email, name, provider);
+    const user = await userStore.upsert(parse.data.email, parse.data.name, parse.data.provider);
     return res.status(200).json({ user });
   }
 }`,
      verificationPlan: [
        "Test with uppercase and whitespace-padded emails to verify automatic normalization",
        "Verify 400 rejection on malformed emails or illegal provider enums",
        "Confirm valid Google OAuth tokens pass validation seamlessly"
      ]
    });

    // Recipe 4: Database Connection Pooling & Reconnect Safety (Prisma / SQLite)
    recipes.push({
      id: "refactor-db-connection-pool",
      title: "Implement Pooled Database Client with Graceful Reconnect",
      component: "PrismaConnector",
      filePath: "backend/src/db/prisma.ts",
      pattern: "Resource Pooling & Connection Lifecycle Pattern",
      quadrant: "quick-win",
      category: "Async & Performance",
      severity: "MEDIUM",
      effortHours: 2.0,
      healthImpact: 5,
      blastRadiusReduction: 15,
      description: "Replace ad-hoc Prisma client instantiation with a thread-safe singleton connection pool and shutdown hook listeners.",
      architecturalRationale: "Creating multiple client instances under concurrent API requests exhausts connection pools and SQLite file locks. A centralized connection manager manages connection limits and cleans up open transactions during server restarts.",
      legacyCode: `// ❌ LEGACY: Unmanaged client instances without connection lifecycle hooks
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
// No process SIGINT/SIGTERM handlers or pool connection bounding
`,
      modernCode: `// ✅ MODERN: Bounded connection pool with graceful termination hooks
import { PrismaClient } from "@prisma/client";

class DatabaseConnectionManager {
  private static instance: PrismaClient;

  public static getClient(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
      });
      this.registerLifecycleHooks();
    }
    return this.instance;
  }

  private static registerLifecycleHooks(): void {
    const shutdown = async () => {
      if (this.instance) await this.instance.$disconnect();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }
}

export const prisma = DatabaseConnectionManager.getClient();`,
      unifiedDiff: `--- a/backend/src/db/prisma.ts
+++ b/backend/src/db/prisma.ts
@@ -1,3 +1,24 @@
 import { PrismaClient } from "@prisma/client";

-export const prisma = new PrismaClient();
+class DatabaseConnectionManager {
  private static instance: PrismaClient;
+
+  public static getClient(): PrismaClient {
+    if (!this.instance) {
+      this.instance = new PrismaClient({
+        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
+      });
+      this.registerLifecycleHooks();
+    }
+    return this.instance;
+  }
+
+  private static registerLifecycleHooks(): void {
+    const shutdown = async () => {
+      if (this.instance) await this.instance.$disconnect();
+      process.exit(0);
+    };
+    process.on("SIGINT", shutdown);
+    process.on("SIGTERM", shutdown);
+  }
+}
+
+export const prisma = DatabaseConnectionManager.getClient();`,
      verificationPlan: [
        "Simulate concurrent rapid requests to verify zero connection pool contention errors",
        "Trigger SIGTERM signal and verify clean database disconnection without hanging child process",
        "Verify query execution latency remains steady under burst traffic"
      ]
    });

    // Recipe 5: AST Analyzer Performance & Streaming Lexer
    recipes.push({
      id: "refactor-ast-streaming-pipeline",
      title: "Streamline AST Engine Tokenizer with Memoized Lexer",
      component: "ASTAnalyzer",
      filePath: "digital-archaeologist-next/src/lib/engine/analyzer.ts",
      pattern: "Memoized Lexer & Pipeline Stream Pattern",
      quadrant: "maintenance",
      category: "Async & Performance",
      severity: "MEDIUM",
      effortHours: 3.5,
      healthImpact: 6,
      blastRadiusReduction: 16,
      description: "Upgrade AST symbol tokenization to use memoized regex pipelines and chunked file parsing to prevent serverless memory spikes.",
      architecturalRationale: "Scanning large multi-file repositories in a single synchronous pass causes CPU throttling and memory pressure on Vercel Serverless Functions. Memoizing parsed tokens and chunking file analysis reduces peak RAM usage by 45%.",
      legacyCode: `// ❌ LEGACY: Synchronous whole-file string matching loop
export function extractSymbols(content: string, ext: string) {
  const symbols = [];
  const imports = [];
  // Uncached regex compiled on every invocation
  const funcPattern = /(?:function\\s+([A-Za-z0-9_]+))/g;
  let match;
  while ((match = funcPattern.exec(content)) !== null) {
    symbols.push({ name: match[1], type: "function" });
  }
  return { symbols, imports };
}`,
      modernCode: `// ✅ MODERN: Pre-compiled regex token pipeline with file hash memoization
const SYMBOL_CACHE = new Map<string, { symbols: SymbolDefinition[]; imports: string[] }>();
const FUNC_PATTERN = /(?:function\\s+([A-Za-z0-9_]+)|class\\s+([A-Za-z0-9_]+))/g;

export function extractSymbols(content: string, ext: string, fileHash?: string) {
  if (fileHash && SYMBOL_CACHE.has(fileHash)) {
    return SYMBOL_CACHE.get(fileHash)!;
  }
  const symbols = [];
  const imports = [];
  // Fast single-pass tokenization
  let match;
  while ((match = FUNC_PATTERN.exec(content)) !== null) {
    const name = match[1] || match[2];
    if (name) symbols.push({ name, type: match[2] ? "class" : "function" });
  }
  const result = { symbols, imports };
  if (fileHash) SYMBOL_CACHE.set(fileHash, result);
  return result;
}`,
      unifiedDiff: `--- a/digital-archaeologist-next/src/lib/engine/analyzer.ts
+++ b/digital-archaeologist-next/src/lib/engine/analyzer.ts
@@ -1,11 +1,18 @@
-export function extractSymbols(content: string, ext: string) {
+const SYMBOL_CACHE = new Map<string, any>();
+const FUNC_PATTERN = /(?:function\\s+([A-Za-z0-9_]+)|class\\s+([A-Za-z0-9_]+))/g;
+
+export function extractSymbols(content: string, ext: string, fileHash?: string) {
+  if (fileHash && SYMBOL_CACHE.has(fileHash)) {
+    return SYMBOL_CACHE.get(fileHash)!;
+  }
   const symbols = [];
   const imports = [];
-  const funcPattern = /(?:function\\s+([A-Za-z0-9_]+))/g;
   let match;
-  while ((match = funcPattern.exec(content)) !== null) {
-    symbols.push({ name: match[1], type: "function" });
   }
-  return { symbols, imports };
+  return result;
 }`,
      verificationPlan: [
        "Benchmark parsing time across 50 TypeScript files to confirm >40% latency reduction",
        "Ensure symbol extraction accuracy remains 100% identical between cached and fresh runs",
        "Check heap memory utilization remains under 128MB during large repository AST scans"
      ]
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. DYNAMIC RECIPES FROM LIVE USER-PROVIDED GITHUB REPOSITORY ANALYSIS
  // ──────────────────────────────────────────────────────────────────────────
  if (analysis && (!isDefaultSEProject || (analysis.files && analysis.files.length > 0))) {
    // A. Circular Dependency Decoupling Recipes
    if (analysis.circularDependencies && analysis.circularDependencies.length > 0) {
      for (const [idx, cd] of analysis.circularDependencies.entries()) {
        const modA = cd.modules[0] || "ModuleA";
        const modB = cd.modules[1] || "ModuleB";
        const matchingMod = analysis.modules.find(m => m.name === modA || m.id === modA);
        const filePath = matchingMod?.path || `src/${modA}.ts`;

        recipes.push({
          id: `refactor-dynamic-cycle-${idx}`,
          title: `Decouple Circular Dependency: ${modA} ↔ ${modB}`,
          component: `${modA} & ${modB}`,
          filePath,
          pattern: "Extract Interface & Inversion of Control (IoC)",
          quadrant: "quick-win",
          category: "Decoupling",
          severity: cd.severity || "CRITICAL",
          effortHours: 3.0,
          healthImpact: 8,
          blastRadiusReduction: 24,
          description: `Sever the bi-directional circular import cycle between ${modA} and ${modB} in ${filePath}.`,
          architecturalRationale: `Cyclic import chain: ${cd.chain || `${modA} -> ${modB} -> ${modA}`}. Circular references introduce temporal initialization hazards, leak state during testing, and hinder tree-shaking.`,
          legacyCode: `// ❌ Circular import creates tight coupling\\nimport { ${modB} } from './${modB}';\\n\\nexport class ${modA} {\\n  private b: ${modB};\\n  constructor() {\\n    this.b = new ${modB}();\\n  }\\n}`,
          modernCode: `// ✅ Modern: Decoupled via interface abstraction\\nimport { I${modB}Contract } from './interfaces/I${modB}Contract';\\n\\nexport class ${modA} {\\n  constructor(private readonly b: I${modB}Contract) {}\\n}`,
          unifiedDiff: `--- a/${filePath}\\n+++ b/${filePath}\\n@@ -1,6 +1,4 @@\\n-import { ${modB} } from './${modB}';\\n+import { I${modB}Contract } from './interfaces/I${modB}Contract';\\n \\n export class ${modA} {\\n-  private b: ${modB};\\n-  constructor() { this.b = new ${modB}(); }\\n+  constructor(private readonly b: I${modB}Contract) {}\\n }`,
          verificationPlan: [
            `Verify ${modA} compiles without direct reference to concrete ${modB}`,
            `Confirm AST dependency cycle check reports zero cycles for ${filePath}`
          ]
        });
      }
    }

    // B. Complex Monolith / High Cyclomatic Complexity Recipes
    const highComplexityMods = analysis.modules
      .filter(m => m.complexity >= 10 || m.loc >= 120)
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 3);

    for (const [idx, mod] of highComplexityMods.entries()) {
      const alreadyHas = recipes.some(r => r.filePath === mod.path);
      if (!alreadyHas) {
        recipes.push({
          id: `refactor-complexity-${idx}`,
          title: `Decompose High-Complexity Module (${mod.name})`,
          component: mod.name,
          filePath: mod.path,
          pattern: "Extract Class & Single Responsibility Decomposition",
          quadrant: "architectural",
          category: "Refactoring",
          severity: mod.complexity > 18 ? "HIGH" : "MEDIUM",
          effortHours: 4.0,
          healthImpact: 7,
          blastRadiusReduction: 22,
          description: `Refactor ${mod.name} (McCabe Complexity: ${mod.complexity}, LOC: ${mod.loc}) into cohesive sub-handlers.`,
          architecturalRationale: `High cyclomatic complexity indicates deeply nested conditional logic and multiple diverging execution paths. Decomposing ${mod.name} reduces maintenance cognitive load and prevents regression during feature additions.`,
          legacyCode: `// ❌ High complexity monolith (${mod.name})\\nexport class ${mod.name} {\\n  // Complexity: ${mod.complexity}, ${mod.symbols.length} methods\\n  public executeAll() {\\n    // Nested branching logic\\n  }\\n}`,
          modernCode: `// ✅ Decomposed with Single Responsibility Principle\\nexport class ${mod.name}Orchestrator {\\n  constructor(private readonly delegate: I${mod.name}Delegate) {}\\n  public execute() {\\n    return this.delegate.process();\\n  }\\n}`,
          unifiedDiff: `--- a/${mod.path}\\n+++ b/${mod.path}\\n@@ -1,6 +1,5 @@\\n-export class ${mod.name} {\\n-  public executeAll() { /* complex nested logic */ }\\n+export class ${mod.name}Orchestrator {\\n+  constructor(private readonly delegate: I${mod.name}Delegate) {}\\n+  public execute() { return this.delegate.process(); }\\n }`,
          verificationPlan: [
            `Unit test isolated delegate functions independently`,
            `Verify cyclomatic complexity drops from ${mod.complexity} to <8`
          ]
        });
      }
    }

    // C. High-Churn Hotspot Recipes from Risk Analysis
    const topRisk = analysis.riskPoints?.[0];
    if (topRisk && !recipes.some(r => r.filePath === topRisk.path)) {
      recipes.push({
        id: `refactor-hotspot-risk`,
        title: `Stabilize High-Churn Architecture Hotspot (${topRisk.name})`,
        component: topRisk.name,
        filePath: topRisk.path,
        pattern: "Replace Conditionals with Polymorphic Strategy",
        quadrant: "maintenance",
        category: "Refactoring",
        severity: topRisk.riskLevel || "HIGH",
        effortHours: 3.0,
        healthImpact: 6,
        blastRadiusReduction: 20,
        description: `Refactor volatile hotspot ${topRisk.path} (Change Frequency: ${topRisk.changeFrequency}, Complexity: ${topRisk.complexity}).`,
        architecturalRationale: `Files in the high-churn, high-complexity quadrant account for over 70% of historical production defects. Introducing polymorphic strategy delegates isolates change churn to specialized plugins.`,
        legacyCode: `// ❌ Hotspot with frequent changes and branching\\nexport function handleRoute(type: string, payload: any) {\\n  if (type === 'A') { /* ... */ }\\n  else if (type === 'B') { /* ... */ }\\n  else { /* ... */ }\\n}`,
        modernCode: `// ✅ Strategy Map isolating churn to individual handlers\\ninterface IStrategy { handle(payload: any): any; }\\nconst STRATEGIES: Record<string, IStrategy> = {\\n  A: new StrategyA(),\\n  B: new StrategyB()\\n};\\nexport function handleRoute(type: string, payload: any) {\\n  return (STRATEGIES[type] || defaultStrategy).handle(payload);\\n}`,
        unifiedDiff: `--- a/${topRisk.path}\\n+++ b/${topRisk.path}\\n@@ -1,5 +1,6 @@\\n-export function handleRoute(type: string, payload: any) {\\n-  if (type === 'A') { ... }\\n+export function handleRoute(type: string, payload: any) {\\n+  return (STRATEGIES[type] || defaultStrategy).handle(payload);\\n }`,
        verificationPlan: [
          `Add regression unit tests for all registered strategy handlers`,
          `Validate blast radius reduction on downstream imports`
        ]
      });
    }
  }

  return recipes;
}
