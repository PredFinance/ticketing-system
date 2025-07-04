import DashboardLayout from "@/components/layout/dashboard-layout"
import SupervisorDepartment from "@/components/supervisor/supervisor-department"

export default function SupervisorDepartmentPage() {
  return (
    <DashboardLayout allowedRoles={["supervisor"]}>
      <SupervisorDepartment />
    </DashboardLayout>
  )
}
