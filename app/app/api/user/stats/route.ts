import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Get user's tickets stats
    const { data: myTickets, error: myTicketsError } = await supabase
      .from("tickets")
      .select("status")
      .eq("created_by", user!.id)

    if (myTicketsError) {
      console.error("My tickets error:", myTicketsError)
      return NextResponse.json({ message: "Failed to fetch user stats" }, { status: 500 })
    }

    // Calculate my tickets stats
    const myTicketStats = {
      total: myTickets.length,
      open: myTickets.filter((t) => t.status === "open").length,
      in_progress: myTickets.filter((t) => t.status === "in_progress").length,
      pending: myTickets.filter((t) => t.status === "pending").length,
      resolved: myTickets.filter((t) => t.status === "resolved").length,
      closed: myTickets.filter((t) => t.status === "closed").length,
    }

    let assignedTicketStats = null

    // If user is supervisor or admin, get assigned tickets stats
    if (user!.role === "supervisor" || user!.role === "admin") {
      const { data: assignedTickets, error: assignedError } = await supabase
        .from("tickets")
        .select("status")
        .eq("assigned_to", user!.id)

      if (!assignedError) {
        assignedTicketStats = {
          total: assignedTickets.length,
          open: assignedTickets.filter((t) => t.status === "open").length,
          in_progress: assignedTickets.filter((t) => t.status === "in_progress").length,
          pending: assignedTickets.filter((t) => t.status === "pending").length,
          resolved: assignedTickets.filter((t) => t.status === "resolved").length,
          closed: assignedTickets.filter((t) => t.status === "closed").length,
        }
      }
    }

    return NextResponse.json({
      myTickets: myTicketStats,
      assignedTickets: assignedTicketStats,
    })
  } catch (error) {
    console.error("User stats API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
