import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { userId: string; action: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("supabase-auth-token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get user from token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    // Check if user is admin
    const { data: userProfile } = await supabase.from("users").select("role").eq("auth_user_id", userData.user.id).single()

    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 })
    }

    const { userId, action } = params

    if (action === "approve") {
      // Update user status to active
      const { error: updateError } = await supabase.from("users").update({ status: "active" }).eq("id", userId)

      if (updateError) {
        console.error("User approval error:", updateError)
        return NextResponse.json({ message: "Failed to approve user" }, { status: 500 })
      }

      // TODO: Send approval email notification

      return NextResponse.json({ message: "User approved successfully" })
    } else if (action === "reject") {
      // Update user status to inactive or delete the user
      const { error: updateError } = await supabase.from("users").update({ status: "inactive" }).eq("id", userId)

      if (updateError) {
        console.error("User rejection error:", updateError)
        return NextResponse.json({ message: "Failed to reject user" }, { status: 500 })
      }

      // TODO: Send rejection email notification

      return NextResponse.json({ message: "User rejected successfully" })
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Admin user action error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
