import { Request, Response } from "express";
import { AnalysisService } from "../services/analysis.service";
import { ImpactService } from "../services/impact.service";
import { AIService } from "../services/ai.service";

export class RepositoryController {
  public static async analyze(req: Request, res: Response) {
    try {
      const { repoUrl, repoName } = req.body;
      const service = AnalysisService.getInstance();
      const analysis = await service.runAnalysis(repoUrl, repoName);
      return res.status(200).json(analysis);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getStatus(req: Request, res: Response) {
    const service = AnalysisService.getInstance();
    const status = service.getStatus();
    return res.status(200).json(status);
  }

  public static async getOverview(req: Request, res: Response) {
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    if (!analysis) {
      return res.status(404).json({ error: "No active analysis found. Please run an analysis first." });
    }
    return res.status(200).json({
      repoName: analysis.repoName,
      branch: analysis.branch,
      analyzedAt: analysis.analyzedAt,
      summary: analysis.summary,
      languages: analysis.languages
    });
  }

  public static async getArchitecture(req: Request, res: Response) {
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    if (!analysis) {
      return res.status(404).json({ error: "No active analysis found." });
    }

    // Dynamically build nodes from analysis dependencies/files
    const typeMap: Record<string, string> = {};
    for (const f of analysis.files) {
      const modName = f.name.replace(/\.[^.]+$/, "");
      const lower = f.path.toLowerCase();
      if (lower.includes("controller") || lower.includes("handler") || lower.includes("route")) typeMap[modName] = "controller";
      else if (lower.includes("repo") || lower.includes("model") || lower.includes("dao")) typeMap[modName] = "repository";
      else if (lower.includes("database") || lower.includes("db") || lower.includes("prisma")) typeMap[modName] = "database";
      else if (lower.includes("util") || lower.includes("helper") || lower.includes("lib")) typeMap[modName] = "utility";
      else typeMap[modName] = "service";
    }

    // Build dependency lookup for edges
    const circularModules = new Set<string>();
    for (const cd of analysis.circularDependencies) {
      for (const m of cd.modules) circularModules.add(m);
    }

    // Build edges from analysis modules if available, otherwise from dependency counts
    const edges: Array<{ id: string; source: string; target: string; animated: boolean; label: string; circular?: boolean }> = [];
    const nodeIds = new Set(analysis.dependencies.map(d => d.module));

    if (analysis.modules.length > 0) {
      for (const mod of analysis.modules) {
        const sourceName = mod.name || mod.id;
        if (!nodeIds.has(sourceName)) continue;
        for (const imp of (mod.raw_imports || [])) {
          const impName = imp.split("/").pop()?.replace(/\.[^.]+$/, "") || imp;
          if (nodeIds.has(impName) && impName !== sourceName) {
            const isCircular = circularModules.has(sourceName) && circularModules.has(impName);
            edges.push({
              id: `e-${sourceName}-${impName}`,
              source: sourceName,
              target: impName,
              animated: isCircular,
              label: isCircular ? "circular" : "imports",
              circular: isCircular
            });
          }
        }
      }
    }

    if (edges.length === 0) {
      for (const cd of analysis.circularDependencies) {
        for (let i = 0; i < cd.modules.length - 1; i++) {
          if (nodeIds.has(cd.modules[i]) && nodeIds.has(cd.modules[i + 1])) {
            edges.push({
              id: `e-circ-${cd.modules[i]}-${cd.modules[i + 1]}`,
              source: cd.modules[i],
              target: cd.modules[i + 1],
              animated: true,
              label: "circular dependency",
              circular: true
            });
          }
        }
      }
    }

    // Compute imports and importedBy for each node
    const importsMap = new Map<string, string[]>();
    const importedByMap = new Map<string, string[]>();
    for (const e of edges) {
      if (!importsMap.has(e.source)) importsMap.set(e.source, []);
      importsMap.get(e.source)!.push(e.target);

      if (!importedByMap.has(e.target)) importedByMap.set(e.target, []);
      importedByMap.get(e.target)!.push(e.source);
    }

    // Group nodes into layers
    const nodes = analysis.dependencies.map((dep, i) => {
      const matchingFile = analysis.files.find(f => f.name.replace(/\.[^.]+$/, "") === dep.module);
      const matchingModule = analysis.modules.find(m => (m.name || m.id) === dep.module);
      const symbols: string[] = matchingModule?.symbols ? matchingModule.symbols.map((s: any) => s.name) : [];

      const pathLower = dep.path.toLowerCase();
      let layer: "pages" | "components" | "services" | "utils" | "config" = "services";
      if (pathLower.includes("page") || pathLower.includes("view") || dep.module === "App" || dep.module === "main" || dep.module === "index") {
        layer = "pages";
      } else if (pathLower.includes("component") || pathLower.includes("ui")) {
        layer = "components";
      } else if (pathLower.includes("service") || pathLower.includes("controller") || pathLower.includes("api") || pathLower.includes("model") || pathLower.includes("inference") || pathLower.includes("processor")) {
        layer = "services";
      } else if (pathLower.includes("util") || pathLower.includes("helper") || pathLower.includes("rule")) {
        layer = "utils";
      } else if (pathLower.includes("config") || pathLower.includes("package") || pathLower.includes(".json") || pathLower.includes("postcss") || pathLower.includes("tailwind")) {
        layer = "config";
      }

      const imports = importsMap.get(dep.module) || [];
      const importedBy = importedByMap.get(dep.module) || [];
      const isConnected = imports.length > 0 || importedBy.length > 0;

      // Smart Tier positions:
      const layerOrder = { pages: 0, components: 1, services: 2, utils: 3, config: 4 };
      const layerIdx = layerOrder[layer] || 2;

      return {
        id: dep.module,
        label: dep.module,
        type: typeMap[dep.module] || (layer === "components" ? "controller" : layer === "services" ? "service" : "repository"),
        category: dep.path.split("/").slice(0, -1).join("/") || "Root",
        path: dep.path,
        files: 1,
        loc: matchingFile?.loc || 0,
        complexity: matchingFile?.complexity || 0,
        risk: dep.risk,
        layer,
        symbols,
        imports,
        importedBy,
        isConnected,
        // Layout grouped by tier with clean spacing
        x: (i % 6) * 260 + 60,
        y: layerIdx * 240 + Math.floor(i / 6) * 60 + 60
      };
    });

    // Subsystems summary
    const subsystems = [
      { id: "pages", name: "Pages & Views", count: nodes.filter(n => n.layer === "pages").length, description: "Top-level application routing and presentation views" },
      { id: "components", name: "UI Components", count: nodes.filter(n => n.layer === "components").length, description: "Reusable interface blocks, charts and interactive cards" },
      { id: "services", name: "Core Services & Pipeline", count: nodes.filter(n => n.layer === "services").length, description: "Business logic, machine learning inference, and processors" },
      { id: "utils", name: "Utilities & Rules", count: nodes.filter(n => n.layer === "utils").length, description: "Helper functions, data formatters and validation rules" },
      { id: "config", name: "Build & Configuration", count: nodes.filter(n => n.layer === "config").length, description: "Build tools, styling configuration and dependencies" }
    ];

    return res.status(200).json({
      nodes,
      edges,
      circularDependencies: analysis.circularDependencies,
      subsystems
    });
  }

  public static async getDependencies(req: Request, res: Response) {
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    if (!analysis) return res.status(404).json({ error: "No analysis found." });
    return res.status(200).json({
      dependencies: analysis.dependencies,
      circularDependencies: analysis.circularDependencies
    });
  }

  public static async getFiles(req: Request, res: Response) {
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    if (!analysis) return res.status(404).json({ error: "No analysis found." });
    return res.status(200).json({ files: analysis.files });
  }

  public static async getFileContent(req: Request, res: Response) {
    try {
      const filePath = req.query.path as string;
      if (!filePath) {
        return res.status(400).json({ error: "Missing path query parameter" });
      }
      const service = AnalysisService.getInstance();
      const content = service.getFileContent(filePath);
      return res.status(200).json(content);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async getGitHistory(req: Request, res: Response) {
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    if (!analysis) return res.status(404).json({ error: "No analysis found." });
    return res.status(200).json({
      commits: analysis.commits,
      mostChangedFiles: analysis.mostChangedFiles,
      contributorsCount: analysis.summary.contributorsCount,
      commitsCount: analysis.summary.commitsCount
    });
  }

  public static async getTechDebt(req: Request, res: Response) {
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    if (!analysis) return res.status(404).json({ error: "No analysis found." });
    return res.status(200).json({
      technicalDebt: analysis.technicalDebt,
      circularDependencies: analysis.circularDependencies
    });
  }

  public static async getRiskAnalysis(req: Request, res: Response) {
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    if (!analysis) return res.status(404).json({ error: "No analysis found." });
    return res.status(200).json({
      riskPoints: analysis.riskPoints
    });
  }

  public static async analyzeImpact(req: Request, res: Response) {
    const { targetSymbol, targetFile } = req.body;
    const result = ImpactService.analyzeImpact(targetSymbol || "PaymentService.processPayment()", targetFile);
    return res.status(200).json(result);
  }

  public static async queryAI(req: Request, res: Response) {
    try {
      const { question, repo } = req.body;
      const aiService = AIService.getInstance();
      const result = await aiService.query(question || "Why does PaymentService depend on TransactionService?", repo);
      return res.status(200).json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  public static async generateDocs(req: Request, res: Response) {
    const { moduleName } = req.body;
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    const target = moduleName || analysis?.repoName || "Module";

    // Find matching dependency/file data for this module
    const matchingDep = analysis?.dependencies.find(d => d.module === target || d.path.includes(target));
    const matchingFile = analysis?.files.find(f => f.name.replace(/\.[^.]+$/, "") === target || f.path.includes(target));
    const relatedDebt = analysis?.technicalDebt.filter(td => td.component.includes(target) || td.file.includes(target)) || [];
    const relatedCircular = analysis?.circularDependencies.filter(cd => cd.modules.includes(target)) || [];

    // Build dependencies list from modules data
    const modData = analysis?.modules.find(m => m.name === target || m.id.includes(target));
    const importsList = modData?.raw_imports?.map(i => `- \`${i}\``)?.join("\n") || "- No tracked imports";

    const docMarkdown = `# ${target} Documentation

## Purpose
Module located at \`${matchingDep?.path || matchingFile?.path || "unknown"}\`.

## Metrics
- **Lines of Code**: ${matchingFile?.loc || "N/A"}
- **Cyclomatic Complexity**: ${matchingFile?.complexity || "N/A"}
- **Language**: ${matchingFile?.language || "N/A"}
- **Symbols**: ${matchingFile?.symbolsCount || "N/A"}
${matchingDep ? `- **Depends On**: ${matchingDep.dependsOn} modules\n- **Dependents**: ${matchingDep.dependents} modules\n- **Coupling Risk**: ${matchingDep.risk}` : ""}

## Imports
${importsList}

${relatedCircular.length > 0 ? `## Circular Dependencies
${relatedCircular.map(cd => `> **Warning**: ${cd.chain} (Severity: ${cd.severity})`).join("\n")}` : ""}

${relatedDebt.length > 0 ? `## Technical Debt
${relatedDebt.map(td => `- **[${td.severity}]** ${td.issue}\n  - File: \`${td.file}\`\n  - Recommendation: ${td.recommendation}`).join("\n\n")}` : ""}
`;

    // Persist documentation to relational database
    try {
      const { AnalysisRepository } = await import("../repositories/analysis.repository");
      await AnalysisRepository.saveDocumentation(analysis?.repoName || "unknown", `${target} Architecture Spec`, docMarkdown, "MODULE", target);
    } catch (e: any) {
      console.warn("Could not save doc to db:", e.message);
    }

    return res.status(200).json({ markdown: docMarkdown });
  }

  public static async getReports(req: Request, res: Response) {
    const service = AnalysisService.getInstance();
    const analysis = service.getCurrentAnalysis();
    const hb = analysis?.summary.healthBreakdown;

    // Build dynamic hotspots
    const circularSection = analysis?.circularDependencies.length
      ? analysis.circularDependencies.map(cd => `- **Circular Dependency**: \`${cd.chain}\` (${cd.severity})`).join("\n")
      : "- No circular dependencies detected.";

    // Top risk files
    const topRisks = (analysis?.riskPoints || [])
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 5)
      .map((r, i) => `${i + 1}. **${r.name}** — Complexity: ${r.complexity}, Churn: ${r.changeFrequency}, Risk: ${r.riskLevel}`)
      .join("\n");

    // Top tech debt
    const topDebt = (analysis?.technicalDebt || [])
      .filter(td => td.severity === "HIGH" || td.severity === "CRITICAL")
      .slice(0, 5)
      .map((td, i) => `${i + 1}. **${td.component}**: ${td.issue}\n   - Recommendation: ${td.recommendation}`)
      .join("\n");

    // Language breakdown
    const langBreakdown = Object.entries(analysis?.languages || {})
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([lang, loc]) => `- **${lang}**: ${loc} lines`)
      .join("\n");

    const reportMarkdown = `# Digital Archaeologist: Engineering Assessment Report
**Repository:** ${analysis?.repoName || "unknown"}  
**Branch:** ${analysis?.branch || "main"}  
**Health Score:** ${analysis?.summary.healthScore || 0} / 100  
**Generated:** ${new Date().toUTCString()}  
**Files Analyzed:** ${analysis?.summary.filesCount || 0}  
**Total Lines of Code:** ${analysis?.summary.totalLoc || 0}  

---

## 1. Executive Summary
The analyzed codebase **${analysis?.repoName || "repository"}** contains ${analysis?.summary.filesCount || 0} source files spanning ${analysis?.summary.totalLoc || 0} lines of code across ${Object.keys(analysis?.languages || {}).length} language(s). ${analysis?.summary.commitsCount || 0} commits by ${analysis?.summary.contributorsCount || 0} contributor(s) were analyzed. Overall Engineering Health is evaluated at **${analysis?.summary.healthScore || 0}/100**.

## 2. Language Breakdown
${langBreakdown || "- No languages detected"}

## 3. Architectural Assessment
- **Architecture Health:** ${hb?.architecture || 0} / 100
- **Maintainability:** ${hb?.maintainability || 0} / 100
- **Test Coverage:** ${hb?.testCoverage || 0} / 100
- **Documentation:** ${hb?.documentation || 0} / 100
- **Dependency Health:** ${hb?.dependencyHealth || 0} / 100

### Architectural Hotspots
${circularSection}

## 4. Risk Hotspots (Churn × Complexity)
${topRisks || "No significant risk hotspots detected."}

## 5. Critical Technical Debt Items
${topDebt || "No high-severity technical debt detected."}

## 6. Remediation Recommendations
${analysis?.circularDependencies.length ? "- **Decouple circular dependencies** using dependency injection, event buses, or intermediate interfaces." : ""}
${(analysis?.technicalDebt || []).some(td => td.category === "Security / Deprecated API") ? "- **Address security vulnerabilities** by replacing deprecated APIs and insecure algorithms." : ""}
${(analysis?.technicalDebt || []).some(td => td.category === "Complexity") ? "- **Reduce complexity hotspots** by extracting methods and applying strategy patterns." : ""}
- **Increase test coverage** across critical paths identified in the risk matrix.
- **Improve documentation** for high-traffic modules.
`;

    // Persist assessment report to relational database
    try {
      const { AnalysisRepository } = await import("../repositories/analysis.repository");
      await AnalysisRepository.saveDocumentation(analysis?.repoName || "unknown", "Engineering Assessment Report", reportMarkdown, "REPOSITORY");
    } catch (e: any) {
      console.warn("Could not save report to db:", e.message);
    }

    return res.status(200).json({ markdown: reportMarkdown });
  }

  public static async getDatabaseStats(req: Request, res: Response) {
    try {
      const { AnalysisRepository } = await import("../repositories/analysis.repository");
      const stats = await AnalysisRepository.getDatabaseStats();
      return res.status(200).json({ status: "connected", database: "SQLite (Prisma)", tables: stats });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}

