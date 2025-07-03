import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("supabase-auth-token")?.value

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from("users")
      .select("role, department_id, organization_id")
      .eq("auth_user_id", userData.user.id)
      .single()

    if (!userProfile || userProfile.role !== "supervisor") {
      return NextResponse.json({ message: "Supervisor access required" }, { status: 403 })
    }

    // Get department tickets
    const { data: tickets } = await supabase
      .from("tickets")
      .select(`
        *,
        category:ticket_categories(name, color),
        creator:users!tickets_created_by_fkey(first_name, last_name),
        assignee:users!tickets_assigned_to_fkey(first_name, last_name)
      `)
      .eq("department_id", userProfile.department_id)
      .order("created_at", { ascending: false })

    // Get department users
    const { data: departmentUsers } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, status")
      .eq("department_id", userProfile.department_id)
      .eq("status", "active")

    // Calculate stats
    const stats = {
      totalTickets: tickets?.length || 0,
      openTickets: tickets?.filter((t) => t.status === "open").length || 0,
      inProgressTickets: tickets?.filter((t) => t.status === "in_progress").length || 0,
      resolvedTickets: tickets?.filter((t) => t.status === "resolved").length || 0,
      unassignedTickets: tickets?.filter((t) => !t.assigned_to).length || 0,
      teamMembers: departmentUsers?.length || 0,
    }

    return NextResponse.json({
      stats,
      tickets: tickets || [],
      teamMembers: departmentUsers || [],
    })
  } catch (error) {
    console.error("Supervisor dashboard API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
