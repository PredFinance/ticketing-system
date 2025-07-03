"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Building2, Ticket, Settings, BarChart3, Shield, Plus, Filter, Download, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

// Import admin components
import { AdminUserManagement } from "@/components/admin/user-management"
import { AdminDepartmentManagement } from "@/components/admin/department-management"
import { AdminTicketManagement } from "@/components/admin/ticket-management"
import { AdminSystemSettings } from "@/components/admin/system-settings"
import { AdminOrganizationSettings } from "@/components/admin/organization-settings"
import { AdminAnalytics } from "@/components/admin/analytics"

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
  const [stats, setStats] = useState<AdminStats>({
    users: { total: 0, pending: 0, active: 0, inactive: 0, suspended: 0 },
    departments: { total: 0, active: 0, inactive: 0 },
    tickets: { total: 0, open: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 },
    categories: { total: 0, active: 0 },
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user && user.role !== "admin") {
      router.push("/dashboard")
      toast.error("Access denied. Admin privileges required.")
    } else if (user) {
      fetchAdminStats()
    }
  }, [user, loading, router])

  const fetchAdminStats = async () => {
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

  const refreshStats = () => {
    setLoadingStats(true)
    fetchAdminStats()
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
              <h1 className="text-xl font-semibold text-gray-900">System Administration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={refreshStats}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
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
            <div className="mb-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">System Overview</h2>
              <p className="text-gray-600">Monitor and manage your entire ticketing system from here.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="card-3d card-shadow-3d animate-slide-up">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.users.total}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span className="text-orange-600">{stats.users.pending} pending</span>
                        <span className="text-green-600">{stats.users.active} active</span>
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
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span className="text-green-600">{stats.departments.active} active</span>
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
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span className="text-blue-600">{stats.tickets.open} open</span>
                        <span className="text-green-600">{stats.tickets.resolved} resolved</span>
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
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>Last 30 days</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="card-shadow-3d">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    User Management
                  </CardTitle>
                  <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("users")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New User
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("users")}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      View Pending Users ({stats.users.pending})
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow-3d">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-green-600" />
                    Department Management
                  </CardTitle>
                  <CardDescription>Organize departments and assign supervisors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("departments")}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Department
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("departments")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Assign Supervisors
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-shadow-3d">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-purple-600" />
                    System Settings
                  </CardTitle>
                  <CardDescription>Configure system-wide settings and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("settings")}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      General Settings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent"
                      onClick={() => setActiveTab("settings")}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Security Settings
                    </Button>
                  </div>
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
          <TabsContent value="settings">
            <div className="space-y-6">
              <AdminOrganizationSettings />
              <AdminSystemSettings />
            </div>
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
