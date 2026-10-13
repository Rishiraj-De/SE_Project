import { BlastRadiusResult } from "../types";
import { AnalysisService } from "./analysis.service";

export class ImpactService {
  public static analyzeImpact(targetSymbol: string, targetFile: string = ""): BlastRadiusResult {
    const analysis = AnalysisService.getInstance().getCurrentAnalysis();

    // If no analysis data, return a minimal stub
    if (!analysis) {
      return {
        targetSymbol,
        targetFile,
        affectedModules: [],
        affectedFunctions: [targetSymbol],
        databaseOperations: 0,
        externalApis: 0,
        riskRating: "LOW",
        confidence: "Requires Verification",
        callHierarchy: {
          name: targetSymbol,
          type: "root",
          file: targetFile,
          children: []
        },
        reasoning: ["No active analysis found. Run an analysis first to compute impact."]
      };
    }

    // 1. Resolve Target File & Module
    let matchingFile = targetFile ? analysis.files.find(f => f.path === targetFile || f.path.endsWith(targetFile)) : undefined;

    // Check if targetSymbol matches a file directly
    if (!matchingFile && targetSymbol) {
      const cleanTarget = targetSymbol.split("(")[0].trim();
      matchingFile = analysis.files.find(f =>
        f.path === cleanTarget ||
        f.path.endsWith("/" + cleanTarget) ||
        f.name === cleanTarget ||
        f.name.replace(/\.[^.]+$/, "") === cleanTarget
      );
    }

    // Find moduleData by matchingFile or targetSymbol
    let moduleData = matchingFile
      ? analysis.modules.find(m => m.path === matchingFile!.path || m.name === matchingFile!.name.replace(/\.[^.]+$/, ""))
      : undefined;

    if (!moduleData && targetSymbol) {
      const cleanSymbol = targetSymbol.split("(")[0].trim();
      const dotParts = cleanSymbol.split(".");
      const candidateModuleName = dotParts[0].split("/").pop() || "";

      moduleData = analysis.modules.find(m =>
        m.name.toLowerCase() === candidateModuleName.toLowerCase() ||
        m.id.toLowerCase() === candidateModuleName.toLowerCase() ||
        m.id.toLowerCase().endsWith("." + candidateModuleName.toLowerCase())
      );

      // Search in symbols of all modules
      if (!moduleData) {
        const symbolNameToFind = dotParts[dotParts.length - 1];
        for (const m of analysis.modules) {
          if (m.symbols && m.symbols.some(s => s.name === cleanSymbol || s.name === symbolNameToFind)) {
            moduleData = m;
            break;
          }
        }
      }
    }

    if (!matchingFile && moduleData) {
      matchingFile = analysis.files.find(f => f.path === moduleData!.path);
    }

    const resolvedModule = moduleData?.name || (matchingFile ? matchingFile.name.replace(/\.[^.]+$/, "") : (targetSymbol.split(".")[0].replace(/[()]/g, "").split("/").pop() || targetSymbol));
    const resolvedFile = matchingFile?.path || moduleData?.path || targetFile || "unknown";
    const resolvedSymbol = targetSymbol || `${resolvedModule}.main()`;

    // 2. Direct Dependencies (Downstream: what does this module import?)
    const directDependencies: Array<{ name: string; file: string; type: "dependency" }> = [];
    const affectedModules: string[] = [];

    if (moduleData && moduleData.raw_imports) {
      for (const imp of moduleData.raw_imports) {
        const impName = imp.split("/").pop()?.replace(/\.[^.]+$/, "") || imp;
        const depFile = analysis.files.find(f => f.name.replace(/\.[^.]+$/, "") === impName || f.path.endsWith(imp) || f.path.includes("/" + impName + "."));
        if (depFile && impName !== resolvedModule) {
          affectedModules.push(impName);
          directDependencies.push({
            name: `${impName} (imported)`,
            file: depFile.path,
            type: "dependency"
          });
        }
      }
    }

    // Fallback if raw_imports didn't find matches but analysis.dependencies has info
    const matchingDep = analysis.dependencies.find(d => d.module === resolvedModule || d.path === resolvedFile);
    if (directDependencies.length === 0 && matchingDep && matchingDep.dependsOn > 0) {
      for (const dep of analysis.dependencies) {
        if (dep.module !== resolvedModule && dep.path !== resolvedFile) {
          affectedModules.push(dep.module);
          directDependencies.push({
            name: `${dep.module} (imported)`,
            file: dep.path,
            type: "dependency"
          });
          if (directDependencies.length >= matchingDep.dependsOn) break;
        }
      }
    }

    // 3. Direct Callers (Upstream: who imports/calls this module?)
    const directCallers: Array<{ name: string; file: string; type: "caller" }> = [];
    const callers: string[] = [];

    for (const mod of analysis.modules) {
      if (mod.name === resolvedModule || mod.path === resolvedFile) continue;
      for (const imp of (mod.raw_imports || [])) {
        const impName = imp.split("/").pop()?.replace(/\.[^.]+$/, "") || imp;
        if (impName === resolvedModule || imp.includes("/" + resolvedModule)) {
          callers.push(mod.name || mod.id);
          directCallers.push({
            name: `${mod.name || mod.id} (caller)`,
            file: mod.path,
            type: "caller"
          });
          break;
        }
      }
    }

    // Fallback callers from dependencies if not found
    if (directCallers.length === 0 && matchingDep && matchingDep.dependents > 0) {
      for (const dep of analysis.dependencies) {
        if (dep.module !== resolvedModule && dep.path !== resolvedFile && !callers.includes(dep.module)) {
          callers.push(dep.module);
          directCallers.push({
            name: `${dep.module} (caller)`,
            file: dep.path,
            type: "caller"
          });
          if (directCallers.length >= matchingDep.dependents) break;
        }
      }
    }

    // 4. Transitive Tracing (Level 2: callers of callers, and imports of imports)
    const children: any[] = [];

    // Upstream callers first
    for (const caller of directCallers) {
      const callerModName = caller.name.replace(" (caller)", "");
      const transitiveCallers: any[] = [];

      for (const mod of analysis.modules) {
        if (mod.name === callerModName || mod.name === resolvedModule) continue;
        for (const imp of (mod.raw_imports || [])) {
          const impName = imp.split("/").pop()?.replace(/\.[^.]+$/, "") || imp;
          if (impName === callerModName) {
            transitiveCallers.push({
              name: `${mod.name || mod.id} (transitive caller)`,
              type: "caller",
              file: mod.path
            });
            if (!callers.includes(mod.name || mod.id)) callers.push(mod.name || mod.id);
            break;
          }
        }
        if (transitiveCallers.length >= 3) break;
      }

      children.push({
        ...caller,
        children: transitiveCallers
      });
    }

    // Downstream dependencies next
    for (const dep of directDependencies) {
      const depModName = dep.name.replace(" (imported)", "");
      const transitiveDeps: any[] = [];
      const depMod = analysis.modules.find(m => m.name === depModName || m.path === dep.file);

      if (depMod && depMod.raw_imports) {
        for (const subImp of depMod.raw_imports) {
          const subImpName = subImp.split("/").pop()?.replace(/\.[^.]+$/, "") || subImp;
          const subDepFile = analysis.files.find(f => f.name.replace(/\.[^.]+$/, "") === subImpName || f.path.endsWith(subImp));
          if (subDepFile && subImpName !== resolvedModule && subImpName !== depModName) {
            transitiveDeps.push({
              name: `${subImpName} (transitive import)`,
              type: "dependency",
              file: subDepFile.path
            });
            if (!affectedModules.includes(subImpName)) affectedModules.push(subImpName);
          }
          if (transitiveDeps.length >= 3) break;
        }
      }

      children.push({
        ...dep,
        children: transitiveDeps
      });
    }

    // 5. Affected Functions
    const affectedFunctions: string[] = [resolvedSymbol];
    if (moduleData && moduleData.symbols && moduleData.symbols.length > 0) {
      for (const s of moduleData.symbols) {
        const fnFormatted = `${resolvedModule}.${s.name}()`;
        if (!affectedFunctions.includes(fnFormatted) && s.type !== "variable") {
          affectedFunctions.push(fnFormatted);
        }
      }
    }
    for (const c of callers) {
      const cMod = analysis.modules.find(m => m.name === c);
      if (cMod && cMod.symbols && cMod.symbols.length > 0) {
        const topSymbol = cMod.symbols.find(s => s.type === "function") || cMod.symbols[0];
        const fnFormatted = `${c}.${topSymbol.name}()`;
        if (!affectedFunctions.includes(fnFormatted)) {
          affectedFunctions.push(fnFormatted);
        }
      }
    }

    // 6. Circular Dependencies
    const circularInvolved = analysis.circularDependencies.filter(
      cd => cd.modules.includes(resolvedModule)
    );

    // 7. Reasoning
    const reasoning: string[] = [];
    if (matchingDep) {
      reasoning.push(`${resolvedModule} depends on ${matchingDep.dependsOn} direct module(s) and is depended upon by ${matchingDep.dependents} upstream module(s).`);
    }
    if (circularInvolved.length > 0) {
      reasoning.push(`CRITICAL: Circular dependency chain detected: ${circularInvolved.map(c => c.chain).join("; ")}.`);
    }
    if (directCallers.length > 0) {
      reasoning.push(`Direct Callers: ${directCallers.map(c => c.name.replace(" (caller)", "")).join(", ")}. Any signature or behavior changes will directly impact these components.`);
    }
    if (directDependencies.length > 0) {
      reasoning.push(`Downstream Dependencies: ${directDependencies.map(d => d.name.replace(" (imported)", "")).join(", ")}. Ensure contracts and return types remain compatible.`);
    }
    if (matchingFile && matchingFile.complexity > 10) {
      reasoning.push(`Cyclomatic Complexity of ${matchingFile.complexity} in ${matchingFile.name} increases the probability of regression side-effects.`);
    }
    if (reasoning.length === 0) {
      reasoning.push(`Target ${resolvedModule} has minimal coupled dependencies in the scanned AST, indicating an isolated module with low blast radius.`);
    }

    // 8. Determine Risk Rating
    let riskRating: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
    const totalCoupled = affectedModules.length + callers.length;
    if (circularInvolved.length > 0 || totalCoupled >= 5) riskRating = "CRITICAL";
    else if (totalCoupled >= 3 || (matchingFile && matchingFile.complexity > 12)) riskRating = "HIGH";
    else if (totalCoupled >= 1 || (matchingFile && matchingFile.complexity > 6)) riskRating = "MEDIUM";

    // 9. Operations count (Database & External APIs)
    let databaseOperations = 0;
    let externalApis = 0;

    const allCheckedModules = [resolvedModule, ...affectedModules, ...callers];
    for (const modName of allCheckedModules) {
      const lower = modName.toLowerCase();
      if (lower.includes("database") || lower.includes("repo") || lower.includes("model") || lower.includes("dao") || lower.includes("db") || lower.includes("store") || lower.includes("query")) {
        databaseOperations += 1;
      }
      if (lower.includes("api") || lower.includes("gateway") || lower.includes("client") || lower.includes("http") || lower.includes("service") || lower.includes("fetch") || lower.includes("remote")) {
        externalApis += 1;
      }
    }

    const uniqueAffected = [...new Set([...affectedModules, ...callers])];

    return {
      targetSymbol: resolvedSymbol,
      targetFile: resolvedFile,
      affectedModules: uniqueAffected,
      affectedFunctions,
      databaseOperations,
      externalApis,
      riskRating,
      confidence: analysis.modules.length > 0 ? "High (Static Call Graph)" : "Medium (Heuristic Traced)",
      callHierarchy: {
        name: resolvedSymbol,
        type: "root",
        file: resolvedFile,
        line: matchingFile ? 1 : undefined,
        children
      },
      reasoning
    };
  }
}
