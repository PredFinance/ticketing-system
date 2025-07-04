"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Ticket, Users, Clock, CheckCircle, AlertTriangle, TrendingUp, Building, FileText } from "lucide-react"
import StatsCard from "@/components/dashboard/stats-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import toast from "react-hot-toast"

export default function SupervisorDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    departmentTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    departmentUsers: 0,
    avgResolutionTime: "0 days",
  })
  const [departmentInfo, setDepartmentInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      console.log("Fetching supervisor dashboard data for profile:", profile)

      if (!profile?.id) {
        console.log("No profile ID found")
        setError("Profile not loaded")
        return
      }

      // Get supervisor's departments with better error handling
      const { data: userDepts, error: deptsError } = await supabase
        .from("user_departments")
        .select(`
          department_id,
          is_supervisor,
          departments (
            id,
            name,
            description
          )
        `)
        .eq("user_id", profile.id)

      console.log("User departments query result:", { userDepts, deptsError })

      if (deptsError) {
        console.error("Error fetching user departments:", deptsError)
        throw new Error(`Failed to fetch departments: ${deptsError.message}`)
      }

      if (!userDepts || userDepts.length === 0) {
        console.log("No departments found for user")
        setError("You are not assigned to any departments")
        return
      }

      // Filter for supervisor departments
      const supervisorDepts = userDepts.filter((ud) => ud.is_supervisor)

      if (supervisorDepts.length === 0) {
        console.log("User is not a supervisor of any departments")
        setError("You don't have supervisor access to any departments")
        return
      }

      const departmentIds = supervisorDepts.map((ud) => ud.department_id)
      const firstDept = supervisorDepts[0].departments

      console.log("Supervisor departments:", departmentIds)
      setDepartmentInfo(firstDept)

      // Fetch tickets for supervised departments with error handling
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("id, status, created_at, resolved_at")
        .in("department_id", departmentIds)

      console.log("Tickets query result:", { tickets, ticketsError })

      if (ticketsError) {
        console.error("Error fetching tickets:", ticketsError)
        // Don't throw here, just log and continue with empty data
        toast.error("Failed to load tickets data")
      }

      // Fetch users in supervised departments
      const { data: deptUsers, error: usersError } = await supabase
        .from("user_departments")
        .select("user_id")
        .in("department_id", departmentIds)

      console.log("Department users query result:", { deptUsers, usersError })

      if (usersError) {
        console.error("Error fetching department users:", usersError)
        toast.error("Failed to load users data")
      }

      // Calculate stats with fallbacks
      const ticketList = tickets || []
      const userList = deptUsers || []

      const newStats = {
        departmentTickets: ticketList.length,
        openTickets: ticketList.filter((t) => t.status === "open").length,
        resolvedTickets: ticketList.filter((t) => t.status === "resolved").length,
        departmentUsers: userList.length,
        avgResolutionTime: "2.5 days", // TODO: Calculate actual average
      }

      console.log("Calculated stats:", newStats)
      setStats(newStats)
      setError(null)
    } catch (error: any) {
      console.error("Error in fetchDashboardData:", error)
      setError(error.message || "Failed to load dashboard data")
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading supervisor dashboard...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Dashboard Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                fetchDashboardData()
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </CardContent>
        </Card>
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
          <h1 className="text-3xl font-bold text-gray-900">Supervisor Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Managing {departmentInfo?.name || "Department"} • Welcome back, {profile?.full_name}!
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-full">
            <Building className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">{departmentInfo?.name}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Department Tickets"
          value={stats.departmentTickets}
          change="+5% from last week"
          changeType="increase"
          icon={Ticket}
          color="purple"
        />
        <StatsCard
          title="Open Tickets"
          value={stats.openTickets}
          change={`${stats.resolvedTickets} resolved`}
          changeType="neutral"
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Team Members"
          value={stats.departmentUsers}
          change="Active users"
          changeType="increase"
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Avg Resolution"
          value={stats.avgResolutionTime}
          change="Below target"
          changeType="increase"
          icon={Clock}
          color="green"
        />
      </div>

      {/* Department Overview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Overview */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Department Overview</CardTitle>
              <CardDescription>{departmentInfo?.description || "Department statistics and insights"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-700">{stats.resolvedTickets}</p>
                  <p className="text-sm text-green-600">Resolved</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-700">{stats.openTickets}</p>
                  <p className="text-sm text-yellow-600">Pending</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Resolution Rate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.departmentTickets > 0
                      ? Math.round((stats.resolvedTickets / stats.departmentTickets) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${stats.departmentTickets > 0 ? (stats.resolvedTickets / stats.departmentTickets) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              <CardDescription>Common supervisory tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Ticket className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">Review Open Tickets</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">Manage Team</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Generate Reports</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">View Analytics</span>
              </motion.button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
