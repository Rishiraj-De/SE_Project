import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";
import { ImpactService } from "@/lib/engine/impactService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetSymbol, targetFile } = body;
    const store = AnalysisStore.getInstance();
    const analysis = store.getCurrentAnalysis();

    if (!analysis) {
      return NextResponse.json({ error: "No active analysis found." }, { status: 404 });
    }

    const result = ImpactService.analyzeImpact(analysis, targetSymbol, targetFile);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to calculate blast radius" }, { status: 500 });
  }
}
