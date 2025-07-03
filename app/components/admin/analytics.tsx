"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, Ticket, Clock, CheckCircle, RefreshCw, Download } from "lucide-react"
import toast from "react-hot-toast"

interface AnalyticsData {
  overview: {
    totalTickets: number
    totalUsers: number
    totalDepartments: number
    avgResolutionTime: number
    ticketGrowth: number
    userGrowth: number
    resolutionRate: number
  }
  ticketsByStatus: Array<{
    status: string
    count: number
    percentage: number
  }>
  ticketsByPriority: Array<{
    priority: string
    count: number
    percentage: number
  }>
  ticketsByDepartment: Array<{
    department: string
    count: number
    resolved: number
    avgResolutionTime: number
  }>
  userActivity: Array<{
    date: string
    newUsers: number
    activeUsers: number
    newTickets: number
    resolvedTickets: number
  }>
  topPerformers: Array<{
    user: {
      name: string
      email: string
      avatar_url?: string
    }
    ticketsResolved: number
    avgResolutionTime: number
    rating: number
  }>
}

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("30d")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange, departmentFilter])

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams({
        timeRange,
        department: departmentFilter,
      })

      const response = await fetch(`/api/admin/analytics?${params}`, { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      } else {
        toast.error("Failed to load analytics")
      }
    } catch (error) {
      toast.error("Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }

  const exportAnalytics = () => {
    if (!analytics) return

    const csvContent = [
      ["Metric", "Value"],
      ["Total Tickets", analytics.overview.totalTickets.toString()],
      ["Total Users", analytics.overview.totalUsers.toString()],
      ["Resolution Rate", `${analytics.overview.resolutionRate}%`],
      ["Avg Resolution Time", `${analytics.overview.avgResolutionTime} hours`],
      ["Ticket Growth", `${analytics.overview.ticketGrowth}%`],
      ["User Growth", `${analytics.overview.userGrowth}%`],
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner mr-2"></div>
        <span>Loading analytics...</span>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600">System performance insights and metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-3d card-shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Ticket className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalTickets}</p>
                <div className="flex items-center mt-1">
                  {analytics.overview.ticketGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={`text-sm ${analytics.overview.ticketGrowth >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {Math.abs(analytics.overview.ticketGrowth)}%
                  </span>
                </div>
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
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.resolutionRate}%</p>
                <p className="text-sm text-gray-500">of all tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-3d card-shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.avgResolutionTime}h</p>
                <p className="text-sm text-gray-500">average hours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-3d card-shadow-3d">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalUsers}</p>
                <div className="flex items-center mt-1">
                  {analytics.overview.userGrowth >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                  )}
                  <span className={`text-sm ${analytics.overview.userGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {Math.abs(analytics.overview.userGrowth)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Status</CardTitle>
            <CardDescription>Distribution of tickets across different statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.ticketsByStatus.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(item.status)}>{item.status.replace("_", " ")}</Badge>
                    <span className="text-sm text-gray-600">{item.count} tickets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-10 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tickets by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Tickets by Priority</CardTitle>
            <CardDescription>Distribution of tickets by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.ticketsByPriority.map((item) => (
                <div key={item.priority} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                    <span className="text-sm text-gray-600">{item.count} tickets</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${item.percentage}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-10 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
          <CardDescription>Ticket volume and resolution metrics by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.ticketsByDepartment.map((dept) => (
              <div key={dept.department} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{dept.department}</h3>
                  <Badge variant="outline">{dept.count} total tickets</Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Resolved:</span>
                    <p className="font-medium text-green-600">{dept.resolved} tickets</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Resolution Rate:</span>
                    <p className="font-medium">
                      {dept.count > 0 ? Math.round((dept.resolved / dept.count) * 100) : 0}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Resolution Time:</span>
                    <p className="font-medium">{dept.avgResolutionTime}h</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${dept.count > 0 ? (dept.resolved / dept.count) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Users with highest ticket resolution rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topPerformers.map((performer, index) => (
              <div key={performer.user.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{performer.user.name}</p>
                    <p className="text-sm text-gray-600">{performer.user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{performer.ticketsResolved} resolved</p>
                  <p className="text-sm text-gray-600">{performer.avgResolutionTime}h avg time</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
