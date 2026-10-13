import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";
import { DocService } from "@/lib/engine/docService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { moduleName } = body;

    const store = AnalysisStore.getInstance();
    const analysis = store.getCurrentAnalysis();

    const markdown = DocService.generateModuleDoc(moduleName || "PaymentService", analysis);
    return NextResponse.json({ markdown });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate docs" }, { status: 500 });
  }
}
