import fs from "fs";
import path from "path";
import { AuthenticatedUser, AuthProvider } from "../types";

/**
 * Serverless-compatible database user store.
 * Persists users across requests on Vercel (/tmp filesystem) and local disk,
 * and maintains an active in-memory cache.
 */
export class UserDatabaseStore {
  private static instance: UserDatabaseStore;
  private users: Map<string, AuthenticatedUser> = new Map();
  private dbPath: string;

  private constructor() {
    const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
    this.dbPath = isVercel
      ? "/tmp/digital_archaeologist_users.json"
      : path.resolve(process.cwd(), "users.json");

    this.loadFromDisk();
  }

  public static getInstance(): UserDatabaseStore {
    if (!UserDatabaseStore.instance) {
      UserDatabaseStore.instance = new UserDatabaseStore();
    }
    return UserDatabaseStore.instance;
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const u of parsed) {
            if (u && u.email) {
              this.users.set(u.email.toLowerCase(), u);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Could not read users from persistent disk:", err);
    }
  }

  private saveToDisk() {
    try {
      const list = Array.from(this.users.values());
      fs.writeFileSync(this.dbPath, JSON.stringify(list, null, 2), "utf-8");
    } catch (err) {
      console.warn("Could not persist users to disk:", err);
    }
  }

  public upsertUser(email: string, name: string, provider: AuthProvider = "email"): AuthenticatedUser {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name && name.trim()) ? name.trim() : cleanEmail.split("@")[0];

    const existing = this.users.get(cleanEmail);
    if (existing) {
      existing.name = cleanName;
      existing.provider = provider;
      existing.updatedAt = new Date().toISOString();
      this.saveToDisk();
      return existing;
    }

    const newUser: AuthenticatedUser = {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      name: cleanName,
      role: "engineer",
      provider,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users.set(cleanEmail, newUser);
    this.saveToDisk();
    return newUser;
  }

  public getUser(email: string): AuthenticatedUser | null {
    return this.users.get(email.toLowerCase().trim()) || null;
  }

  public getAllUsers(): AuthenticatedUser[] {
    return Array.from(this.users.values());
  }
}
