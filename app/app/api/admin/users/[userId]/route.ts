import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { userId } = params
    const body = await request.json()

    const { error } = await supabase
      .from("users")
      .update(body)
      .eq("id", userId)

    if (error) {
      console.error("User update error:", error)
      return NextResponse.json({ message: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User updated successfully" })
  } catch (error) {
    console.error("User update API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}