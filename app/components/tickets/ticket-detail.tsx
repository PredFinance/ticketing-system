"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  Tag,
  Paperclip,
  Edit,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import CommentSection from "./comment-section"
import FileAttachmentViewer from "./file-attachment-viewer"

interface TicketDetailProps {
  ticketId: string
  userRole: "admin" | "supervisor" | "user"
}

export default function TicketDetail({ ticketId, userRole }: TicketDetailProps) {
  const { profile } = useAuth()
  const [ticket, setTicket] = useState<any>(null)
  const [attachments, setAttachments] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchTicketDetails()
    setupRealtimeSubscription()
  }, [ticketId])

  const fetchTicketDetails = async () => {
    try {
      // Fetch ticket with related data
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select(`
          *,
          user_profiles!tickets_created_by_fkey (
            id,
            full_name,
            avatar_url,
            email
          ),
          assigned_user:user_profiles!tickets_assigned_to_fkey (
            id,
            full_name,
            avatar_url
          ),
          ticket_categories (
            name,
            color,
            icon
          ),
          departments (
            name,
            color
          )
        `)
        .eq("id", ticketId)
        .single()

      if (ticketError) throw ticketError

      // Check if user has permission to view this ticket
      const canView = await checkViewPermission(ticketData)
      if (!canView) {
        toast.error("You don't have permission to view this ticket")
        router.back()
        return
      }

      setTicket(ticketData)

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from("file_attachments")
        .select("*")
        .eq("related_to", "ticket")
        .eq("related_id", ticketId)
        .order("created_at", { ascending: true })

      if (!attachmentsError) {
        setAttachments(attachmentsData || [])
      }

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from("ticket_comments")
        .select(`
          *,
          user_profiles (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true })

      if (!commentsError) {
        setComments(commentsData || [])
      }
    } catch (error: any) {
      toast.error("Failed to load ticket details")
      console.error("Error fetching ticket:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkViewPermission = async (ticketData: any) => {
    if (!profile) return false

    // Admin can view all tickets
    if (userRole === "admin") return true

    // User can view their own tickets
    if (ticketData.created_by === profile.id) return true

    // Check if user is in the same department and ticket is public
    if (ticketData.visibility === "public") {
      const { data: userDepts } = await supabase
        .from("user_departments")
        .select("department_id")
        .eq("user_id", profile.id)

      const departmentIds = userDepts?.map((ud) => ud.department_id) || []
      if (departmentIds.includes(ticketData.department_id)) return true
    }

    // Supervisor can view all tickets in their supervised departments
    if (userRole === "supervisor") {
      const { data: supervisedDepts } = await supabase
        .from("user_departments")
        .select("department_id")
        .eq("user_id", profile.id)
        .eq("is_supervisor", true)

      const supervisedDepartmentIds = supervisedDepts?.map((ud) => ud.department_id) || []
      if (supervisedDepartmentIds.includes(ticketData.department_id)) return true
    }

    return false
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_comments",
          filter: `ticket_id=eq.${ticketId}`,
        },
        () => {
          fetchTicketDetails()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticketId}`,
        },
        () => {
          fetchTicketDetails()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const updateTicketStatus = async (newStatus: string) => {
    if (!canUpdateStatus()) return

    setUpdating(true)
    try {
      const updateData: any = { status: newStatus }

      if (newStatus === "resolved") {
        updateData.resolved_at = new Date().toISOString()
      } else if (newStatus === "closed") {
        updateData.closed_at = new Date().toISOString()
      }

      const { error } = await supabase.from("tickets").update(updateData).eq("id", ticketId)

      if (error) throw error

      // Create notification for ticket creator
      if (ticket.created_by !== profile?.id) {
        await supabase.from("notifications").insert({
          organization_id: profile?.organization_id,
          user_id: ticket.created_by,
          type: "ticket_status_changed",
          title: "Ticket Status Updated",
          message: `Your ticket "${ticket.title}" status has been changed to ${newStatus}`,
          data: {
            ticket_id: ticketId,
            ticket_number: ticket.ticket_number,
            new_status: newStatus,
            updated_by: profile?.full_name,
          },
        })
      }

      toast.success("Ticket status updated successfully")
      fetchTicketDetails()
    } catch (error: any) {
      toast.error("Failed to update ticket status")
    } finally {
      setUpdating(false)
    }
  }

  const assignTicket = async (userId: string) => {
    if (!canAssignTicket()) return

    setUpdating(true)
    try {
      const { error } = await supabase
        .from("tickets")
        .update({
          assigned_to: userId ? Number.parseInt(userId) : null,
          assigned_by: profile?.id,
        })
        .eq("id", ticketId)

      if (error) throw error

      toast.success("Ticket assignment updated")
      fetchTicketDetails()
    } catch (error: any) {
      toast.error("Failed to assign ticket")
    } finally {
      setUpdating(false)
    }
  }

  const canUpdateStatus = () => {
    return userRole === "admin" || userRole === "supervisor"
  }

  const canAssignTicket = () => {
    return userRole === "admin" || userRole === "supervisor"
  }

  const canEditTicket = () => {
    return ticket?.created_by === profile?.id || userRole === "admin"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "reserved":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ticket not found</h3>
          <p className="text-gray-500 mb-4">
            The ticket you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4"
      >
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
          <p className="text-gray-600">Ticket #{ticket.ticket_number}</p>
        </div>
        {canEditTicket() && (
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                      {ticket.visibility === "public" ? (
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          <Eye className="w-3 h-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-gray-200 text-gray-700">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    {ticket.ticket_categories && (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: ticket.ticket_categories.color,
                          color: ticket.ticket_categories.color,
                        }}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {ticket.ticket_categories.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-900 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </div>

                {ticket.tags && ticket.tags.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {ticket.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Created by:</span>
                    <span className="font-medium">{ticket.user_profiles?.full_name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{ticket.departments?.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">{new Date(ticket.created_at).toLocaleString()}</span>
                  </div>
                  {ticket.resolved_at && (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Resolved:</span>
                      <span className="font-medium">{new Date(ticket.resolved_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* File Attachments */}
          {attachments.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Paperclip className="w-5 h-5 mr-2" />
                    Attachments ({attachments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileAttachmentViewer attachments={attachments} />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Comments Section */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <CommentSection
              ticketId={ticketId}
              comments={comments}
              onCommentAdded={fetchTicketDetails}
              userRole={userRole}
              ticketCreatedBy={ticket.created_by}
            />
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          {canUpdateStatus() && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Manage Ticket
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
                    <Select value={ticket.status || "open"} onValueChange={updateTicketStatus} disabled={updating}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {canAssignTicket() && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Assigned To</Label>
                      <Select
                        value={ticket.assigned_to?.toString() || "unassigned"}
                        onValueChange={assignTicket}
                        disabled={updating}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {/* TODO: Add department users */}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Ticket Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={ticket.user_profiles?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-purple-100 text-purple-700">
                      {ticket.user_profiles?.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ticket.user_profiles?.full_name}</p>
                    <p className="text-xs text-gray-500">Ticket Creator</p>
                  </div>
                </div>

                {ticket.assigned_user && (
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={ticket.assigned_user?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {ticket.assigned_user?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{ticket.assigned_user?.full_name}</p>
                      <p className="text-xs text-gray-500">Assigned To</p>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={getStatusColor(ticket.status)} variant="outline">
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visibility:</span>
                    <span className="font-medium">{ticket.visibility}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Comments:</span>
                    <span className="font-medium">{comments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Attachments:</span>
                    <span className="font-medium">{attachments.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
