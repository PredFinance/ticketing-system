import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30d"
    const departmentFilter = searchParams.get("department") || "all"

    // Calculate date range
    const now = new Date()
    const daysBack = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000)

    // Get overview statistics
    const [usersResult, ticketsResult, departmentsResult] = await Promise.all([
      supabase.from("users").select("*").eq("organization_id", user!.organization_id),
      supabase
        .from("tickets")
        .select("*")
        .eq("organization_id", user!.organization_id)
        .gte("created_at", startDate.toISOString()),
      supabase.from("departments").select("*").eq("organization_id", user!.organization_id),
    ])

    const users = usersResult.data || []
    const tickets = ticketsResult.data || []
    const departments = departmentsResult.data || []

    // Calculate growth rates (comparing with previous period)
    const previousStartDate = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000)
    const [previousUsersResult, previousTicketsResult] = await Promise.all([
      supabase
        .from("users")
        .select("id")
        .eq("organization_id", user!.organization_id)
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString()),
      supabase
        .from("tickets")
        .select("id")
        .eq("organization_id", user!.organization_id)
        .gte("created_at", previousStartDate.toISOString())
        .lt("created_at", startDate.toISOString()),
    ])

    const previousUsers = previousUsersResult.data || []
    const previousTickets = previousTicketsResult.data || []

    const userGrowth =
      previousUsers.length > 0 ? ((users.length - previousUsers.length) / previousUsers.length) * 100 : 0
    const ticketGrowth =
      previousTickets.length > 0 ? ((tickets.length - previousTickets.length) / previousTickets.length) * 100 : 0

    // Calculate average resolution time
    const resolvedTickets = tickets.filter((t) => t.status === "resolved" && t.resolved_at)
    const avgResolutionTime =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((acc, ticket) => {
            const created = new Date(ticket.created_at)
            const resolved = new Date(ticket.resolved_at)
            return acc + (resolved.getTime() - created.getTime())
          }, 0) /
          resolvedTickets.length /
          (1000 * 60 * 60) // Convert to hours
        : 0

    const resolutionRate = tickets.length > 0 ? (resolvedTickets.length / tickets.length) * 100 : 0

    // Tickets by status
    const statusCounts = tickets.reduce((acc: any, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1
      return acc
    }, {})

    const ticketsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count: count as number,
      percentage: tickets.length > 0 ? Math.round(((count as number) / tickets.length) * 100) : 0,
    }))

    // Tickets by priority
    const priorityCounts = tickets.reduce((acc: any, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
      return acc
    }, {})

    const ticketsByPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count: count as number,
      percentage: tickets.length > 0 ? Math.round(((count as number) / tickets.length) * 100) : 0,
    }))

    // Tickets by department
    const ticketsByDepartment = await Promise.all(
      departments.map(async (dept) => {
        const deptTickets = tickets.filter((t) => t.department_id === dept.id)
        const deptResolved = deptTickets.filter((t) => t.status === "resolved" && t.resolved_at)

        const deptAvgResolutionTime =
          deptResolved.length > 0
            ? deptResolved.reduce((acc, ticket) => {
                const created = new Date(ticket.created_at)
                const resolved = new Date(ticket.resolved_at)
                return acc + (resolved.getTime() - created.getTime())
              }, 0) /
              deptResolved.length /
              (1000 * 60 * 60)
            : 0

        return {
          department: dept.name,
          count: deptTickets.length,
          resolved: deptResolved.length,
          avgResolutionTime: Math.round(deptAvgResolutionTime),
        }
      }),
    )

    // User activity (simplified - would need more complex queries for real data)
    const userActivity = Array.from({ length: Math.min(daysBack, 30) }, (_, i) => {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayTickets = tickets.filter((t) => {
        const ticketDate = new Date(t.created_at)
        return ticketDate.toDateString() === date.toDateString()
      })

      return {
        date: date.toISOString().split("T")[0],
        newUsers: 0, // Would need separate query
        activeUsers: 0, // Would need separate query
        newTickets: dayTickets.length,
        resolvedTickets: dayTickets.filter((t) => t.status === "resolved").length,
      }
    }).reverse()

    // Top performers (users with most resolved tickets)
    const userTicketCounts = await Promise.all(
      users
        .filter((u) => u.role !== "user")
        .map(async (u) => {
          const userTickets = tickets.filter((t) => t.assigned_to === u.id && t.status === "resolved")
          const userAvgTime =
            userTickets.length > 0
              ? userTickets.reduce((acc, ticket) => {
                  if (ticket.resolved_at) {
                    const created = new Date(ticket.created_at)
                    const resolved = new Date(ticket.resolved_at)
                    return acc + (resolved.getTime() - created.getTime())
                  }
                  return acc
                }, 0) /
                userTickets.length /
                (1000 * 60 * 60)
              : 0

          return {
            user: {
              name: `${u.first_name} ${u.last_name}`,
              email: u.email,
              avatar_url: u.avatar_url,
            },
            ticketsResolved: userTickets.length,
            avgResolutionTime: Math.round(userAvgTime),
            rating: 5, // Would calculate based on feedback
          }
        }),
    )

    const topPerformers = userTicketCounts.sort((a, b) => b.ticketsResolved - a.ticketsResolved).slice(0, 5)

    const analyticsData = {
      overview: {
        totalTickets: tickets.length,
        totalUsers: users.length,
        totalDepartments: departments.length,
        avgResolutionTime: Math.round(avgResolutionTime),
        ticketGrowth: Math.round(ticketGrowth),
        userGrowth: Math.round(userGrowth),
        resolutionRate: Math.round(resolutionRate),
      },
      ticketsByStatus,
      ticketsByPriority,
      ticketsByDepartment,
      userActivity,
      topPerformers,
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
