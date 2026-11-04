import { AnalysisResult, RefactoringRecipe } from "../types";

/**
 * Modernization & Refactor Studio Engine
 * Generates automated refactoring recipes, architectural codemods,
 * and unified diffs based on AST analysis and detected technical debt.
 */
export function generateModernizationPlan(analysis: AnalysisResult | null): RefactoringRecipe[] {
  const recipes: RefactoringRecipe[] = [];

  // Recipe 1: Break Circular Dependency between Payment & Transaction Services
  recipes.push({
    id: "refactor-break-cycle-payment-tx",
    title: "Decouple Circular Dependency via Interface Inversion",
    component: "PaymentService & TransactionService",
    filePath: "src/payment/PaymentService.ts",
    pattern: "Extract Interface & Inversion of Control (IoC)",
    quadrant: "quick-win",
    category: "Decoupling",
    severity: "CRITICAL",
    effortHours: 3.5,
    healthImpact: 8,
    blastRadiusReduction: 26,
    description: "Eliminate tight coupling between PaymentService and TransactionService by introducing an abstract ITransactionRecorder interface.",
    architecturalRationale: "Circular imports create hidden runtime initialization side-effects, complicate unit testing with mocks, and prevent separate deployment or module extraction. By depending on abstractions rather than concrete implementations (Dependency Inversion Principle), both services can evolve independently.",
    legacyCode: `// ❌ LEGACY: Direct circular import creates runtime cycle
import { TransactionService } from "./TransactionService";
import { DatabaseConnector } from "../database/DatabaseConnector";

export class PaymentService {
  private txService: TransactionService;

  constructor() {
    // Tight instantiation and circular reference
    this.txService = new TransactionService();
  }

  public async processPayment(amount: number, card: string) {
    // ... validation logic
    const record = await this.txService.recordTransaction({
      amount,
      status: "PENDING"
    });
    return record;
  }
}`,
    modernCode: `// ✅ MODERN: Decoupled via Interface Inversion (IoC)
import { ITransactionRecorder, TransactionPayload } from "./interfaces/ITransactionRecorder";

export class PaymentService {
  // Injected dependency conforms to abstract contract
  constructor(private readonly txRecorder: ITransactionRecorder) {}

  public async processPayment(amount: number, card: string) {
    // Pure business logic without concrete cycle
    return this.txRecorder.recordTransaction({
      amount,
      status: "PENDING",
      timestamp: Date.now()
    });
  }
}`,
    unifiedDiff: `@@ -1,15 +1,11 @@
-import { TransactionService } from "./TransactionService";
-import { DatabaseConnector } from "../database/DatabaseConnector";
+import { ITransactionRecorder, TransactionPayload } from "./interfaces/ITransactionRecorder";

 export class PaymentService {
-  private txService: TransactionService;
-
-  constructor() {
-    this.txService = new TransactionService();
-  }
+  constructor(private readonly txRecorder: ITransactionRecorder) {}

   public async processPayment(amount: number, card: string) {
-    const record = await this.txService.recordTransaction({
+    return this.txRecorder.recordTransaction({
       amount,
-      status: "PENDING"
+      status: "PENDING",
       timestamp: Date.now()
     });
-    return record;
   }
 }`,
    verificationPlan: [
      "Run unit tests with MockTransactionRecorder (0 network calls needed)",
      "Verify TypeScript build output has 0 cyclic reference warnings in AST bundle graph",
      "Confirm TransactionService still implements ITransactionRecorder contract"
    ]
  });

  // Recipe 2: Upgrade Deprecated Insecure Cryptography
  recipes.push({
    id: "refactor-crypto-upgrade",
    title: "Upgrade Insecure Hashing (MD5) to Modern Argon2id / SHA-256",
    component: "LegacyCryptoUtils",
    filePath: "src/utils/LegacyCryptoUtils.ts",
    pattern: "Replace Insecure Primitives with Modern WebCrypto & Scrypt",
    quadrant: "security",
    category: "Security",
    severity: "HIGH",
    effortHours: 2.5,
    healthImpact: 6,
    blastRadiusReduction: 18,
    description: "Replace deprecated, collision-vulnerable MD5/SHA-1 sync hashing with modern constant-time Scrypt / SHA-256 key derivation.",
    architecturalRationale: "MD5 has been cryptographically broken for collision resistance since 2004. Synchronous crypto functions in Node.js also block the single-threaded event loop under heavy load, causing severe API latency spikes. Upgrading to asynchronous, salt-hardened algorithms satisfies PCI-DSS 4.0 compliance.",
    legacyCode: `// ❌ LEGACY: Vulnerable MD5 & Sync blocking hashing
import crypto from "crypto";

export class LegacyCryptoUtils {
  public static hashSecret(plainText: string): string {
    // Insecure MD5 without salt or work factor
    return crypto.createHash("md5").update(plainText).digest("hex");
  }

  public static encryptPayload(data: string, key: string): string {
    // Deprecated DES algorithm
    const cipher = crypto.createCipher("des", key);
    return cipher.update(data, "utf8", "hex") + cipher.final("hex");
  }
}`,
    modernCode: `// ✅ MODERN: Asynchronous Salted Key Derivation & AES-256-GCM
import crypto from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(crypto.scrypt);

export class SecureCryptoService {
  public static async hashSecret(plainText: string, salt = crypto.randomBytes(16)): Promise<string> {
    const derivedKey = (await scryptAsync(plainText, salt, 64)) as Buffer;
    return \`\${salt.toString("hex")}:\${derivedKey.toString("hex")}\`;
  }

  public static encryptPayload(data: string, secretKey: Buffer): { iv: string; ciphertext: string; tag: string } {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, iv);
    const ciphertext = cipher.update(data, "utf8", "hex") + cipher.final("hex");
    return {
      iv: iv.toString("hex"),
      ciphertext,
      tag: cipher.getAuthTag().toString("hex")
    };
  }
}`,
    unifiedDiff: `@@ -1,15 +1,24 @@
 import crypto from "crypto";
+import { promisify } from "util";
+
+const scryptAsync = promisify(crypto.scrypt);

-export class LegacyCryptoUtils {
-  public static hashSecret(plainText: string): string {
-    return crypto.createHash("md5").update(plainText).digest("hex");
+export class SecureCryptoService {
+  public static async hashSecret(plainText: string, salt = crypto.randomBytes(16)): Promise<string> {
+    const derivedKey = (await scryptAsync(plainText, salt, 64)) as Buffer;
+    return \`\${salt.toString("hex")}:\${derivedKey.toString("hex")}\`;
   }

-  public static encryptPayload(data: string, key: string): string {
-    const cipher = crypto.createCipher("des", key);
-    return cipher.update(data, "utf8", "hex") + cipher.final("hex");
+  public static encryptPayload(data: string, secretKey: Buffer) {
+    const iv = crypto.randomBytes(12);
+    const cipher = crypto.createCipheriv("aes-256-gcm", secretKey, iv);
+    const ciphertext = cipher.update(data, "utf8", "hex") + cipher.final("hex");
+    return { iv: iv.toString("hex"), ciphertext, tag: cipher.getAuthTag().toString("hex") };
   }
 }`,
    verificationPlan: [
      "Verify backwards-compatibility hashing verification fallback for legacy user records",
      "Benchmark throughput to confirm zero event-loop blocking under concurrent loads",
      "Validate AES-256-GCM authentication tag verification rejects tampered ciphertexts"
    ]
  });

  // Recipe 3: Decompose God Class (PaymentService)
  recipes.push({
    id: "refactor-god-class-payment",
    title: "Decompose Monolithic God Class into Domain Subservices",
    component: "PaymentService",
    filePath: "src/payment/PaymentService.ts",
    pattern: "Extract Class & Single Responsibility Principle (SRP)",
    quadrant: "architectural",
    category: "Refactoring",
    severity: "HIGH",
    effortHours: 6.0,
    healthImpact: 7,
    blastRadiusReduction: 32,
    description: "Extract card validation, notification dispatch, and payment gateway communication into discrete, single-purpose service classes.",
    architecturalRationale: "PaymentService currently acts as a 'God Class' with 284 LOC and high cyclomatic complexity (18), violating the Single Responsibility Principle. Modifying billing logic risks breaking card validation or email receipts. Breaking it into targeted services reduces regression blast radius from 85% down to 24%.",
    legacyCode: `// ❌ LEGACY: God Class handling validation, HTTP gateway, receipts, and retries
export class PaymentService {
  public async handleEverything(req: any) {
    // 1. Validate credit card checksum (Luhn algorithm)
    if (!this.checkLuhn(req.cardNumber)) throw new Error("Invalid card");

    // 2. Gateway HTTP request with inline retries
    let response;
    for (let i = 0; i < 3; i++) {
      try {
        response = await fetch("https://gateway.internal/charge", { method: "POST", body: JSON.stringify(req) });
        break;
      } catch (e) {}
    }

    // 3. Format and dispatch notification email directly
    await emailSender.sendReceipt(req.email, response.id);
    return response;
  }
}`,
    modernCode: `// ✅ MODERN: Orchestrator delegating to specialized domain handlers
export class PaymentOrchestrator {
  constructor(
    private readonly cardValidator: ICardValidator,
    private readonly gatewayClient: IPaymentGateway,
    private readonly notifier: IPaymentNotifier
  ) {}

  public async executeCharge(command: ChargeCommand): Promise<ChargeResult> {
    this.cardValidator.assertValid(command.paymentMethod);
    const charge = await this.gatewayClient.processWithRetry(command);
    await this.notifier.notifyReceiptAsync(command.customerEmail, charge);
    return charge;
  }
}`,
    unifiedDiff: `@@ -1,18 +1,13 @@
-export class PaymentService {
-  public async handleEverything(req: any) {
-    if (!this.checkLuhn(req.cardNumber)) throw new Error("Invalid card");
-
-    let response;
-    for (let i = 0; i < 3; i++) {
-      try {
-        response = await fetch("https://gateway.internal/charge", { ... });
-        break;
-      } catch (e) {}
-    }
-
-    await emailSender.sendReceipt(req.email, response.id);
-    return response;
+export class PaymentOrchestrator {
+  constructor(
+    private readonly cardValidator: ICardValidator,
+    private readonly gatewayClient: IPaymentGateway,
+    private readonly notifier: IPaymentNotifier
+  ) {}
+
  public async executeCharge(command: ChargeCommand): Promise<ChargeResult> {
    this.cardValidator.assertValid(command.paymentMethod);
    const charge = await this.gatewayClient.processWithRetry(command);
    await this.notifier.notifyReceiptAsync(command.customerEmail, charge);
    return charge;
  }
}`,
    verificationPlan: [
      "Unit test ICardValidator independently with edge-case card numbers and expired dates",
      "Unit test IPaymentGateway retry behavior using simulated network timeout faults",
      "Ensure asynchronous notification dispatch never holds up payment HTTP response"
    ]
  });

  // Recipe 4: Eliminate Callback Cascade & Add Connection Pooling
  recipes.push({
    id: "refactor-db-connection-pool",
    title: "Replace Nested Callbacks with Async/Await Connection Pool",
    component: "DatabaseConnector",
    filePath: "src/database/DatabaseConnector.ts",
    pattern: "Async/Await Pipeline & Resource Pooling Pattern",
    quadrant: "quick-win",
    category: "Async & Performance",
    severity: "MEDIUM",
    effortHours: 2.0,
    healthImpact: 5,
    blastRadiusReduction: 15,
    description: "Refactor legacy callback-based database queries to clean Promises with connection pooling and automated reconnect.",
    architecturalRationale: "Nested callback architecture causes 'Pyramid of Doom', leaks unhandled promise rejections, and opens new database socket connections on every invocation without connection reuse. Modern connection pooling reduces query latency by 70% and prevents socket exhaustion under peak concurrency.",
    legacyCode: `// ❌ LEGACY: Callback hell with raw unpooled sockets
export class DatabaseConnector {
  public query(sql: string, callback: (err: any, rows: any) => void) {
    const client = new RawSocketClient(this.config);
    client.connect((err) => {
      if (err) return callback(err, null);
      client.execute(sql, (execErr, result) => {
        client.disconnect();
        if (execErr) return callback(execErr, null);
        callback(null, result);
      });
    });
  }
}`,
    modernCode: `// ✅ MODERN: Reusable connection pool with async/await & transaction safety
export class DatabaseConnectionPool {
  private pool: Pool;

  constructor(config: PoolConfig) {
    this.pool = new Pool({ ...config, max: 20, idleTimeoutMillis: 30000 });
  }

  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows as T[];
    } finally {
      client.release(); // Return to pool rather than destroying socket
    }
  }
}`,
    unifiedDiff: `@@ -1,13 +1,15 @@
-export class DatabaseConnector {
-  public query(sql: string, callback: (err: any, rows: any) => void) {
-    const client = new RawSocketClient(this.config);
-    client.connect((err) => {
-      if (err) return callback(err, null);
-      client.execute(sql, (execErr, result) => {
-        client.disconnect();
-        if (execErr) return callback(execErr, null);
-        callback(null, result);
-      });
-    });
+export class DatabaseConnectionPool {
+  private pool: Pool;
+
+  constructor(config: PoolConfig) {
+    this.pool = new Pool({ ...config, max: 20, idleTimeoutMillis: 30000 });
+  }
+
+  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
+    const client = await this.pool.connect();
+    try {
+      const result = await client.query(sql, params);
+      return result.rows as T[];
+    } finally {
+      client.release();
+    }
   }
 }`,
    verificationPlan: [
      "Simulate 500 concurrent queries to verify pool contention stays bounded under 20 clients",
      "Verify client.release() is always called even when query syntax error is thrown",
      "Check error telemetry contains parameterized SQL query tags without leaking raw parameter values"
    ]
  });

  // Recipe 5: Input Validation & Type Safety
  recipes.push({
    id: "refactor-input-validation-zod",
    title: "Introduce Strict Schema Validation & DTO Type Guards",
    component: "AuthController",
    filePath: "src/auth/AuthController.ts",
    pattern: "Data Transfer Object (DTO) & Boundary Schema Validation",
    quadrant: "maintenance",
    category: "Security",
    severity: "MEDIUM",
    effortHours: 1.5,
    healthImpact: 4,
    blastRadiusReduction: 12,
    description: "Enforce runtime input boundaries using Zod/Joi schemas on request controllers to prevent injection and unexpected type casting.",
    architecturalRationale: "TypeScript type checks compile away at runtime. In legacy systems, unvalidated controller parameters frequently propagate undefined states or SQL/NoSQL injection payloads deep into service layers before failing silently.",
    legacyCode: `// ❌ LEGACY: Unchecked 'any' payload and manual fragile if-checks
export class AuthController {
  public static async login(req: any, res: any) {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
      return res.status(400).send("missing fields");
    }
    // Dangerous raw query without sanitization
    const user = await db.find({ email });
    return res.json(user);
  }
}`,
    modernCode: `// ✅ MODERN: Schema-driven runtime validation with typed DTO
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128)
});

export class AuthController {
  public static async login(req: Request, res: Response) {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: "Invalid credentials format", details: parseResult.error.flatten() });
    }
    const { email, password } = parseResult.data;
    const user = await authService.authenticateSafely(email, password);
    return res.json(user);
  }
}`,
    unifiedDiff: `@@ -1,11 +1,15 @@
+import { z } from "zod";
+
+const LoginSchema = z.object({
+  email: z.string().email().trim().toLowerCase(),
+  password: z.string().min(8).max(128)
+});
+
 export class AuthController {
-  public static async login(req: any, res: any) {
-    const email = req.body.email;
-    const password = req.body.password;
-    if (!email || !password) {
-      return res.status(400).send("missing fields");
+  public static async login(req: Request, res: Response) {
+    const parseResult = LoginSchema.safeParse(req.body);
+    if (!parseResult.success) {
+      return res.status(400).json({ error: "Invalid credentials format" });
     }
-    const user = await db.find({ email });
-    return res.json(user);
+    const { email, password } = parseResult.data;
+    return res.json(await authService.authenticateSafely(email, password));
   }
 }`,
    verificationPlan: [
      "Send malformed payloads (JSON arrays, SQL injections, oversized strings) and confirm 400 rejection",
      "Verify valid email casings are automatically normalized to lower-case",
      "Check unit tests cover both valid and boundary invalid login attempts"
    ]
  });

  // If a live user analysis was performed and has additional files/debt, dynamically append contextual recipes
  if (analysis && analysis.circularDependencies && analysis.circularDependencies.length > 0) {
    for (const [idx, cd] of analysis.circularDependencies.entries()) {
      const exists = recipes.some(r => cd.modules.some(m => r.title.includes(m)));
      if (!exists && cd.modules.length >= 2) {
        const modA = cd.modules[0];
        const modB = cd.modules[1];
        recipes.push({
          id: `refactor-dynamic-cycle-${idx}`,
          title: `Break Circular Reference: ${modA} ↔ ${modB}`,
          component: `${modA} & ${modB}`,
          filePath: `src/${modA}.ts`,
          pattern: "Mediator / Interface Extraction",
          quadrant: "quick-win",
          category: "Decoupling",
          severity: cd.severity || "HIGH",
          effortHours: 3.0,
          healthImpact: 7,
          blastRadiusReduction: 22,
          description: `Break recursive dependency loop between ${modA} and ${modB} by introducing a shared Mediator or Interface.`,
          architecturalRationale: `Cyclic import chain: ${cd.chain || `${modA} -> ${modB} -> ${modA}`}. Breaking this cycle isolates change blast radius.`,
          legacyCode: `// Circular reference detected in analysis graph\nimport { ${modB} } from './${modB}';\n\nexport class ${modA} {\n  constructor(private b: ${modB}) {}\n}`,
          modernCode: `// Decoupled via shared contract\nimport { I${modB}Contract } from './interfaces/I${modB}Contract';\n\nexport class ${modA} {\n  constructor(private b: I${modB}Contract) {}\n}`,
          unifiedDiff: `@@ -1,4 +1,4 @@\n-import { ${modB} } from './${modB}';\n+import { I${modB}Contract } from './interfaces/I${modB}Contract';\n \n export class ${modA} {\n-  constructor(private b: ${modB}) {}\n+  constructor(private b: I${modB}Contract) {}\n }`,
          verificationPlan: [
            `Validate that ${modA} imports only the interface contract`,
            `Check module graph acyclicity verification in CI`
          ]
        });
      }
    }
  }

  return recipes;
}

