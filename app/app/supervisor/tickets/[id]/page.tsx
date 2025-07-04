import DashboardLayout from "@/components/layout/dashboard-layout"
import TicketDetail from "@/components/tickets/ticket-detail"

interface PageProps {
  params: {
    id: string
  }
}

export default function SupervisorTicketDetailPage({ params }: PageProps) {
  return (
    <DashboardLayout allowedRoles={["supervisor"]}>
      <TicketDetail ticketId={params.id} userRole="supervisor" />
    </DashboardLayout>
  )
}
