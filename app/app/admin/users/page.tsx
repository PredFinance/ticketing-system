import DashboardLayout from "@/components/layout/dashboard-layout"
import UserManagement from "@/components/admin/user-management"

export default function AdminUsersPage() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <UserManagement />
    </DashboardLayout>
  )
}
