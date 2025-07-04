import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Get all tickets for the organization
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select(`
        id,
        organization_id,
        ticket_number,
        title,
        description,
        category_id,
        department_id,
        priority,
        status,
        created_by,
        assigned_to,
        due_date,
        resolved_at,
        closed_at,
        created_at,
        updated_at,
        is_public_in_department,
        allow_department_comments
      `)
      .eq("organization_id", user!.organization_id)
      .order("created_at", { ascending: false })

    if (ticketsError) {
      console.error("Tickets fetch error:", ticketsError)
      return NextResponse.json({ message: "Failed to fetch tickets" }, { status: 500 })
    }

    // Manually fetch related data for each ticket
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
          .select("first_name, last_name, email, avatar_url")
          .eq("id", ticket.created_by)
          .single()

        // Get assignee
        let assignee = null
        if (ticket.assigned_to) {
          const { data: assigneeData } = await supabase
            .from("users")
            .select("first_name, last_name, email, avatar_url")
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
          comments_count: commentsCount || 0,
        }
      }),
    )

    return NextResponse.json(ticketsWithDetails)
  } catch (error) {
    console.error("Admin tickets API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
