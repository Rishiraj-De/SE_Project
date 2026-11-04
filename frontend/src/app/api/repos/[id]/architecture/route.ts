import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";

export async function GET() {
  const store = AnalysisStore.getInstance();
  const analysis = store.getCurrentAnalysis();

  if (!analysis) {
    return NextResponse.json({ error: "No active analysis found." }, { status: 404 });
  }

  const circularModules = new Set<string>();
  for (const cd of analysis.circularDependencies || []) {
    for (const m of cd.modules) circularModules.add(m);
  }

  const importsMap: Record<string, string[]> = {};
  const importedByMap: Record<string, string[]> = {};

  for (const dep of analysis.dependencies || []) {
    importsMap[dep.module] = [];
    importedByMap[dep.module] = [];
  }

  for (const mod of analysis.modules || []) {
    const fromName = mod.name;
    for (const imp of mod.raw_imports || []) {
      const toName = imp.split("/").pop()?.replace(/\.[^.]+$/, "") || imp;
      if (importsMap[fromName] && !importsMap[fromName].includes(toName)) {
        importsMap[fromName].push(toName);
      }
      if (importedByMap[toName] && !importedByMap[toName].includes(fromName)) {
        importedByMap[toName].push(fromName);
      }
    }
  }

  const nodes = (analysis.dependencies || []).map((dep, i) => {
    let role = "service";
    let layer = "services";
    const lower = dep.module.toLowerCase();
    if (lower.includes("controller") || lower.includes("handler")) {
      role = "controller";
      layer = "controllers";
    } else if (lower.includes("connector") || lower.includes("database") || lower.includes("repo")) {
      role = "database";
      layer = "database";
    } else if (lower.includes("util") || lower.includes("helper") || lower.includes("crypto")) {
      role = "utility";
      layer = "utilities";
    }

    const col = i % 3;
    const row = Math.floor(i / 3);

    return {
      id: dep.module,
      type: "customModuleNode",
      position: { x: col * 320 + 80, y: row * 220 + 80 },
      data: {
        label: dep.module,
        role,
        layer,
        loc: 180,
        complexity: dep.risk === "HIGH" ? 18 : dep.risk === "MEDIUM" ? 10 : 5,
        changeFrequency: dep.risk === "HIGH" ? 14 : 3,
        isCircular: circularModules.has(dep.module),
        imports: importsMap[dep.module] || [],
        importedBy: importedByMap[dep.module] || []
      }
    };
  });

  const edges: Array<{ id: string; source: string; target: string; animated: boolean; label: string; circular?: boolean }> = [];
  let edgeId = 1;

  for (const mod of analysis.modules || []) {
    for (const imp of mod.raw_imports || []) {
      const toName = imp.split("/").pop()?.replace(/\.[^.]+$/, "") || imp;
      if (importsMap[toName] && toName !== mod.name) {
        const isCircular = circularModules.has(mod.name) && circularModules.has(toName);
        edges.push({
          id: `e-${edgeId++}`,
          source: mod.name,
          target: toName,
          animated: isCircular,
          label: isCircular ? "circular" : "imports",
          circular: isCircular
        });
      }
    }
  }

  return NextResponse.json({ nodes, edges });
}
