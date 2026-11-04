import { NextRequest, NextResponse } from "next/server";
import { UserDatabaseStore } from "@/lib/db/userStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, provider = "email" } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = (name && typeof name === "string" && name.trim()) 
      ? name.trim() 
      : cleanEmail.split("@")[0];

    // Try syncing with SQLite backend (Express + Prisma) if available
    const possibleBackendUrls = [
      process.env.NEXT_PUBLIC_API_URL,
      "http://127.0.0.1:5000/api",
      "http://localhost:5000/api"
    ].filter(Boolean) as string[];

    let sqliteSynced = false;
    for (const bUrl of possibleBackendUrls) {
      if (bUrl.includes(":3000")) continue;
      try {
        const backendRes = await fetch(`${bUrl}/auth/authenticate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, name: cleanName, provider }),
          signal: AbortSignal.timeout(1500)
        });
        if (backendRes.ok) {
          sqliteSynced = true;
          break;
        }
      } catch {
        // Continue to next backend URL or fallback
      }
    }

    // Persist into serverless UserDatabaseStore
    const userStore = UserDatabaseStore.getInstance();
    const storedUser = userStore.upsertUser(cleanEmail, cleanName, provider);

    console.log(`[VERCEL AUTH] Stored user in database: ${storedUser.name} (${storedUser.email}) via ${provider}`);

    return NextResponse.json({
      success: true,
      message: "User authenticated and stored in database successfully",
      user: storedUser
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to authenticate" }, { status: 500 });
  }
}
