import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("supabase-auth-token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { id } = params

    // Get ticket with all related data
    const { data: ticket, error } = await supabase
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

    if (error) {
      console.error("Ticket fetch error:", error)
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Ticket detail API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("supabase-auth-token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { id } = params
    const updates = await request.json()

    const { data: ticket, error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("ticket_number", id)
      .select()
      .single()

    if (error) {
      console.error("Ticket update error:", error)
      return NextResponse.json({ message: "Failed to update ticket" }, { status: 500 })
    }

    // Log activity
    await supabase.from("ticket_activities").insert({
      ticket_id: ticket.id,
      user_id: userData.user.id,
      action: "updated",
      description: `Ticket updated: ${Object.keys(updates).join(", ")}`,
    })

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Ticket update API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
