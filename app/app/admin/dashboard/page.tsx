import DashboardLayout from "@/components/layout/dashboard-layout"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default function AdminDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <AdminDashboard />
    </DashboardLayout>
  )
}
