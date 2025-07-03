"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Users, Ticket, Clock, CheckCircle, AlertCircle, BarChart3, Search, Eye } from "lucide-react"
import toast from "react-hot-toast"

interface SupervisorStats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  unassignedTickets: number
  teamMembers: number
}

interface TicketData {
  id: number
  ticket_number: string
  title: string
  status: string
  priority: string
  created_at: string
  creator: { first_name: string; last_name: string }
  assignee?: { first_name: string; last_name: string }
  category?: { name: string; color: string }
}

interface TeamMember {
  id: number
  first_name: string
  last_name: string
  email: string
  status: string
  role: string
}

export default function SupervisorDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<SupervisorStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    unassignedTickets: 0,
    teamMembers: 0,
  })
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user && user.role !== "supervisor") {
      router.push("/dashboard")
      toast.error("Access denied. Supervisor privileges required.")
    } else if (user) {
      fetchSupervisorData()
    }
  }, [user, loading, router])

  const fetchSupervisorData = async () => {
    try {
      // Fetch tickets for supervisor's department
      const ticketsResponse = await fetch("/api/tickets", { credentials: "include" })
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        setTickets(ticketsData)

        // Calculate stats
        const stats = {
          totalTickets: ticketsData.length,
          openTickets: ticketsData.filter((t: TicketData) => t.status === "open").length,
          inProgressTickets: ticketsData.filter((t: TicketData) => t.status === "in_progress").length,
          resolvedTickets: ticketsData.filter((t: TicketData) => t.status === "resolved").length,
          unassignedTickets: ticketsData.filter((t: TicketData) => !t.assignee).length,
          teamMembers: 0, // Will be updated when we fetch team members
        }
        setStats(stats)
      }

      // Fetch team members (users in the same department)
      const usersResponse = await fetch("/api/admin/users", { credentials: "include" })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        const departmentMembers = usersData.filter(
          (u: any) => u.department_id === user?.departmentId && u.status === "active",
        )
        setTeamMembers(departmentMembers)
        setStats((prev) => ({ ...prev, teamMembers: departmentMembers.length }))
      }
    } catch (error) {
      toast.error("Failed to load supervisor data")
    } finally {
      setLoadingData(false)
    }
  }

  const assignTicket = async (ticketNumber: string, userId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ assigned_to: Number.parseInt(userId) }),
      })

      if (response.ok) {
        toast.success("Ticket assigned successfully")
        fetchSupervisorData()
      } else {
        toast.error("Failed to assign ticket")
      }
    } catch (error) {
      toast.error("Failed to assign ticket")
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supervisor dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Supervisor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-blue-600 font-medium">Supervisor</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Department Management</h2>
          <p className="text-gray-600">Manage your team's tickets and monitor department performance.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="card-3d card-shadow-3d animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unassigned</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unassignedTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.teamMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Supervisor Tabs */}
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets">Ticket Management</TabsTrigger>
            <TabsTrigger value="team">Team Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Ticket className="w-5 h-5 mr-2 text-blue-600" />
                      Department Tickets ({filteredTickets.length})
                    </CardTitle>
                    <CardDescription>Manage and assign tickets within your department</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900">{ticket.ticket_number}</h3>
                            <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace("_", " ")}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                            {ticket.category && (
                              <>
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: ticket.category.color }}
                                />
                                <span className="text-sm text-gray-600">{ticket.category.name}</span>
                              </>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium mb-1">{ticket.title}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              Created by {ticket.creator.first_name} {ticket.creator.last_name}
                            </span>
                            <span>{formatDate(ticket.created_at)}</span>
                            {ticket.assignee && (
                              <span>
                                Assigned to {ticket.assignee.first_name} {ticket.assignee.last_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!ticket.assignee && (
                            <Select onValueChange={(userId) => assignTicket(ticket.ticket_number, userId)}>
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Assign to..." />
                              </SelectTrigger>
                              <SelectContent>
                                {teamMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id.toString()}>
                                    {member.first_name} {member.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/tickets/${ticket.ticket_number}`)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  Team Members ({stats.teamMembers})
                </CardTitle>
                <CardDescription>Manage your department team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gray-100 text-gray-600">
                            {member.first_name[0]}
                            {member.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {member.first_name} {member.last_name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{member.email}</span>
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={member.status === "active" ? "status-resolved" : "status-pending"}>
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-3d card-shadow-3d">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-3d card-shadow-3d">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">In Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.inProgressTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-3d card-shadow-3d">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Resolved</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-3d card-shadow-3d">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalTickets > 0 ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
