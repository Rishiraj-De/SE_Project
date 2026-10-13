import { NextResponse } from "next/server";
import { AnalysisStore } from "@/lib/engine/store";

export async function GET() {
  const store = AnalysisStore.getInstance();
  const analysis = store.getCurrentAnalysis();

  const tree = [
    {
      name: "src",
      path: "src",
      type: "dir",
      children: [
        {
          name: "payment",
          path: "src/payment",
          type: "dir",
          children: [
            { name: "PaymentService.ts", path: "src/payment/PaymentService.ts", type: "file", loc: 284, complexity: 18 },
            { name: "TransactionService.ts", path: "src/payment/TransactionService.ts", type: "file", loc: 195, complexity: 12 }
          ]
        },
        {
          name: "auth",
          path: "src/auth",
          type: "dir",
          children: [
            { name: "AuthController.ts", path: "src/auth/AuthController.ts", type: "file", loc: 142, complexity: 9 },
            { name: "SessionManager.ts", path: "src/auth/SessionManager.ts", type: "file", loc: 29, complexity: 3 }
          ]
        },
        {
          name: "database",
          path: "src/database",
          type: "dir",
          children: [
            { name: "DatabaseConnector.ts", path: "src/database/DatabaseConnector.ts", type: "file", loc: 168, complexity: 7 }
          ]
        },
        {
          name: "notifications",
          path: "src/notifications",
          type: "dir",
          children: [
            { name: "NotificationService.ts", path: "src/notifications/NotificationService.ts", type: "file", loc: 110, complexity: 5 }
          ]
        },
        {
          name: "users",
          path: "src/users",
          type: "dir",
          children: [
            { name: "UserRepository.ts", path: "src/users/UserRepository.ts", type: "file", loc: 175, complexity: 8 }
          ]
        },
        {
          name: "utils",
          path: "src/utils",
          type: "dir",
          children: [
            { name: "LegacyCryptoUtils.ts", path: "src/utils/LegacyCryptoUtils.ts", type: "file", loc: 135, complexity: 11 }
          ]
        },
        { name: "index.ts", path: "src/index.ts", type: "file", loc: 45, complexity: 2 }
      ]
    }
  ];

  return NextResponse.json({
    files: analysis.files,
    tree
  });
}
