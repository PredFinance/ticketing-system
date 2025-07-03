import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Get user statistics
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("status")
      .eq("organization_id", user!.organization_id)

    if (usersError) {
      console.error("Users fetch error:", usersError)
      return NextResponse.json({ message: "Failed to fetch user stats" }, { status: 500 })
    }

    const userStats = {
      total: users.length,
      pending: users.filter((u) => u.status === "pending").length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      suspended: users.filter((u) => u.status === "suspended").length,
    }

    // Get department statistics
    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select("is_active")
      .eq("organization_id", user!.organization_id)

    if (deptError) {
      console.error("Departments fetch error:", deptError)
      return NextResponse.json({ message: "Failed to fetch department stats" }, { status: 500 })
    }

    const departmentStats = {
      total: departments.length,
      active: departments.filter((d) => d.is_active).length,
      inactive: departments.filter((d) => !d.is_active).length,
    }

    // Get ticket statistics
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets")
      .select("status")
      .eq("organization_id", user!.organization_id)

    if (ticketsError) {
      console.error("Tickets fetch error:", ticketsError)
      return NextResponse.json({ message: "Failed to fetch ticket stats" }, { status: 500 })
    }

    const ticketStats = {
      total: tickets.length,
      open: tickets.filter((t) => t.status === "open").length,
      in_progress: tickets.filter((t) => t.status === "in_progress").length,
      pending: tickets.filter((t) => t.status === "pending").length,
      resolved: tickets.filter((t) => t.status === "resolved").length,
      closed: tickets.filter((t) => t.status === "closed").length,
    }

    // Get category statistics
    const { data: categories, error: categoriesError } = await supabase
      .from("ticket_categories")
      .select("is_active")
      .eq("organization_id", user!.organization_id)

    if (categoriesError) {
      console.error("Categories fetch error:", categoriesError)
      return NextResponse.json({ message: "Failed to fetch category stats" }, { status: 500 })
    }

    const categoryStats = {
      total: categories.length,
      active: categories.filter((c) => c.is_active).length,
    }

    return NextResponse.json({
      users: userStats,
      departments: departmentStats,
      tickets: ticketStats,
      categories: categoryStats,
    })
  } catch (error) {
    console.error("Admin stats API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
