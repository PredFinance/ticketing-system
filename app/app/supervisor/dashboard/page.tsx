import DashboardLayout from "@/components/layout/dashboard-layout"
import SupervisorDashboard from "@/components/supervisor/supervisor-dashboard"

export default function SupervisorDashboardPage() {
  return (
    <DashboardLayout allowedRoles={["supervisor"]}>
      <SupervisorDashboard />
    </DashboardLayout>
  )
}
