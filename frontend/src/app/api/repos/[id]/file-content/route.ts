import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get("path") || "src/payment/PaymentService.ts";

  const store = AnalysisStore.getInstance();
  const fileData = store.getFileContent(filePath);

  return NextResponse.json(fileData);
}
