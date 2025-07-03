import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Logout error:", error)
      return NextResponse.json({ message: "Logout failed" }, { status: 500 })
    }

    const response = NextResponse.json({ message: "Logged out successfully" })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
