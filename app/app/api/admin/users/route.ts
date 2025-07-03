import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        *,
        departments(name)
      `)
      .eq("organization_id", user!.organization_id)
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("Users fetch error:", usersError)
      return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("Admin users API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
