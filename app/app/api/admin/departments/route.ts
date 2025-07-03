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
      .select("role, organization_id")
      .eq("auth_user_id", userData.user.id)
      .single()
    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 })
    }

    const { data: departments, error } = await supabase
      .from("departments")
      .select(`
        *,
        supervisor:users!departments_supervisor_id_fkey(first_name, last_name, email),
        user_count:users(count)
      `)
      .eq("organization_id", userProfile.organization_id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Departments fetch error:", error)
      return NextResponse.json({ message: "Failed to fetch departments" }, { status: 500 })
    }

    return NextResponse.json(departments)
  } catch (error) {
    console.error("Departments API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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
      .select("role, organization_id")
      .eq("auth_user_id", userData.user.id)
      .single()
    if (!userProfile || userProfile.role !== "admin") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 })
    }

    const { name, description, supervisorId } = await request.json()

    if (!name) {
      return NextResponse.json({ message: "Department name is required" }, { status: 400 })
    }

    const { data: department, error } = await supabase
      .from("departments")
      .insert({
        organization_id: userProfile.organization_id,
        name,
        description,
        supervisor_id: supervisorId || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Department creation error:", error)
      return NextResponse.json({ message: "Failed to create department" }, { status: 500 })
    }

    return NextResponse.json(department)
  } catch (error) {
    console.error("Create department API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
