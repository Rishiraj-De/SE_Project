import { DatabaseConnector } from "../database/DatabaseConnector";

export class NotificationService {
  private db: DatabaseConnector;

  constructor() {
    this.db = DatabaseConnector.getInstance();
  }

  public async sendPaymentConfirmation(userId: string, amount: number, currency: string): Promise<boolean> {
    const message = `Payment of ${amount} ${currency} received successfully.`;
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
