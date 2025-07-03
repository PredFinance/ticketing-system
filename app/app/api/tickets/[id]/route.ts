import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const { id } = params

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select(`
        *,
        category:ticket_categories(name, color),
        department:departments(name),
        creator:users!tickets_created_by_fkey(first_name, last_name, email, avatar_url),
        assignee:users!tickets_assigned_to_fkey(first_name, last_name, email, avatar_url),
        comments:ticket_comments(
          *,
          user:users(first_name, last_name, avatar_url, role)
        ),
        attachments(*),
        activities:ticket_activities(
          *,
          user:users(first_name, last_name)
        )
      `)
      .eq("ticket_number", id)
      .single()

    if (ticketError) {
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

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Ticket detail API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const { id } = params
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

    // Log activity using integer ID
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
