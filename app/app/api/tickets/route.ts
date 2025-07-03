import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Use simpler query without complex joins
    let query = supabase
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
        updated_at
      `)
      .eq("organization_id", user!.organization_id)

    // Filter based on user role
    if (user!.role === "user") {
      // Users see only tickets they created or are assigned to
      query = query.or(`created_by.eq.${user!.id},assigned_to.eq.${user!.id}`)
    } else if (user!.role === "supervisor") {
      // Supervisors see tickets in their department
      query = query.eq("department_id", user!.department_id)
    }
    // Admins see all tickets (no additional filter)

    const { data: tickets, error: ticketsError } = await query.order("created_at", { ascending: false })

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
          .select("first_name, last_name")
          .eq("id", ticket.created_by)
          .single()

        // Get assignee
        let assignee = null
        if (ticket.assigned_to) {
          const { data: assigneeData } = await supabase
            .from("users")
            .select("first_name, last_name")
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
          comments_count: Array(commentsCount || 0).fill(null), // Create array for compatibility
        }
      }),
    )

    return NextResponse.json(ticketsWithDetails)
  } catch (error) {
    console.error("Tickets API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
