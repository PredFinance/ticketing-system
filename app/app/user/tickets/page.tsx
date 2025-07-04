import DashboardLayout from "@/components/layout/dashboard-layout"
import TicketList from "@/components/tickets/ticket-list"

export default function UserTicketsPage() {
  return (
    <DashboardLayout allowedRoles={["user"]}>
      <TicketList userRole="user" />
    </DashboardLayout>
  )
}
