import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";
import { ImpactService } from "@/lib/engine/impactService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetSymbol, targetFile } = body;

    const store = AnalysisStore.getInstance();
    const analysis = store.getCurrentAnalysis();

    const result = ImpactService.analyzeImpact(analysis, targetSymbol || "PaymentService.processPayment()", targetFile || "");
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to analyze impact" }, { status: 500 });
  }
}
