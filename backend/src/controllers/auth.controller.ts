import { Request, Response } from "express";
import { prisma } from "../db/prisma";

export class AuthController {
  /**
   * Authenticates user via Google, Apple, or Email and stores their name and email
   * into the SQLite database via Prisma.
   */
  public static async authenticate(req: Request, res: Response) {
    try {
      const { email, name, provider = "email" } = req.body;

      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "A valid email address is required." });
      }

      const cleanEmail = email.toLowerCase().trim();
      const cleanName = (name && typeof name === "string" && name.trim()) 
        ? name.trim() 
        : cleanEmail.split("@")[0];

      // Upsert user in database
      const user = await prisma.user.upsert({
        where: { email: cleanEmail },
        update: {
          name: cleanName,
          updatedAt: new Date()
        },
        create: {
          email: cleanEmail,
          name: cleanName,
          role: "engineer"
        }
      });

      console.log(`[AUTH] Stored user in database: ${user.name} (${user.email}) via ${provider}`);

      return res.status(200).json({
        success: true,
        message: "User authenticated and stored in database successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          provider,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (err: any) {
      console.error("[AUTH ERROR] Failed to store user in database:", err);
      return res.status(500).json({ error: err.message || "Failed to authenticate user" });
    }
  }

  /**
   * Fetch a user profile by email
   */
  public static async getUser(req: Request, res: Response) {
    try {
      const email = req.params.email || (req.query.email as string);
      if (!email) {
        return res.status(400).json({ error: "Email parameter is required." });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          repositories: {
            select: { id: true, name: true, url: true, defaultBranch: true }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: "User not found in database." });
      }

      return res.status(200).json({ user });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  /**
   * List all stored users in the database
   */
  public static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 50
      });
      return res.status(200).json({ users, total: users.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
