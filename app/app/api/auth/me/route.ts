import { authenticateUser } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const { user, error } = await authenticateUser()

  if (error) return error

  return NextResponse.json({
    id: user!.id,
    email: user!.email,
    firstName: user!.first_name,
    lastName: user!.last_name,
    role: user!.role,
    status: user!.status,
    departmentId: user!.department_id,
    organizationId: user!.organization_id,
    avatarUrl: user!.avatar_url,
  })
}
