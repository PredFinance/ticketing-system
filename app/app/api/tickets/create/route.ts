import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { uploadTicketAttachment } from "@/lib/supabase/file-upload"

export async function POST(request: NextRequest) {
  console.log("🎫 Starting ticket creation API...")

  try {
    // Step 1: Create Supabase client with proper cookie handling
    console.log("📝 Step 1: Setting up Supabase client...")
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    )

    console.log("✅ Supabase client created")

    // Step 2 & 3 removed: No authentication or profile fetching

    // Step 4: Parse form data
    console.log("📝 Step 2: Parsing form data...")
    const formData = await request.formData()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const priority = formData.get("priority") as string
    const departmentId = formData.get("departmentId") as string
    const categoryId = formData.get("categoryId") as string
    const visibility = formData.get("visibility") as string
    const organizationId = formData.get("organizationId") as string
    const createdBy = formData.get("createdBy") as string

    console.log("✅ Form data parsed:", {
      title: title?.substring(0, 50) + "...",
      description: description?.substring(0, 50) + "...",
      priority,
      departmentId,
      categoryId,
      visibility,
      organizationId,
      createdBy,
    })

    // Step 5: Validate required fields
    console.log("📝 Step 3: Validating required fields...")
    if (!title?.trim()) {
      console.error("❌ Title is required")
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!description?.trim()) {
      console.error("❌ Description is required")
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    if (!departmentId) {
      console.error("❌ Department is required")
      return NextResponse.json({ error: "Department is required" }, { status: 400 })
    }

    if (!organizationId) {
      console.error("❌ Organization ID is required")
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 })
    }

    if (!createdBy) {
      console.error("❌ Created By is required")
      return NextResponse.json({ error: "Created By is required" }, { status: 400 })
    }

    console.log("✅ Required fields validated")

    // Step 6: Generate shorter ticket number (max 20 chars)
    console.log("📝 Step 4: Generating ticket number...")
    const timestamp = Date.now().toString().slice(-8) // Last 8 digits
    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase() // 4 chars
    const ticketNumber = `TKT-${timestamp}-${randomId}` // Format: TKT-12345678-ABCD (max 17 chars)
    console.log("✅ Ticket number generated:", ticketNumber, `(${ticketNumber.length} chars)`)

    // Step 7: Create ticket in database
    console.log("📝 Step 5: Creating ticket in database...")
    const ticketData = {
      ticket_number: ticketNumber,
      organization_id: Number.parseInt(organizationId),
      department_id: Number.parseInt(departmentId),
      category_id: categoryId ? Number.parseInt(categoryId) : null,
      created_by: createdBy,
      title: title.trim(),
      description: description.trim(),
      priority: priority as "low" | "medium" | "high" | "critical",
      visibility: visibility as "public" | "private",
      status: "open" as const,
    }

    console.log("📝 Inserting ticket with data:", ticketData)

    const { data: ticket, error: ticketError } = await supabase.from("tickets").insert(ticketData).select().single()

    if (ticketError) {
      console.error("❌ Ticket creation error:", ticketError)
      return NextResponse.json(
        {
          error: "Failed to create ticket",
          details: ticketError.message,
          code: ticketError.code,
        },
        { status: 400 },
      )
    }

    if (!ticket) {
      console.error("❌ No ticket returned from insert")
      return NextResponse.json({ error: "Ticket creation failed - no data returned" }, { status: 500 })
    }

    console.log("✅ Ticket created successfully:", { id: ticket.id, ticket_number: ticket.ticket_number })

    // Step 8: Handle file uploads
    console.log("📝 Step 6: Processing file uploads...")
    const files = formData.getAll("files") as File[]
    console.log(`📎 Found ${files.length} files to upload`)

    const uploadResults = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file && file.size > 0) {
        console.log(`📎 Uploading file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes)`)

        try {
          // Upload file to storage
          const fileUrl = await uploadTicketAttachment(file, ticket.id, Number.parseInt(organizationId))
          console.log(`✅ File uploaded to storage: ${fileUrl}`)

          // Save file record to database
          const { data: fileRecord, error: fileError } = await supabase
            .from("file_attachments")
            .insert({
              organization_id: Number.parseInt(organizationId),
              uploaded_by: createdBy,
              file_name: file.name,
              file_size: file.size,
              file_type: file.type,
              file_url: fileUrl,
              storage_path: fileUrl,
              related_to: "ticket",
              related_id: ticket.id,
              is_image: file.type.startsWith("image/"),
            })
            .select()
            .single()

          if (fileError) {
            console.error(`❌ Failed to save file record for ${file.name}:`, fileError)
            uploadResults.push({ file: file.name, success: false, error: fileError.message })
          } else {
            console.log(`✅ File record saved for ${file.name}`)
            uploadResults.push({ file: file.name, success: true, id: fileRecord.id })
          }
        } catch (uploadError: any) {
          console.error(`❌ Failed to upload ${file.name}:`, uploadError)
          uploadResults.push({ file: file.name, success: false, error: uploadError.message })
        }
      }
    }

    console.log("✅ File upload processing complete:", uploadResults)

    // Step 9: Create notification (optional)
    console.log("📝 Step 7: Creating notification...")
    try {
      await supabase.from("notifications").insert({
        organization_id: Number.parseInt(organizationId),
        user_id: createdBy,
        type: "ticket_created",
        title: "Ticket Created",
        message: `Your ticket "${title}" has been created successfully.`,
        data: { ticket_id: ticket.id, ticket_number: ticket.ticket_number },
      })
      console.log("✅ Notification created")
    } catch (notificationError) {
      console.error("⚠️ Failed to create notification (non-critical):", notificationError)
    }

    // Step 10: Return success response
    console.log("🎉 Ticket creation completed successfully!")
    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.ticket_number,
        title: ticket.title,
        status: ticket.status,
      },
      files: uploadResults,
    })
  } catch (error: any) {
    console.error("💥 Unexpected error in ticket creation:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
