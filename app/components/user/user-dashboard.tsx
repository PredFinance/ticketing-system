"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Ticket, Plus, CheckCircle, MessageSquare, TrendingUp, Building, AlertTriangle } from "lucide-react"
import StatsCard from "@/components/dashboard/stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"

export default function UserDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    myTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    departmentTickets: 0,
  })
  const [recentTickets, setRecentTickets] = useState([])
  const [userDepartments, setUserDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      if (!profile?.id) return

      // Fetch user's departments
      const { data: userDepts } = await supabase
        .from("user_departments")
        .select(`
          departments (
            id,
            name,
            color
          )
        `)
        .eq("user_id", profile.id)

      if (userDepts) {
        setUserDepartments(userDepts.map((ud) => ud.departments))
      }

      // Fetch user's tickets
      const { data: myTickets } = await supabase
        .from("tickets")
        .select("*")
        .eq("created_by", profile.id)
        .order("created_at", { ascending: false })
        .limit(5)

      // Fetch department tickets (public ones)
      const departmentIds = userDepts?.map((ud) => ud.departments.id) || []
      const { data: deptTickets } = await supabase
        .from("tickets")
        .select("*")
        .in("department_id", departmentIds)
        .eq("visibility", "public")

      setStats({
        myTickets: myTickets?.length || 0,
        openTickets: myTickets?.filter((t) => t.status === "open").length || 0,
        resolvedTickets: myTickets?.filter((t) => t.status === "resolved").length || 0,
        departmentTickets: deptTickets?.length || 0,
      })

      setRecentTickets(myTickets || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
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
          <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.full_name}! Track your tickets and collaborate with your team.
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          {userDepartments.map((dept: any, index) => (
            <div key={index} className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-full">
              <Building className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">{dept.name}</span>
            </div>
          ))}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => router.push("/user/tickets/create")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="My Tickets"
          value={stats.myTickets}
          change="Total created"
          changeType="neutral"
          icon={Ticket}
          color="purple"
        />
        <StatsCard
          title="Open Tickets"
          value={stats.openTickets}
          change="Awaiting response"
          changeType="neutral"
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolvedTickets}
          change="Successfully closed"
          changeType="increase"
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Department Tickets"
          value={stats.departmentTickets}
          change="Available to contribute"
          changeType="neutral"
          icon={MessageSquare}
          color="blue"
        />
      </div>

      {/* Recent Tickets & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">My Recent Tickets</CardTitle>
              <CardDescription>Your latest ticket submissions and updates</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTickets.length > 0 ? (
                <div className="space-y-4">
                  {recentTickets.map((ticket: any, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/user/tickets/${ticket.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{ticket.title}</p>
                          <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {ticket.ticket_number} • {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No tickets created yet</p>
                  <Button
                    onClick={() => router.push("/user/tickets/create")}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Ticket
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/user/tickets/create")}
                className="w-full flex items-center justify-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Create New Ticket</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/user/tickets")}
                className="w-full flex items-center justify-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Ticket className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">View All My Tickets</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/user/department")}
                className="w-full flex items-center justify-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Department Collaboration</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">My Statistics</span>
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
