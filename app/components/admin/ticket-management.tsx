"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Eye,
  Trash2,
  MessageSquare,
  Clock,
  User,
  Building2,
  Flag,
  RefreshCw,
  Download,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface Ticket {
  id: number
  ticket_number: string
  title: string
  description: string
  status: "open" | "in_progress" | "pending" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "urgent"
  is_public_in_department: boolean
  allow_department_comments: boolean
  created_at: string
  updated_at: string
  due_date?: string
  creator: {
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
  assignee?: {
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
  category?: {
    name: string
    color: string
  }
  department?: {
    name: string
  }
  comments_count: number
}

interface Department {
  id: number
  name: string
}

interface Category {
  id: number
  name: string
  color: string
}

export function AdminTicketManagement() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [visibilityFilter, setVisibilityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTickets()
    fetchDepartments()
    fetchCategories()
  }, [])

  useEffect(() => {
    filterAndSortTickets()
  }, [
    tickets,
    searchTerm,
    statusFilter,
    priorityFilter,
    departmentFilter,
    categoryFilter,
    visibilityFilter,
    sortBy,
    sortOrder,
  ])

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/admin/tickets", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      } else {
        toast.error("Failed to load tickets")
      }
    } catch (error) {
      toast.error("Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error("Failed to load departments:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error("Failed to load categories:", error)
    }
  }

  const filterAndSortTickets = () => {
    const filtered = tickets.filter((ticket) => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter
      const matchesDepartment = departmentFilter === "all" || ticket.department?.name === departmentFilter
      const matchesCategory = categoryFilter === "all" || ticket.category?.name === categoryFilter
      const matchesVisibility =
        visibilityFilter === "all" ||
        (visibilityFilter === "public" && ticket.is_public_in_department) ||
        (visibilityFilter === "private" && !ticket.is_public_in_department)

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesCategory && matchesVisibility
      )
    })

    // Sort tickets
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Ticket]
      let bValue: any = b[sortBy as keyof Ticket]

      if (sortBy === "creator") {
        aValue = `${a.creator.first_name} ${a.creator.last_name}`
        bValue = `${b.creator.first_name} ${b.creator.last_name}`
      } else if (sortBy === "assignee") {
        aValue = a.assignee ? `${a.assignee.first_name} ${a.assignee.last_name}` : ""
        bValue = b.assignee ? `${b.assignee.first_name} ${b.assignee.last_name}` : ""
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    setFilteredTickets(filtered)
  }

  const handleTicketAction = async (ticketId: number, action: string, data?: any) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data || {}),
      })

      if (response.ok) {
        toast.success(`Ticket ${action} successful`)
        fetchTickets()
      } else {
        toast.error(`Failed to ${action} ticket`)
      }
    } catch (error) {
      toast.error(`Failed to ${action} ticket`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "pending":
        return "bg-purple-100 text-purple-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-800"
      case "medium":
        return "bg-blue-100 text-blue-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  const exportTickets = () => {
    const csvContent = [
      [
        "Ticket Number",
        "Title",
        "Status",
        "Priority",
        "Department",
        "Creator",
        "Assignee",
        "Created",
        "Visibility",
      ].join(","),
      ...filteredTickets.map((ticket) =>
        [
          ticket.ticket_number,
          `"${ticket.title}"`,
          ticket.status,
          ticket.priority,
          ticket.department?.name || "",
          `"${ticket.creator.first_name} ${ticket.creator.last_name}"`,
          ticket.assignee ? `"${ticket.assignee.first_name} ${ticket.assignee.last_name}"` : "",
          ticket.created_at,
          ticket.is_public_in_department ? "Public" : "Private",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `tickets-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner mr-2"></div>
        <span>Loading tickets...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ticket Management</h2>
          <p className="text-gray-600">Monitor and manage all system tickets</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchTickets}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportTickets}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
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
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={`${sortBy}-${sortOrder}`}
              onValueChange={(value) => {
                const [field, order] = value.split("-")
                setSortBy(field)
                setSortOrder(order as "asc" | "desc")
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                <SelectItem value="priority-desc">High Priority First</SelectItem>
                <SelectItem value="status-asc">Status A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredTickets.length} of {tickets.length} tickets
            </span>
            <div className="flex items-center space-x-4">
              <span>Public: {tickets.filter((t) => t.is_public_in_department).length}</span>
              <span>Private: {tickets.filter((t) => !t.is_public_in_department).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>All Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>System-wide ticket overview and management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/tickets/${ticket.ticket_number}`)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-gray-900">{ticket.ticket_number}</h3>
                    <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      <Flag className="w-3 h-3 mr-1" />
                      {ticket.priority}
                    </Badge>
                    {ticket.category && (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ticket.category.color }} />
                        <span className="text-sm text-gray-600">{ticket.category.name}</span>
                      </div>
                    )}
                    <Badge variant={ticket.is_public_in_department ? "default" : "secondary"}>
                      {ticket.is_public_in_department ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <p className="text-gray-900 font-medium mb-1">{ticket.title}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      {ticket.creator.first_name} {ticket.creator.last_name}
                    </span>
                    {ticket.assignee && (
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        Assigned to {ticket.assignee.first_name} {ticket.assignee.last_name}
                      </span>
                    )}
                    {ticket.department && (
                      <span className="flex items-center">
                        <Building2 className="w-3 h-3 mr-1" />
                        {ticket.department.name}
                      </span>
                    )}
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(ticket.created_at)}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {ticket.comments_count} comments
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/tickets/${ticket.ticket_number}`)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/tickets/${ticket.ticket_number}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, "assign")}>
                        <User className="w-4 h-4 mr-2" />
                        Reassign
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTicketAction(ticket.id, "change-priority")}>
                        <Flag className="w-4 h-4 mr-2" />
                        Change Priority
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleTicketAction(ticket.id, "toggle-visibility")}
                        className={ticket.is_public_in_department ? "text-orange-600" : "text-green-600"}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {ticket.is_public_in_department ? "Make Private" : "Make Public"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleTicketAction(ticket.id, "delete")}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Ticket
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
