import DashboardLayout from "@/components/layout/dashboard-layout"
import TicketDetail from "@/components/tickets/ticket-detail"

interface PageProps {
  params: {
    id: string
  }
}

export default function UserTicketDetailPage({ params }: PageProps) {
  return (
    <DashboardLayout allowedRoles={["user"]}>
      <TicketDetail ticketId={params.id} userRole="user" />
    </DashboardLayout>
  )
}
