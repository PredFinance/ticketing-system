import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const priority = searchParams.get("priority") || ""
    const sortBy = searchParams.get("sortBy") || "created_at"
    const sortOrder = searchParams.get("sortOrder") || "desc"

    const offset = (page - 1) * limit

    // Build query for user's tickets (created by them or assigned to them)
    let query = supabase
      .from("tickets")
      .select(
        `
        id,
        ticket_number,
        title,
        status,
        priority,
        created_at,
        updated_at,
        created_by,
        assigned_to,
        category_id,
        department_id
      `,
        { count: "exact" },
      )
      .eq("organization_id", user!.organization_id)

    // Filter by user role
    if (user!.role === "user") {
      query = query.or(`created_by.eq.${user!.id},assigned_to.eq.${user!.id}`)
    } else if (user!.role === "supervisor") {
      query = query.eq("department_id", user!.department_id)
    }
    // Admin sees all tickets (no additional filter)

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,ticket_number.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq("status", status)
    }
    if (priority) {
      query = query.eq("priority", priority)
    }

    // Apply sorting and pagination
    query = query.order(sortBy, { ascending: sortOrder === "asc" }).range(offset, offset + limit - 1)

    const { data: tickets, error: ticketsError, count } = await query

    if (ticketsError) {
      console.error("Tickets fetch error:", ticketsError)
      return NextResponse.json({ message: "Failed to fetch tickets" }, { status: 500 })
    }

    // Fetch related data for each ticket
    const ticketsWithDetails = await Promise.all(
      tickets.map(async (ticket) => {
        // Get category
        let category = null
        if (ticket.category_id) {
          const { data: categoryData } = await supabase
            .from("ticket_categories")
            .select("name, color")
            .eq("id", ticket.category_id)
            .single()
          category = categoryData
        }

        // Get department
        let department = null
        if (ticket.department_id) {
          const { data: deptData } = await supabase
            .from("departments")
            .select("name")
            .eq("id", ticket.department_id)
            .single()
          department = deptData
        }

        // Get creator
        const { data: creatorData } = await supabase
          .from("users")
          .select("first_name, last_name, avatar_url")
          .eq("id", ticket.created_by)
          .single()

        // Get assignee
        let assignee = null
        if (ticket.assigned_to) {
          const { data: assigneeData } = await supabase
            .from("users")
            .select("first_name, last_name, avatar_url")
            .eq("id", ticket.assigned_to)
            .single()
          assignee = assigneeData
        }

        // Get comments count
        const { count: commentsCount } = await supabase
          .from("ticket_comments")
          .select("*", { count: "exact", head: true })
          .eq("ticket_id", ticket.id)

        return {
          ...ticket,
          category,
          department,
          creator: creatorData,
          assignee,
          comments: Array(commentsCount || 0).fill(null),
        }
      }),
    )

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: ticketsWithDetails,
      total: count || 0,
      page,
      limit,
      totalPages,
    })
  } catch (error) {
    console.error("User tickets API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
