import type { Metadata } from "next"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import DepartmentManagement from "@/components/admin/department-management"

export const metadata: Metadata = {
  title: "Department Management | Admin Dashboard",
  description: "Manage departments, assign users, and configure organizational structure",
}

export default function DepartmentsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <DepartmentManagement />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
