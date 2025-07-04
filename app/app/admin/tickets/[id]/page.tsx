// @ts-nocheck
/* eslint-disable */
import DashboardLayout from "@/components/layout/dashboard-layout"
import TicketDetail from "@/components/tickets/ticket-detail"

interface PageProps {
  params: { id: string }
}

export default function AdminTicketDetailPage({ params }: PageProps) {
  return (
    <DashboardLayout allowedRoles={["admin"]}>
      <TicketDetail ticketId={params.id} userRole="admin" />
    </DashboardLayout>
  )
}
