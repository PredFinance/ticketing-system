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

    // Get user stats
    const userStats = await supabase
      .from("users")
      .select("status")
      .then(({ data }) => {
        const stats = data?.reduce(
          (acc, user) => {
            acc[user.status] = (acc[user.status] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )
        return stats
      })

    // Get ticket stats
    const ticketStats = await supabase
      .from("tickets")
      .select("status, priority, created_at, resolved_at")
      .then(({ data }) => {
        const stats = data?.reduce(
          (acc, ticket) => {
            acc.total = (acc.total || 0) + 1
            acc[ticket.status] = (acc[ticket.status] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )
        return stats
      })

    return NextResponse.json({
      users: {
        total: Object.values(userStats || {}).reduce((a, b) => a + b, 0),
        pending: userStats?.pending || 0,
        active: userStats?.active || 0,
        inactive: userStats?.inactive || 0,
        suspended: userStats?.suspended || 0,
      },
      tickets: {
        total: ticketStats?.total || 0,
        open: ticketStats?.open || 0,
        in_progress: ticketStats?.in_progress || 0,
        pending: ticketStats?.pending || 0,
        resolved: ticketStats?.resolved || 0,
        closed: ticketStats?.closed || 0,
      },
    })
  } catch (error) {
    console.error("Admin stats API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
