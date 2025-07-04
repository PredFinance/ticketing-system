import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params

    // Get attachment details
    const { data: attachment, error: attachmentError } = await supabase
      .from("attachments")
      .select(`
        *,
        ticket:tickets(id, created_by, assigned_to, department_id)
      `)
      .eq("id", id)
      .single()

    if (attachmentError || !attachment) {
      return NextResponse.json({ message: "Attachment not found" }, { status: 404 })
    }

    // Check access permissions
    const ticket = attachment.ticket as any
    if (user!.role === "user") {
      if (ticket.created_by !== user!.id && ticket.assigned_to !== user!.id) {
        return NextResponse.json({ message: "Access denied" }, { status: 403 })
      }
    } else if (user!.role === "supervisor") {
      if (ticket.department_id !== user!.department_id) {
        return NextResponse.json({ message: "Access denied" }, { status: 403 })
      }
    }

    // Get file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("ticket-attachments")
      .download(attachment.file_path)

    if (downloadError || !fileData) {
      return NextResponse.json({ message: "File not found" }, { status: 404 })
    }

    // Return file with proper headers
    return new NextResponse(fileData, {
      headers: {
        "Content-Type": attachment.mime_type,
        "Content-Disposition": `attachment; filename="${attachment.original_filename}"`,
        "Content-Length": attachment.file_size.toString(),
      },
    })
  } catch (error) {
    console.error("Download attachment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
