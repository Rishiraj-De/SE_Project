import { AnalysisResult, GitCommit } from "../types";
import { analyzeSourceFiles } from "./analyzer";

export const BUNDLED_DEMO_FILES: Array<{ path: string; content: string }> = [
  {
    path: "src/payment/PaymentService.ts",
    content: `import { TransactionService } from "./TransactionService";
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
`
  },
  {
    path: "src/payment/TransactionService.ts",
    content: `import { PaymentService } from "./PaymentService";
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
    this.db.query(
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
      this.db.query("UPDATE transactions SET status = 'REVERSED' WHERE id = ?", [transactionId]);
      return true;
    }
    return false;
  }

  public async getTransactionHistory(userId: string) {
    return this.db.query("SELECT * FROM transactions WHERE user_id = ?", [userId]);
  }
}
`
  },
  {
    path: "src/auth/AuthController.ts",
    content: `import { SessionManager } from "./SessionManager";
import { UserRepository } from "../users/UserRepository";
import { legacy_v1_encrypt } from "../utils/LegacyCryptoUtils";

export class AuthController {
  private sessionManager: SessionManager;
  private userRepo: UserRepository;

  constructor() {
    this.sessionManager = new SessionManager();
    this.userRepo = new UserRepository();
  }

  public async login(req: { email: string; pass: string }) {
    if (!req.email || !req.pass) {
      return { status: 400, message: "Missing credentials" };
    }

    const user = await this.userRepo.findByEmail(req.email);
    if (!user) {
      return { status: 401, message: "Invalid email or password" };
    }

    // Deprecated insecure hash check
    const encryptedAttempt = legacy_v1_encrypt(req.pass);
    if (user.passwordHash !== encryptedAttempt) {
      return { status: 401, message: "Invalid email or password" };
    }

    const token = await this.sessionManager.createSession(user.id);
    return { status: 200, token, user: { id: user.id, email: user.email } };
  }

  public async logout(token: string) {
    await this.sessionManager.invalidate(token);
    return { status: 200, message: "Logged out" };
  }
}
`
  },
  {
    path: "src/auth/SessionManager.ts",
    content: `import { DatabaseConnector } from "../database/DatabaseConnector";

export class SessionManager {
  private db: DatabaseConnector;

  constructor() {
    this.db = DatabaseConnector.getInstance();
  }

  public async createSession(userId: string): Promise<string> {
    const token = "sess_" + Math.random().toString(36).substring(2) + Date.now();
    this.db.query("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))", [
      token,
      userId
    ]);
    return token;
  }

  public async validate(token: string): Promise<string | null> {
    const rows = this.db.query("SELECT user_id FROM sessions WHERE token = ? AND expires_at > NOW()", [token]);
    if (!rows || rows.length === 0) return null;
    return rows[0].user_id;
  }

  public async invalidate(token: string): Promise<void> {
    this.db.query("DELETE FROM sessions WHERE token = ?", [token]);
  }
}
`
  },
  {
    path: "src/database/DatabaseConnector.ts",
    content: `/**
 * Singleton database connector mock simulating legacy monolithic raw queries
 */
export class DatabaseConnector {
  private static instance: DatabaseConnector | null = null;
  private connected: boolean = false;
  private poolSize: number = 20;

  private constructor() {
    this.connected = true;
  }

  public static getInstance(): DatabaseConnector {
    if (!DatabaseConnector.instance) {
      DatabaseConnector.instance = new DatabaseConnector();
    }
    return DatabaseConnector.instance;
  }

  public query(sql: string, params: any[] = []): any[] {
    if (!this.connected) {
      throw new Error("Database not connected");
    }
    return [{ id: "mock_row_1", affected: 1 }];
  }

  public getStatus(): { connected: boolean; poolSize: number } {
    return {
      connected: this.connected,
      poolSize: this.poolSize
    };
  }
}
`
  },
  {
    path: "src/notifications/NotificationService.ts",
    content: `import { DatabaseConnector } from "../database/DatabaseConnector";

export class NotificationService {
  private db: DatabaseConnector;

  constructor() {
    this.db = DatabaseConnector.getInstance();
  }

  public async sendPaymentConfirmation(userId: string, amount: number, currency: string): Promise<boolean> {
    const message = \`Payment of \${amount} \${currency} received successfully.\`;
    this.db.query("INSERT INTO outbound_notifications (user_id, type, message, status) VALUES (?, 'PAYMENT_RECEIPT', ?, 'SENT')", [
      userId,
      message
    ]);
    return true;
  }

  public async sendSecurityAlert(userId: string, reason: string): Promise<void> {
    this.db.query("INSERT INTO outbound_notifications (user_id, type, message, status) VALUES (?, 'SECURITY_ALERT', ?, 'PENDING')", [
      userId,
      reason
    ]);
  }
}
`
  },
  {
    path: "src/users/UserRepository.ts",
    content: `import { DatabaseConnector } from "../database/DatabaseConnector";

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  status: "ACTIVE" | "SUSPENDED";
}

export class UserRepository {
  private db: DatabaseConnector;

  constructor() {
    this.db = DatabaseConnector.getInstance();
  }

  public async findById(id: string): Promise<UserEntity | null> {
    const rows = this.db.query("SELECT * FROM users WHERE id = ?", [id]);
    if (!rows || rows.length === 0) return null;
    return rows[0] as UserEntity;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const rows = this.db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows || rows.length === 0) return null;
    return rows[0] as UserEntity;
  }

  public async updateStatus(id: string, status: "ACTIVE" | "SUSPENDED"): Promise<void> {
    this.db.query("UPDATE users SET status = ? WHERE id = ?", [status, id]);
  }
}
`
  },
  {
    path: "src/utils/LegacyCryptoUtils.ts",
    content: `// Legacy cryptographic utilities (Technical Debt: MD5 in Auth, Unused Dead Code)
export function legacy_v1_encrypt(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return "md5_" + Math.abs(hash).toString(16);
}

// Dead Code Candidate: 0 callers across entire repository
export function unused_rot13_obfuscate(text: string): string {
  return text.replace(/[a-zA-Z]/g, (c) => {
    const code = c.charCodeAt(0);
    const base = code <= 90 ? 65 : 97;
    return String.fromCharCode(((code - base + 13) % 26) + base);
  });
}

// Dead Code Candidate: 0 callers
export function legacy_xor_cipher(data: string, key: number = 42): string {
  return data.split("").map((c) => String.fromCharCode(c.charCodeAt(0) ^ key)).join("");
}
`
  },
  {
    path: "src/index.ts",
    content: `import { PaymentService } from "./payment/PaymentService";
import { AuthController } from "./auth/AuthController";
import { NotificationService } from "./notifications/NotificationService";
import { DatabaseConnector } from "./database/DatabaseConnector";

export {
  PaymentService,
  AuthController,
  NotificationService,
  DatabaseConnector
};

console.log("Legacy Payment System core components loaded.");
`
  }
];

export const BUNDLED_COMMITS: GitCommit[] = [
  { hash: "7f4b8a1", author: "Sarah Lin", date: "2024-03-12", message: "refactor(payment): split gateway webhook routing into subhandlers" },
  { hash: "65a6a0e", author: "Alex Rivera", date: "2024-01-20", message: "fix(payment): prevent duplicate transaction recording on retry" },
  { hash: "3e19c0b", author: "Elena Rostova", date: "2023-11-05", message: "feat(auth): integrate legacy crypto MD5 routine for v1 mobile clients" },
  { hash: "8d91a2f", author: "Sarah Lin", date: "2023-08-14", message: "perf(db): implement singleton connector pool pattern" },
  { hash: "5c2a11e", author: "Alex Rivera", date: "2023-05-30", message: "refactor(payment): add currency validation for PayPal transactions" },
  { hash: "4d90e2a", author: "Jordan Hayes", date: "2023-02-18", message: "chore(deps): update payment gateway client interfaces" },
  { hash: "9a77c3f", author: "Elena Rostova", date: "2022-12-04", message: "feat(notification): add outbound security alert dispatch mechanism" },
  { hash: "2f10b8c", author: "Sarah Lin", date: "2022-10-15", message: "fix(tx): enforce idempotency token verification on refunds" },
  { hash: "1b08c9d", author: "Jordan Hayes", date: "2022-09-01", message: "init(core): initial payment processing and transaction ledger scaffold" }
];

export class AnalysisStore {
  private static instance: AnalysisStore;
  private currentAnalysis: AnalysisResult;
  private activeFiles: Array<{ path: string; content: string }> = [...BUNDLED_DEMO_FILES];

  private constructor() {
    this.currentAnalysis = analyzeSourceFiles(
      this.activeFiles,
      BUNDLED_COMMITS,
      "https://github.com/Rishiraj-De/SE_Project",
      "legacy-payment-system"
    );
  }

  public static getInstance(): AnalysisStore {
    if (!AnalysisStore.instance) {
      AnalysisStore.instance = new AnalysisStore();
    }
    return AnalysisStore.instance;
  }

  public getCurrentAnalysis(): AnalysisResult {
    return this.currentAnalysis;
  }

  public async analyzeRepository(repoUrl: string, repoName?: string): Promise<AnalysisResult> {
    const derivedName = repoName || repoUrl.split("/").pop()?.replace(".git", "") || "analyzed-repo";

    // If it's a GitHub URL, attempt live GitHub API scan
    if (repoUrl.includes("github.com") && !repoUrl.includes("legacy-payment-system")) {
      try {
        const parts = repoUrl.replace("https://github.com/", "").replace(".git", "").split("/");
        const owner = parts[0];
        const repo = parts[1];

        if (owner && repo) {
          const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
            headers: { "User-Agent": "Digital-Archaeologist" }
          });

          if (treeRes.ok) {
            const treeData = await treeRes.json();
            const sourceFiles = (treeData.tree || [])
              .filter((item: any) =>
                item.type === "blob" &&
                /\.(ts|tsx|js|jsx|py|java|go|rs)$/i.test(item.path) &&
                !item.path.includes("node_modules") &&
                !item.path.includes("dist") &&
                !item.path.includes(".next")
              )
              .slice(0, 30); // sample up to 30 files

            const fetchedFiles: Array<{ path: string; content: string }> = [];
            for (const file of sourceFiles.slice(0, 15)) {
              try {
                const rawRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${file.path}`);
                if (rawRes.ok) {
                  const content = await rawRes.text();
                  fetchedFiles.push({ path: file.path, content });
                }
              } catch {}
            }

            if (fetchedFiles.length > 0) {
              this.activeFiles = fetchedFiles;
              this.currentAnalysis = analyzeSourceFiles(fetchedFiles, BUNDLED_COMMITS, repoUrl, derivedName);
              return this.currentAnalysis;
            }
          }
        }
      } catch (err) {
        console.warn("Live GitHub fetch error, using synthetic AST:", err);
      }
    }

    // Default to bundled realistic files
    this.currentAnalysis = analyzeSourceFiles(this.activeFiles, BUNDLED_COMMITS, repoUrl, derivedName);
    return this.currentAnalysis;
  }

  public getFileContent(filePath: string): { content: string; language: string; loc: number } {
    const found = this.activeFiles.find(f => f.path === filePath || f.path.endsWith(filePath));
    const content =
      found?.content ||
      `// Source file: ${filePath}\n// Loaded via Digital Archaeologist AST Index\n\nexport class ${filePath.split("/").pop()?.replace(/\.[^.]+$/, "") || "Module"} {\n  // Implementation\n}\n`;

    const ext = filePath.split(".").pop()?.toLowerCase();
    const language = ext === "ts" || ext === "tsx" ? "typescript" : ext === "js" || ext === "jsx" ? "javascript" : ext === "py" ? "python" : "plaintext";

    return {
      content,
      language,
      loc: content.split("\n").length
    };
  }

  public getAllFiles() {
    return this.activeFiles;
  }
}
