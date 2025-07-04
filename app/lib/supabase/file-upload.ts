import { createClient } from "@/lib/supabase/client"

/**
 * Upload a file attachment for a ticket
 * @param file - The file to upload
 * @param ticketId - The ticket ID
 * @param organizationId - The organization ID
 * @returns Promise<string> - The public URL of the uploaded file
 */
export async function uploadTicketAttachment(file: File, ticketId: number, organizationId: number): Promise<string> {
  try {
    console.log("📤 Starting file upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      ticketId,
      organizationId,
    })

    // Validate file
    if (!file) {
      throw new Error("No file provided")
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`)
    }

    // Allowed file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type not allowed: ${file.type}`)
    }

    const supabase = createClient()

    // Generate unique file path that includes organization ID for RLS
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin"
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}-${randomId}.${fileExt}`
    const filePath = `tickets/${organizationId}/${ticketId}/${fileName}`

    console.log("📁 Upload path:", filePath)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("complaint-attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    console.log("✅ File uploaded to storage:", uploadData.path)

    // Get public URL
    const { data: urlData } = supabase.storage.from("complaint-attachments").getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      throw new Error("Failed to get public URL")
    }

    console.log("✅ Public URL generated:", urlData.publicUrl)

    return urlData.publicUrl
  } catch (error: any) {
    console.error("💥 File upload error:", error)
    throw error
  }
}

/**
 * Upload a file attachment for a comment
 * @param file - The file to upload
 * @param commentId - The comment ID
 * @param organizationId - The organization ID
 * @returns Promise<string> - The public URL of the uploaded file
 */
export async function uploadCommentAttachment(file: File, commentId: number, organizationId: number): Promise<string> {
  try {
    console.log("📤 Starting comment file upload:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      commentId,
      organizationId,
    })

    // Validate file
    if (!file) {
      throw new Error("No file provided")
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 10MB)`)
    }

    // Allowed file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type not allowed: ${file.type}`)
    }

    const supabase = createClient()

    // Generate unique file path that includes organization ID for RLS
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "bin"
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}-${randomId}.${fileExt}`
    const filePath = `comments/${organizationId}/${commentId}/${fileName}`

    console.log("📁 Upload path:", filePath)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("complaint-attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("❌ Storage upload error:", uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    console.log("✅ File uploaded to storage:", uploadData.path)

    // Get public URL
    const { data: urlData } = supabase.storage.from("complaint-attachments").getPublicUrl(filePath)

    if (!urlData.publicUrl) {
      throw new Error("Failed to get public URL")
    }

    console.log("✅ Public URL generated:", urlData.publicUrl)

    return urlData.publicUrl
  } catch (error: any) {
    console.error("💥 Comment file upload error:", error)
    throw error
  }
}

/**
 * Delete a file attachment
 * @param filePath - The storage path of the file
 * @returns Promise<void>
 */
export async function deleteTicketAttachment(filePath: string): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase.storage.from("complaint-attachments").remove([filePath])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }

    console.log("✅ File deleted:", filePath)
  } catch (error: any) {
    console.error("❌ File delete error:", error)
    throw error
  }
}

/**
 * Get download URL for a file
 * @param filePath - The storage path of the file
 * @returns Promise<string> - The download URL
 */
export async function getFileDownloadUrl(filePath: string): Promise<string> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.storage.from("complaint-attachments").createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
      throw new Error(`Failed to create download URL: ${error.message}`)
    }

    return data.signedUrl
  } catch (error: any) {
    console.error("❌ Download URL error:", error)
    throw error
  }
}
