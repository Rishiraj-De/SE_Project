import { SessionManager } from "./SessionManager";
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
