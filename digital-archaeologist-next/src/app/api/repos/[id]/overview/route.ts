import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";

export async function GET() {
  const store = AnalysisStore.getInstance();
  const analysis = store.getCurrentAnalysis();

  return NextResponse.json({
    summary: analysis.summary,
    languages: analysis.languages,
    healthScore: analysis.summary.healthScore,
    immediateAttention: [
      {
        type: "CIRCULAR_DEPENDENCY",
        title: "Circular Dependency Detected",
        description: "PaymentService <-> TransactionService forms a cyclic dependency loop.",
        severity: "HIGH"
      },
      {
        type: "SECURITY_DEPRECATION",
        title: "Insecure MD5 Hashing in Auth",
        description: "LegacyCryptoUtils.legacy_v1_encrypt utilizes weak MD5 algorithm.",
        severity: "HIGH"
      }
    ]
  });
}
