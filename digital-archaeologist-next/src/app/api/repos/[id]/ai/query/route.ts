import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";
import { AIService } from "@/lib/engine/aiService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question } = body;

    const store = AnalysisStore.getInstance();
    const analysis = store.getCurrentAnalysis();

    const response = AIService.query(question || "", analysis);
    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to query AI" }, { status: 500 });
  }
}
