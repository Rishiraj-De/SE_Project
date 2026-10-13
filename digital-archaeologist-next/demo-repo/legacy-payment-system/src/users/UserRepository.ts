import { DatabaseConnector } from "../database/DatabaseConnector";

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
