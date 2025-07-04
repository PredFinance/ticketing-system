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
import { Users, Ticket, Clock, CheckCircle, AlertCircle, BarChart3, Search, Eye, Building2 } from "lucide-react"
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
  const [departmentName, setDepartmentName] = useState<string>("")
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
      fetchDepartmentName()
    }
  }, [user, loading, router])

  const fetchSupervisorData = async () => {
    try {
      const ticketsResponse = await fetch("/api/tickets", { credentials: "include" })
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json()
        setTickets(ticketsData)

        const stats = {
          totalTickets: ticketsData.length,
          openTickets: ticketsData.filter((t: TicketData) => t.status === "open").length,
          inProgressTickets: ticketsData.filter((t: TicketData) => t.status === "in_progress").length,
          resolvedTickets: ticketsData.filter((t: TicketData) => t.status === "resolved").length,
          unassignedTickets: ticketsData.filter((t: TicketData) => !t.assignee).length,
          teamMembers: 0,
        }
        setStats(stats)
      }

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

  const fetchDepartmentName = async () => {
    if (!user?.departmentId) return
    try {
      const res = await fetch(`/api/departments`)
      if (res.ok) {
        const departments = await res.json()
        const dept = departments.find((d: any) => d.id === user.departmentId)
        setDepartmentName(dept?.name || "")
      }
    } catch {
      setDepartmentName("")
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

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter

    return matchesSearch && matchesStatus
  })

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading supervisor dashboard...</p>
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
            {/* Left side - Logo and Title */}
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Supervisor Dashboard</h1>
                {departmentName && (
                  <div className="flex items-center text-xs sm:text-sm text-blue-700 font-medium">
                    <Building2 className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{departmentName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - User info */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-sm min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-blue-600 font-medium">Supervisor</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Department Management</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your team's tickets and monitor department performance.
          </p>
        </div>

        {/* Stats Cards - Mobile Optimized Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
                  <Ticket className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-600 mb-1">Total Tickets</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-600 mb-1">Unassigned</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.unassignedTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2 sm:mb-0 sm:mr-3">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-600 mb-1">Team Members</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.teamMembers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tickets" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1">
            <TabsTrigger value="tickets" className="text-xs sm:text-sm py-2">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="team" className="text-xs sm:text-sm py-2">
              Team
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                  <div>
                    <CardTitle className="flex items-center text-lg">
                      <Ticket className="w-5 h-5 mr-2 text-blue-600" />
                      Department Tickets ({filteredTickets.length})
                    </CardTitle>
                    <CardDescription className="mt-1">Manage and assign tickets within your department</CardDescription>
                  </div>

                  {/* Search and Filter - Mobile Stacked */}
                  <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-full sm:w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-32">
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

              <CardContent className="pt-0">
                <div className="space-y-4">
                  {filteredTickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No tickets found matching your criteria</p>
                    </div>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        {/* Mobile-First Ticket Layout */}
                        <div className="space-y-3">
                          {/* Header with ticket number and badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{ticket.ticket_number}</h3>
                            <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace("_", " ")}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
                            {ticket.category && (
                              <div className="flex items-center space-x-1">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: ticket.category.color }}
                                />
                                <span className="text-xs text-gray-600">{ticket.category.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Title */}
                          <p className="text-gray-900 font-medium text-sm sm:text-base line-clamp-2">{ticket.title}</p>

                          {/* Metadata */}
                          <div className="flex flex-col space-y-1 text-xs text-gray-500">
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

                          {/* Actions */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                            {!ticket.assignee && (
                              <Select onValueChange={(userId) => assignTicket(ticket.ticket_number, userId)}>
                                <SelectTrigger className="w-full sm:w-40">
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
                              className="w-full sm:w-auto"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-green-600" />
                  Team Members ({stats.teamMembers})
                </CardTitle>
                <CardDescription>Manage your department team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No team members found</p>
                    </div>
                  ) : (
                    teamMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-3 sm:space-y-0"
                      >
                        <div className="flex items-center space-x-4 w-full sm:w-auto">
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarFallback className="bg-gray-100 text-gray-600">
                              {member.first_name[0]}
                              {member.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                              {member.first_name} {member.last_name}
                            </h3>
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs sm:text-sm text-gray-600">
                              <span className="truncate">{member.email}</span>
                              <Badge variant="outline" className="text-xs w-fit">
                                {member.role}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <Badge
                          className={`text-xs w-fit ${
                            member.status === "active"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                          }`}
                        >
                          {member.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-600 mb-1">Open Tickets</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-600 mb-1">In Progress</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.inProgressTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-600 mb-1">Resolved</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-600 mb-1">Resolution Rate</p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
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
