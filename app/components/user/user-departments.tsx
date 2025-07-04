"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Building, Users, MessageSquare, Ticket, Plus, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

interface DepartmentWithStats {
  id: number
  name: string
  description: string | null
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
  organization_id: number
  ticketCount: number
  memberCount: number
  recentTickets: any[]
}

export default function UserDepartments() {
  const { profile } = useAuth()
  const [departments, setDepartments] = useState<DepartmentWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchUserDepartments()
  }, [profile])

  const fetchUserDepartments = async () => {
    try {
      if (!profile?.id) return

      // Get user's departments
      const { data: userDepts, error: deptsError } = await supabase
        .from("user_departments")
        .select(`
          departments (
            id,
            name,
            description,
            color,
            is_active,
            created_at,
            updated_at,
            organization_id
          )
        `)
        .eq("user_id", profile.id)

      if (deptsError) throw deptsError

      const departmentList = userDepts?.map((ud: any) => ud.departments).filter(Boolean) || []

      // Get stats for each department
      const departmentsWithStats = await Promise.all(
        departmentList.map(async (dept: any) => {
          // Get ticket count
          const { data: tickets } = await supabase
            .from("tickets")
            .select("id, title, status, priority, created_at")
            .eq("department_id", dept.id)
            .eq("visibility", "public")
            .order("created_at", { ascending: false })
            .limit(5)

          // Get member count
          const { data: members } = await supabase.from("user_departments").select("id").eq("department_id", dept.id)

          return {
            ...dept,
            ticketCount: tickets?.length || 0,
            memberCount: members?.length || 0,
            recentTickets: tickets || [],
          }
        }),
      )

      setDepartments(departmentsWithStats)
    } catch (error) {
      console.error("Error fetching departments:", error)
      toast.error("Failed to load departments")
    } finally {
      setLoading(false)
    }
  }

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase()),
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
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading departments...</p>
        </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Department Collaboration</h1>
          <p className="text-gray-600 mt-1">Collaborate with your team members and view department activities</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => router.push("/user/tickets/create")}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Ticket
          </Button>
        </motion.div>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department, index) => (
          <motion.div
            key={department.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: department.color }} />
                    <CardTitle className="text-lg font-semibold text-gray-900">{department.name}</CardTitle>
                  </div>
                  <Building className="w-5 h-5 text-gray-400" />
                </div>
                <CardDescription className="text-sm text-gray-600">
                  {department.description || "No description available"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Ticket className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-blue-700">{department.ticketCount}</p>
                    <p className="text-xs text-blue-600">Active Tickets</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-lg font-bold text-green-700">{department.memberCount}</p>
                    <p className="text-xs text-green-600">Team Members</p>
                  </div>
                </div>

                {/* Recent Tickets */}
                {department.recentTickets.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {department.recentTickets.slice(0, 3).map((ticket: any) => (
                        <div
                          key={ticket.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs cursor-pointer hover:bg-gray-100"
                          onClick={() => router.push(`/user/tickets/${ticket.id}`)}
                        >
                          <span className="truncate flex-1 mr-2">{ticket.title}</span>
                          <div className="flex space-x-1">
                            <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                            <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => router.push(`/user/tickets?department=${department.id}`)}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    View Tickets
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
          <p className="text-gray-600">
            {searchTerm ? "Try adjusting your search terms" : "You haven't been assigned to any departments yet"}
          </p>
        </motion.div>
      )}
    </div>
  )
}
