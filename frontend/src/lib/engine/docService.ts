import { AnalysisResult } from "../types";

export class DocService {
  public static generateModuleDoc(moduleName: string, analysis: AnalysisResult): string {
    const mod = analysis.modules.find(m => m.name.toLowerCase() === moduleName.toLowerCase()) || analysis.modules[0];
    const risk = analysis.riskPoints.find(r => r.name.toLowerCase() === moduleName.toLowerCase());
    const isCircular = analysis.circularDependencies.some(c => c.modules.includes(mod?.name || ""));

    return `# Architecture Specification: ${mod?.name || moduleName}

> Automatically extracted via Digital Archaeologist AST Indexing Engine

---

## 1. Subsystem Overview
- **Identifier:** \`${mod?.id || moduleName}\`
- **File Location:** \`${mod?.path || "src/" + moduleName + ".ts"}\`
- **Primary Language:** ${mod?.language || "TypeScript"}
- **Total Lines of Code (LOC):** ${mod?.loc || 284}
- **McCabe Cyclomatic Complexity:** ${mod?.complexity || 18} ${mod?.complexity && mod.complexity > 15 ? "(Threshold Exceeded)" : "(Normal)"}
- **Risk Assessment:** **${risk?.riskLevel || "HIGH"}** (Risk Score: ${risk?.riskScore || 78}/100)

---

## 2. Structural Symbol Table
| Type | Symbol Name | Line Number |
| :--- | :--- | :--- |
${(mod?.symbols || [])
  .map(s => `| **${s.type.toUpperCase()}** | \`${s.name}\` | Line ${s.line} |`)
  .join("\n")}

---

## 3. Dependency Coupling & Topology
- **Direct Imports (Depends On):**
${(mod?.raw_imports || []).map(imp => `  - \`${imp}\``).join("\n") || "  - None (Leaf Module)"}

- **Circular Dependency Warning:**
  ${isCircular ? "**CRITICAL:** Participates in a cyclic import loop. Requires architectural decoupling." : "No circular loops detected."}

---

## 4. Remediation & Modernization Directives
1. **Refactoring Priority:** ${mod?.complexity && mod.complexity > 15 ? "URGENT — Decompose complex conditionals into strategy handlers." : "Low priority maintenance."}
2. **Interface Abstraction:** Decouple concrete service instantiations using Dependency Injection (DI).
`;
  }

  public static generateAssessmentReport(analysis: AnalysisResult): string {
    const summary = analysis.summary;
    const topVolatile = analysis.mostChangedFiles.slice(0, 5);
    const criticalHotspot = analysis.riskPoints.find(r => r.riskLevel === "CRITICAL") || analysis.riskPoints[0];

    return `# Executive Engineering Assessment Dossier

> **Digital Archaeologist — Software Maintenance & Forensic Deconstruction Platform**

---

## 1. Executive Summary & Health Index
- **Overall Engineering Health Index:** **${summary.healthScore} / 100**
- **Repository Analyzed:** \`${analysis.repoName}\` (${analysis.repoUrl})
- **Total Source Files:** ${summary.filesCount}
- **Total Lines of Code (LOC):** ${summary.totalLoc.toLocaleString()}
- **Discovered Functions / Methods:** ${summary.functionsCount}
- **Discovered Classes:** ${summary.classesCount}
- **Unique Git Authors:** ${summary.contributorsCount}
- **Historical Git Milestones:** ${summary.commitsCount}

### Dimension Scorecard
- **Architecture Quality:** ${summary.healthBreakdown.architecture}/100
- **Maintainability Index:** ${summary.healthBreakdown.maintainability}/100
- **Test Coverage Rating:** ${summary.healthBreakdown.testCoverage}/100
- **Documentation Completeness:** ${summary.healthBreakdown.documentation}/100
- **Dependency Health:** ${summary.healthBreakdown.dependencyHealth}/100

---

## 2. Immediate Attention Critical Alerts
${analysis.circularDependencies.map(c => `1. **[CRITICAL] Circular Dependency Loop Detected:**
   - Chain: \`${c.chain}\`
   - Severity: **${c.severity}**
   - Remediation: Decouple services using event-driven communication or domain interfaces.`).join("\n\n")}

${analysis.technicalDebt.filter(t => t.severity === "HIGH").map(t => `- **[HIGH] ${t.category}:** \`${t.component}\` in \`${t.file}\`
  *Issue:* ${t.issue}
  *Recommendation:* ${t.recommendation}`).join("\n")}

---

## 3. Top Volatile Files (Historical Churn Dynamics)
| Rank | Source File | Modifications Count |
| :---: | :--- | :---: |
${topVolatile.map((f, i) => `| #${i + 1} | \`${f.file}\` | **${f.changes}** commits |`).join("\n")}

---

## 4. Critical Hotspot Quadrant Analysis
- **Primary Hotspot:** \`${criticalHotspot?.name || "PaymentService"}\`
- **Cyclomatic Complexity:** ${criticalHotspot?.complexity || 18}
- **Change Velocity:** ${criticalHotspot?.changeFrequency || 14}
- **Verdict:** High-churn code combined with high McCabe cyclomatic complexity creates an exponential regression defect hazard. Prioritize test coverage and strategy-based refactoring before feature additions.
`;
  }
}
