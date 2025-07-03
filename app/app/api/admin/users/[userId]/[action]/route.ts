import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { userId: string; action: string } }) {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const { userId, action } = params

    if (action === "approve") {
      const { error: updateError } = await supabase.from("users").update({ status: "active" }).eq("id", Number(userId)) // Use integer ID

      if (updateError) {
        console.error("User approval error:", updateError)
        return NextResponse.json({ message: "Failed to approve user" }, { status: 500 })
      }

      return NextResponse.json({ message: "User approved successfully" })
    } else if (action === "reject") {
      const { error: updateError } = await supabase
        .from("users")
        .update({ status: "inactive" })
        .eq("id", Number(userId)) // Use integer ID

      if (updateError) {
        console.error("User rejection error:", updateError)
        return NextResponse.json({ message: "Failed to reject user" }, { status: 500 })
      }

      return NextResponse.json({ message: "User rejected successfully" })
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Admin user action error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
