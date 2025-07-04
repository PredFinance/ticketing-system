import { requireAdmin } from "@/lib/auth"
import { createSupabaseServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()

    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", user!.organization_id)
      .single()

    if (orgError) {
      console.error("Organization fetch error:", orgError)
      return NextResponse.json({ message: "Failed to fetch organization" }, { status: 500 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Organization API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const { user, error } = await requireAdmin()
  if (error) return error

  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()

    const { data: organization, error: updateError } = await supabase
      .from("organizations")
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        logo_url: body.logo_url,
        primary_color: body.primary_color,
        secondary_color: body.secondary_color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user!.organization_id)
      .select()
      .single()

    if (updateError) {
      console.error("Organization update error:", updateError)
      return NextResponse.json({ message: "Failed to update organization" }, { status: 500 })
    }

    return NextResponse.json(organization)
  } catch (error) {
    console.error("Organization update API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
