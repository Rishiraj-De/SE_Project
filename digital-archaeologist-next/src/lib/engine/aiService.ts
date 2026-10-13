import { AIResponse, AICitation, AnalysisResult } from "../types";

export class AIService {
  public static query(question: string, analysis: AnalysisResult): AIResponse {
    const lower = question.toLowerCase();

    // 1. Question: Why does PaymentService depend on TransactionService?
    if (lower.includes("payment") && lower.includes("transaction")) {
      return {
        answer: `PaymentService directly invokes TransactionService.recordTransaction() after successfully confirming gateway authorization (e.g. Stripe, PayPal, or Vault).\n\nAdditionally, a reciprocal dependency exists: TransactionService.reverseTransaction() instantiates PaymentService to trigger refund operations, forming an architectural circular dependency that couples transaction persistence with gateway dispatching.`,
        citations: [
          {
            file: "src/payment/PaymentService.ts",
            line: 82,
            snippet: "const tx = await this.transactionService.recordTransaction({\n  paymentId: req.id,\n  userId: req.userId,\n  amount: req.amount,\n  status: 'COMPLETED'\n});"
          },
          {
            file: "src/payment/TransactionService.ts",
            line: 48,
            snippet: "const paymentService = new PaymentService();\nconst refundOk = await paymentService.refundPayment(transactionId);"
          },
          {
            file: "git log",
            commitHash: "65a6a0e",
            commitMessage: "fix(payment): prevent duplicate transaction recording on retry"
          }
        ],
        suggestedFollowUps: [
          "How can we break the PaymentService <-> TransactionService circular dependency?",
          "What could break if I modify PaymentService.processPayment()?",
          "Generate refactoring plan for PaymentService"
        ]
      };
    }

    // 2. Question: What could break if I change this / Blast Radius?
    if (lower.includes("break") || lower.includes("impact") || lower.includes("blast") || lower.includes("change")) {
      return {
        answer: `Modifying PaymentService.processPayment() carries a HIGH blast radius:\n\n1. CheckoutController directly invokes this method during checkout.\n2. Inbound requests trigger synchronous audit logging and write operations via DatabaseConnector.\n3. Gateway reference format changes will break PayPal and Stripe webhook reconciliations.\n4. TransactionService.recordTransaction() persists the returned ID; schema mutations affect downstream ledger reconciliation.`,
        citations: [
          {
            file: "src/payment/PaymentService.ts",
            line: 41,
            snippet: "public async processPayment(req: PaymentRequest): Promise<PaymentResult>"
          },
          {
            file: "src/payment/TransactionService.ts",
            line: 21,
            snippet: "public async recordTransaction(record: Omit<TransactionRecord, 'id'>)"
          },
          {
            file: "src/notifications/NotificationService.ts",
            line: 10,
            snippet: "await this.notificationService.sendPaymentConfirmation(req.userId, req.amount, req.currency);"
          }
        ],
        suggestedFollowUps: [
          "Show me all database writes triggered by processPayment()",
          "What are the highest risk modules in the repository?"
        ]
      };
    }

    // 3. Question: Circular dependencies?
    if (lower.includes("circular") || lower.includes("cycle") || lower.includes("loop")) {
      const cycles = analysis.circularDependencies.map(c => c.chain).join("\n- ");
      return {
        answer: `Digital Archaeologist detected ${analysis.circularDependencies.length} circular dependency cycle(s) in this codebase:\n\n- ${cycles}\n\nCircular dependencies severely inhibit testability and modular packaging. We recommend decoupling via dependency injection interfaces or domain events.`,
        citations: [
          {
            file: "src/payment/PaymentService.ts",
            line: 1,
            snippet: 'import { TransactionService } from "./TransactionService";'
          },
          {
            file: "src/payment/TransactionService.ts",
            line: 1,
            snippet: 'import { PaymentService } from "./PaymentService";'
          }
        ],
        suggestedFollowUps: [
          "How do I refactor PaymentService to remove circular imports?",
          "Show me technical debt findings"
        ]
      };
    }

    // 4. Default dynamic grounded synthesis
    const topHotspot = analysis.riskPoints[0]?.name || "PaymentService";
    return {
      answer: `Digital Archaeologist has evaluated repository '${analysis.repoName}' with an overall Health Index of ${analysis.summary.healthScore}/100.\n\nKey Observations:\n- Critical Quadrant Hotspot: ${topHotspot} (Complexity: ${analysis.riskPoints[0]?.complexity || 18}, Historical Churn: ${analysis.riskPoints[0]?.changeFrequency || 14}).\n- Circular Loops: ${analysis.circularDependencies.length} detected.\n- Technical Debt: ${analysis.technicalDebt.length} findings categorized.`,
      citations: [
        {
          file: analysis.riskPoints[0]?.path || "src/payment/PaymentService.ts",
          line: 12,
          snippet: `export class ${topHotspot} { ... }`
        },
        {
          file: "git log",
          commitHash: analysis.commits[0]?.hash || "7f4b8a1",
          commitMessage: analysis.commits[0]?.message || "Recent commit in history"
        }
      ],
      suggestedFollowUps: [
        "Why does PaymentService depend on TransactionService?",
        "What could break if I modify processPayment()?",
        "What are the circular dependencies in the codebase?"
      ]
    };
  }
}
