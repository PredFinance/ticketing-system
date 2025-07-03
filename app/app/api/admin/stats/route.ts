import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Get user stats
    const { data: users } = await supabase.from("users").select("status").eq("organization_id", user!.organization_id)

    const userStats =
      users?.reduce(
        (acc, user) => {
          acc[user.status] = (acc[user.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    // Get ticket stats
    const { data: tickets } = await supabase
      .from("tickets")
      .select("status, priority, created_at, resolved_at")
      .eq("organization_id", user!.organization_id)

    const ticketStats =
      tickets?.reduce(
        (acc, ticket) => {
          acc.total = (acc.total || 0) + 1
          acc[ticket.status] = (acc[ticket.status] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ) || {}

    return NextResponse.json({
      users: {
        total: Object.values(userStats).reduce((a, b) => a + b, 0),
        pending: userStats.pending || 0,
        active: userStats.active || 0,
        inactive: userStats.inactive || 0,
        suspended: userStats.suspended || 0,
      },
      tickets: {
        total: ticketStats.total || 0,
        open: ticketStats.open || 0,
        in_progress: ticketStats.in_progress || 0,
        pending: ticketStats.pending || 0,
        resolved: ticketStats.resolved || 0,
        closed: ticketStats.closed || 0,
      },
    })
  } catch (error) {
    console.error("Admin stats API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
