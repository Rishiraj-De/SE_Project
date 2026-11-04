import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";

export async function GET() {
  const store = AnalysisStore.getInstance();
  const analysis = store.getCurrentAnalysis();

  if (!analysis) {
    return NextResponse.json({ error: "No active analysis found." }, { status: 404 });
  }

  // Construct dynamic file tree from analyzed files
  const tree: any[] = [];
  for (const f of analysis.files || []) {
    const parts = f.path.split("/");
    let currentLevel = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      let existing = currentLevel.find((item: any) => item.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          type: isFile ? "file" : "dir",
          loc: isFile ? f.loc : undefined,
          complexity: isFile ? f.complexity : undefined,
          children: isFile ? undefined : []
        };
        currentLevel.push(existing);
      }
      if (!isFile) {
        currentLevel = existing.children;
      }
    }
  }

  return NextResponse.json({
    files: analysis.files,
    tree
  });
}
