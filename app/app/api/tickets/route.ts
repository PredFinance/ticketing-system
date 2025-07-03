import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    let query = supabase
      .from("tickets")
      .select(`
        *,
        category:ticket_categories(name, color),
        department:departments(name),
        creator:users!tickets_created_by_fkey(first_name, last_name),
        assignee:users!tickets_assigned_to_fkey(first_name, last_name)
      `)
      .eq("organization_id", user!.organization_id)

    // Filter based on user role - use integer IDs for relationships
    if (user!.role === "user") {
      query = query.or(`created_by.eq.${user!.id},assigned_to.eq.${user!.id}`)
    } else if (user!.role === "supervisor" && user!.department_id) {
      // Supervisors see tickets from their department
      query = query.eq("department_id", user!.department_id)
    }
    // Admins see all tickets (no additional filter)

    const { data: tickets, error: ticketsError } = await query.order("created_at", { ascending: false })

    if (ticketsError) {
      console.error("Tickets fetch error:", ticketsError)
      return NextResponse.json({ message: "Failed to fetch tickets" }, { status: 500 })
    }

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Tickets API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
