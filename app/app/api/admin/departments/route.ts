import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    const { data: departments, error: deptError } = await supabase
      .from("departments")
      .select(`
        *,
        supervisor:users!departments_supervisor_id_fkey(first_name, last_name, email)
      `)
      .eq("organization_id", user!.organization_id)
      .order("created_at", { ascending: false })

    if (deptError) {
      console.error("Departments fetch error:", deptError)
      return NextResponse.json({ message: "Failed to fetch departments" }, { status: 500 })
    }

    return NextResponse.json(departments)
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

    const { data: department, error: createError } = await supabase
      .from("departments")
      .insert({
        organization_id: user!.organization_id,
        name,
        description,
        supervisor_id: supervisorId ? Number(supervisorId) : null, // Use integer ID
      })
      .select()
      .single()

    if (createError) {
      console.error("Department creation error:", createError)
      return NextResponse.json({ message: "Failed to create department" }, { status: 500 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error("Create department API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
