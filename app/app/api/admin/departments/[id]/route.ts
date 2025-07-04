import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params

    const { data: department, error: deptError } = await supabase
      .from("departments")
      .select(`
        *,
        supervisor:users!departments_supervisor_id_fkey(id, first_name, last_name, email),
        users(id, first_name, last_name, email, role, status)
      `)
      .eq("id", id)
      .single()

    if (deptError) {
      console.error("Department fetch error:", deptError)
      return NextResponse.json({ message: "Department not found" }, { status: 404 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error("Department API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params
    const body = await request.json()

    const { data: department, error: updateError } = await supabase
      .from("departments")
      .update({
        name: body.name,
        description: body.description,
        supervisor_id: body.supervisor_id || null,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (updateError) {
      console.error("Department update error:", updateError)
      return NextResponse.json({ message: "Failed to update department" }, { status: 500 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error("Department update API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id } = await params

    // Check if department has users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id")
      .eq("department_id", id)
      .limit(1)

    if (usersError) {
      console.error("Users check error:", usersError)
      return NextResponse.json({ message: "Failed to check department users" }, { status: 500 })
    }

    if (users && users.length > 0) {
      return NextResponse.json({ message: "Cannot delete department with assigned users" }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from("departments")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("Department delete error:", deleteError)
      return NextResponse.json({ message: "Failed to delete department" }, { status: 500 })
    }

    return NextResponse.json({ message: "Department deleted successfully" })
  } catch (error) {
    console.error("Department delete API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
