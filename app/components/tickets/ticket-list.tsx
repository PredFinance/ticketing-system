"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, Filter, Plus, Eye, MessageSquare, Paperclip, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface TicketListProps {
  userRole: "admin" | "supervisor" | "user"
  showCreateButton?: boolean
}

export default function TicketList({ userRole, showCreateButton = true }: TicketListProps) {
  const { profile } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, priorityFilter])

  const fetchTickets = async () => {
    try {
      if (!profile?.id || !profile?.organization_id) return

      let query = supabase
        .from("tickets")
        .select(`
          *,
          user_profiles!tickets_created_by_fkey (
            full_name,
            avatar_url
          ),
          ticket_categories (
            name,
            color
          ),
          departments (
            name
          )
        `)
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false })

      // Apply role-based filtering
      switch (userRole) {
        case "user":
          // Users see their own tickets + public tickets from their departments
          const { data: userDepts } = await supabase
            .from("user_departments")
            .select("department_id")
            .eq("user_id", profile.id)

          const departmentIds = userDepts?.map((ud) => ud.department_id) || []

          query = query.or(
            `created_by.eq.${profile.id},and(department_id.in.(${departmentIds.join(",")}),visibility.eq.public)`,
          )
          break

        case "supervisor":
          // Supervisors see all tickets in their supervised departments
          const { data: supervisedDepts } = await supabase
            .from("user_departments")
            .select("department_id")
            .eq("user_id", profile.id)
            .eq("is_supervisor", true)

          const supervisedDepartmentIds = supervisedDepts?.map((ud) => ud.department_id) || []

          if (supervisedDepartmentIds.length > 0) {
            query = query.in("department_id", supervisedDepartmentIds)
          }
          break

        case "admin":
          // Admins see all tickets
          break
      }

      // Apply filters
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter)
      }

      const { data, error } = await query

      if (error) throw error

      setTickets(data || [])
    } catch (error: any) {
      toast.error("Failed to fetch tickets")
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTickets = tickets.filter(
    (ticket: any) =>
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
      case "reserved":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === "user" ? "My Tickets" : userRole === "supervisor" ? "Department Tickets" : "All Tickets"}
          </h2>
          <p className="text-gray-600">
            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""} found
          </p>
        </div>
        {showCreateButton && userRole === "user" && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => router.push("/user/tickets/create")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </motion.div>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map((ticket: any, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2 }}
            >
              <Card
                className="border-0 shadow-sm bg-white/80 backdrop-blur-sm cursor-pointer hover:shadow-md transition-all"
                onClick={() => router.push(`/${userRole}/tickets/${ticket.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{ticket.title}</h3>
                        <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                        <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="font-medium text-purple-600">{ticket.ticket_number}</span>
                        <span>•</span>
                        <span>{ticket.departments?.name}</span>
                        <span>•</span>
                        <span>by {ticket.user_profiles?.full_name}</span>
                        <span>•</span>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{ticket.description}</p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        {ticket.visibility === "public" && (
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3" />
                            <span>Public</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <MessageSquare className="w-3 h-3" />
                          <span>0 comments</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Paperclip className="w-3 h-3" />
                          <span>0 attachments</span>
                        </div>
                      </div>
                    </div>

                    {ticket.ticket_categories && (
                      <Badge
                        variant="outline"
                        className="ml-4"
                        style={{
                          borderColor: ticket.ticket_categories.color,
                          color: ticket.ticket_categories.color,
                        }}
                      >
                        {ticket.ticket_categories.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "No tickets have been created yet"}
              </p>
              {showCreateButton && userRole === "user" && (
                <Button
                  onClick={() => router.push("/user/tickets/create")}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Ticket
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
