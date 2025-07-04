import { createSupabaseServerClient } from "@/lib/supabase"

export interface UploadResult {
  path: string
  filename: string
  size: number
  mimeType: string
  originalFilename: string
}

export async function uploadFileToSupabase(
  file: File,
  bucketName = "ticket-attachments",
  folderPath = "",
): Promise<UploadResult | null> {
  try {
    const supabase = createSupabaseServerClient()

    // Generate a unique filename to avoid collisions
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const fileExtension = file.name.split(".").pop()
    const uniqueFilename = `${timestamp}-${randomString}.${fileExtension}`

    // Create the full path including any folder structure
    const filePath = folderPath ? `${folderPath}/${uniqueFilename}` : uniqueFilename

    // Upload the file to Supabase Storage
    const { data, error } = await (await supabase).storage.from(bucketName).upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return null
    }

    return {
      path: data.path,
      filename: uniqueFilename,
      size: file.size,
      mimeType: file.type,
      originalFilename: file.name,
    }
  } catch (error) {
    console.error("File upload error:", error)
    return null
  }
}

export async function getFileUrl(path: string, bucketName = "ticket-attachments"): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path)
  return data.publicUrl
}
