import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { repoUrl, repoName, userEmail } = body;
    const store = AnalysisStore.getInstance();
    const result = await store.analyzeRepository(repoUrl, repoName, userEmail);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to analyze repository" }, { status: 500 });
  }
}
