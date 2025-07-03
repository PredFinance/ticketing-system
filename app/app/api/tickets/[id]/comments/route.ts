import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { content, isInternal } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ message: "Comment content is required" }, { status: 400 })
    }

    // Get ticket by ticket_number
    const { data: ticket } = await supabase.from("tickets").select("id").eq("ticket_number", id).single()

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 })
    }

    const { data: comment, error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: ticket.id,
        user_id: userData.user.id,
        content,
        is_internal: isInternal || false,
      })
      .select(`
        *,
        user:users(first_name, last_name, avatar_url, role)
      `)
      .single()

    if (error) {
      console.error("Comment creation error:", error)
      return NextResponse.json({ message: "Failed to create comment" }, { status: 500 })
    }

    // Update ticket's updated_at
    await supabase.from("tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticket.id)

    // Log activity
    await supabase.from("ticket_activities").insert({
      ticket_id: ticket.id,
      user_id: userData.user.id,
      action: "commented",
      description: "Added a comment",
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Comment creation API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
