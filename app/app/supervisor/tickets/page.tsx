import DashboardLayout from "@/components/layout/dashboard-layout"
import TicketList from "@/components/tickets/ticket-list"

export default function SupervisorTicketsPage() {
  return (
    <DashboardLayout allowedRoles={["supervisor"]}>
      <TicketList userRole="supervisor" showCreateButton={false} />
    </DashboardLayout>
  )
}
