import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("id, role, organization_id")
      .eq("auth_user_id", user.id)
      .single()
    if (profileError || !userProfile) {
      return NextResponse.json({ message: "User profile not found" }, { status: 404 })
    }

    let query = supabase
      .from("tickets")
      .select(`
        *,
        category:ticket_categories(name, color),
        department:departments(name),
        creator:users!tickets_created_by_fkey(first_name, last_name),
        assignee:users!tickets_assigned_to_fkey(first_name, last_name),
        comments_count:ticket_comments(count)
      `)
      .eq("organization_id", userProfile.organization_id)

    // Filter based on user role
    if (userProfile.role === "user") {
      // Use the integer userProfile.id for created_by/assigned_to
      query = query.or(`created_by.eq.${userProfile.id},assigned_to.eq.${userProfile.id}`)
    }

    const { data: tickets, error: ticketsError } = await query.order("created_at", { ascending: false })

    if (ticketsError) {
      console.error("Tickets fetch error:", ticketsError)
      return NextResponse.json({ message: "Failed to fetch tickets" }, { status: 500 })
    }

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Tickets API error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
