import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options)
          },
          remove(name: string) {
            cookieStore.delete(name)
          },
        },
      }
    )

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    if (!authData.user) {
      return NextResponse.json({ message: "Authentication failed" }, { status: 401 })
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authData.user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ message: "User profile not found" }, { status: 403 })
    }

    if (userProfile.status !== "active") {
      return NextResponse.json({ message: "Account is not active. Please contact administrator." }, { status: 401 })
    }

    await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("id", userProfile.id)

    // Let Supabase SSR handle setting cookies via response headers
    const response = NextResponse.json({
      id: userProfile.id,
      email: userProfile.email,
      firstName: userProfile.first_name,
      lastName: userProfile.last_name,
      role: userProfile.role,
      status: userProfile.status,
      departmentId: userProfile.department_id,
      avatarUrl: userProfile.avatar_url,
    })

    // Set cookies for SSR
    supabase.auth.setSession(authData.session)
    // (If using @supabase/ssr v0.3+, this is handled automatically)

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
