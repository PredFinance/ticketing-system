import DashboardLayout from "@/components/layout/dashboard-layout"
import UserDepartments from "@/components/user/user-departments"

export default function UserDepartmentsPage() {
  return (
    <DashboardLayout allowedRoles={["user"]}>
      <UserDepartments />
    </DashboardLayout>
  )
}
