import { AIResponse, AICitation } from "../types";
import { AnalysisService } from "./analysis.service";

export interface LLMProvider {
  ask(question: string, contextRepo: string): Promise<AIResponse>;
}

export class LocalContextEngine implements LLMProvider {
  public async ask(question: string, contextRepo: string): Promise<AIResponse> {
    const analysis = AnalysisService.getInstance().getCurrentAnalysis();
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

    // 2. Question: What could break if I change this?
    if (lower.includes("break") || lower.includes("impact") || lower.includes("change")) {
      return {
        answer: `Modifying PaymentService.processPayment() carries a HIGH blast radius:\n\n1. CheckoutController directly invokes this method during end-user checkout.\n2. Inbound requests with amounts > 10,000 trigger synchronous audit logging via DatabaseConnector.\n3. Gateway reference format changes will break PayPal and Stripe webhook reconciliations.\n4. TransactionService.recordTransaction() persists the returned ID; any schema change affects downstream financial ledger tables.`,
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
          "Run automated blast radius impact analysis on processPayment()",
          "Which database queries are triggered by PaymentService?",
          "What unit tests are missing for this module?"
        ]
      };
    }

    // 3. Question: Which files are most risky?
    if (lower.includes("risky") || lower.includes("risk") || lower.includes("debt")) {
      return {
        answer: `Based on co-change churn and cyclomatic complexity analysis, the two most critical files are:\n\n1. PaymentService.ts (Complexity 18, 84 historical changes) — high nesting, multiple gateway branches, and circular dependency.\n2. AuthController.ts (Complexity 5, 62 historical changes) — zero test coverage and insecure legacy MD5 hash verification via LegacyCryptoUtils.legacy_v1_encrypt().\n\nDatabaseConnector.ts also presents single-point-of-failure coupling with 6 direct dependents.`,
        citations: [
          {
            file: "src/payment/PaymentService.ts",
            line: 45,
            snippet: "if (req.gateway === 'stripe') { ... } else if (req.gateway === 'paypal') { ... }"
          },
          {
            file: "src/utils/LegacyCryptoUtils.ts",
            line: 7,
            snippet: "export function legacy_v1_encrypt(raw: string): string {\n  return crypto.createHash('md5').update(raw).digest('hex');\n}"
          },
          {
            file: "git log",
            commitHash: "5547385",
            commitMessage: "chore(payment): holiday sale high-load patches"
          }
        ],
        suggestedFollowUps: [
          "Why is MD5 considered technical debt here?",
          "How to refactor DatabaseConnector into a connection pool provider?",
          "View full Risk Analysis quadrant"
        ]
      };
    }

    // 4. Question: Explain this architecture
    if (lower.includes("architecture") || lower.includes("structure") || lower.includes("overview")) {
      return {
        answer: `The repository exhibits a classic tiered monolith pattern typical of 2018–2021 Node.js/TypeScript services:\n\n• Core Services: PaymentService and TransactionService handle business workflows, but suffer from mutual circular dependencies.\n• Authentication Layer: AuthController orchestrates SessionManager and UserRepository with legacy MD5 hashing.\n• Persistence: DatabaseConnector operates as a global singleton providing raw query execution without an ORM layer.\n• Notification Subsystem: NotificationService writes asynchronous alert rows directly to outbound queue tables.`,
        citations: [
          {
            file: "src/database/DatabaseConnector.ts",
            line: 5,
            snippet: "public static getInstance(): DatabaseConnector"
          },
          {
            file: "src/index.ts",
            line: 1,
            snippet: "import { PaymentService } from './payment/PaymentService';\nimport { AuthController } from './auth/AuthController';"
          }
        ],
        suggestedFollowUps: [
          "Show circular dependency graph",
          "Generate architectural documentation",
          "What is the test coverage breakdown?"
        ]
      };
    }

    // Default contextual answer
    return {
      answer: `Analysis of ${analysis?.repoName || "legacy repository"}: The codebase contains ${analysis?.summary.filesCount || 10} source files across ${analysis?.summary.totalLoc || 428} lines of code. Key architectural observations include a circular dependency between PaymentService and TransactionService, single-threaded database access via DatabaseConnector, and dead prototype code in LegacyCryptoUtils.`,
      citations: [
        {
          file: "src/payment/PaymentService.ts",
          line: 1,
          snippet: "import { TransactionService } from './TransactionService';"
        },
        {
          file: "src/payment/TransactionService.ts",
          line: 3,
          snippet: "import { PaymentService } from './PaymentService';"
        }
      ],
      suggestedFollowUps: [
        "Why does PaymentService depend on TransactionService?",
        "What could break if I change this?",
        "Which files are most risky?",
        "Explain this architecture"
      ]
    };
  }
}

export class AIService {
  private static instance: AIService;
  private provider: LLMProvider;

  private constructor() {
    this.provider = new LocalContextEngine();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public setProvider(provider: LLMProvider) {
    this.provider = provider;
  }

  public async query(question: string, repo: string = "legacy-payment-system"): Promise<AIResponse> {
    const result = await this.provider.ask(question, repo);
    try {
      const { AnalysisRepository } = await import("../repositories/analysis.repository");
      await AnalysisRepository.logAIMessage(repo, "user", question);
      await AnalysisRepository.logAIMessage(repo, "assistant", result.answer, JSON.stringify(result.citations));
    } catch (e: any) {
      console.warn("Could not log AI conversation to database:", e.message);
    }
    return result;
  }
}
