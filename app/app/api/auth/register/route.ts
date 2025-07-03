import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, departmentId } = await request.json()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Auth creation error:", authError)
      return NextResponse.json({ message: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ message: "Failed to create user" }, { status: 500 })
    }

    // Get default organization
    const { data: organization } = await supabaseAdmin.from("organizations").select("id").limit(1).single()

    if (!organization) {
      return NextResponse.json({ message: "No organization found" }, { status: 500 })
    }

    // Create user profile in our users table
   const { data: newUser, error: profileError } = await supabaseAdmin
  .from("users")
  .insert({
    auth_user_id: authData.user.id,
    organization_id: organization.id,
    department_id: departmentId ? Number(departmentId) : null, // <-- use departmentId
    email,
    first_name: firstName,
    last_name: lastName,
    role: "user",
    status: "pending",
    email_verified: true,
  })
  .select()
  .single()

    if (profileError) {
      console.error("Profile creation error:", profileError)
      // Clean up auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ message: "Failed to create user profile" }, { status: 500 })
    }

    return NextResponse.json({ message: "Registration successful. Please wait for admin approval." }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
