import DashboardLayout from "@/components/layout/dashboard-layout"
import TicketDetail from "@/components/tickets/ticket-detail"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserTicketDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <DashboardLayout allowedRoles={["user"]}>
      <TicketDetail ticketId={id} userRole="user" />
    </DashboardLayout>
  )
}
