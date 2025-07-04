import DashboardLayout from "@/components/layout/dashboard-layout"
import TicketList from "@/components/tickets/ticket-list"

export default function AdminTicketsPage() {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <TicketList userRole="admin" showCreateButton={false} />
    </DashboardLayout>
  )
}
