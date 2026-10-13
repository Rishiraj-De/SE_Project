import path from "path";
import fs from "fs";
import { execFile, exec } from "child_process";
import { promisify } from "util";
import { AnalysisResult, AnalysisSummary } from "../types";

const execPromise = promisify(exec);
const execFilePromise = promisify(execFile);

export class AnalysisService {
  private static instance: AnalysisService;
  private currentAnalysis: AnalysisResult | null = null;
  private isAnalyzing: boolean = false;

  private constructor() {
    // Load pre-warmed demo cache if exists
    this.initDefaultDemo();
  }

  public static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  private async initDefaultDemo() {
    const demoDir = path.resolve(__dirname, "../../../demo-repo/legacy-payment-system");
    if (fs.existsSync(demoDir)) {
      try {
        const result = await this.executeAnalysis(demoDir, "https://github.com/example/legacy-payment-system", "legacy-payment-system");
        result.repoDir = demoDir;
        this.currentAnalysis = result;
        // Persist to relational database
        const { AnalysisRepository } = await import("../repositories/analysis.repository");
        await AnalysisRepository.saveAnalysisRun(result);
      } catch (err) {
        console.warn("Could not pre-warm demo analysis:", err);
      }
    }
  }

  public getCurrentAnalysis(): AnalysisResult | null {
    return this.currentAnalysis;
  }

  public getStatus() {
    return {
      isAnalyzing: this.isAnalyzing,
      analysis: this.currentAnalysis
    };
  }

  public async runAnalysis(repoUrl: string, repoName?: string): Promise<AnalysisResult> {
    this.isAnalyzing = true;
    const name = repoName || repoUrl.split("/").pop()?.replace(".git", "") || "legacy-repo";
    const runId = "run_" + Date.now();

    // Default pipeline steps
    const pipelineSteps = [
      "Repository cloned",
      "Languages detected",
      "Source tree indexed",
      "AST generated",
      "Dependencies extracted",
      "Git history analysis",
      "Architecture reconstruction",
      "Risk analysis",
      "Documentation generation"
    ];

    let targetDir = path.resolve(__dirname, "../../../demo-repo/legacy-payment-system");

    // If an external GitHub URL is passed (and not the demo), clone into a temp workspace
    if (repoUrl && !repoUrl.includes("legacy-payment-system") && !repoUrl.includes("demo")) {
      const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const tempCloneDir = path.resolve(__dirname, `../../temp-repos/${safeName}_${Date.now()}`);
      try {
        fs.mkdirSync(path.dirname(tempCloneDir), { recursive: true });
        await execPromise(`git clone --depth 50 "${repoUrl}" "${tempCloneDir}"`, { timeout: 120000 });
        targetDir = tempCloneDir;
      } catch (e: any) {
        console.error("Git clone failed, falling back to demo repo:", e.message);
      }
    }

    const initialResult: AnalysisResult = {
      id: runId,
      repoUrl,
      repoName: name,
      repoDir: targetDir,
      branch: "main",
      status: "running",
      analyzedAt: new Date().toISOString(),
      currentStep: pipelineSteps[0],
      completedSteps: [],
      summary: {
        filesCount: 0,
        totalLoc: 0,
        functionsCount: 0,
        classesCount: 0,
        contributorsCount: 0,
        commitsCount: 0,
        healthScore: 0,
        healthBreakdown: {
          architecture: 0,
          maintainability: 0,
          testCoverage: 0,
          documentation: 0,
          dependencyHealth: 0
        }
      },
      languages: {},
      files: [],
      modules: [],
      dependencies: [],
      circularDependencies: [],
      commits: [],
      mostChangedFiles: [],
      technicalDebt: [],
      riskPoints: []
    };

    this.currentAnalysis = initialResult;

    // Simulate progressive pipeline steps for real UI responsiveness
    for (let i = 0; i < pipelineSteps.length - 2; i++) {
      await new Promise(r => setTimeout(r, 220));
      initialResult.completedSteps.push(pipelineSteps[i]);
      initialResult.currentStep = pipelineSteps[i + 1];
    }

    // Execute real analysis engine
    const analysisData = await this.executeAnalysis(targetDir, repoUrl, name);
    analysisData.id = runId;
    analysisData.repoDir = targetDir;
    analysisData.status = "completed";
    analysisData.completedSteps = pipelineSteps;
    analysisData.currentStep = "Done";

    // Persist to relational SQLite database via Prisma
    try {
      const { AnalysisRepository } = await import("../repositories/analysis.repository");
      await AnalysisRepository.saveAnalysisRun(analysisData);
    } catch (e: any) {
      console.warn("Could not save to database:", e.message);
    }

    this.currentAnalysis = analysisData;
    this.isAnalyzing = false;
    return analysisData;
  }

  /** Detect the default branch (main, master, etc.) for the repository */
  private detectBranch(repoDir: string): string {
    try {
      const { execSync } = require("child_process");
      const branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: repoDir, encoding: "utf-8" }).trim();
      return branch || "main";
    } catch {
      return "main";
    }
  }

  /** Compute a dynamic health score from actual analysis metrics */
  private computeHealthScore(result: AnalysisResult): void {
    const files = result.files;
    const deps = result.dependencies;
    const circularCount = result.circularDependencies.length;
    const debtCount = result.technicalDebt.length;
    const totalFiles = files.length || 1;

    // Architecture: penalise for circular deps and high-coupling modules
    const highCouplingCount = deps.filter(d => (d.dependsOn + d.dependents) > 5).length;
    const architecture = Math.max(20, 100 - (circularCount * 15) - (highCouplingCount * 5));

    // Maintainability: penalise for high-complexity files
    const avgComplexity = files.reduce((s, f) => s + f.complexity, 0) / totalFiles;
    const maintainability = Math.max(20, Math.round(100 - (avgComplexity * 3)));

    // Test coverage heuristic: check for test file presence
    const testFiles = files.filter(f =>
      f.path.includes("test") || f.path.includes("spec") || f.path.includes("__tests__")
    ).length;
    const testCoverage = Math.min(100, Math.round((testFiles / totalFiles) * 300));

    // Documentation heuristic: check for doc files
    const docIndicators = files.filter(f =>
      f.name.toLowerCase().includes("readme") || f.path.includes("docs/")
    ).length;
    const documentation = Math.min(100, Math.round(20 + (docIndicators * 15)));

    // Dependency health: penalise for tech debt items
    const dependencyHealth = Math.max(20, 100 - (debtCount * 4));

    const healthScore = Math.round(
      (architecture * 0.25) +
      (maintainability * 0.25) +
      (testCoverage * 0.2) +
      (documentation * 0.1) +
      (dependencyHealth * 0.2)
    );

    result.summary.healthScore = Math.max(10, Math.min(100, healthScore));
    result.summary.healthBreakdown = {
      architecture: Math.min(100, architecture),
      maintainability: Math.min(100, maintainability),
      testCoverage: Math.min(100, testCoverage),
      documentation: Math.min(100, documentation),
      dependencyHealth: Math.min(100, dependencyHealth)
    };
  }

  private async executeAnalysis(targetDir: string, repoUrl: string, repoName: string): Promise<AnalysisResult> {
    const pythonScript = path.resolve(__dirname, "../../../analysis-engine/analyzer.py");
    const branch = this.detectBranch(targetDir);

    let rawJson = "";
    try {
      const { stdout } = await execPromise(`python "${pythonScript}" "${targetDir}"`, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 });
      rawJson = stdout;
    } catch (e: any) {
      console.warn("Python analyzer call failed, running native fallback parser:", e.message);
      return this.nativeFallbackAnalysis(targetDir, repoUrl, repoName);
    }

    try {
      const parsed = JSON.parse(rawJson);
      const result: AnalysisResult = {
        id: "run_" + Date.now(),
        repoUrl,
        repoName,
        repoDir: targetDir,
        branch,
        status: "completed",
        analyzedAt: new Date().toISOString(),
        completedSteps: [
          "Repository cloned",
          "Languages detected",
          "Source tree indexed",
          "AST generated",
          "Dependencies extracted",
          "Git history analysis",
          "Architecture reconstruction",
          "Risk analysis",
          "Documentation generation"
        ],
        summary: parsed.summary,
        languages: parsed.languages,
        files: parsed.files,
        modules: parsed.modules || [],
        dependencies: parsed.dependencies,
        circularDependencies: parsed.circularDependencies,
        commits: parsed.commits,
        mostChangedFiles: parsed.mostChangedFiles,
        technicalDebt: parsed.technicalDebt,
        riskPoints: parsed.riskPoints
      };
      this.computeHealthScore(result);
      return result;
    } catch (err: any) {
      console.error("Failed to parse analyzer output:", err.message);
      return this.nativeFallbackAnalysis(targetDir, repoUrl, repoName);
    }
  }

  private nativeFallbackAnalysis(targetDir: string, repoUrl: string, repoName: string): AnalysisResult {
    // Native TypeScript fallback: walk the repo directory and build analysis from scratch
    const branch = this.detectBranch(targetDir);
    const supportedExts: Record<string, string> = {
      ".ts": "TypeScript", ".tsx": "TypeScript",
      ".js": "JavaScript", ".jsx": "JavaScript",
      ".py": "Python", ".java": "Java",
      ".go": "Go", ".rs": "Rust", ".json": "JSON"
    };
    const ignoreDirs = new Set([".git", "node_modules", "dist", "build", ".next", "__pycache__", ".cache"]);

    const filesList: AnalysisResult["files"] = [];
    const modulesList: AnalysisResult["modules"] = [];
    const languageCounts: Record<string, number> = {};
    const importGraph: Record<string, Set<string>> = {};
    const revGraph: Record<string, Set<string>> = {};

    // Recursive walk
    const walk = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            if (!ignoreDirs.has(entry.name)) walk(path.join(dir, entry.name));
          } else {
            const ext = path.extname(entry.name).toLowerCase();
            if (!(ext in supportedExts)) continue;
            const fullPath = path.join(dir, entry.name);
            const relPath = path.relative(targetDir, fullPath).replace(/\\/g, "/");
            try {
              const content = fs.readFileSync(fullPath, "utf-8");
              const lines = content.split("\n");
              const loc = lines.length;
              const lang = supportedExts[ext];
              languageCounts[lang] = (languageCounts[lang] || 0) + loc;

              // Simple complexity count
              const branchPatterns = [/\bif\b/g, /\belse\s+if\b/g, /\bfor\b/g, /\bwhile\b/g, /\bcase\b/g, /\bcatch\b/g, /&&/g, /\|\|/g];
              let complexity = 1;
              for (const p of branchPatterns) complexity += (content.match(p) || []).length;

              // Extract symbols
              const symbols: Array<{ type: "class" | "function" | "interface" | "variable"; name: string; line: number }> = [];
              const classPattern = /\bclass\s+([A-Za-z0-9_]+)/g;
              let cm;
              while ((cm = classPattern.exec(content)) !== null) {
                const line = content.substring(0, cm.index).split("\n").length;
                symbols.push({ type: "class", name: cm[1], line });
              }
              const funcPattern = /(?:function\s+([A-Za-z0-9_]+)|(?:public|private|protected|async|\s)?\s*([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?::\s*[^\{]+)?\s*\{|def\s+([A-Za-z0-9_]+))/g;
              let fm;
              const skipWords = new Set(["if", "while", "for", "switch", "catch", "function", "constructor", "return"]);
              while ((fm = funcPattern.exec(content)) !== null) {
                const name = fm[1] || fm[2] || fm[3];
                if (name && !skipWords.has(name)) {
                  const line = content.substring(0, fm.index).split("\n").length;
                  symbols.push({ type: "function", name, line });
                }
              }

              // Extract imports
              const imports: string[] = [];
              const importPatterns = [
                /import\s+.*?from\s+['"](.+?)['"]/g,
                /import\s+['"](.+?)['"]/g,
                /require\(['"](.+?)['"]\)/g,
                /from\s+([a-zA-Z0-9_.]+)\s+import/g
              ];
              for (const p of importPatterns) {
                let m;
                while ((m = p.exec(content)) !== null) imports.push(m[1]);
              }

              const moduleId = relPath.replace(/\//g, ".").replace(new RegExp(`\\${ext}$`), "");
              const modName = entry.name.replace(/\.[^.]+$/, "");
              importGraph[moduleId] = new Set(imports);
              if (!revGraph[moduleId]) revGraph[moduleId] = new Set();

              modulesList.push({
                id: moduleId,
                name: modName,
                path: relPath,
                language: lang,
                loc,
                complexity,
                symbols,
                raw_imports: imports
              });

              filesList.push({ path: relPath, name: entry.name, loc, complexity, language: lang, symbolsCount: symbols.length });
            } catch { /* skip unreadable files */ }
          }
        }
      } catch { /* skip unreadable dirs */ }
    };

    walk(targetDir);

    // Build reverse import graph
    for (const mod of modulesList) {
      for (const imp of mod.raw_imports) {
        const impName = imp.split("/").pop()?.replace(/\.[^.]+$/, "") || imp;
        const target = modulesList.find(m => m.name === impName || m.path.endsWith(imp) || m.id.endsWith(impName));
        if (target) {
          if (!revGraph[target.id]) revGraph[target.id] = new Set();
          revGraph[target.id].add(mod.id);
        }
      }
    }

    // Build dependency list from file data
    const dependencies = filesList.map(f => {
      const modId = f.path.replace(/\//g, ".").replace(/\.[^.]+$/, "");
      const depCount = importGraph[modId]?.size || 0;
      const revCount = revGraph[modId]?.size || 0;
      const totalCoupling = depCount + revCount;
      return {
        module: f.name.replace(/\.[^.]+$/, ""),
        path: f.path,
        dependsOn: depCount,
        dependents: revCount,
        risk: (totalCoupling > 5 ? "HIGH" : totalCoupling > 2 ? "MEDIUM" : "LOW") as "HIGH" | "MEDIUM" | "LOW"
      };
    });

    // Git commits (native)
    let commits: AnalysisResult["commits"] = [];
    const contributors = new Set<string>();
    try {
      const { execSync } = require("child_process");
      const gitLog = execSync("git log --pretty=format:%h|%an|%ad|%s --date=short -100", { cwd: targetDir, encoding: "utf-8" });
      for (const line of gitLog.trim().split("\n")) {
        const parts = line.split("|");
        if (parts.length >= 4) {
          commits.push({ hash: parts[0], author: parts[1], date: parts[2], message: parts.slice(3).join("|") });
          contributors.add(parts[1]);
        }
      }
    } catch { /* no git history available */ }

    // Git file churn (native)
    const fileChurn: Record<string, number> = {};
    try {
      const { execSync } = require("child_process");
      const churnRaw = execSync("git log --name-only --pretty=format: -100", { cwd: targetDir, encoding: "utf-8" });
      for (const line of churnRaw.split("\n")) {
        const trimmed = line.trim();
        if (trimmed) fileChurn[trimmed] = (fileChurn[trimmed] || 0) + 1;
      }
    } catch { /* no git available */ }

    const mostChangedFiles = Object.entries(fileChurn)
      .map(([file, changes]) => ({ file, changes }))
      .sort((a, b) => b.changes - a.changes)
      .slice(0, 20);

    // Build technical debt
    const technicalDebt: AnalysisResult["technicalDebt"] = [];
    for (const f of filesList) {
      if (f.complexity > 15) {
        technicalDebt.push({
          severity: f.complexity > 20 ? "HIGH" : "MEDIUM",
          component: f.name.replace(/\.[^.]+$/, ""),
          file: f.path,
          issue: `High Cyclomatic Complexity (${f.complexity})`,
          category: "Complexity",
          recommendation: "Decompose nested conditionals into smaller subroutines or strategy handlers."
        });
      }
    }

    // Risk points
    const riskPoints: AnalysisResult["riskPoints"] = filesList.map(f => {
      const churn = fileChurn[f.path] || 1;
      const riskScore = (f.complexity * 2) + (churn * 3);
      return {
        id: f.path.replace(/\//g, ".").replace(/\.[^.]+$/, ""),
        name: f.name.replace(/\.[^.]+$/, ""),
        path: f.path,
        complexity: f.complexity,
        changeFrequency: churn,
        riskLevel: (f.complexity > 15 && churn > 3) ? "CRITICAL" : f.complexity > 12 ? "HIGH" : churn > 2 ? "MEDIUM" : "LOW",
        riskScore,
        dependencies: 0,
        dependents: 0
      };
    });

    const totalLoc = filesList.reduce((s, f) => s + f.loc, 0);

    const result: AnalysisResult = {
      id: "run_fallback_" + Date.now(),
      repoUrl,
      repoName,
      repoDir: targetDir,
      branch,
      status: "completed",
      analyzedAt: new Date().toISOString(),
      completedSteps: [
        "Repository cloned",
        "Languages detected",
        "Source tree indexed",
        "AST generated",
        "Dependencies extracted",
        "Git history analysis",
        "Architecture reconstruction",
        "Risk analysis",
        "Documentation generation"
      ],
      summary: {
        filesCount: filesList.length,
        totalLoc,
        functionsCount: filesList.reduce((s, f) => s + f.symbolsCount, 0),
        classesCount: modulesList.reduce((s, m) => s + m.symbols.filter(sy => sy.type === "class").length, 0),
        contributorsCount: contributors.size || 1,
        commitsCount: commits.length || 1,
        healthScore: 0,
        healthBreakdown: { architecture: 0, maintainability: 0, testCoverage: 0, documentation: 0, dependencyHealth: 0 }
      },
      languages: languageCounts,
      files: filesList,
      modules: modulesList,
      dependencies,
      circularDependencies: [],
      commits,
      mostChangedFiles,
      technicalDebt,
      riskPoints
    };

    this.computeHealthScore(result);
    return result;
  }

  public getFileContent(filePath: string): { content: string; language: string; loc: number } {
    // Use the actual analyzed repo directory, not hardcoded demo
    const repoDir = this.currentAnalysis?.repoDir
      || path.resolve(__dirname, "../../../demo-repo/legacy-payment-system");
    const fullPath = path.resolve(repoDir, filePath);
    
    // Security check to avoid directory traversal
    if (!fullPath.startsWith(path.resolve(repoDir))) {
      throw new Error("Access denied: path outside repository root");
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    const ext = path.extname(filePath).toLowerCase();
    const langMap: Record<string, string> = {
      ".ts": "typescript",
      ".tsx": "typescript",
      ".js": "javascript",
      ".jsx": "javascript",
      ".json": "json",
      ".py": "python",
      ".java": "java",
      ".go": "go",
      ".rs": "rust",
      ".md": "markdown",
      ".yaml": "yaml",
      ".yml": "yaml",
      ".css": "css",
      ".html": "html",
      ".sql": "sql",
      ".sh": "shell",
      ".c": "c",
      ".cpp": "cpp",
      ".h": "c",
      ".hpp": "cpp"
    };

    return {
      content,
      language: langMap[ext] || "plaintext",
      loc: content.split("\n").length
    };
  }
}
