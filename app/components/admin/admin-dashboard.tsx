"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Ticket, Building, TrendingUp, Clock, CheckCircle, AlertTriangle, Plus } from "lucide-react"
import StatsCard from "@/components/dashboard/stats-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalTickets: 0,
    openTickets: 0,
    totalDepartments: 0,
    resolvedTickets: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      if (!profile?.organization_id) return

      // Fetch user stats
      const { data: users } = await supabase
        .from("user_profiles")
        .select("id, is_approved")
        .eq("organization_id", profile.organization_id)

      // Fetch ticket stats
      const { data: tickets } = await supabase
        .from("tickets")
        .select("id, status")
        .eq("organization_id", profile.organization_id)

      // Fetch department stats
      const { data: departments } = await supabase
        .from("departments")
        .select("id")
        .eq("organization_id", profile.organization_id)

      setStats({
        totalUsers: users?.length || 0,
        pendingApprovals: users?.filter((u) => !u.is_approved).length || 0,
        totalTickets: tickets?.length || 0,
        openTickets: tickets?.filter((t) => t.status === "open").length || 0,
        resolvedTickets: tickets?.filter((t) => t.status === "resolved").length || 0,
        totalDepartments: departments?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {profile?.full_name}! Here's what's happening in your organization.
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          change="+12% from last month"
          changeType="increase"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          change={stats.pendingApprovals > 0 ? "Requires attention" : "All caught up"}
          changeType={stats.pendingApprovals > 0 ? "neutral" : "increase"}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Total Tickets"
          value={stats.totalTickets}
          change="+8% from last week"
          changeType="increase"
          icon={Ticket}
          color="purple"
        />
        <StatsCard
          title="Open Tickets"
          value={stats.openTickets}
          change={`${stats.resolvedTickets} resolved this week`}
          changeType="increase"
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Departments" value={stats.totalDepartments} icon={Building} color="green" />
        <StatsCard
          title="Resolution Rate"
          value={`${stats.totalTickets > 0 ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100) : 0}%`}
          change="Above target"
          changeType="increase"
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="System Health"
          value="Excellent"
          change="All systems operational"
          changeType="increase"
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
                <Users className="w-4 h-4 mr-3" />
                Approve Pending Users ({stats.pendingApprovals})
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
                <Building className="w-4 h-4 mr-3" />
                Manage Departments
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
                <Ticket className="w-4 h-4 mr-3" />
                View All Tickets
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 bg-transparent">
                <TrendingUp className="w-4 h-4 mr-3" />
                System Analytics
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "New user registration", user: "John Doe", time: "2 minutes ago", type: "user" },
                  { action: "Ticket resolved", user: "IT Department", time: "15 minutes ago", type: "ticket" },
                  { action: "Department created", user: "Admin", time: "1 hour ago", type: "department" },
                  { action: "User approved", user: "Jane Smith", time: "2 hours ago", type: "approval" },
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activity.type === "user"
                          ? "bg-blue-500"
                          : activity.type === "ticket"
                            ? "bg-green-500"
                            : activity.type === "department"
                              ? "bg-purple-500"
                              : "bg-yellow-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
