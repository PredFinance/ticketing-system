import DashboardLayout from "@/components/layout/dashboard-layout"
import CreateTicketForm from "@/components/tickets/create-ticket-form"

export default function CreateTicketPage() {
  return (
    <DashboardLayout allowedRoles={["user"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Ticket</h1>
          <p className="text-gray-600 mt-1">Submit a new complaint or issue for review</p>
        </div>
        <CreateTicketForm />
      </div>
    </DashboardLayout>
  )
}
