import { DatabaseConnector } from "../database/DatabaseConnector";
// Circular dependency: TransactionService imports PaymentService for refund logic
import { PaymentService } from "./PaymentService";

export interface TransactionRecord {
  id: string;
  paymentId: string;
  userId: string;
  amount: number;
  reference: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  createdAt?: string;
}

export class TransactionService {
  private db: DatabaseConnector;

  constructor() {
    this.db = DatabaseConnector.getInstance();
  }

  public async recordTransaction(record: Omit<TransactionRecord, "id">): Promise<TransactionRecord> {
    const id = "tx_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const sql = `
      INSERT INTO transactions (id, payment_id, user_id, amount, reference, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    this.db.query(sql, [id, record.paymentId, record.userId, record.amount, record.reference, record.status]);
    
    return {
      id,
      ...record,
      createdAt: new Date().toISOString()
    };
  }

  public async getTransaction(transactionId: string): Promise<TransactionRecord | null> {
    const rows = this.db.query("SELECT * FROM transactions WHERE id = ?", [transactionId]);
    if (!rows || rows.length === 0) {
      return null;
    }
    return rows[0] as TransactionRecord;
  }

  /**
   * Reverse transaction: calls PaymentService to issue gateway reversal.
   * Tight coupling & circular dependency.
   */
  public async reverseTransaction(transactionId: string, reason: string): Promise<boolean> {
    const tx = await this.getTransaction(transactionId);
    if (!tx || tx.status === "REFUNDED") {
      return false;
    }

    const paymentService = new PaymentService();
    const refundOk = await paymentService.refundPayment(transactionId);
    if (refundOk) {
      this.db.query("UPDATE transactions SET status = 'REFUNDED', notes = ? WHERE id = ?", [reason, transactionId]);
      return true;
    }
    return false;
  }
}
