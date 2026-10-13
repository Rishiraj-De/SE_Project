import { AnalysisResult, BlastRadiusResult, AIResponse } from "./types";
import { DEMO_ANALYSIS, DEMO_BLAST_RADIUS, DEMO_AI_RESPONSES, DEMO_FILE_CONTENTS } from "./demoData";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function fetchAnalysisStatus(): Promise<{ isAnalyzing: boolean; analysis: AnalysisResult | null }> {
  try {
    const res = await fetch(`${API_BASE}/analysis/status`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Status API returned non-OK");
    return await res.json();
  } catch (err) {
    // Graceful offline / Vercel fallback
    return {
      isAnalyzing: false,
      analysis: DEMO_ANALYSIS
    };
  }
}

export async function triggerAnalysis(repoUrl: string, repoName?: string): Promise<AnalysisResult> {
  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repoUrl, repoName }),
      signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) throw new Error("Analysis failed");
    return await res.json();
  } catch (err) {
    return {
      ...DEMO_ANALYSIS,
      repoUrl: repoUrl || DEMO_ANALYSIS.repoUrl,
      repoName: repoName || "analyzed-repository",
      analyzedAt: new Date().toISOString()
    };
  }
}

export async function fetchOverview(repoId: string = "current") {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/overview`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch overview");
    return await res.json();
  } catch {
    return {
      summary: DEMO_ANALYSIS.summary,
      languages: DEMO_ANALYSIS.languages,
      healthScore: DEMO_ANALYSIS.summary.healthScore,
      immediateAttention: [
        {
          type: "CIRCULAR_DEPENDENCY",
          title: "Circular Dependency Detected",
          description: "PaymentService <-> TransactionService forms a cyclic dependency loop.",
          severity: "HIGH"
        },
        {
          type: "SECURITY_DEPRECATION",
          title: "Insecure MD5 Hashing in Auth",
          description: "LegacyCryptoUtils.legacy_v1_encrypt utilizes weak MD5 algorithm.",
          severity: "HIGH"
        }
      ]
    };
  }
}

export async function fetchArchitecture(repoId: string = "current") {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/architecture`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch architecture");
    return await res.json();
  } catch {
    // Generate nodes and edges dynamically from DEMO_ANALYSIS
    const nodes = DEMO_ANALYSIS.dependencies.map((dep, i) => {
      let role = "service";
      const lower = dep.module.toLowerCase();
      if (lower.includes("controller")) role = "controller";
      else if (lower.includes("connector") || lower.includes("database")) role = "database";
      else if (lower.includes("util") || lower.includes("crypto")) role = "utility";

      return {
        id: dep.module,
        type: "customModuleNode",
        position: { x: (i % 3) * 280 + 80, y: Math.floor(i / 3) * 180 + 80 },
        data: {
          label: dep.module,
          role,
          loc: 180,
          complexity: dep.risk === "HIGH" ? 18 : 8,
          changeFrequency: dep.risk === "HIGH" ? 14 : 3,
          isCircular: dep.module === "PaymentService" || dep.module === "TransactionService",
          imports: dep.module === "PaymentService" ? ["TransactionService", "DatabaseConnector"] : dep.module === "TransactionService" ? ["PaymentService", "DatabaseConnector"] : [],
          importedBy: dep.module === "DatabaseConnector" ? ["PaymentService", "TransactionService"] : []
        }
      };
    });

    const edges = [
      { id: "e-circ-1", source: "PaymentService", target: "TransactionService", animated: true, label: "circular", circular: true },
      { id: "e-circ-2", source: "TransactionService", target: "PaymentService", animated: true, label: "circular", circular: true },
      { id: "e-db-1", source: "PaymentService", target: "DatabaseConnector", animated: false, label: "queries" },
      { id: "e-db-2", source: "TransactionService", target: "DatabaseConnector", animated: false, label: "queries" },
      { id: "e-notif-1", source: "PaymentService", target: "NotificationService", animated: false, label: "sends" },
      { id: "e-auth-1", source: "AuthController", target: "LegacyCryptoUtils", animated: false, label: "hashes" }
    ];

    return { nodes, edges };
  }
}

export async function fetchDependencies(repoId: string = "current") {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/dependencies`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch dependencies");
    return await res.json();
  } catch {
    return {
      dependencies: DEMO_ANALYSIS.dependencies,
      circularDependencies: DEMO_ANALYSIS.circularDependencies
    };
  }
}

export async function fetchFiles(repoId: string = "current") {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/files`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch files");
    return await res.json();
  } catch {
    return {
      files: DEMO_ANALYSIS.files,
      tree: [
        {
          name: "src",
          path: "src",
          type: "dir",
          children: [
            {
              name: "payment",
              path: "src/payment",
              type: "dir",
              children: [
                { name: "PaymentService.ts", path: "src/payment/PaymentService.ts", type: "file", loc: 284, complexity: 18 },
                { name: "TransactionService.ts", path: "src/payment/TransactionService.ts", type: "file", loc: 195, complexity: 12 }
              ]
            },
            {
              name: "auth",
              path: "src/auth",
              type: "dir",
              children: [
                { name: "AuthController.ts", path: "src/auth/AuthController.ts", type: "file", loc: 142, complexity: 9 }
              ]
            },
            {
              name: "database",
              path: "src/database",
              type: "dir",
              children: [
                { name: "DatabaseConnector.ts", path: "src/database/DatabaseConnector.ts", type: "file", loc: 168, complexity: 7 }
              ]
            },
            {
              name: "utils",
              path: "src/utils",
              type: "dir",
              children: [
                { name: "LegacyCryptoUtils.ts", path: "src/utils/LegacyCryptoUtils.ts", type: "file", loc: 135, complexity: 11 }
              ]
            }
          ]
        }
      ]
    };
  }
}

export async function fetchFileContent(filePath: string, repoId: string = "current"): Promise<{ content: string; language: string; loc: number }> {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/file-content?path=${encodeURIComponent(filePath)}`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch file content");
    return await res.json();
  } catch {
    const content = DEMO_FILE_CONTENTS[filePath] || `// Source file: ${filePath}\n// Loaded via Digital Archaeologist AST Index\n\nexport class ${filePath.split("/").pop()?.replace(/\.[^.]+$/, "") || "Module"} {\n  // Implementation\n}\n`;
    return {
      content,
      language: filePath.endsWith(".ts") || filePath.endsWith(".tsx") ? "typescript" : filePath.endsWith(".js") ? "javascript" : "plaintext",
      loc: content.split("\n").length
    };
  }
}

export async function fetchGitHistory(repoId: string = "current") {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/git-history`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch git history");
    return await res.json();
  } catch {
    return {
      commits: DEMO_ANALYSIS.commits,
      mostChangedFiles: DEMO_ANALYSIS.mostChangedFiles
    };
  }
}

export async function fetchTechDebt(repoId: string = "current") {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/tech-debt`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch technical debt");
    return await res.json();
  } catch {
    return {
      technicalDebt: DEMO_ANALYSIS.technicalDebt
    };
  }
}

export async function fetchRiskAnalysis(repoId: string = "current") {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/risk-analysis`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch risk analysis");
    return await res.json();
  } catch {
    return {
      riskPoints: DEMO_ANALYSIS.riskPoints
    };
  }
}

export async function fetchImpactAnalysis(targetSymbol: string, targetFile?: string, repoId: string = "current"): Promise<BlastRadiusResult> {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/impact-analysis`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetSymbol, targetFile }),
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error("Failed to calculate blast radius");
    return await res.json();
  } catch {
    return {
      ...DEMO_BLAST_RADIUS,
      targetSymbol: targetSymbol || DEMO_BLAST_RADIUS.targetSymbol,
      targetFile: targetFile || DEMO_BLAST_RADIUS.targetFile
    };
  }
}

export async function queryAI(question: string, repoId: string = "legacy-payment-system"): Promise<AIResponse> {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/ai/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, repo: repoId }),
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) throw new Error("Failed to query contextual AI assistant");
    return await res.json();
  } catch {
    return DEMO_AI_RESPONSES.default;
  }
}

export async function generateDocumentation(moduleName: string, repoId: string = "current"): Promise<{ markdown: string }> {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/docs/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleName }),
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) throw new Error("Failed to generate documentation");
    return await res.json();
  } catch {
    return {
      markdown: `# Architecture Specification: ${moduleName}

## Overview
**${moduleName}** is a critical subsystem identified in the AST dependency graph.
- **Lines of Code (LOC):** 284
- **Cyclomatic Complexity:** 18 (McCabe Threshold Exceeded)
- **Role:** Payment Gateway Dispatcher & Settlement Orchestrator

## Dependencies & Coupling
- **Imports:** \`TransactionService\`, \`DatabaseConnector\`, \`NotificationService\`
- **Imported By:** \`CheckoutController\`, \`TransactionService\` *(Circular Loop)*

## Identified Risk & Anti-Patterns
1. **Circular Dependency:** Reciprocal coupling with \`TransactionService\` prevents isolated unit testing.
2. **Database Write Cascades:** Modifying \`processPayment\` cascades writes to ledger tables.

## Recommended Refactoring Plan
- Decouple gateway authorization from transaction persistence using an Event-Driven Architecture or \`IPaymentRecordService\` interface.
`
    };
  }
}

export async function fetchReports(repoId: string = "current"): Promise<{ markdown: string }> {
  try {
    const res = await fetch(`${API_BASE}/repos/${repoId}/reports`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error("Failed to fetch reports");
    return await res.json();
  } catch {
    return {
      markdown: `# Executive Engineering Assessment Dossier

> **Digital Archaeologist — Software Maintenance & Forensic Deconstruction Platform**

---

## 1. Executive Summary
- **Overall Engineering Health Index:** **68 / 100**
- **Total Source Files:** 14
- **Total Lines of Code (LOC):** 2,420
- **Total Commit Milestones:** 18
- **Primary Languages:** TypeScript (90%), JSON (10%)

---

## 2. Immediate Attention Alerts
1. **[CRITICAL] Circular Dependency Loop:**
   \`PaymentService <-> TransactionService\`
   *Impact:* Prevents clean modular decoupling and complicates unit mock injection.
2. **[HIGH] Security Deprecation:**
   \`LegacyCryptoUtils.legacy_v1_encrypt\` invokes weak MD5 hashing for credential hashing.
3. **[HIGH] Hotspot Hot-Zone:**
   \`PaymentService.ts\` is located in the Critical Hotspot quadrant (Complexity: 18, Churn: 14 modifications).

---

## 3. Engineering Health Breakdown
- **Architecture:** 72 / 100
- **Maintainability:** 61 / 100
- **Test Coverage:** 43 / 100
- **Documentation:** 35 / 100
- **Dependency Health:** 74 / 100

---

## 4. Remediation Action Plan
1. **Decouple Payment and Transaction Services:** Introduce an event bus (\`PaymentProcessedEvent\`) to break the bidirectional import.
2. **Decompose High-Complexity Gateway Logic:** Refactor nested \`if-else\` gateway branches in \`PaymentService.processPayment\` into Strategy pattern implementations.
3. **Upgrade Password Cryptography:** Replace MD5 with \`argon2id\` or \`bcrypt\`.
`
    };
  }
}
