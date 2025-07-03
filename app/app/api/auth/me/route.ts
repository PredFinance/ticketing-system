import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookieStore = await cookies() // Await here!
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set() {},
        remove() {},
      }
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  console.log("Supabase user:", user, "Error:", error)

  if (error || !user) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 })
  }

  // Get user profile
  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("auth_user_id", user.id)
    .single()
  console.log("User profile:", userProfile, "Profile error:", profileError)

  if (profileError || !userProfile) {
    return NextResponse.json({ message: "User profile not found" }, { status: 404 })
  }

  if (userProfile.status !== "active") {
    return NextResponse.json({ message: "Account is not active" }, { status: 401 })
  }

  return NextResponse.json({
    id: userProfile.id,
    email: userProfile.email,
    firstName: userProfile.first_name,
    lastName: userProfile.last_name,
    role: userProfile.role,
    status: userProfile.status,
    departmentId: userProfile.department_id,
    avatarUrl: userProfile.avatar_url,
  })
}
