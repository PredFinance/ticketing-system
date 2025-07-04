export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: number
          name: string
          slug: string
          logo_url: string | null
          admin_email: string
          admin_name: string
          phone: string | null
          address: string | null
          is_active: boolean
          onboarding_completed: boolean
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          slug: string
          admin_email: string
          admin_name: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          is_active?: boolean
          onboarding_completed?: boolean
          settings?: any
        }
        Update: {
          name?: string
          slug?: string
          admin_email?: string
          admin_name?: string
          phone?: string | null
          address?: string | null
          logo_url?: string | null
          is_active?: boolean
          onboarding_completed?: boolean
          settings?: any
        }
      }
      departments: {
        Row: {
          id: number
          organization_id: number
          name: string
          description: string | null
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: number
          name: string
          description?: string | null
          color?: string
          is_active?: boolean
        }
        Update: {
          organization_id?: number
          name?: string
          description?: string | null
          color?: string
          is_active?: boolean
        }
      }
      user_profiles: {
        Row: {
          id: number
          auth_id: string
          organization_id: number
          email: string
          full_name: string
          avatar_url: string | null
          phone: string | null
          role: "admin" | "supervisor" | "user"
          is_approved: boolean
          approved_by: number | null
          approved_at: string | null
          last_login: string | null
          is_online: boolean
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          auth_id: string
          organization_id: number
          email: string
          full_name: string
          avatar_url?: string | null
          phone?: string | null
          role?: "admin" | "supervisor" | "user"
          is_approved?: boolean
          approved_by?: number | null
          approved_at?: string | null
          last_login?: string | null
          is_online?: boolean
          settings?: any
        }
        Update: {
          organization_id?: number
          email?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          role?: "admin" | "supervisor" | "user"
          is_approved?: boolean
          approved_by?: number | null
          approved_at?: string | null
          last_login?: string | null
          is_online?: boolean
          settings?: any
        }
      }
      user_departments: {
        Row: {
          id: number
          user_id: number
          department_id: number
          is_supervisor: boolean
          can_assign_tickets: boolean
          joined_at: string
        }
        Insert: {
          user_id: number
          department_id: number
          is_supervisor?: boolean
          can_assign_tickets?: boolean
        }
        Update: {
          user_id?: number
          department_id?: number
          is_supervisor?: boolean
          can_assign_tickets?: boolean
        }
      }
      tickets: {
        Row: {
          id: number
          ticket_number: string
          organization_id: number
          department_id: number
          category_id: number | null
          created_by: number
          assigned_to: number | null
          assigned_by: number | null
          title: string
          description: string
          priority: "low" | "medium" | "high" | "critical"
          status: "open" | "in_progress" | "resolved" | "closed" | "reserved"
          visibility: "public" | "private"
          tags: string[] | null
          due_date: string | null
          resolved_at: string | null
          closed_at: string | null
          metadata: any
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: number
          department_id: number
          category_id?: number | null
          created_by: number
          assigned_to?: number | null
          assigned_by?: number | null
          title: string
          description: string
          priority?: "low" | "medium" | "high" | "critical"
          status?: "open" | "in_progress" | "resolved" | "closed" | "reserved"
          visibility?: "public" | "private"
          tags?: string[] | null
          due_date?: string | null
          metadata?: any
        }
        Update: {
          department_id?: number
          category_id?: number | null
          assigned_to?: number | null
          assigned_by?: number | null
          title?: string
          description?: string
          priority?: "low" | "medium" | "high" | "critical"
          status?: "open" | "in_progress" | "resolved" | "closed" | "reserved"
          visibility?: "public" | "private"
          tags?: string[] | null
          due_date?: string | null
          resolved_at?: string | null
          closed_at?: string | null
          metadata?: any
        }
      }
      ticket_categories: {
        Row: {
          id: number
          organization_id: number
          name: string
          description: string | null
          color: string
          icon: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          organization_id: number
          name: string
          description?: string | null
          color?: string
          icon?: string | null
          is_active?: boolean
        }
        Update: {
          organization_id?: number
          name?: string
          description?: string | null
          color?: string
          icon?: string | null
          is_active?: boolean
        }
      }
      ticket_comments: {
        Row: {
          id: number
          ticket_id: number
          user_id: number
          content: string
          is_internal: boolean
          mentioned_users: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          ticket_id: number
          user_id: number
          content: string
          is_internal?: boolean
          mentioned_users?: number[] | null
        }
        Update: {
          ticket_id?: number
          user_id?: number
          content?: string
          is_internal?: boolean
          mentioned_users?: number[] | null
        }
      }
      file_attachments: {
        Row: {
          id: number
          organization_id: number
          uploaded_by: number
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          storage_path: string
          related_to: string
          related_id: number
          is_image: boolean
          created_at: string
        }
        Insert: {
          organization_id: number
          uploaded_by: number
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          storage_path: string
          related_to: string
          related_id: number
          is_image?: boolean
        }
        Update: {
          organization_id?: number
          uploaded_by?: number
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          storage_path?: string
          related_to?: string
          related_id?: number
          is_image?: boolean
        }
      }
      notifications: {
        Row: {
          id: number
          organization_id: number
          user_id: number
          type: string
          title: string
          message: string
          data: any
          is_read: boolean
          is_email_sent: boolean
          created_at: string
        }
        Insert: {
          organization_id: number
          user_id: number
          type: string
          title: string
          message: string
          data?: any
          is_read?: boolean
          is_email_sent?: boolean
        }
        Update: {
          organization_id?: number
          user_id?: number
          type?: string
          title?: string
          message?: string
          data?: any
          is_read?: boolean
          is_email_sent?: boolean
        }
      }
    }
  }
}
