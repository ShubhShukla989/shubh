import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
  session: any;
}

/**
 * Require authentication for API routes
 * Uses JWT session data - NO database query needed
 * This is the performance-optimized version
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  
  // Get user data from JWT session (no DB query!)
  const user = session.user as any;
  
  if (!user.id || !user.email) {
    throw new Error("INVALID_SESSION");
  }
  
  return {
    user: {
      id: parseInt(user.id),
      email: user.email,
      name: user.name || "",
      role: user.role || "Admin",
    },
    session,
  };
}

/**
 * Handle authentication errors consistently
 */
export function handleAuthError(error: any) {
  if (error.message === "UNAUTHORIZED") {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }
  
  if (error.message === "INVALID_SESSION") {
    return NextResponse.json(
      { success: false, error: "Invalid session" },
      { status: 401 }
    );
  }
  
  return NextResponse.json(
    { success: false, error: "Internal server error" },
    { status: 500 }
  );
}
