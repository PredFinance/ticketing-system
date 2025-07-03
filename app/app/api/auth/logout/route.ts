import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()
    await supabase.auth.signOut()

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
