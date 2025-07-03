"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { PendingApproval } from "@/components/pending-approval"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Ticket, Plus, Clock, CheckCircle, AlertCircle, MessageSquare, Search, Filter, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import toast from "react-hot-toast"

interface TicketData {
  id: number
  ticket_number: string
  title: string
  status: "open" | "in_progress" | "pending" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  updated_at: string
  creator: { first_name: string; last_name: string }
  assignee?: { first_name: string; last_name: string }
  category?: { name: string; color: string }
  comments_count: Array<any>
}

interface DashboardStats {
  total: number
  open: number
  inProgress: number
  resolved: number
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [loadingTickets, setLoadingTickets] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      if (user.status === "pending") {
        setLoadingTickets(false)
        return
      }
      fetchDashboardData()
    }
  }, [user, loading, router])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/tickets", {
        credentials: "include",
      })

      if (response.ok) {
        const ticketsData = await response.json()
        setTickets(ticketsData)

        // Calculate stats from actual data
        const stats = {
          total: ticketsData.length,
          open: ticketsData.filter((t: TicketData) => t.status === "open").length,
          inProgress: ticketsData.filter((t: TicketData) => t.status === "in_progress").length,
          resolved: ticketsData.filter((t: TicketData) => t.status === "resolved").length,
        }
        setStats(stats)
      } else {
        toast.error("Failed to load dashboard data")
      }
    } catch (error) {
      toast.error("Failed to load dashboard data")
    } finally {
      setLoadingTickets(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "status-open"
      case "in_progress":
        return "status-in-progress"
      case "pending":
        return "status-pending"
      case "resolved":
        return "status-resolved"
      case "closed":
        return "status-closed"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "priority-low"
      case "medium":
        return "priority-medium"
      case "high":
        return "priority-high"
      case "urgent":
        return "priority-urgent"
      default:
        return "bg-gray-100 text-gray-700"
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

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.category?.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading || loadingTickets) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show pending approval screen if user status is pending
  if (user?.status === "pending") {
    return <PendingApproval />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-purple-100 text-purple-600">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {user?.firstName}!</h2>
          <p className="text-gray-600">Here's what's happening with your tickets today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-3d card-shadow-3d animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 animate-slide-up">
          <Button
            onClick={() => router.push("/tickets/create")}
            className="btn-3d bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Ticket
          </Button>
          <Button variant="outline" onClick={() => router.push("/tickets")} className="btn-3d">
            <Ticket className="w-4 h-4 mr-2" />
            View All Tickets
          </Button>
        </div>

        {/* Recent Tickets */}
        <Card className="card-shadow-3d animate-slide-up">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Your latest ticket activity and updates</CardDescription>
              </div>
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tickets found</p>
                  <Button
                    onClick={() => router.push("/tickets/create")}
                    className="mt-4 btn-3d bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Create Your First Ticket
                  </Button>
                </div>
              ) : (
                filteredTickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/tickets/${ticket.ticket_number}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Ticket className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900">{ticket.ticket_number}</p>
                          <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{ticket.title}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {ticket.category && <span>{ticket.category.name}</span>}
                          {ticket.assignee && (
                            <span>
                              Assigned to {ticket.assignee.first_name} {ticket.assignee.last_name}
                            </span>
                          )}
                          <span>Updated {formatDate(ticket.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {ticket.comments_count.length > 0 && (
                        <div className="flex items-center text-gray-500">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          <span className="text-sm">{ticket.comments_count.length}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
