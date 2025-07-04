import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function POST() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Delete existing settings
    await supabase.from("system_settings").delete().eq("organization_id", user!.organization_id)

    // Create default settings
    const defaultSettings = [
      // General Settings
      {
        setting_key: "system_name",
        setting_value: "Support Ticket System",
        setting_type: "string",
        description: "Name of the system",
        is_public: true,
      },
      {
        setting_key: "system_description",
        setting_value: "Internal support ticket management system",
        setting_type: "string",
        description: "System description",
        is_public: true,
      },
      {
        setting_key: "default_language",
        setting_value: "en",
        setting_type: "string",
        description: "Default system language",
        is_public: true,
      },
      {
        setting_key: "default_timezone",
        setting_value: "UTC",
        setting_type: "string",
        description: "Default timezone",
        is_public: true,
      },

      // Email Settings
      {
        setting_key: "email_notifications_enabled",
        setting_value: "true",
        setting_type: "boolean",
        description: "Enable email notifications",
        is_public: false,
      },
      {
        setting_key: "smtp_host",
        setting_value: "",
        setting_type: "string",
        description: "SMTP server host",
        is_public: false,
      },
      {
        setting_key: "smtp_port",
        setting_value: "587",
        setting_type: "number",
        description: "SMTP server port",
        is_public: false,
      },
      {
        setting_key: "smtp_encryption",
        setting_value: "tls",
        setting_type: "string",
        description: "SMTP encryption method",
        is_public: false,
      },
      {
        setting_key: "smtp_username",
        setting_value: "",
        setting_type: "string",
        description: "SMTP username",
        is_public: false,
      },
      {
        setting_key: "from_email",
        setting_value: "",
        setting_type: "string",
        description: "From email address",
        is_public: false,
      },

      // Security Settings
      {
        setting_key: "session_timeout",
        setting_value: "60",
        setting_type: "number",
        description: "Session timeout in minutes",
        is_public: false,
      },
      {
        setting_key: "password_min_length",
        setting_value: "8",
        setting_type: "number",
        description: "Minimum password length",
        is_public: false,
      },
      {
        setting_key: "require_password_complexity",
        setting_value: "false",
        setting_type: "boolean",
        description: "Require complex passwords",
        is_public: false,
      },
      {
        setting_key: "require_email_verification",
        setting_value: "true",
        setting_type: "boolean",
        description: "Require email verification",
        is_public: false,
      },
      {
        setting_key: "auto_approve_users",
        setting_value: "false",
        setting_type: "boolean",
        description: "Auto-approve new users",
        is_public: false,
      },

      // Ticket Settings
      {
        setting_key: "default_ticket_priority",
        setting_value: "medium",
        setting_type: "string",
        description: "Default ticket priority",
        is_public: true,
      },
      {
        setting_key: "ticket_number_prefix",
        setting_value: "TKT",
        setting_type: "string",
        description: "Ticket number prefix",
        is_public: true,
      },
      {
        setting_key: "auto_close_resolved_after",
        setting_value: "7",
        setting_type: "number",
        description: "Auto-close resolved tickets after days",
        is_public: true,
      },
      {
        setting_key: "allow_public_ticket_creation",
        setting_value: "false",
        setting_type: "boolean",
        description: "Allow public ticket creation",
        is_public: true,
      },
      {
        setting_key: "require_category_selection",
        setting_value: "false",
        setting_type: "boolean",
        description: "Require category selection",
        is_public: true,
      },

      // Notification Settings
      {
        setting_key: "notify_on_ticket_created",
        setting_value: "true",
        setting_type: "boolean",
        description: "Notify on ticket creation",
        is_public: false,
      },
      {
        setting_key: "notify_on_ticket_assigned",
        setting_value: "true",
        setting_type: "boolean",
        description: "Notify on ticket assignment",
        is_public: false,
      },
      {
        setting_key: "notify_on_status_change",
        setting_value: "true",
        setting_type: "boolean",
        description: "Notify on status change",
        is_public: false,
      },
      {
        setting_key: "notify_on_comment_added",
        setting_value: "true",
        setting_type: "boolean",
        description: "Notify on comment added",
        is_public: false,
      },
      {
        setting_key: "notification_digest_frequency",
        setting_value: "daily",
        setting_type: "string",
        description: "Notification digest frequency",
        is_public: false,
      },

      // File Upload Settings
      {
        setting_key: "max_file_size",
        setting_value: "10",
        setting_type: "number",
        description: "Maximum file size in MB",
        is_public: true,
      },
      {
        setting_key: "max_files_per_ticket",
        setting_value: "5",
        setting_type: "number",
        description: "Maximum files per ticket",
        is_public: true,
      },
      {
        setting_key: "allowed_file_types",
        setting_value: "jpg,jpeg,png,gif,pdf,doc,docx,txt",
        setting_type: "string",
        description: "Allowed file types",
        is_public: true,
      },
      {
        setting_key: "scan_uploaded_files",
        setting_value: "false",
        setting_type: "boolean",
        description: "Scan uploaded files for viruses",
        is_public: false,
      },
    ]

    const settingsToInsert = defaultSettings.map((setting) => ({
      ...setting,
      organization_id: user!.organization_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))

    await supabase.from("system_settings").insert(settingsToInsert)

    return NextResponse.json({ message: "Settings reset to defaults successfully" })
  } catch (error) {
    console.error("Settings reset API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
