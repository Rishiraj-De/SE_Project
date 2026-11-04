import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";
import { DocService } from "@/lib/engine/docService";

export async function GET() {
  const store = AnalysisStore.getInstance();
  const analysis = store.getCurrentAnalysis();

  if (!analysis) {
    return NextResponse.json({ error: "No active analysis found." }, { status: 404 });
  }

  const markdown = DocService.generateAssessmentReport(analysis);
  return NextResponse.json({ markdown });
}
