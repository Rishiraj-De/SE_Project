import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";

export async function GET() {
  const store = AnalysisStore.getInstance();
  const analysis = store.getCurrentAnalysis();

  if (!analysis) {
    return NextResponse.json({ error: "No active analysis found." }, { status: 404 });
  }

  return NextResponse.json({
    commits: analysis.commits,
    mostChangedFiles: analysis.mostChangedFiles
  });
}
