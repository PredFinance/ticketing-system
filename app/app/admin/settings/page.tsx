import DashboardLayout from "@/components/layout/dashboard-layout"
import AdminSettings from "@/components/admin/admin-settings"

export default function AdminSettingsPage() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <AdminSettings />
    </DashboardLayout>
  )
}
