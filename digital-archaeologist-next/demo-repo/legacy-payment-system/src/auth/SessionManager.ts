import { DatabaseConnector } from "../database/DatabaseConnector";

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
