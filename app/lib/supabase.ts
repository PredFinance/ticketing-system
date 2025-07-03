import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// Client-side Supabase client
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Server-side Supabase client for API routes (Next.js 15 compatible)
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
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
  })
}

// Admin client with service role key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// Database Types and Interfaces
export type UserRole = "admin" | "supervisor" | "user"
export type UserStatus = "pending" | "active" | "inactive" | "suspended"
export type TicketPriority = "low" | "medium" | "high" | "urgent"
export type TicketStatus = "open" | "in_progress" | "pending" | "resolved" | "closed"
export type NotificationStatus = "pending" | "sent" | "failed"
export type SettingType = "string" | "number" | "boolean" | "json"

// Organization Interface
export interface Organization {
  id: number
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

// Department Interface
export interface Department {
  id: number
  organization_id: number
  name: string
  description: string | null
  supervisor_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Relations
  supervisor?: User
  users?: User[]
  user_count?: number
}

// User Interface
export interface User {
  id: number
  organization_id: number
  department_id: number | null
  email: string
  first_name: string
  last_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  status: UserStatus
  last_login: string | null
  email_verified: boolean
  created_at: string
  updated_at: string
  auth_user_id: string | null
  // Relations
  organization?: Organization
  department?: Department
}

// Ticket Category Interface
export interface TicketCategory {
  id: number
  organization_id: number
  name: string
  description: string | null
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Ticket Interface
export interface Ticket {
  id: number
  organization_id: number
  ticket_number: string
  title: string
  description: string
  category_id: number | null
  department_id: number | null
  priority: TicketPriority
  status: TicketStatus
  created_by: number
  assigned_to: number | null
  due_date: string | null
  resolved_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  // Relations
  category?: TicketCategory
  department?: Department
  creator?: User
  assignee?: User
  comments?: TicketComment[]
  attachments?: Attachment[]
  activities?: TicketActivity[]
  watchers?: TicketWatcher[]
  comments_count?: number
}

// Ticket Comment Interface
export interface TicketComment {
  id: number
  ticket_id: number
  user_id: number
  content: string
  is_internal: boolean
  is_system_message: boolean
  parent_comment_id: number | null
  created_at: string
  updated_at: string
  // Relations
  ticket?: Ticket
  user?: User
  parent_comment?: TicketComment
  replies?: TicketComment[]
}

// Attachment Interface
export interface Attachment {
  id: number
  ticket_id: number
  comment_id: number | null
  uploaded_by: number
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
  // Relations
  ticket?: Ticket
  comment?: TicketComment
  uploader?: User
}

// Ticket Watcher Interface
export interface TicketWatcher {
  id: number
  ticket_id: number
  user_id: number
  created_at: string
  // Relations
  ticket?: Ticket
  user?: User
}

// Ticket Activity Interface
export interface TicketActivity {
  id: number
  ticket_id: number
  user_id: number | null
  action: string
  old_value: string | null
  new_value: string | null
  description: string | null
  created_at: string
  // Relations
  ticket?: Ticket
  user?: User
}

// Email Notification Interface
export interface EmailNotification {
  id: number
  to_email: string
  subject: string
  body: string
  template_name: string | null
  template_data: Record<string, any> | null
  status: NotificationStatus
  attempts: number
  max_attempts: number
  error_message: string | null
  scheduled_at: string
  sent_at: string | null
  created_at: string
}

// System Settings Interface
export interface SystemSetting {
  id: number
  organization_id: number
  setting_key: string
  setting_value: string | null
  setting_type: SettingType
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  // Relations
  organization?: Organization
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Statistics Interfaces
export interface UserStats {
  total: number
  pending: number
  active: number
  inactive: number
  suspended: number
}

export interface TicketStats {
  total: number
  open: number
  in_progress: number
  pending: number
  resolved: number
  closed: number
}

export interface DashboardStats {
  users: UserStats
  tickets: TicketStats
}

// Form Data Types
export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  departmentId?: number
}

export interface CreateTicketData {
  title: string
  description: string
  categoryId?: number
  departmentId?: number
  priority: TicketPriority
  files?: File[]
}

export interface UpdateTicketData {
  title?: string
  description?: string
  categoryId?: number
  departmentId?: number
  priority?: TicketPriority
  status?: TicketStatus
  assigned_to?: number
  due_date?: string
}

export interface CreateCommentData {
  content: string
  isInternal?: boolean
}

export interface CreateDepartmentData {
  name: string
  description?: string
  supervisorId?: number
}

export interface UpdateUserData {
  firstName?: string
  lastName?: string
  phone?: string
  avatar_url?: string
  role?: UserRole
  status?: UserStatus
  department_id?: number
}

// Database Query Types
export interface TicketFilters {
  status?: TicketStatus[]
  priority?: TicketPriority[]
  categoryId?: number
  departmentId?: number
  assignedTo?: number
  createdBy?: number
  dateFrom?: string
  dateTo?: string
}

export interface UserFilters {
  role?: UserRole[]
  status?: UserStatus[]
  departmentId?: number
}

// Supabase Database Schema Type
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization
        Insert: Omit<Organization, "id" | "created_at" | "updated_at"> & {
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Organization, "id" | "created_at">>
      }
      departments: {
        Row: Department
        Insert: Omit<Department, "id" | "created_at" | "updated_at"> & {
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Department, "id" | "created_at">>
      }
      users: {
        Row: User
        Insert: Omit<User, "id" | "created_at" | "updated_at"> & {
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<User, "id" | "created_at">>
      }
      ticket_categories: {
        Row: TicketCategory
        Insert: Omit<TicketCategory, "id" | "created_at" | "updated_at"> & {
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<TicketCategory, "id" | "created_at">>
      }
      tickets: {
        Row: Ticket
        Insert: Omit<Ticket, "id" | "created_at" | "updated_at"> & {
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<Ticket, "id" | "created_at">>
      }
      ticket_comments: {
        Row: TicketComment
        Insert: Omit<TicketComment, "id" | "created_at" | "updated_at"> & {
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<TicketComment, "id" | "created_at">>
      }
      attachments: {
        Row: Attachment
        Insert: Omit<Attachment, "id" | "created_at"> & {
          id?: number
          created_at?: string
        }
        Update: Partial<Omit<Attachment, "id" | "created_at">>
      }
      ticket_watchers: {
        Row: TicketWatcher
        Insert: Omit<TicketWatcher, "id" | "created_at"> & {
          id?: number
          created_at?: string
        }
        Update: Partial<Omit<TicketWatcher, "id" | "created_at">>
      }
      ticket_activities: {
        Row: TicketActivity
        Insert: Omit<TicketActivity, "id" | "created_at"> & {
          id?: number
          created_at?: string
        }
        Update: Partial<Omit<TicketActivity, "id" | "created_at">>
      }
      email_notifications: {
        Row: EmailNotification
        Insert: Omit<EmailNotification, "id" | "created_at"> & {
          id?: number
          created_at?: string
        }
        Update: Partial<Omit<EmailNotification, "id" | "created_at">>
      }
      system_settings: {
        Row: SystemSetting
        Insert: Omit<SystemSetting, "id" | "created_at" | "updated_at"> & {
          id?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<SystemSetting, "id" | "created_at">>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      ticket_priority: TicketPriority
      ticket_status: TicketStatus
      notification_status: NotificationStatus
      setting_type: SettingType
    }
  }
}

// Helper functions for type safety
export function isValidUserRole(role: string): role is UserRole {
  return ["admin", "supervisor", "user"].includes(role)
}

export function isValidUserStatus(status: string): status is UserStatus {
  return ["pending", "active", "inactive", "suspended"].includes(status)
}

export function isValidTicketPriority(priority: string): priority is TicketPriority {
  return ["low", "medium", "high", "urgent"].includes(priority)
}

export function isValidTicketStatus(status: string): status is TicketStatus {
  return ["open", "in_progress", "pending", "resolved", "closed"].includes(status)
}

// Constants
export const USER_ROLES: UserRole[] = ["admin", "supervisor", "user"]
export const USER_STATUSES: UserStatus[] = ["pending", "active", "inactive", "suspended"]
export const TICKET_PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"]
export const TICKET_STATUSES: TicketStatus[] = ["open", "in_progress", "pending", "resolved", "closed"]

export const PRIORITY_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  urgent: "#dc2626",
} as const

export const STATUS_COLORS = {
  open: "#3b82f6",
  in_progress: "#f59e0b",
  pending: "#8b5cf6",
  resolved: "#10b981",
  closed: "#6b7280",
} as const

export const ROLE_PERMISSIONS = {
  admin: ["read", "write", "delete", "manage_users", "manage_departments", "view_all_tickets"],
  supervisor: ["read", "write", "manage_department_tickets", "assign_tickets"],
  user: ["read", "write_own", "create_tickets"],
} as const
