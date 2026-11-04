import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";
import { DocService } from "@/lib/engine/docService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { moduleName } = body;
    const store = AnalysisStore.getInstance();
    const analysis = store.getCurrentAnalysis();

    if (!analysis) {
      return NextResponse.json({ error: "No active analysis found." }, { status: 404 });
    }

    const markdown = DocService.generateModuleDoc(moduleName || "SystemArchitecture", analysis);
    return NextResponse.json({ markdown });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate documentation" }, { status: 500 });
  }
}
