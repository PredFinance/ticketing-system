import { createSupabaseServerClient } from "./supabase"
import { NextResponse } from "next/server"

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  departmentId: number | null
  organizationId: string
  avatarUrl: string | null
}

export async function getAuthenticatedUser(): Promise<{ user: AuthUser | null; error: NextResponse | null }> {
  try {
    const supabase = await createSupabaseServerClient()

    // Get the current user from Supabase session
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

    // Get user profile from our users table
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

    const user: AuthUser = {
      id: userProfile.id,
      email: userProfile.email,
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      role: userProfile.role,
      status: userProfile.status,
      departmentId: userProfile.department_id,
      organizationId: userProfile.organization_id,
      avatarUrl: userProfile.avatar_url,
    }

    return { user, error: null }
  } catch (error) {
    console.error("Authentication error:", error)
    return {
      user: null,
      error: NextResponse.json({ message: "Internal server error" }, { status: 500 }),
    }
  }
}

export async function requireAuth(requiredRole?: string) {
  const { user, error } = await getAuthenticatedUser()

  if (error) return { user: null, error }

  if (requiredRole && user!.role !== requiredRole) {
    return {
      user: null,
      error: NextResponse.json({ message: `${requiredRole} access required` }, { status: 403 }),
    }
  }

  return { user, error: null }
}
