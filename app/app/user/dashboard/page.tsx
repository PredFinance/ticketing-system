import DashboardLayout from "@/components/layout/dashboard-layout"
import UserDashboard from "@/components/user/user-dashboard"

export default function UserDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["user"]}>
      <UserDashboard />
    </DashboardLayout>
  )
}
