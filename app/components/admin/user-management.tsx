"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Users, Search, MoreHorizontal, Shield, Crown, UserIcon, Mail, Phone, Calendar, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import toast from "react-hot-toast"

interface User {
  id: number
  full_name: string
  email: string
  phone: string | null
  role: "admin" | "supervisor" | "user"
  is_approved: boolean
  is_online: boolean
  last_login: string | null
  created_at: string
  avatar_url: string | null
  user_departments: Array<{
    departments: {
      id: number
      name: string
      color: string
    }
    is_supervisor: boolean
  }>
}

export default function UserManagement() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    type: "approve" | "reject" | "role_change" | "delete"
    user: User | null
  }>({ open: false, type: "approve", user: null })
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select(`
          *,
          user_departments (
            is_supervisor,
            departments (
              id,
              name,
              color
            )
          )
        `)
        .eq("organization_id", profile?.organization_id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleApproveUser = async (userId: number) => {
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          is_approved: true,
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (error) throw error

      // Send notification to user
      const user = users.find((u) => u.id === userId)
      if (user) {
        await supabase.from("notifications").insert({
          organization_id: profile?.organization_id,
          user_id: userId,
          type: "account_approved",
          title: "Account Approved",
          message: "Your account has been approved and you can now access the system.",
          data: {
            approved_by: profile?.full_name,
          },
        })
      }

      toast.success("User approved successfully")
      fetchUsers()
    } catch (error) {
      console.error("Error approving user:", error)
      toast.error("Failed to approve user")
    }
  }

  const handleRejectUser = async (userId: number) => {
    try {
      const { error } = await supabase.from("user_profiles").delete().eq("id", userId)

      if (error) throw error

      toast.success("User rejected and removed")
      fetchUsers()
    } catch (error) {
      console.error("Error rejecting user:", error)
      toast.error("Failed to reject user")
    }
  }

  const handleRoleChange = async (userId: number, newRole: "admin" | "supervisor" | "user") => {
    try {
      const { error } = await supabase.from("user_profiles").update({ role: newRole }).eq("id", userId)

      if (error) throw error

      // Send notification to user
      const user = users.find((u) => u.id === userId)
      if (user) {
        await supabase.from("notifications").insert({
          organization_id: profile?.organization_id,
          user_id: userId,
          type: "role_changed",
          title: "Role Updated",
          message: `Your role has been changed to ${newRole}.`,
          data: {
            old_role: user.role,
            new_role: newRole,
            changed_by: profile?.full_name,
          },
        })
      }

      toast.success("User role updated successfully")
      fetchUsers()
    } catch (error) {
      console.error("Error updating user role:", error)
      toast.error("Failed to update user role")
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-4 h-4 text-red-600" />
      case "supervisor":
        return <Shield className="w-4 h-4 text-blue-600" />
      default:
        return <UserIcon className="w-4 h-4 text-gray-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>
      case "supervisor":
        return <Badge className="bg-blue-100 text-blue-800">Supervisor</Badge>
      default:
        return <Badge className="bg-green-100 text-green-800">User</Badge>
    }
  }

  const getStatusBadge = (user: User) => {
    if (!user.is_approved) {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
    if (user.is_online) {
      return <Badge className="bg-green-100 text-green-800">Online</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "approved" && user.is_approved) ||
      (statusFilter === "pending" && !user.is_approved) ||
      (statusFilter === "online" && user.is_online) ||
      (statusFilter === "offline" && !user.is_online)

    return matchesSearch && matchesRole && matchesStatus
  })

  const pendingUsers = users.filter((user) => !user.is_approved)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage users, roles, and permissions for your organization</p>
        </div>
        {pendingUsers.length > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 mt-2 sm:mt-0">
            {pendingUsers.length} pending approval{pendingUsers.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {user.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.full_name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getRoleIcon(user.role)}
                        {getRoleBadge(user.role)}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!user.is_approved && (
                        <>
                          <DropdownMenuItem
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                type: "approve",
                                user,
                              })
                            }
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                type: "reject",
                                user,
                              })
                            }
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        onClick={() =>
                          setActionDialog({
                            open: true,
                            type: "role_change",
                            user,
                          })
                        }
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Change Role
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setActionDialog({
                            open: true,
                            type: "delete",
                            user,
                          })
                        }
                        className="text-red-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(user)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 truncate">{user.email}</span>
                  </div>

                  {user.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{user.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {user.user_departments && user.user_departments.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Departments:</p>
                    <div className="flex flex-wrap gap-1">
                      {user.user_departments.map((userDept, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: userDept.departments.color,
                            color: userDept.departments.color,
                          }}
                        >
                          {userDept.departments.name}
                          {userDept.is_supervisor && " (Supervisor)"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {user.last_login && (
                  <p className="text-xs text-gray-500">Last login: {new Date(user.last_login).toLocaleString()}</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">
              {searchTerm || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No users have been created yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action Dialogs */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" && "Approve User"}
              {actionDialog.type === "reject" && "Reject User"}
              {actionDialog.type === "role_change" && "Change User Role"}
              {actionDialog.type === "delete" && "Delete User"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "approve" &&
                `Are you sure you want to approve ${actionDialog.user?.full_name}? They will be able to access the system.`}
              {actionDialog.type === "reject" &&
                `Are you sure you want to reject ${actionDialog.user?.full_name}? Their account will be permanently deleted.`}
              {actionDialog.type === "role_change" && `Select a new role for ${actionDialog.user?.full_name}.`}
              {actionDialog.type === "delete" &&
                `Are you sure you want to delete ${actionDialog.user?.full_name}? This action cannot be undone.`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.type === "role_change" && (
            <div className="py-4">
              <Select defaultValue={actionDialog.user?.role}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog((prev) => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              variant={actionDialog.type === "delete" || actionDialog.type === "reject" ? "destructive" : "default"}
              onClick={() => {
                if (actionDialog.type === "approve" && actionDialog.user) {
                  handleApproveUser(actionDialog.user.id)
                } else if (actionDialog.type === "reject" && actionDialog.user) {
                  handleRejectUser(actionDialog.user.id)
                }
                setActionDialog((prev) => ({ ...prev, open: false }))
              }}
            >
              {actionDialog.type === "approve" && "Approve"}
              {actionDialog.type === "reject" && "Reject"}
              {actionDialog.type === "role_change" && "Update Role"}
              {actionDialog.type === "delete" && "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
