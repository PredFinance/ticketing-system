export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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
          settings: Json | null
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
          settings?: Json | null
          created_at?: string
          updated_at?: string
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
          settings?: Json | null
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: number
          name?: string
          description?: string | null
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
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
          status: "pending" | "approved" | "suspended"
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
          status?: "pending" | "approved" | "suspended"
          is_approved?: boolean
          approved_by?: number | null
          approved_at?: string | null
          last_login?: string | null
          is_online?: boolean
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          organization_id?: number
          email?: string
          full_name?: string
          avatar_url?: string | null
          phone?: string | null
          role?: "admin" | "supervisor" | "user"
          status?: "pending" | "approved" | "suspended"
          is_approved?: boolean
          approved_by?: number | null
          approved_at?: string | null
          last_login?: string | null
          is_online?: boolean
          settings?: any
          created_at?: string
          updated_at?: string
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
          status: "open" | "in_progress" | "resolved" | "closed"
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
          status?: "open" | "in_progress" | "resolved" | "closed"
          visibility?: "public" | "private"
          tags?: string[] | null
          due_date?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          department_id?: number
          category_id?: number | null
          assigned_to?: number | null
          assigned_by?: number | null
          title?: string
          description?: string
          priority?: "low" | "medium" | "high" | "critical"
          status?: "open" | "in_progress" | "resolved" | "closed"
          visibility?: "public" | "private"
          tags?: string[] | null
          due_date?: string | null
          resolved_at?: string | null
          closed_at?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          ticket_id?: number
          user_id?: number
          content?: string
          is_internal?: boolean
          mentioned_users?: number[] | null
          created_at?: string
          updated_at?: string
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
          related_to: "ticket" | "comment"
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
          related_to: "ticket" | "comment"
          related_id: number
          is_image?: boolean
          created_at?: string
        }
        Update: {
          organization_id?: number
          uploaded_by?: number
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          storage_path?: string
          related_to?: "ticket" | "comment"
          related_id?: number
          is_image?: boolean
          created_at?: string
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
          created_at?: string
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
          created_at?: string
        }
      }
    }
  }
}

// Helper types for components
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"]
export type UserDepartment = {
  id: number
  user_id: number
  department_id: number
  is_supervisor: boolean
  can_assign_tickets: boolean
  joined_at: string
  user_profiles?: UserProfile
}

export type DepartmentWithUsers = {
  id: number
  name: string
  description: string | null
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
  organization_id: number
  userCount: number
  supervisorCount: number
  users: UserProfile[]
  user_departments?: UserDepartment[]
}

export type TicketWithDetails = {
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
  status: "open" | "in_progress" | "resolved" | "closed"
  visibility: "public" | "private"
  tags: string[] | null
  due_date: string | null
  resolved_at: string | null
  closed_at: string | null
  metadata: any
  created_at: string
  updated_at: string
  departments?: { name: string; color: string }
  user_profiles?: UserProfile
  ticket_categories?: { name: string; color: string }
}

export type AnalyticsData = {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  avgResolutionTime: number
  ticketsByPriority: Record<string, number>
  ticketsByDepartment: Record<string, number>
  ticketsByStatus: Record<string, number>
  recentActivity: TicketWithDetails[]
  userStats: {
    totalUsers: number
    activeUsers: number
    newUsersThisMonth: number
  }
}

export type Ticket = Database["public"]["Tables"]["tickets"]["Row"]
export type TicketComment = Database["public"]["Tables"]["ticket_comments"]["Row"]
export type Department = Database["public"]["Tables"]["departments"]["Row"]
export type FileAttachment = Database["public"]["Tables"]["file_attachments"]["Row"]
