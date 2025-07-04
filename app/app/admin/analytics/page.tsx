import type { Metadata } from "next"
import ProtectedRoute from "@/components/auth/protected-route"
import DashboardLayout from "@/components/layout/dashboard-layout"
import AnalyticsDashboard from "@/components/admin/analytics-dashboard"

export const metadata: Metadata = {
  title: "Analytics | Admin Dashboard",
  description: "System analytics, metrics, and performance insights",
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <DashboardLayout>
        <AnalyticsDashboard />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
