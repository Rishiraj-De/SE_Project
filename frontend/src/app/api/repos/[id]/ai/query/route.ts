import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";
import { AIService } from "@/lib/engine/aiService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question } = body;
    const store = AnalysisStore.getInstance();
    const analysis = store.getCurrentAnalysis();

    if (!analysis) {
      return NextResponse.json({ error: "No active analysis found." }, { status: 404 });
    }

    const result = AIService.query(question || "", analysis);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to query AI assistant" }, { status: 500 });
  }
}
