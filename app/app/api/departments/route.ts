import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: departments, error } = await supabase
      .from("departments")
      .select("id, name, description, is_active")
      .eq("is_active", true)
      .order("name", { ascending: true })

    if (error) {
      return NextResponse.json({ message: "Failed to fetch departments" }, { status: 500 })
    }

    return NextResponse.json(departments)
  } catch (error) {
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}