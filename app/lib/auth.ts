import { createSupabaseServerClient } from "./supabase"
import { NextResponse } from "next/server"
import type { User } from "./supabase"

export interface AuthResult {
  user: User | null
  error: NextResponse | null
}

export async function authenticateUser(): Promise<AuthResult> {
  try {
    const supabase = await createSupabaseServerClient()

    // Get the authenticated user from Supabase Auth
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return {
        user: null,
        error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      }
    }

    // Get the user profile using the auth_user_id
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .single()

    if (profileError || !userProfile) {
      return {
        user: null,
        error: NextResponse.json({ message: "User profile not found" }, { status: 404 }),
      }
    }

    if (userProfile.status !== "active") {
      return {
        user: null,
        error: NextResponse.json({ message: "Account is not active" }, { status: 401 }),
      }
    }

    return { user: userProfile as User, error: null }
  } catch (error) {
    console.error("Authentication error:", error)
    return {
      user: null,
      error: NextResponse.json({ message: "Internal server error" }, { status: 500 }),
    }
  }
}

export async function requireRole(requiredRole: "admin" | "supervisor" | "user"): Promise<AuthResult> {
  const { user, error } = await authenticateUser()

  if (error) return { user: null, error }

  if (user!.role !== requiredRole && requiredRole !== "user") {
    if (requiredRole === "supervisor" && user!.role === "admin") {
      // Admin can access supervisor routes
      return { user, error: null }
    }

    return {
      user: null,
      error: NextResponse.json({ message: `${requiredRole} access required` }, { status: 403 }),
    }
  }

  return { user, error: null }
}

export async function requireAdmin(): Promise<AuthResult> {
  return requireRole("admin")
}

export async function requireSupervisor(): Promise<AuthResult> {
  return requireRole("supervisor")
}
