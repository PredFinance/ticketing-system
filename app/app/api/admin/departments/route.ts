import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Use a simpler query approach to avoid foreign key issues
    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select(`
        id,
        organization_id,
        name,
        description,
        supervisor_id,
        is_active,
        created_at,
        updated_at
      `)
      .eq("organization_id", user!.organization_id)
      .order("created_at", { ascending: false })

    if (deptError) {
      console.error("Departments fetch error:", deptError)
      return NextResponse.json({ message: "Failed to fetch departments" }, { status: 500 })
    }

    // Manually fetch supervisor and user count data
    const departmentsWithDetails = await Promise.all(
      departments.map(async (dept) => {
        // Get supervisor info if supervisor_id exists
        let supervisor = null
        if (dept.supervisor_id) {
          const { data: supervisorData } = await supabase
            .from("users")
            .select("first_name, last_name, email")
            .eq("id", dept.supervisor_id)
            .single()
          supervisor = supervisorData
        }

        // Get user count for this department
        const { count: userCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("department_id", dept.id)
          .eq("status", "active")

        return {
          ...dept,
          supervisor,
          user_count: Array(userCount || 0).fill(null), // Create array for compatibility
        }
      }),
    )

    return NextResponse.json(departmentsWithDetails)
  } catch (error) {
    console.error("Departments API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const { name, description, supervisorId } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Department name is required" }, { status: 400 })
    }

    // Validate supervisor exists if provided
    if (supervisorId) {
      const { data: supervisorExists } = await supabase
        .from("users")
        .select("id")
        .eq("id", supervisorId)
        .eq("organization_id", user!.organization_id)
        .single()

      if (!supervisorExists) {
        return NextResponse.json({ message: "Invalid supervisor selected" }, { status: 400 })
      }
    }

    const { data: department, error: deptError } = await supabase
      .from("departments")
      .insert({
        organization_id: user!.organization_id,
        name,
        description,
        supervisor_id: supervisorId ? Number(supervisorId) : null,
      })
      .select()
      .single()

    if (deptError) {
      console.error("Department creation error:", deptError)
      return NextResponse.json({ message: "Failed to create department" }, { status: 500 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error("Create department API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
