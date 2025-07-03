import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const categoryId = formData.get("categoryId") as string
    const departmentId = formData.get("departmentId") as string
    const priority = formData.get("priority") as string

    if (!title || !description) {
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 })
    }

    // Generate unique ticket number
    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`

    // Create ticket using integer IDs
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        organization_id: user!.organization_id,
        ticket_number: ticketNumber,
        title,
        description,
        category_id: categoryId ? Number(categoryId) : null,
        department_id: departmentId ? Number(departmentId) : null,
        priority: priority as any,
        status: "open",
        created_by: user!.id, // Use integer ID from users table
      })
      .select()
      .single()

    if (ticketError) {
      console.error("Ticket creation error:", ticketError)
      return NextResponse.json({ message: "Failed to create ticket" }, { status: 500 })
    }

    // Add initial system message
    await supabase.from("ticket_comments").insert({
      ticket_id: ticket.id,
      user_id: user!.id, // Use integer ID
      content: `Ticket created with priority: ${priority}`,
      is_system_message: true,
    })

    // Add user as watcher
    await supabase.from("ticket_watchers").insert({
      ticket_id: ticket.id,
      user_id: user!.id, // Use integer ID
    })

    // Log activity
    await supabase.from("ticket_activities").insert({
      ticket_id: ticket.id,
      user_id: user!.id, // Use integer ID
      action: "created",
      description: "Ticket created",
    })

    return NextResponse.json({
      ticketNumber: ticket.ticket_number,
      id: ticket.id,
      message: "Ticket created successfully",
    })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
