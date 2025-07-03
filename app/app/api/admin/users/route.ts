import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("supabase-auth-token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("users").select("role").eq("auth_user_id", userData.user.id).single()
    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 })
    }

    // Get all users with department info
    const { data: users, error } = await supabase
      .from("users")
      .select(`
        *,
        departments(name)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Users fetch error:", error)
      return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
