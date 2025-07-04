import { authenticateUser } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    // Get user profile with organization and department info
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select(`
        *,
        organization:organizations(*),
        department:departments(*)
      `)
      .eq("id", user!.id)
      .single()

    if (profileError) {
      console.error("Profile fetch error:", profileError)
      return NextResponse.json({ message: "Failed to fetch profile" }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { user, error } = await authenticateUser()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const updates = await request.json()

    // Only allow updating certain fields
    const allowedFields = ["first_name", "last_name", "phone"]
    const filteredUpdates = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as any)

    filteredUpdates.updated_at = new Date().toISOString()

    const { data: updatedProfile, error: updateError } = await supabase
      .from("users")
      .update(filteredUpdates)
      .eq("id", user!.id)
      .select(`
        *,
        organization:organizations(*),
        department:departments(*)
      `)
      .single()

    if (updateError) {
      console.error("Profile update error:", updateError)
      return NextResponse.json({ message: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error("Profile update API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
