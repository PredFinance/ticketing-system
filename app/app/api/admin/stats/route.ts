import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Get user stats
    const { data: userStats } = await supabase
      .from("users")
      .select("status")
      .eq("organization_id", user!.organization_id)

    const userStatsSummary = userStats?.reduce(
      (acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Get ticket stats
    const { data: ticketStats } = await supabase
      .from("tickets")
      .select("status, priority")
      .eq("organization_id", user!.organization_id)

    const ticketStatsSummary = ticketStats?.reduce(
      (acc, ticket) => {
        acc.total = (acc.total || 0) + 1
        acc[ticket.status] = (acc[ticket.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return NextResponse.json({
      users: {
        total: Object.values(userStatsSummary || {}).reduce((a, b) => a + b, 0),
        pending: userStatsSummary?.pending || 0,
        active: userStatsSummary?.active || 0,
        inactive: userStatsSummary?.inactive || 0,
        suspended: userStatsSummary?.suspended || 0,
      },
      tickets: {
        total: ticketStatsSummary?.total || 0,
        open: ticketStatsSummary?.open || 0,
        in_progress: ticketStatsSummary?.in_progress || 0,
        pending: ticketStatsSummary?.pending || 0,
        resolved: ticketStatsSummary?.resolved || 0,
        closed: ticketStatsSummary?.closed || 0,
      },
    })
  } catch (error) {
    console.error("Admin stats API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
