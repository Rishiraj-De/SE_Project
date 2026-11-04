import { NextResponse } from "next/server";
import { UserDatabaseStore } from "@/lib/db/userStore";

export async function GET() {
  const userStore = UserDatabaseStore.getInstance();
  const users = userStore.getAllUsers();
  return NextResponse.json({
    users,
    total: users.length
  });
}
