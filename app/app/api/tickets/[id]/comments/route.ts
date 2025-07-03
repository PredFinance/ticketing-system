import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
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

    const { data: comment, error: commentError } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: ticket.id,
        user_id: user!.id, // Use integer ID
        content,
        is_internal: isInternal || false,
      })
      .select(`
        *,
        user:users(first_name, last_name, avatar_url, role)
      `)
      .single()

    if (commentError) {
      console.error("Comment creation error:", commentError)
      return NextResponse.json({ message: "Failed to create comment" }, { status: 500 })
    }

    // Update ticket's updated_at
    await supabase.from("tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticket.id)

    // Log activity using integer ID
    await supabase.from("ticket_activities").insert({
      ticket_id: ticket.id,
      user_id: user!.id,
      action: "commented",
      description: "Added a comment",
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Comment creation API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
