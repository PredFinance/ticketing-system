"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Settings,
  Building2,
  MoreHorizontal,
  RefreshCw,
  Shield,
  Ticket,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import toast from "react-hot-toast"

interface Department {
  id: number
  name: string
  description?: string
  supervisor_id?: number
  is_active: boolean
  allow_public_tickets: boolean
  auto_assign_tickets: boolean
  created_at: string
  updated_at: string
  supervisor?: {
    first_name: string
    last_name: string
    email: string
    avatar_url?: string
  }
  user_count: number
  ticket_count: number
  active_tickets: number
}

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  avatar_url?: string
}

export function AdminDepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
  }, [])

  useEffect(() => {
    filterDepartments()
  }, [departments, searchTerm, statusFilter])

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      } else {
        toast.error("Failed to load departments")
      }
    } catch (error) {
      toast.error("Failed to load departments")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.filter((user: User) => user.role === "supervisor" || user.role === "admin"))
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    }
  }

  const filterDepartments = () => {
    const filtered = departments.filter((dept) => {
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && dept.is_active) ||
        (statusFilter === "inactive" && !dept.is_active)
      return matchesSearch && matchesStatus
    })
    setFilteredDepartments(filtered)
  }

  const handleCreateDepartment = async (data: any) => {
    try {
      const response = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Department created successfully")
        setShowCreateDialog(false)
        fetchDepartments()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to create department")
      }
    } catch (error) {
      toast.error("Failed to create department")
    }
  }

  const handleUpdateDepartment = async (id: number, data: any) => {
    try {
      const response = await fetch(`/api/admin/departments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Department updated successfully")
        setEditingDepartment(null)
        fetchDepartments()
      } else {
        toast.error("Failed to update department")
      }
    } catch (error) {
      toast.error("Failed to update department")
    }
  }

  const handleDeleteDepartment = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/departments/${id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (response.ok) {
        toast.success("Department deleted successfully")
        fetchDepartments()
      } else {
        toast.error("Failed to delete department")
      }
    } catch (error) {
      toast.error("Failed to delete department")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner mr-2"></div>
        <span>Loading departments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
          <p className="text-gray-600">Organize departments and manage supervisors</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchDepartments}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
                <DialogDescription>Add a new department to your organization</DialogDescription>
              </DialogHeader>
              <CreateDepartmentForm users={users} onSuccess={handleCreateDepartment} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <Card key={department.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{department.name}</CardTitle>
                    <Badge
                      className={department.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      {department.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingDepartment(department)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Department
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Department Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Department
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Department</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{department.name}"? This action cannot be undone and will
                            affect all users and tickets in this department.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteDepartment(department.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {department.description && <p className="text-sm text-gray-600">{department.description}</p>}

              {/* Supervisor */}
              {department.supervisor ? (
                <div className="flex items-center space-x-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={department.supervisor.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                      {department.supervisor.first_name[0]}
                      {department.supervisor.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {department.supervisor.first_name} {department.supervisor.last_name}
                    </p>
                    <p className="text-xs text-gray-500">Supervisor</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">No supervisor assigned</span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-semibold text-gray-900">{department.user_count}</span>
                  </div>
                  <p className="text-xs text-gray-500">Members</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Ticket className="w-4 h-4 text-purple-600" />
                    <span className="text-lg font-semibold text-gray-900">{department.active_tickets}</span>
                  </div>
                  <p className="text-xs text-gray-500">Active Tickets</p>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Public Tickets</span>
                  <Badge variant={department.allow_public_tickets ? "default" : "secondary"}>
                    {department.allow_public_tickets ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Auto Assignment</span>
                  <Badge variant={department.auto_assign_tickets ? "default" : "secondary"}>
                    {department.auto_assign_tickets ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>

              <div className="text-xs text-gray-400 pt-2 border-t">Created {formatDate(department.created_at)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Department Dialog */}
      {editingDepartment && (
        <EditDepartmentDialog
          department={editingDepartment}
          users={users}
          onClose={() => setEditingDepartment(null)}
          onSave={(data) => handleUpdateDepartment(editingDepartment.id, data)}
        />
      )}
    </div>
  )
}

// Create Department Form Component
function CreateDepartmentForm({ users, onSuccess }: { users: User[]; onSuccess: (data: any) => void }) {
  const [formData, setFormData] = useState<{
    name: string
    description: string
    supervisor_id: number | null
    allow_public_tickets: boolean
    auto_assign_tickets: boolean
  }>({
    name: "",
    description: "",
    supervisor_id: null,
    allow_public_tickets: true,
    auto_assign_tickets: false,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSuccess({
        ...formData,
        supervisor_id: formData.supervisor_id,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Department Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter department name"
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter department description"
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="supervisor">Supervisor</Label>
        <Select
          value={formData.supervisor_id?.toString() || "none"}
          onValueChange={(value) =>
            setFormData({ ...formData, supervisor_id: value === "none" ? null : Number.parseInt(value) })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select supervisor (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No supervisor</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id.toString()}>
                {user.first_name} {user.last_name} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="allow_public_tickets">Allow Public Tickets</Label>
            <p className="text-sm text-gray-500">Users can create tickets visible to all department members</p>
          </div>
          <Switch
            id="allow_public_tickets"
            checked={formData.allow_public_tickets}
            onCheckedChange={(checked) => setFormData({ ...formData, allow_public_tickets: checked })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto_assign_tickets">Auto Assignment</Label>
            <p className="text-sm text-gray-500">Automatically assign new tickets to available users</p>
          </div>
          <Switch
            id="auto_assign_tickets"
            checked={formData.auto_assign_tickets}
            onCheckedChange={(checked) => setFormData({ ...formData, auto_assign_tickets: checked })}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Department"}
        </Button>
      </div>
    </form>
  )
}

// Edit Department Dialog Component
function EditDepartmentDialog({
  department,
  users,
  onClose,
  onSave,
}: {
  department: Department
  users: User[]
  onClose: () => void
  onSave: (data: any) => void
}) {
  const [formData, setFormData] = useState({
    name: department.name,
    description: department.description || "",
    supervisor_id: department.supervisor_id?.toString() || "none",
    is_active: department.is_active,
    allow_public_tickets: department.allow_public_tickets,
    auto_assign_tickets: department.auto_assign_tickets,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      supervisor_id: formData.supervisor_id === "none" ? null : Number.parseInt(formData.supervisor_id),
    })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department information and settings</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="supervisor">Supervisor</Label>
            <Select
              value={formData.supervisor_id}
              onValueChange={(value) => setFormData({ ...formData, supervisor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supervisor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No supervisor</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.first_name} {user.last_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Department Status</Label>
                <p className="text-sm text-gray-500">Enable or disable this department</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow_public_tickets">Allow Public Tickets</Label>
                <p className="text-sm text-gray-500">Users can create tickets visible to all department members</p>
              </div>
              <Switch
                id="allow_public_tickets"
                checked={formData.allow_public_tickets}
                onCheckedChange={(checked) => setFormData({ ...formData, allow_public_tickets: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_assign_tickets">Auto Assignment</Label>
                <p className="text-sm text-gray-500">Automatically assign new tickets to available users</p>
              </div>
              <Switch
                id="auto_assign_tickets"
                checked={formData.auto_assign_tickets}
                onCheckedChange={(checked) => setFormData({ ...formData, auto_assign_tickets: checked })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
