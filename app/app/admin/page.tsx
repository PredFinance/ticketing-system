"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Building2,
  Ticket,
  Settings,
  BarChart3,
  Shield,
  Bell,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react"
import { AdminUserManagement } from "@/components/admin/user-management"
import { AdminDepartmentManagement } from "@/components/admin/department-management"
import { AdminTicketManagement } from "@/components/admin/ticket-management"
import { AdminSystemSettings } from "@/components/admin/system-settings"
import { AdminOrganizationSettings } from "@/components/admin/organization-settings"
import { AdminAnalytics } from "@/components/admin/analytics"
import toast from "react-hot-toast"

interface AdminStats {
  users: {
    total: number
    pending: number
    active: number
    inactive: number
    suspended: number
  }
  departments: {
    total: number
    active: number
    inactive: number
  }
  tickets: {
    total: number
    open: number
    in_progress: number
    pending: number
    resolved: number
    closed: number
  }
  categories: {
    total: number
    active: number
  }
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user && user.role !== "admin") {
      router.push("/dashboard")
      toast.error("Access denied. Administrator privileges required.")
    } else if (user) {
      fetchStats()
    }
  }, [user, loading, router])

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        toast.error("Failed to load admin statistics")
      }
    } catch (error) {
      toast.error("Failed to load admin statistics")
    } finally {
      setLoadingStats(false)
    }
  }

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load dashboard data</p>
          <Button onClick={fetchStats} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-red-100 text-red-600">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-red-600 font-medium">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">System Overview</h2>
                <p className="text-gray-600">Monitor your organization's support system performance</p>
              </div>
              <Button onClick={fetchStats} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="card-3d card-shadow-3d animate-slide-up">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.users.total}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-green-100 text-green-800 text-xs">{stats.users.active} active</Badge>
                        {stats.users.pending > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs">{stats.users.pending} pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Departments</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.departments.total}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-green-100 text-green-800 text-xs">{stats.departments.active} active</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Ticket className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.tickets.total}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className="bg-blue-100 text-blue-800 text-xs">{stats.tickets.open} open</Badge>
                        <Badge className="bg-green-100 text-green-800 text-xs">{stats.tickets.resolved} resolved</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.3s" }}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.tickets.total > 0 ? Math.round((stats.tickets.resolved / stats.tickets.total) * 100) : 0}
                        %
                      </p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600">Good performance</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={() => setActiveTab("users")} variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users ({stats.users.pending} pending approval)
                  </Button>
                  <Button
                    onClick={() => setActiveTab("departments")}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Manage Departments
                  </Button>
                  <Button onClick={() => setActiveTab("tickets")} variant="outline" className="w-full justify-start">
                    <Ticket className="w-4 h-4 mr-2" />
                    Review Tickets ({stats.tickets.open} open)
                  </Button>
                  <Button onClick={() => setActiveTab("settings")} variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    System Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Current system status and alerts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-900">System Status</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Operational</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-900">Response Time</span>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Good</Badge>
                  </div>

                  {stats.users.pending > 0 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-5 h-5 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-900">Pending Approvals</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">{stats.users.pending}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUserManagement />
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <AdminDepartmentManagement />
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <AdminTicketManagement />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Tabs defaultValue="system" className="space-y-6">
              <TabsList>
                <TabsTrigger value="system">System Settings</TabsTrigger>
                <TabsTrigger value="organization">Organization</TabsTrigger>
              </TabsList>

              <TabsContent value="system">
                <AdminSystemSettings />
              </TabsContent>

              <TabsContent value="organization">
                <AdminOrganizationSettings />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
