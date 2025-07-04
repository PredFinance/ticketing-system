"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp,
  Users,
  Ticket,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import toast from "react-hot-toast"

export default function AnalyticsDashboard() {
  const { profile } = useAuth()
  const [analytics, setAnalytics] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: 0,
    ticketsByPriority: {},
    ticketsByDepartment: {},
    ticketsByStatus: {},
    recentActivity: [],
    userStats: {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30")
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      if (!profile?.organization_id) return

      const dateFilter = new Date()
      dateFilter.setDate(dateFilter.getDate() - Number.parseInt(timeRange))

      // Fetch tickets data
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select(`
          *,
          departments (name),
          user_profiles (full_name)
        `)
        .eq("organization_id", profile.organization_id)
        .gte("created_at", dateFilter.toISOString())

      if (ticketsError) throw ticketsError

      // Fetch users data
      const { data: users, error: usersError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("organization_id", profile.organization_id)

      if (usersError) throw usersError

      // Process tickets data
      const ticketList = tickets || []
      const userList = users || []

      // Calculate resolution time
      const resolvedTickets = ticketList.filter((t) => t.resolved_at)
      const avgResolutionTime =
        resolvedTickets.length > 0
          ? resolvedTickets.reduce((acc, ticket) => {
              const created = new Date(ticket.created_at)
              const resolved = new Date(ticket.resolved_at)
              return acc + (resolved.getTime() - created.getTime())
            }, 0) /
            resolvedTickets.length /
            (1000 * 60 * 60 * 24) // Convert to days
          : 0

      // Group tickets by priority
      const ticketsByPriority = ticketList.reduce((acc: any, ticket) => {
        acc[ticket.priority] = (acc[ticket.priority] || 0) + 1
        return acc
      }, {})

      // Group tickets by department
      const ticketsByDepartment = ticketList.reduce((acc: any, ticket) => {
        const deptName = ticket.departments?.name || "Unassigned"
        acc[deptName] = (acc[deptName] || 0) + 1
        return acc
      }, {})

      // Group tickets by status
      const ticketsByStatus = ticketList.reduce((acc: any, ticket) => {
        acc[ticket.status] = (acc[ticket.status] || 0) + 1
        return acc
      }, {})

      // Calculate user stats
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const newUsersThisMonth = userList.filter((user) => new Date(user.created_at) >= thirtyDaysAgo).length

      setAnalytics({
        totalTickets: ticketList.length,
        openTickets: ticketList.filter((t) => t.status === "open").length,
        resolvedTickets: ticketList.filter((t) => t.status === "resolved").length,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        ticketsByPriority,
        ticketsByDepartment,
        ticketsByStatus,
        recentActivity: ticketList.slice(0, 10),
        userStats: {
          totalUsers: userList.length,
          activeUsers: userList.filter((u) => u.is_approved).length,
          newUsersThisMonth,
        },
      })
    } catch (error: any) {
      toast.error("Failed to load analytics")
      console.error("Analytics error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500"
      case "in_progress":
        return "bg-yellow-500"
      case "resolved":
        return "bg-green-500"
      case "closed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">System performance and insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Total Tickets</p>
                  <p className="text-3xl font-bold">{analytics.totalTickets}</p>
                </div>
                <Ticket className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Open Tickets</p>
                  <p className="text-3xl font-bold">{analytics.openTickets}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Resolved</p>
                  <p className="text-3xl font-bold">{analytics.resolvedTickets}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Avg Resolution</p>
                  <p className="text-3xl font-bold">{analytics.avgResolutionTime}d</p>
                </div>
                <Clock className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Priority */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Tickets by Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.ticketsByPriority).map(([priority, count]: [string, any]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(priority)}`} />
                      <span className="capitalize font-medium">{priority}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">{count}</span>
                      <span className="text-sm text-gray-500">
                        ({Math.round((count / analytics.totalTickets) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tickets by Department */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Tickets by Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.ticketsByDepartment).map(([dept, count]: [string, any]) => (
                  <div key={dept} className="flex items-center justify-between">
                    <span className="font-medium">{dept}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${(count / analytics.totalTickets) * 100}%` }}
                        />
                      </div>
                      <span className="font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Status Overview & User Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Ticket Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(analytics.ticketsByStatus).map(([status, count]: [string, any]) => (
                  <div key={status} className="text-center p-4 rounded-lg border">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(status)} mx-auto mb-2`} />
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-gray-600 capitalize">{status.replace("_", " ")}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Statistics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">Total Users</p>
                    <p className="text-sm text-blue-600">Registered accounts</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{analytics.userStats.totalUsers}</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-900">Active Users</p>
                    <p className="text-sm text-green-600">Approved accounts</p>
                  </div>
                  <p className="text-2xl font-bold text-green-700">{analytics.userStats.activeUsers}</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-purple-900">New This Month</p>
                    <p className="text-sm text-purple-600">Recent registrations</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-purple-700">{analytics.userStats.newUsersThisMonth}</p>
                    {analytics.userStats.newUsersThisMonth > 0 && <TrendingUp className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Recent Ticket Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 5).map((ticket: any) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getPriorityColor(ticket.priority)} text-white`}>{ticket.priority}</Badge>
                    <div>
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-sm text-gray-600">
                        by {ticket.user_profiles?.full_name} • {ticket.departments?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getStatusColor(ticket.status)} text-white`}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
