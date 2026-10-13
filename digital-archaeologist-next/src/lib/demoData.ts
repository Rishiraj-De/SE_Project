import { AnalysisResult, BlastRadiusResult, AIResponse } from "./types";

export const DEMO_ANALYSIS: AnalysisResult = {
  id: "legacy-payment-system-demo",
  repoUrl: "https://github.com/Rishiraj-De/SE_Project",
  repoName: "legacy-payment-system",
  repoDir: "demo-repo/legacy-payment-system",
  branch: "main",
  status: "completed",
  analyzedAt: new Date().toISOString(),
  completedSteps: [
    "Repository cloned",
    "Languages detected",
    "Source tree indexed",
    "AST generated",
    "Dependencies extracted",
    "Git history analysis",
    "Architecture reconstruction",
    "Risk analysis",
    "Documentation generation"
  ],
  summary: {
    filesCount: 14,
    totalLoc: 2420,
    functionsCount: 38,
    classesCount: 12,
    contributorsCount: 4,
    commitsCount: 18,
    healthScore: 68,
    healthBreakdown: {
      architecture: 72,
      maintainability: 61,
      testCoverage: 43,
      documentation: 35,
      dependencyHealth: 74
    }
  },
  languages: {
    TypeScript: 2180,
    JSON: 240
  },
  files: [
    { path: "src/payment/PaymentService.ts", name: "PaymentService.ts", loc: 284, complexity: 18, language: "TypeScript", symbolsCount: 6 },
    { path: "src/payment/TransactionService.ts", name: "TransactionService.ts", loc: 195, complexity: 12, language: "TypeScript", symbolsCount: 4 },
    { path: "src/auth/AuthController.ts", name: "AuthController.ts", loc: 142, complexity: 9, language: "TypeScript", symbolsCount: 3 },
    { path: "src/database/DatabaseConnector.ts", name: "DatabaseConnector.ts", loc: 168, complexity: 7, language: "TypeScript", symbolsCount: 4 },
    { path: "src/notifications/NotificationService.ts", name: "NotificationService.ts", loc: 110, complexity: 5, language: "TypeScript", symbolsCount: 3 },
    { path: "src/users/UserService.ts", name: "UserService.ts", loc: 175, complexity: 8, language: "TypeScript", symbolsCount: 5 },
    { path: "src/utils/LegacyCryptoUtils.ts", name: "LegacyCryptoUtils.ts", loc: 135, complexity: 11, language: "TypeScript", symbolsCount: 4 },
    { path: "src/index.ts", name: "index.ts", loc: 45, complexity: 2, language: "TypeScript", symbolsCount: 1 }
  ],
  modules: [
    {
      id: "src.payment.PaymentService",
      name: "PaymentService",
      path: "src/payment/PaymentService.ts",
      language: "TypeScript",
      loc: 284,
      complexity: 18,
      symbols: [
        { type: "class", name: "PaymentService", line: 12 },
        { type: "function", name: "processPayment", line: 41 },
        { type: "function", name: "refundPayment", line: 120 },
        { type: "function", name: "validateCard", line: 165 },
        { type: "function", name: "dispatchGateway", line: 204 }
      ],
      raw_imports: ["./TransactionService", "../database/DatabaseConnector", "../notifications/NotificationService"]
    },
    {
      id: "src.payment.TransactionService",
      name: "TransactionService",
      path: "src/payment/TransactionService.ts",
      language: "TypeScript",
      loc: 195,
      complexity: 12,
      symbols: [
        { type: "class", name: "TransactionService", line: 8 },
        { type: "function", name: "recordTransaction", line: 21 },
        { type: "function", name: "reverseTransaction", line: 48 },
        { type: "function", name: "getTransactionHistory", line: 89 }
      ],
      raw_imports: ["./PaymentService", "../database/DatabaseConnector"]
    },
    {
      id: "src.auth.AuthController",
      name: "AuthController",
      path: "src/auth/AuthController.ts",
      language: "TypeScript",
      loc: 142,
      complexity: 9,
      symbols: [
        { type: "class", name: "AuthController", line: 10 },
        { type: "function", name: "login", line: 25 },
        { type: "function", name: "register", line: 70 }
      ],
      raw_imports: ["../utils/LegacyCryptoUtils", "../users/UserService"]
    },
    {
      id: "src.database.DatabaseConnector",
      name: "DatabaseConnector",
      path: "src/database/DatabaseConnector.ts",
      language: "TypeScript",
      loc: 168,
      complexity: 7,
      symbols: [
        { type: "class", name: "DatabaseConnector", line: 6 },
        { type: "function", name: "getInstance", line: 14 },
        { type: "function", name: "query", line: 32 },
        { type: "function", name: "executeWrite", line: 65 }
      ],
      raw_imports: []
    },
    {
      id: "src.notifications.NotificationService",
      name: "NotificationService",
      path: "src/notifications/NotificationService.ts",
      language: "TypeScript",
      loc: 110,
      complexity: 5,
      symbols: [
        { type: "class", name: "NotificationService", line: 5 },
        { type: "function", name: "sendPaymentConfirmation", line: 10 },
        { type: "function", name: "sendAlert", line: 35 }
      ],
      raw_imports: []
    },
    {
      id: "src.users.UserService",
      name: "UserService",
      path: "src/users/UserService.ts",
      language: "TypeScript",
      loc: 175,
      complexity: 8,
      symbols: [
        { type: "class", name: "UserService", line: 7 },
        { type: "function", name: "getUserById", line: 18 },
        { type: "function", name: "updateBalance", line: 52 }
      ],
      raw_imports: ["../database/DatabaseConnector"]
    },
    {
      id: "src.utils.LegacyCryptoUtils",
      name: "LegacyCryptoUtils",
      path: "src/utils/LegacyCryptoUtils.ts",
      language: "TypeScript",
      loc: 135,
      complexity: 11,
      symbols: [
        { type: "function", name: "legacy_v1_encrypt", line: 15 },
        { type: "function", name: "unused_rot13_obfuscate", line: 45 },
        { type: "function", name: "legacy_xor_cipher", line: 80 }
      ],
      raw_imports: []
    }
  ],
  dependencies: [
    { module: "PaymentService", path: "src/payment/PaymentService.ts", dependsOn: 3, dependents: 2, risk: "HIGH" },
    { module: "TransactionService", path: "src/payment/TransactionService.ts", dependsOn: 2, dependents: 2, risk: "HIGH" },
    { module: "AuthController", path: "src/auth/AuthController.ts", dependsOn: 2, dependents: 0, risk: "MEDIUM" },
    { module: "DatabaseConnector", path: "src/database/DatabaseConnector.ts", dependsOn: 0, dependents: 4, risk: "HIGH" },
    { module: "NotificationService", path: "src/notifications/NotificationService.ts", dependsOn: 0, dependents: 1, risk: "LOW" },
    { module: "UserService", path: "src/users/UserService.ts", dependsOn: 1, dependents: 1, risk: "LOW" },
    { module: "LegacyCryptoUtils", path: "src/utils/LegacyCryptoUtils.ts", dependsOn: 0, dependents: 1, risk: "MEDIUM" }
  ],
  circularDependencies: [
    {
      modules: ["PaymentService", "TransactionService"],
      chain: "PaymentService -> TransactionService -> PaymentService",
      severity: "HIGH"
    }
  ],
  commits: [
    { hash: "7f4b8a1", author: "Sarah Lin", date: "2024-03-12", message: "refactor(payment): split gateway webhook routing into subhandlers" },
    { hash: "65a6a0e", author: "Alex Rivera", date: "2024-01-20", message: "fix(payment): prevent duplicate transaction recording on retry" },
    { hash: "3e19c0b", author: "Dev Team", date: "2023-11-05", message: "feat(auth): integrate legacy crypto MD5 routine for v1 mobile clients" },
    { hash: "8d91a2f", author: "Sarah Lin", date: "2023-08-14", message: "perf(db): implement singleton connector pool pattern" },
    { hash: "1b08c9d", author: "Jordan Hayes", date: "2022-09-01", message: "init(core): initial payment processing and transaction ledger scaffold" }
  ],
  mostChangedFiles: [
    { file: "src/payment/PaymentService.ts", changes: 14 },
    { file: "src/payment/TransactionService.ts", changes: 9 },
    { file: "src/database/DatabaseConnector.ts", changes: 7 },
    { file: "src/auth/AuthController.ts", changes: 5 },
    { file: "src/utils/LegacyCryptoUtils.ts", changes: 3 }
  ],
  technicalDebt: [
    {
      severity: "HIGH",
      component: "PaymentService",
      file: "src/payment/PaymentService.ts",
      issue: "High Cyclomatic Complexity (18)",
      category: "Complexity",
      recommendation: "Decompose nested gateway branches into strategy handlers or polymorphism."
    },
    {
      severity: "HIGH",
      component: "PaymentService <-> TransactionService",
      file: "PaymentService -> TransactionService -> PaymentService",
      issue: "Circular dependency detected between payment and transaction services",
      category: "Circular Dependency",
      recommendation: "Decouple services using an event bus or intermediate domain interface."
    },
    {
      severity: "HIGH",
      component: "LegacyCryptoUtils.legacy_v1_encrypt",
      file: "src/utils/LegacyCryptoUtils.ts",
      issue: "Insecure MD5 hashing algorithm in authentication path",
      category: "Security / Deprecated API",
      recommendation: "Migrate password hashing to argon2id or bcrypt with salt."
    },
    {
      severity: "MEDIUM",
      component: "LegacyCryptoUtils.unused_rot13_obfuscate",
      file: "src/utils/LegacyCryptoUtils.ts",
      issue: "Dead code candidate: 0 callers across repository",
      category: "Dead Code",
      recommendation: "Safely delete unreferenced obsolete cipher prototype."
    }
  ],
  riskPoints: [
    { id: "PaymentService", name: "PaymentService", path: "src/payment/PaymentService.ts", complexity: 18, changeFrequency: 14, riskLevel: "CRITICAL", riskScore: 78, dependencies: 3, dependents: 2 },
    { id: "TransactionService", name: "TransactionService", path: "src/payment/TransactionService.ts", complexity: 12, changeFrequency: 9, riskLevel: "HIGH", riskScore: 51, dependencies: 2, dependents: 2 },
    { id: "AuthController", name: "AuthController", path: "src/auth/AuthController.ts", complexity: 9, changeFrequency: 5, riskLevel: "MEDIUM", riskScore: 33, dependencies: 2, dependents: 0 },
    { id: "DatabaseConnector", name: "DatabaseConnector", path: "src/database/DatabaseConnector.ts", complexity: 7, changeFrequency: 7, riskLevel: "HIGH", riskScore: 35, dependencies: 0, dependents: 4 },
    { id: "LegacyCryptoUtils", name: "LegacyCryptoUtils", path: "src/utils/LegacyCryptoUtils.ts", complexity: 11, changeFrequency: 3, riskLevel: "MEDIUM", riskScore: 31, dependencies: 0, dependents: 1 },
    { id: "UserService", name: "UserService", path: "src/users/UserService.ts", complexity: 8, changeFrequency: 2, riskLevel: "LOW", riskScore: 22, dependencies: 1, dependents: 1 }
  ]
};

export const DEMO_BLAST_RADIUS: BlastRadiusResult = {
  targetSymbol: "PaymentService.processPayment()",
  targetFile: "src/payment/PaymentService.ts",
  affectedModules: ["CheckoutController", "TransactionService", "NotificationService", "DatabaseConnector"],
  affectedFunctions: ["processPayment", "recordTransaction", "sendPaymentConfirmation", "executeWrite"],
  databaseOperations: 2,
  externalApis: 3,
  riskRating: "CRITICAL",
  confidence: "High (Static AST Analysis)",
  callHierarchy: {
    name: "PaymentService.processPayment()",
    type: "root",
    file: "src/payment/PaymentService.ts",
    children: [
      {
        name: "CheckoutController.checkout()",
        type: "caller",
        file: "src/controllers/CheckoutController.ts",
        children: []
      },
      {
        name: "TransactionService.recordTransaction()",
        type: "dependency",
        file: "src/payment/TransactionService.ts",
        children: [
          {
            name: "DatabaseConnector.executeWrite()",
            type: "side_effect",
            file: "src/database/DatabaseConnector.ts",
            children: []
          }
        ]
      },
      {
        name: "NotificationService.sendPaymentConfirmation()",
        type: "dependency",
        file: "src/notifications/NotificationService.ts",
        children: []
      }
    ]
  },
  reasoning: [
    "High Fan-In: Multiple checkout endpoints invoke processPayment() directly.",
    "Database Write: Invokes TransactionService which executes SQL INSERT into ledger tables.",
    "External Endpoints: Directly communicates with Stripe and PayPal gateways; payload format changes will break webhook reconciliation.",
    "Circular Dependency: Reciprocal call exists to TransactionService.reverseTransaction()."
  ]
};

export const DEMO_AI_RESPONSES: Record<string, AIResponse> = {
  default: {
    answer: "Digital Archaeologist has completed AST and forensic dependency indexing on the repository.\n\nKey Finding: A critical circular dependency exists between PaymentService.ts and TransactionService.ts. Furthermore, PaymentService is situated in the Critical Hotspot quadrant (McCabe Complexity: 18, Churn: 14 changes), indicating elevated risk during modifications.",
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
      "How do we break the PaymentService <-> TransactionService circular dependency?",
      "What is the blast radius of modifying PaymentService.processPayment()?",
      "Which files have the highest churn rate in the repository?"
    ]
  }
};

export const DEMO_FILE_CONTENTS: Record<string, string> = {
  "src/payment/PaymentService.ts": `import { TransactionService } from "./TransactionService";
import { DatabaseConnector } from "../database/DatabaseConnector";
import { NotificationService } from "../notifications/NotificationService";

export interface PaymentRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  gateway: "STRIPE" | "PAYPAL" | "VAULT";
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export class PaymentService {
  private transactionService: TransactionService;
  private notificationService: NotificationService;
  private db: DatabaseConnector;

  constructor() {
    this.transactionService = new TransactionService();
    this.notificationService = new NotificationService();
    this.db = DatabaseConnector.getInstance();
  }

  // Cyclomatic Complexity: 18 (nested gateway branches)
  public async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    if (!req.id || !req.userId || req.amount <= 0) {
      throw new Error("Invalid payment payload");
    }

    let authSuccess = false;

    if (req.gateway === "STRIPE") {
      if (req.amount > 10000) {
        // High-value check
        authSuccess = await this.dispatchStripeEnterprise(req);
      } else {
        authSuccess = await this.dispatchStripeStandard(req);
      }
    } else if (req.gateway === "PAYPAL") {
      if (req.currency !== "USD" && req.currency !== "EUR") {
        authSuccess = await this.dispatchPayPalMultiCurrency(req);
      } else {
        authSuccess = await this.dispatchPayPalStandard(req);
      }
    } else if (req.gateway === "VAULT") {
      authSuccess = await this.dispatchVaultDirect(req);
    } else {
      throw new Error("Unsupported gateway type: " + req.gateway);
    }

    if (!authSuccess) {
      return { success: false, error: "Gateway authorization rejected" };
    }

    // Circular Dependency: PaymentService invokes TransactionService
    const tx = await this.transactionService.recordTransaction({
      paymentId: req.id,
      userId: req.userId,
      amount: req.amount,
      status: "COMPLETED"
    });

    await this.notificationService.sendPaymentConfirmation(req.userId, req.amount, req.currency);

    return { success: true, transactionId: tx.id };
  }

  public async refundPayment(transactionId: string): Promise<boolean> {
    this.db.query("UPDATE payments SET status = 'REFUNDED' WHERE tx_id = ?", [transactionId]);
    return true;
  }

  private async dispatchStripeStandard(req: PaymentRequest) { return true; }
  private async dispatchStripeEnterprise(req: PaymentRequest) { return true; }
  private async dispatchPayPalStandard(req: PaymentRequest) { return true; }
  private async dispatchPayPalMultiCurrency(req: PaymentRequest) { return true; }
  private async dispatchVaultDirect(req: PaymentRequest) { return true; }
}
`,

  "src/payment/TransactionService.ts": `import { PaymentService } from "./PaymentService";
import { DatabaseConnector } from "../database/DatabaseConnector";

export interface TransactionRecord {
  id: string;
  paymentId: string;
  userId: string;
  amount: number;
  status: string;
}

export class TransactionService {
  private db: DatabaseConnector;

  constructor() {
    this.db = DatabaseConnector.getInstance();
  }

  public async recordTransaction(record: Omit<TransactionRecord, "id">): Promise<TransactionRecord> {
    const id = "tx_" + Date.now();
    await this.db.executeWrite(
      "INSERT INTO transactions (id, payment_id, user_id, amount, status) VALUES (?, ?, ?, ?, ?)",
      [id, record.paymentId, record.userId, record.amount, record.status]
    );
    return { id, ...record };
  }

  // Circular Dependency: TransactionService instantiates and calls PaymentService!
  public async reverseTransaction(transactionId: string): Promise<boolean> {
    const paymentService = new PaymentService();
    const refundOk = await paymentService.refundPayment(transactionId);
    if (refundOk) {
      await this.db.executeWrite("UPDATE transactions SET status = 'REVERSED' WHERE id = ?", [transactionId]);
      return true;
    }
    return false;
  }
}
`,

  "src/utils/LegacyCryptoUtils.ts": `// Legacy cryptographic utilities (Technical Debt: MD5 in Auth, Unused Dead Code)
export class LegacyCryptoUtils {
  // Insecure MD5 routine used in AuthController
  public static legacy_v1_encrypt(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = (hash << 5) - hash + password.charCodeAt(i);
      hash |= 0;
    }
    return "md5_" + Math.abs(hash).toString(16);
  }

  // Dead Code Candidate: 0 callers across entire repository
  public static unused_rot13_obfuscate(text: string): string {
    return text.replace(/[a-zA-Z]/g, (c) => {
      const code = c.charCodeAt(0);
      const base = code <= 90 ? 65 : 97;
      return String.fromCharCode(((code - base + 13) % 26) + base);
    });
  }

  // Dead Code Candidate: 0 callers
  public static legacy_xor_cipher(data: string, key: number = 42): string {
    return data.split("").map((c) => String.fromCharCode(c.charCodeAt(0) ^ key)).join("");
  }
}
`
};
