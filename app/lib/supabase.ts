import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client for admin operations
export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Database types with UUID
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          address: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          department_id: string | null
          email: string
          first_name: string
          last_name: string
          phone: string | null
          avatar_url: string | null
          role: "admin" | "supervisor" | "user"
          status: "pending" | "active" | "inactive" | "suspended"
          last_login: string | null
          email_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          department_id?: string | null
          email: string
          first_name: string
          last_name: string
          phone?: string | null
          avatar_url?: string | null
          role?: "admin" | "supervisor" | "user"
          status?: "pending" | "active" | "inactive" | "suspended"
          last_login?: string | null
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          department_id?: string | null
          email?: string
          first_name?: string
          last_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: "admin" | "supervisor" | "user"
          status?: "pending" | "active" | "inactive" | "suspended"
          last_login?: string | null
          email_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          organization_id: string
          ticket_number: string
          title: string
          description: string
          category_id: string | null
          department_id: string | null
          priority: "low" | "medium" | "high" | "urgent"
          status: "open" | "in_progress" | "pending" | "resolved" | "closed"
          created_by: string
          assigned_to: string | null
          due_date: string | null
          resolved_at: string | null
          closed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          ticket_number: string
          title: string
          description: string
          category_id?: string | null
          department_id?: string | null
          priority?: "low" | "medium" | "high" | "urgent"
          status?: "open" | "in_progress" | "pending" | "resolved" | "closed"
          created_by: string
          assigned_to?: string | null
          due_date?: string | null
          resolved_at?: string | null
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          ticket_number?: string
          title?: string
          description?: string
          category_id?: string | null
          department_id?: string | null
          priority?: "low" | "medium" | "high" | "urgent"
          status?: "open" | "in_progress" | "pending" | "resolved" | "closed"
          created_by?: string
          assigned_to?: string | null
          due_date?: string | null
          resolved_at?: string | null
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
