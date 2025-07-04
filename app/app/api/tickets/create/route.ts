import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Parse form data
    const formData = await request.formData()
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const categoryId = formData.get("categoryId") as string
    const priority = formData.get("priority") as string
    const isPublic = formData.get("isPublic") === "true"

    // Use user's department from auth context
    const departmentId = user?.department_id

    if (!title || !description) {
      return NextResponse.json({ message: "Title and description are required" }, { status: 400 })
    }

    // Generate ticket number
    const ticketNumber = `TKT-${Date.now().toString().slice(-6)}`

    // Create ticket
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
        created_by: user!.id,
        is_public_in_department: isPublic,
      })
      .select()
      .single()

    if (ticketError) {
      console.error("Ticket creation error:", ticketError)
      return NextResponse.json({ message: "Failed to create ticket" }, { status: 500 })
    }

    // Handle file uploads
    const files = formData.getAll("files") as File[]
    const uploadedFiles = []

    if (files.length > 0) {
      for (const file of files) {
        try {
          // Generate a unique filename
          const timestamp = Date.now()
          const randomString = Math.random().toString(36).substring(2, 10)
          const fileExtension = file.name.split(".").pop()
          const uniqueFilename = `${timestamp}-${randomString}.${fileExtension}`

          // Create folder path based on ticket number
          const folderPath = `tickets/${ticketNumber}`
          const filePath = `${folderPath}/${uniqueFilename}`

          // Upload file to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("ticket-attachments")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            console.error("File upload error:", uploadError)
            continue
          }

          // Save attachment record in database
          const { data: attachment, error: attachmentError } = await supabase
            .from("attachments")
            .insert({
              ticket_id: ticket.id,
              uploaded_by: user!.id,
              filename: uniqueFilename,
              original_filename: file.name,
              file_path: filePath,
              file_size: file.size,
              mime_type: file.type,
            })
            .select()
            .single()

          if (!attachmentError) {
            uploadedFiles.push(attachment)
          }
        } catch (fileError) {
          console.error("Individual file upload error:", fileError)
          continue
        }
      }
    }

    // Add initial system message
    await supabase.from("ticket_comments").insert({
      ticket_id: ticket.id,
      user_id: user!.id,
      content: `Ticket created with priority: ${priority}${uploadedFiles.length > 0 ? ` with ${uploadedFiles.length} attachment(s)` : ""}`,
      is_system_message: true,
    })

    // Add user as watcher
    await supabase.from("ticket_watchers").insert({
      ticket_id: ticket.id,
      user_id: user!.id,
    })

    // Log activity
    await supabase.from("ticket_activities").insert({
      ticket_id: ticket.id,
      user_id: user!.id,
      action: "created",
      description: `Ticket created${uploadedFiles.length > 0 ? ` with ${uploadedFiles.length} attachment(s)` : ""}`,
    })

    return NextResponse.json({
      ticketNumber: ticket.ticket_number,
      id: ticket.id,
      message: "Ticket created successfully",
      attachments: uploadedFiles,
    })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
