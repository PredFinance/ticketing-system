import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params

    // Get basic ticket data first
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_number", id)
      .single()

    if (ticketError || !ticket) {
      console.error("Ticket fetch error:", ticketError)
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    // Check access permissions
    if (user!.role === "user") {
      if (ticket.created_by !== user!.id && ticket.assigned_to !== user!.id) {
        return NextResponse.json({ message: "Access denied" }, { status: 403 })
      }
    } else if (user!.role === "supervisor") {
      if (ticket.department_id !== user!.department_id) {
        return NextResponse.json({ message: "Access denied" }, { status: 403 })
      }
    }

    // Manually fetch related data
    let category = null
    if (ticket.category_id) {
      const { data: categoryData } = await supabase
        .from("ticket_categories")
        .select("name, color")
        .eq("id", ticket.category_id)
        .single()
      category = categoryData
    }

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

    // Get comments
    const { data: comments } = await supabase
      .from("ticket_comments")
      .select(`
        id,
        content,
        is_internal,
        is_system_message,
        created_at,
        user_id
      `)
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true })

    // Get user data for each comment
    const commentsWithUsers = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: userData } = await supabase
          .from("users")
          .select("first_name, last_name, avatar_url, role")
          .eq("id", comment.user_id)
          .single()

        return {
          ...comment,
          user: userData,
        }
      }),
    )

    // Get activities
    const { data: activities } = await supabase
      .from("ticket_activities")
      .select(`
        id,
        action,
        description,
        created_at,
        user_id
      `)
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: false })

    // Get user data for each activity
    const activitiesWithUsers = await Promise.all(
      (activities || []).map(async (activity) => {
        let user = null
        if (activity.user_id) {
          const { data: userData } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("id", activity.user_id)
            .single()
          user = userData
        }

        return {
          ...activity,
          user,
        }
      }),
    )

    // Get attachments
    const { data: attachments } = await supabase.from("attachments").select("*").eq("ticket_id", ticket.id)

    const ticketWithDetails = {
      ...ticket,
      category,
      department,
      creator: creatorData,
      assignee,
      comments: commentsWithUsers,
      activities: activitiesWithUsers,
      attachments: attachments || [],
    }

    return NextResponse.json(ticketWithDetails)
  } catch (error) {
    console.error("Ticket detail API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params
    const updates = await request.json()

    const { data: ticket, error: updateError } = await supabase
      .from("tickets")
      .update(updates)
      .eq("ticket_number", id)
      .select()
      .single()

    if (updateError) {
      console.error("Ticket update error:", updateError)
      return NextResponse.json({ message: "Failed to update ticket" }, { status: 500 })
    }

    // Log activity
    await supabase.from("ticket_activities").insert({
      ticket_id: ticket.id,
      user_id: user!.id,
      action: "updated",
      description: `Ticket updated: ${Object.keys(updates).join(", ")}`,
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Ticket update API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
