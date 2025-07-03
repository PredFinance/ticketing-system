import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    const { data: categories, error: categoriesError } = await supabase
      .from("ticket_categories")
      .select("*")
      .eq("organization_id", user!.organization_id)
      .eq("is_active", true)
      .order("name")

    if (categoriesError) {
      console.error("Categories fetch error:", categoriesError)
      return NextResponse.json({ message: "Failed to fetch categories" }, { status: 500 })
    }

    return NextResponse.json(categories)
  } catch (error) {
    console.error("Categories API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
