import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    if (!authData.user) {
      return NextResponse.json({ message: "Authentication failed" }, { status: 401 })
    }

    // Get user profile using auth_user_id
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authData.user.id)
      .single()

    if (profileError || !userProfile) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ message: "User profile not found" }, { status: 403 })
    }

    if (userProfile.status !== "active") {
      return NextResponse.json(
        {
          message: "Account is not active. Please contact administrator.",
        },
        { status: 401 },
      )
    }

    // Update last login using the integer ID
    await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", userProfile.id)

    const response = NextResponse.json({
      id: userProfile.id,
      email: userProfile.email,
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      role: userProfile.role,
      status: userProfile.status,
      departmentId: userProfile.department_id,
      organizationId: userProfile.organization_id,
      avatarUrl: userProfile.avatar_url,
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
