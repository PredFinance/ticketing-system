import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()

    // Use a simpler query to avoid foreign key issues
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        organization_id,
        department_id,
        email,
        first_name,
        last_name,
        phone,
        avatar_url,
        role,
        status,
        last_login,
        email_verified,
        created_at,
        updated_at,
        auth_user_id
      `)
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("Users fetch error:", usersError)
      return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 })
    }

    // Manually fetch department names for users
    const usersWithDepartments = await Promise.all(
      users.map(async (userData) => {
        let department = null
        if (userData.department_id) {
          const { data: deptData } = await supabase
            .from("departments")
            .select("name")
            .eq("id", userData.department_id)
            .single()
          department = deptData
        }

        return {
          ...userData,
          department,
        }
      }),
    )

    return NextResponse.json(usersWithDepartments)
  } catch (error) {
    console.error("Users API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
