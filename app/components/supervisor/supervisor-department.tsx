"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Users,
  Ticket,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import type { UserProfile, TicketWithDetails } from "@/lib/supabase/database.types"

interface DepartmentMember extends UserProfile {
  is_supervisor: boolean
  can_assign_tickets: boolean
  joined_at: string
}

interface DepartmentStats {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  totalMembers: number
  avgResolutionTime: string
}

export default function SupervisorDepartment() {
  const { profile } = useAuth()
  const [department, setDepartment] = useState<any>(null)
  const [members, setMembers] = useState<DepartmentMember[]>([])
  const [tickets, setTickets] = useState<TicketWithDetails[]>([])
  const [stats, setStats] = useState<DepartmentStats>({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    totalMembers: 0,
    avgResolutionTime: "0 days",
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchDepartmentData()
  }, [profile])

  const fetchDepartmentData = async () => {
    try {
      if (!profile?.id) return

      // Get supervisor's department
      const { data: userDepts, error: deptsError } = await supabase
        .from("user_departments")
        .select(`
          department_id,
          is_supervisor,
          departments (
            id,
            name,
            description,
            color,
            organization_id
          )
        `)
        .eq("user_id", profile.id)
        .eq("is_supervisor", true)

      if (deptsError) throw deptsError

      if (!userDepts || userDepts.length === 0) {
        toast.error("You don't have supervisor access to any departments")
        return
      }

      const dept = userDepts[0].departments
      setDepartment(dept)

      // Fetch department members
      const { data: deptMembers, error: membersError } = await supabase
        .from("user_departments")
        .select(`
          is_supervisor,
          can_assign_tickets,
          joined_at,
          user_profiles (
            id,
            email,
            full_name,
            avatar_url,
            role,
            is_approved,
            last_login,
            is_online,
            created_at
          )
        `)
        .eq("department_id", dept.id)

      if (membersError) throw membersError

      const membersList =
        deptMembers?.map((dm: any) => ({
          ...dm.user_profiles,
          is_supervisor: dm.is_supervisor,
          can_assign_tickets: dm.can_assign_tickets,
          joined_at: dm.joined_at,
        })) || []

      setMembers(membersList)

      // Fetch department tickets
      const { data: deptTickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          *,
          user_profiles!tickets_created_by_fkey (
            full_name,
            email
          ),
          ticket_categories (
            name,
            color
          )
        `)
        .eq("department_id", dept.id)
        .order("created_at", { ascending: false })

      if (ticketsError) throw ticketsError

      setTickets(deptTickets || [])

      // Calculate stats
      const totalTickets = deptTickets?.length || 0
      const openTickets = deptTickets?.filter((t) => t.status === "open").length || 0
      const resolvedTickets = deptTickets?.filter((t) => t.status === "resolved").length || 0

      setStats({
        totalTickets,
        openTickets,
        resolvedTickets,
        totalMembers: membersList.length,
        avgResolutionTime: "2.5 days", // TODO: Calculate actual average
      })
    } catch (error) {
      console.error("Error fetching department data:", error)
      toast.error("Failed to load department data")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTicket = async (ticketId: number, userId: number) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          assigned_to: userId,
          assigned_by: profile?.id,
          status: "in_progress",
        })
        .eq("id", ticketId)

      if (error) throw error

      toast.success("Ticket assigned successfully")
      fetchDepartmentData()
    } catch (error) {
      console.error("Error assigning ticket:", error)
      toast.error("Failed to assign ticket")
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading department data...</p>
        </div>
      </div>
    )
  }

  if (!department) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Department Access</h3>
        <p className="text-gray-600">You don't have supervisor access to any departments.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600 mt-1">
            Managing {department.name} • {stats.totalMembers} members • {stats.totalTickets} tickets
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Button variant="outline">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
                </div>
                <Ticket className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-red-600">{stats.openTickets}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Members</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalMembers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Resolution</p>
                  <p className="text-2xl font-bold text-green-600">{stats.avgResolutionTime}</p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tickets */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Recent Tickets</CardTitle>
                  <CardDescription>Latest ticket submissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tickets.slice(0, 5).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => router.push(`/supervisor/tickets/${ticket.id}`)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                          <p className="text-xs text-gray-500">
                            {ticket.user_profiles?.full_name} • {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                          <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Team Performance */}
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                  <CardDescription>Department statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Resolution Rate</span>
                      <span className="text-sm font-medium">
                        {stats.totalTickets > 0 ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${stats.totalTickets > 0 ? (stats.resolvedTickets / stats.totalTickets) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-green-700">{stats.resolvedTickets}</p>
                        <p className="text-xs text-green-600">Resolved</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                        <p className="text-lg font-bold text-red-700">{stats.openTickets}</p>
                        <p className="text-xs text-red-600">Open</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>

            {/* Tickets List */}
            <div className="space-y-4">
              {tickets
                .filter(
                  (ticket) =>
                    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    ticket.description.toLowerCase().includes(searchTerm.toLowerCase()),
                )
                .map((ticket) => (
                  <Card key={ticket.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{ticket.title}</h3>
                            <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                            <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>#{ticket.ticket_number}</span>
                            <span>By {ticket.user_profiles?.full_name}</span>
                            <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/supervisor/tickets/${ticket.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Assign to Member</DropdownMenuItem>
                            <DropdownMenuItem>Change Status</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            {/* Members List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">
                          {member.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{member.full_name}</h3>
                        <p className="text-xs text-gray-500 truncate">{member.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={member.is_supervisor ? "default" : "secondary"}>
                            {member.is_supervisor ? "Supervisor" : "Member"}
                          </Badge>
                          {member.is_online && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      <p>Joined: {new Date(member.joined_at).toLocaleDateString()}</p>
                      {member.last_login && <p>Last login: {new Date(member.last_login).toLocaleDateString()}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
