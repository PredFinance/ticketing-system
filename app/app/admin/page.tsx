"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Shield,
  UserCheck,
  UserX,
  Search,
  Mail,
  Calendar,
  Building,
  Ticket,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Settings,
} from "lucide-react"
import toast from "react-hot-toast"

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
  department_id?: number
  created_at: string
  department?: { name: string }
}

interface Department {
  id: number
  name: string
  description: string
  supervisor_id?: number
  is_active: boolean
  created_at: string
  supervisor?: { first_name: string; last_name: string; email: string }
  user_count: Array<any>
}

interface SystemStats {
  users: {
    total: number
    pending: number
    active: number
    inactive: number
    suspended: number
  }
  tickets: {
    total: number
    open: number
    in_progress: number
    pending: number
    resolved: number
    closed: number
  }
}

export default function AdminDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [stats, setStats] = useState<SystemStats>({
    users: { total: 0, pending: 0, active: 0, inactive: 0, suspended: 0 },
    tickets: { total: 0, open: 0, in_progress: 0, pending: 0, resolved: 0, closed: 0 },
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loadingData, setLoadingData] = useState(true)
  const [newDepartment, setNewDepartment] = useState({ name: "", description: "", supervisorId: "" })
  const [showCreateDept, setShowCreateDept] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user && user.role !== "admin") {
      router.push("/dashboard")
      toast.error("Access denied. Admin privileges required.")
    } else if (user) {
      fetchAdminData()
    }
  }, [user, loading, router])

  const fetchAdminData = async () => {
    try {
      // Fetch stats
      const statsResponse = await fetch("/api/admin/stats", { credentials: "include" })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch users
      const usersResponse = await fetch("/api/admin/users", { credentials: "include" })
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData)
      }

      // Fetch departments
      const deptResponse = await fetch("/api/admin/departments", { credentials: "include" })
      if (deptResponse.ok) {
        const deptData = await deptResponse.json()
        setDepartments(deptData)
      }
    } catch (error) {
      toast.error("Failed to load admin data")
    } finally {
      setLoadingData(false)
    }
  }

  const handleUserApproval = async (userId: number, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        toast.success(`User ${action === "approve" ? "approved" : "rejected"} successfully`)
        fetchAdminData()
      } else {
        toast.error(`Failed to ${action} user`)
      }
    } catch (error) {
      toast.error(`Failed to ${action} user`)
    }
  }

  const createDepartment = async () => {
    if (!newDepartment.name.trim()) {
      toast.error("Department name is required")
      return
    }

    try {
      const response = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newDepartment.name,
          description: newDepartment.description,
          supervisorId: newDepartment.supervisorId || null,
        }),
      })

      if (response.ok) {
        toast.success("Department created successfully")
        setNewDepartment({ name: "", description: "", supervisorId: "" })
        setShowCreateDept(false)
        fetchAdminData()
      } else {
        toast.error("Failed to create department")
      }
    } catch (error) {
      toast.error("Failed to create department")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || user.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const pendingUsers = users.filter((user) => user.status === "pending")

  if (loading || loadingData) {
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
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
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
                <p className="text-red-600 font-medium">Super Admin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">System Administration</h2>
          <p className="text-gray-600">Manage users, monitor system performance, and configure settings.</p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.users.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.users.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-3d card-shadow-3d animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.tickets.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="tickets">Ticket Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Pending Approvals */}
            {pendingUsers.length > 0 && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 text-orange-600" />
                    Pending User Approvals ({pendingUsers.length})
                  </CardTitle>
                  <CardDescription>Review and approve new user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingUsers.map((pendingUser) => (
                      <div key={pendingUser.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-gray-100 text-gray-600">
                                {pendingUser.first_name[0]}
                                {pendingUser.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {pendingUser.first_name} {pendingUser.last_name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span className="flex items-center">
                                  <Mail className="w-4 h-4 mr-1" />
                                  {pendingUser.email}
                                </span>
                                {pendingUser.department && (
                                  <span className="flex items-center">
                                    <Building className="w-4 h-4 mr-1" />
                                    {pendingUser.department.name}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(pendingUser.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className="status-pending">Pending</Badge>
                            <Button
                              size="sm"
                              onClick={() => handleUserApproval(pendingUser.id, "approve")}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserApproval(pendingUser.id, "reject")}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Users */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>All Users ({users.length})</CardTitle>
                    <CardDescription>Manage all system users</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gray-100 text-gray-600">
                              {user.first_name[0]}
                              {user.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {user.first_name} {user.last_name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{user.email}</span>
                              <Badge variant="outline" className="text-xs">
                                {user.role}
                              </Badge>
                              {user.department && <span>{user.department.name}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={
                              user.status === "active"
                                ? "status-resolved"
                                : user.status === "pending"
                                  ? "status-pending"
                                  : "status-closed"
                            }
                          >
                            {user.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>System-wide Ticket Statistics</CardTitle>
                <CardDescription>Overview of all tickets in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.tickets.total}</p>
                    <p className="text-sm text-blue-600">Total</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{stats.tickets.open}</p>
                    <p className="text-sm text-orange-600">Open</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{stats.tickets.in_progress}</p>
                    <p className="text-sm text-yellow-600">In Progress</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stats.tickets.pending}</p>
                    <p className="text-sm text-purple-600">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.tickets.resolved}</p>
                    <p className="text-sm text-green-600">Resolved</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{stats.tickets.closed}</p>
                    <p className="text-sm text-gray-600">Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Department Management</CardTitle>
                    <CardDescription>Manage organizational departments and supervisors</CardDescription>
                  </div>
                  <Dialog open={showCreateDept} onOpenChange={setShowCreateDept}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Department
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Department</DialogTitle>
                        <DialogDescription>Add a new department to your organization</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Department Name</Label>
                          <Input
                            id="name"
                            value={newDepartment.name}
                            onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                            placeholder="Enter department name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newDepartment.description}
                            onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                            placeholder="Enter department description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="supervisor">Supervisor</Label>
                          <Select
                            value={newDepartment.supervisorId}
                            onValueChange={(value) => setNewDepartment({ ...newDepartment, supervisorId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select supervisor" />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter((u) => u.role === "supervisor" || u.role === "admin")
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id.toString()}>
                                    {user.first_name} {user.last_name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowCreateDept(false)}>
                            Cancel
                          </Button>
                          <Button onClick={createDepartment}>Create Department</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{dept.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                            {dept.supervisor && (
                              <span>
                                Supervisor: {dept.supervisor.first_name} {dept.supervisor.last_name}
                              </span>
                            )}
                            <span>{dept.user_count.length} members</span>
                            <span>Created {formatDate(dept.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={dept.is_active ? "status-resolved" : "status-closed"}>
                            {dept.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 bg-transparent">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  System Settings
                </CardTitle>
                <CardDescription>Configure system-wide settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">General Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Email Notifications</p>
                            <p className="text-sm text-gray-600">Send email notifications for ticket updates</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Auto Assignment</p>
                            <p className="text-sm text-gray-600">Automatically assign tickets to available users</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Security Settings</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Session Timeout</p>
                            <p className="text-sm text-gray-600">Configure user session timeout duration</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">Password Policy</p>
                            <p className="text-sm text-gray-600">Set password requirements and policies</p>
                          </div>
                          <Button variant="outline" size="sm">
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
