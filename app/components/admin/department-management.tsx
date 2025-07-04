"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Edit, Trash2, Users, Search, MoreHorizontal, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import toast from "react-hot-toast"

export default function DepartmentManagement() {
  const { profile } = useAuth()
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showUsersDialog, setShowUsersDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  })
  const supabase = createClient()

  useEffect(() => {
    fetchDepartments()
    fetchUsers()
  }, [])

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select(`
          *,
          user_departments (
            user_id,
            is_supervisor,
            user_profiles (
              id,
              full_name,
              avatar_url,
              role
            )
          )
        `)
        .eq("organization_id", profile?.organization_id)
        .order("name")

      if (error) throw error

      // Process the data to count users and supervisors
      const processedDepartments =
        data?.map((dept) => ({
          ...dept,
          userCount: dept.user_departments?.length || 0,
          supervisorCount: dept.user_departments?.filter((ud) => ud.is_supervisor)?.length || 0,
          users: dept.user_departments?.map((ud) => ud.user_profiles) || [],
        })) || []

      setDepartments(processedDepartments)
    } catch (error: any) {
      toast.error("Failed to fetch departments")
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("organization_id", profile?.organization_id)
        .eq("is_approved", true)
        .order("full_name")

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      console.error("Error fetching users:", error)
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from("departments").insert({
        organization_id: profile?.organization_id,
        name: formData.name,
        description: formData.description,
        color: formData.color,
      })

      if (error) throw error

      toast.success("Department created successfully")
      setShowCreateDialog(false)
      setFormData({ name: "", description: "", color: "#3B82F6" })
      fetchDepartments()
    } catch (error: any) {
      toast.error("Failed to create department")
      console.error("Error:", error)
    }
  }

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase
        .from("departments")
        .update({
          name: formData.name,
          description: formData.description,
          color: formData.color,
        })
        .eq("id", selectedDepartment.id)

      if (error) throw error

      toast.success("Department updated successfully")
      setShowEditDialog(false)
      setSelectedDepartment(null)
      fetchDepartments()
    } catch (error: any) {
      toast.error("Failed to update department")
      console.error("Error:", error)
    }
  }

  const handleDeleteDepartment = async (departmentId: number) => {
    if (!confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.from("departments").delete().eq("id", departmentId)

      if (error) throw error

      toast.success("Department deleted successfully")
      fetchDepartments()
    } catch (error: any) {
      toast.error("Failed to delete department")
      console.error("Error:", error)
    }
  }

  const handleAssignUser = async (userId: number, departmentId: number, isSupervisor = false) => {
    try {
      const { error } = await supabase.from("user_departments").insert({
        user_id: userId,
        department_id: departmentId,
        is_supervisor: isSupervisor,
      })

      if (error) throw error

      toast.success("User assigned successfully")
      fetchDepartments()
    } catch (error: any) {
      toast.error("Failed to assign user")
      console.error("Error:", error)
    }
  }

  const handleRemoveUser = async (userId: number, departmentId: number) => {
    try {
      const { error } = await supabase
        .from("user_departments")
        .delete()
        .eq("user_id", userId)
        .eq("department_id", departmentId)

      if (error) throw error

      toast.success("User removed successfully")
      fetchDepartments()
    } catch (error: any) {
      toast.error("Failed to remove user")
      console.error("Error:", error)
    }
  }

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
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
          <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
          <p className="text-gray-600">{filteredDepartments.length} departments found</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          New Department
        </Button>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department, index) => (
          <motion.div
            key={department.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: department.color }} />
                    <div>
                      <CardTitle className="text-lg">{department.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{department.description || "No description"}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDepartment(department)
                          setFormData({
                            name: department.name,
                            description: department.description || "",
                            color: department.color,
                          })
                          setShowEditDialog(true)
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDepartment(department)
                          setShowUsersDialog(true)
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Users
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteDepartment(department.id)} className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-blue-700">{department.userCount}</p>
                    <p className="text-xs text-blue-600">Members</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Settings className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-green-700">{department.supervisorCount}</p>
                    <p className="text-xs text-green-600">Supervisors</p>
                  </div>
                </div>

                {department.users.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Recent Members</p>
                    <div className="flex -space-x-2">
                      {department.users.slice(0, 4).map((user: any) => (
                        <Avatar key={user.id} className="w-8 h-8 border-2 border-white">
                          <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{user.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {department.users.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                          <span className="text-xs text-gray-600">+{department.users.length - 4}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Create Department Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogDescription>Add a new department to organize your team and tickets.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDepartment} className="space-y-4">
            <div>
              <Label htmlFor="name">Department Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., IT Support"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the department"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="color">Department Color</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 rounded border"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Create Department
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department information and settings.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateDepartment} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Department Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Department Color</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  id="edit-color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 rounded border"
                />
                <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                Update Department
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Users Dialog */}
      <Dialog open={showUsersDialog} onOpenChange={setShowUsersDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Department Users</DialogTitle>
            <DialogDescription>Add or remove users from {selectedDepartment?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Current Users */}
            <div>
              <h4 className="font-medium mb-2">Current Members ({selectedDepartment?.users?.length || 0})</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedDepartment?.users?.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveUser(user.id, selectedDepartment.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Users */}
            <div>
              <h4 className="font-medium mb-2">Available Users</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {users
                  .filter((user) => !selectedDepartment?.users?.some((deptUser: any) => deptUser.id === user.id))
                  .map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-xs text-gray-500">{user.role}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssignUser(user.id, selectedDepartment.id, false)}
                        >
                          Add Member
                        </Button>
                        <Button size="sm" onClick={() => handleAssignUser(user.id, selectedDepartment.id, true)}>
                          Add Supervisor
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
