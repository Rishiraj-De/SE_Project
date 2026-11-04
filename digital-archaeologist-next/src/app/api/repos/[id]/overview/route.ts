import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";

export async function GET() {
  const store = AnalysisStore.getInstance();
  const analysis = store.getCurrentAnalysis();

  if (!analysis) {
    return NextResponse.json({ error: "No active analysis found." }, { status: 404 });
  }

  return NextResponse.json({
    summary: analysis.summary,
    languages: analysis.languages,
    healthScore: analysis.summary?.healthScore || 68,
    immediateAttention: (analysis.circularDependencies || []).map((cd) => ({
      type: "CIRCULAR_DEPENDENCY",
      title: "Circular Dependency Detected",
      description: `${cd.modules.join(" <-> ")} forms a cyclic loop.`,
      severity: cd.severity
    }))
  });
}
