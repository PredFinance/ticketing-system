"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ticket, Plus, Search, MessageSquare, Clock, User, Calendar, Eye, Paperclip } from "lucide-react"
import toast from "react-hot-toast"

interface TicketData {
  id: number
  ticket_number: string
  title: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  creator: { first_name: string; last_name: string }
  assignee?: { first_name: string; last_name: string }
  category?: { name: string; color: string }
  comments_count: Array<any>
  attachments?: Array<any>
}

export default function TicketsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [filteredTickets, setFilteredTickets] = useState<TicketData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [loadingTickets, setLoadingTickets] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      fetchTickets()
    }
  }, [user, loading, router])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, statusFilter, priorityFilter])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/tickets", { credentials: "include" })
      if (response.ok) {
        const ticketsData = await response.json()
        setTickets(ticketsData)
      } else {
        toast.error("Failed to load tickets")
      }
    } catch (error) {
      toast.error("Failed to load tickets")
    } finally {
      setLoadingTickets(false)
    }
  }

  const filterTickets = () => {
    let filtered = tickets

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.category?.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter)
    }

    setFilteredTickets(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 border-red-200"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "pending":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading || loadingTickets) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {user?.role === "admin"
                  ? "All Tickets"
                  : user?.role === "supervisor"
                    ? "Department Tickets"
                    : "My Tickets"}
              </h1>
            </div>
            <Button
              onClick={() => router.push("/tickets/create")}
              className="bg-purple-600 hover:bg-purple-700 text-white ml-4 flex-shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New Ticket</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Filters */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 rounded-lg border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 rounded-lg border-gray-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-10 rounded-lg border-gray-200">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets List */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
              <div>
                <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
                <CardDescription>
                  {user?.role === "admin"
                    ? "All tickets in the system"
                    : user?.role === "supervisor"
                      ? "Tickets in your department"
                      : "Your support tickets"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first support ticket to get started"}
                </p>
                <Button
                  onClick={() => router.push("/tickets/create")}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/tickets/${ticket.ticket_number}`)}
                  >
                    <div className="space-y-3">
                      {/* Header with badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{ticket.ticket_number}</h3>
                        <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                        {ticket.category && (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ticket.category.color }} />
                            <span className="text-xs text-gray-600">{ticket.category.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <p className="text-gray-900 font-medium text-sm sm:text-base line-clamp-2">{ticket.title}</p>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {formatDate(ticket.created_at)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Updated {formatDate(ticket.updated_at)}
                        </span>
                        <span className="flex items-center">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {ticket.creator.first_name} {ticket.creator.last_name}
                        </span>
                        {ticket.assignee && (
                          <span className="flex items-center">
                            Assigned to {ticket.assignee.first_name} {ticket.assignee.last_name}
                          </span>
                        )}
                        <span className="flex items-center">
                          <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {ticket.comments_count.length} comments
                        </span>
                        {ticket.attachments && ticket.attachments.length > 0 && (
                          <span className="flex items-center">
                            <Paperclip className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            {ticket.attachments.length} files
                          </span>
                        )}
                      </div>

                      {/* View button for mobile */}
                      <div className="flex justify-end pt-2 sm:hidden">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
