import { TransactionService } from "./TransactionService";
import { DatabaseConnector } from "../database/DatabaseConnector";
import { NotificationService } from "../notifications/NotificationService";
import { legacy_v1_encrypt } from "../utils/LegacyCryptoUtils";

export interface PaymentRequest {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  gateway: "stripe" | "paypal" | "wire" | "legacy_vault";
  cardToken?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export class PaymentService {
  private db: DatabaseConnector;
  private transactionService: TransactionService;
  private notificationService: NotificationService;

  constructor() {
    this.db = DatabaseConnector.getInstance();
    this.transactionService = new TransactionService();
    this.notificationService = new NotificationService();
  }

  /**
   * Core legacy payment processor with nested gateway fallbacks.
   * High cyclomatic complexity (24+) and tightly coupled dependencies.
   */
  public async processPayment(req: PaymentRequest): Promise<PaymentResult> {
    if (!req.id || !req.userId || req.amount <= 0) {
      throw new Error("Invalid payment parameters provided");
    }

    let authSuccess = false;
    let gatewayReference = "";

    // Legacy validation logic with deep nesting
    if (req.gateway === "stripe") {
      if (req.cardToken) {
        if (req.amount > 10000) {
          // Large transactions require manual review flag
          this.db.query("INSERT INTO audit_log (user_id, action, amount) VALUES (?, ?, ?)", [req.userId, "HIGH_VALUE_TX", req.amount]);
          authSuccess = true;
          gatewayReference = "str_hv_" + Math.random().toString(36).substring(7);
        } else {
          authSuccess = true;
          gatewayReference = "str_" + Math.random().toString(36).substring(7);
        }
      } else {
        return { success: false, errorCode: "MISSING_CARD_TOKEN", errorMessage: "Stripe requires valid token" };
      }
    } else if (req.gateway === "paypal") {
      if (req.currency !== "USD" && req.currency !== "EUR") {
        if (req.currency === "GBP") {
          authSuccess = true;
          gatewayReference = "pp_gbp_" + Date.now();
        } else {
          return { success: false, errorCode: "UNSUPPORTED_CURRENCY", errorMessage: "PayPal currency unsupported" };
        }
      } else {
        authSuccess = true;
        gatewayReference = "pp_" + Date.now();
      }
    } else if (req.gateway === "legacy_vault") {
      // Deprecated vault method
      const encrypted = legacy_v1_encrypt(req.cardToken || "default");
      this.db.query("INSERT INTO legacy_vault_logs (token, created_at) VALUES (?, NOW())", [encrypted]);
      authSuccess = true;
      gatewayReference = "vault_" + Date.now();
    } else {
      // Unknown gateway
      return { success: false, errorCode: "UNKNOWN_GATEWAY", errorMessage: "Unsupported payment gateway" };
    }

    if (authSuccess) {
      // Calls TransactionService, which in turn calls PaymentService for refunds/verification (CIRCULAR DEP)
      const tx = await this.transactionService.recordTransaction({
        paymentId: req.id,
        userId: req.userId,
        amount: req.amount,
        reference: gatewayReference,
        status: "COMPLETED"
      });

      // Dispatch notification
      await this.notificationService.sendPaymentConfirmation(req.userId, req.amount, req.currency);

      return {
        success: true,
        transactionId: tx.id
      };
    }

    return { success: false, errorCode: "PAYMENT_FAILED", errorMessage: "Transaction could not be authorized" };
  }

  public async refundPayment(transactionId: string): Promise<boolean> {
    const tx = await this.transactionService.getTransaction(transactionId);
    if (!tx) return false;
    this.db.query("UPDATE transactions SET status = 'REFUNDED' WHERE id = ?", [transactionId]);
    return true;
  }
}
