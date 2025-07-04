import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string; action: string } }) {
  const { user, error } = await requireAdmin()
  if (error) return error

  let action: string | undefined;
  try {
    const supabase = await createSupabaseServerClient()
    const { id, action: actionParam } = params
    action = actionParam
    const body = await request.json()

    // Get the ticket first
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .eq("organization_id", user!.organization_id)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    switch (action) {
      case "assign":
        const { assigned_to } = body
        if (!assigned_to) {
          return NextResponse.json({ message: "Assignee ID required" }, { status: 400 })
        }

        // Verify assignee exists and is in the same organization
        const { data: assignee } = await supabase
          .from("users")
          .select("id")
          .eq("id", assigned_to)
          .eq("organization_id", user!.organization_id)
          .single()

        if (!assignee) {
          return NextResponse.json({ message: "Invalid assignee" }, { status: 400 })
        }

        await supabase
          .from("tickets")
          .update({
            assigned_to,
            status: ticket.status === "open" ? "in_progress" : ticket.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        // Log activity
        await supabase.from("ticket_activities").insert({
          ticket_id: ticket.id,
          user_id: user!.id,
          action: "assigned",
          description: `Ticket assigned to user ${assigned_to}`,
        })

        break

      case "change-priority":
        const { priority } = body
        if (!["low", "medium", "high", "urgent"].includes(priority)) {
          return NextResponse.json({ message: "Invalid priority" }, { status: 400 })
        }

        await supabase
          .from("tickets")
          .update({
            priority,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        // Log activity
        await supabase.from("ticket_activities").insert({
          ticket_id: ticket.id,
          user_id: user!.id,
          action: "priority_changed",
          old_value: ticket.priority,
          new_value: priority,
          description: `Priority changed from ${ticket.priority} to ${priority}`,
        })

        break

      case "toggle-visibility":
        const newVisibility = !ticket.is_public_in_department

        await supabase
          .from("tickets")
          .update({
            is_public_in_department: newVisibility,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)

        // Log activity
        await supabase.from("ticket_activities").insert({
          ticket_id: ticket.id,
          user_id: user!.id,
          action: "visibility_changed",
          description: `Ticket visibility changed to ${newVisibility ? "public" : "private"}`,
        })

        break

      case "delete":
        // Check if user has permission to delete (admin only)
        if (user!.role !== "admin") {
          return NextResponse.json({ message: "Insufficient permissions" }, { status: 403 })
        }

        // Delete related records first
        await Promise.all([
          supabase.from("ticket_comments").delete().eq("ticket_id", ticket.id),
          supabase.from("ticket_activities").delete().eq("ticket_id", ticket.id),
          supabase.from("ticket_watchers").delete().eq("ticket_id", ticket.id),
          supabase.from("attachments").delete().eq("ticket_id", ticket.id),
        ])

        // Delete the ticket
        await supabase.from("tickets").delete().eq("id", id)

        return NextResponse.json({ message: "Ticket deleted successfully" })

      default:
        return NextResponse.json({ message: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ message: `Ticket ${action} completed successfully` })
  } catch (error) {
    console.error(`Ticket ${action} API error:`, error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
