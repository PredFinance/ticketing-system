import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("supabase-auth-token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Get user from token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const categoryId = formData.get("categoryId") as string
    const departmentId = formData.get("departmentId") as string
    const priority = formData.get("priority") as string

    if (!title || !description) {
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 })
    }

    // Get user profile to get organization
    const { data: userProfile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("auth_user_id", userData.user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ message: "User profile not found" }, { status: 404 })
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        organization_id: userProfile.organization_id,
        ticket_number: ticketNumber,
        title,
        description,
        category_id: categoryId || null,
        department_id: departmentId || null,
        priority: priority as any,
        status: "open",
        created_by: userData.user.id,
      })
      .select()
      .single()

    if (ticketError) {
      console.error("Ticket creation error:", ticketError)
      return NextResponse.json({ message: "Failed to create ticket" }, { status: 500 })
    }

    // Handle file uploads (simplified for now)
    const files = formData.getAll("files") as File[]
    if (files.length > 0) {
      // TODO: Implement file upload to storage and save attachment records
      console.log(`${files.length} files to upload for ticket ${ticketNumber}`)
    }

    // Add initial system message
    await supabase.from("ticket_comments").insert({
      ticket_id: ticket.id,
      user_id: userData.user.id,
      content: `Ticket created with priority: ${priority}`,
      is_system_message: true,
    })

    // Add user as watcher
    await supabase.from("ticket_watchers").insert({
      ticket_id: ticket.id,
      user_id: userData.user.id,
    })

    // Log activity
    await supabase.from("ticket_activities").insert({
      ticket_id: ticket.id,
      user_id: userData.user.id,
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
