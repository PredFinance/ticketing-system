import { createClient } from "@supabase/supabase-js"

async function setupSupabaseStorage() {
  // Replace with your Supabase URL and service role key
  const supabaseUrl = ""
  const supabaseServiceKey = ""

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials")
    return
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Create the ticket-attachments bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

    if (bucketsError) {
      throw bucketsError
    }

    const bucketExists = buckets.some((bucket) => bucket.name === "ticket-attachments")

    if (!bucketExists) {
      console.log("Creating ticket-attachments bucket...")
      const { error } = await supabase.storage.createBucket("ticket-attachments", {
        public: true, // Make files publicly accessible
        fileSizeLimit: 10485760, // 10MB limit
      })

      if (error) {
        throw error
      }

      console.log("Bucket created successfully!")
    } else {
      console.log("Bucket already exists, updating settings...")

      // Update bucket to be public
      const { error } = await supabase.storage.updateBucket("ticket-attachments", {
        public: true,
        fileSizeLimit: 10485760, // 10MB limit
      })

      if (error) {
        throw error
      }

      console.log("Bucket settings updated successfully!")
    }

    // Set up storage policies to allow authenticated users to upload
    console.log("Setting up storage policies...")

    // Allow authenticated users to upload files
    await supabase.rpc("create_storage_policy", {
      bucket_name: "ticket-attachments",
      policy_name: "authenticated_upload",
      definition: `(role() = 'authenticated')::boolean`,
      operation: "INSERT",
    })

    // Allow anyone to download public files
    await supabase.rpc("create_storage_policy", {
      bucket_name: "ticket-attachments",
      policy_name: "public_download",
      definition: `true`,
      operation: "SELECT",
    })

    console.log("Storage setup completed successfully!")
  } catch (error) {
    console.error("Error setting up storage:", error)
  }
}

setupSupabaseStorage()
