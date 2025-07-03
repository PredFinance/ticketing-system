"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MessageSquare, User, Calendar, Flag, Send, Paperclip, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"

interface TicketDetail {
  id: number
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  creator: { first_name: string; last_name: string; email: string; avatar_url?: string }
  assignee?: { first_name: string; last_name: string; email: string; avatar_url?: string }
  category?: { name: string; color: string }
  department?: { name: string }
  comments: Array<{
    id: number
    content: string
    is_internal: boolean
    is_system_message: boolean
    created_at: string
    user: { first_name: string; last_name: string; avatar_url?: string; role: string }
  }>
  activities: Array<{
    id: number
    action: string
    description: string
    created_at: string
    user?: { first_name: string; last_name: string }
  }>
}

export default function TicketDetailPage() {
  const params = useParams()
  const ticketId = params.id as string

  const { user, loading } = useAuth()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [loadingTicket, setLoadingTicket] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      fetchTicket()
    }
  }, [user, loading, router, ticketId])

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, { credentials: "include" })
      if (response.ok) {
        const ticketData = await response.json()
        setTicket(ticketData)
      } else {
        toast.error("Ticket not found")
        router.push("/tickets")
      }
    } catch (error) {
      toast.error("Failed to load ticket")
      router.push("/tickets")
    } finally {
      setLoadingTicket(false)
    }
  }

  const submitComment = async () => {
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: newComment,
          isInternal,
        }),
      })

      if (response.ok) {
        setNewComment("")
        setIsInternal(false)
        fetchTicket()
        toast.success("Comment added successfully")
      } else {
        toast.error("Failed to add comment")
      }
    } catch (error) {
      toast.error("Failed to add comment")
    } finally {
      setSubmittingComment(false)
    }
  }

  const updateTicketStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTicket()
        toast.success("Ticket status updated")
      } else {
        toast.error("Failed to update ticket status")
      }
    } catch (error) {
      toast.error("Failed to update ticket status")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "status-open"
      case "in_progress":
        return "status-in-progress"
      case "pending":
        return "status-pending"
      case "resolved":
        return "status-resolved"
      case "closed":
        return "status-closed"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "priority-low"
      case "medium":
        return "priority-medium"
      case "high":
        return "priority-high"
      case "urgent":
        return "priority-urgent"
      default:
        return "bg-gray-100 text-gray-700"
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

  if (loading || loadingTicket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Ticket not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center flex-1">
              <h1 className="text-xl font-semibold text-gray-900">{ticket.ticket_number}</h1>
              <Badge className={`ml-3 ${getStatusColor(ticket.status)}`}>{ticket.status.replace("_", " ")}</Badge>
              <Badge className={`ml-2 ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</Badge>
            </div>
            {(user?.role === "admin" || user?.role === "supervisor") && (
              <Select value={ticket.status} onValueChange={updateTicketStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>{ticket.title}</CardTitle>
                <CardDescription className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    Created by {ticket.creator.first_name} {ticket.creator.last_name}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(ticket.created_at)}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Comments ({ticket.comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comments List */}
                <div className="space-y-4">
                  {ticket.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={comment.user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gray-100 text-gray-600">
                          {comment.user.first_name[0]}
                          {comment.user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {comment.user.first_name} {comment.user.last_name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {comment.user.role}
                              </Badge>
                              {comment.is_internal && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                                  Internal
                                </Badge>
                              )}
                              {comment.is_system_message && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  System
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Add Comment */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">Add Comment</h3>
                    {(user?.role === "admin" || user?.role === "supervisor") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsInternal(!isInternal)}
                        className={isInternal ? "bg-yellow-50 text-yellow-700 border-yellow-200" : ""}
                      >
                        {isInternal ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                        {isInternal ? "Internal" : "Public"}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Type your comment here..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-24"
                  />
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm">
                      <Paperclip className="w-4 h-4 mr-1" />
                      Attach File
                    </Button>
                    <Button
                      onClick={submitComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {submittingComment ? (
                        <div className="flex items-center">
                          <div className="spinner mr-2"></div>
                          Posting...
                        </div>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Info */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Priority</span>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    <Flag className="w-3 h-3 mr-1" />
                    {ticket.priority}
                  </Badge>
                </div>
                {ticket.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Category</span>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: ticket.category.color }} />
                      <span className="text-sm text-gray-900">{ticket.category.name}</span>
                    </div>
                  </div>
                )}
                {ticket.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Department</span>
                    <span className="text-sm text-gray-900">{ticket.department.name}</span>
                  </div>
                )}
                <Separator />
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Created by</span>
                    <div className="flex items-center mt-1">
                      <Avatar className="w-6 h-6 mr-2">
                        <AvatarImage src={ticket.creator.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                          {ticket.creator.first_name[0]}
                          {ticket.creator.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-900">
                        {ticket.creator.first_name} {ticket.creator.last_name}
                      </span>
                    </div>
                  </div>
                  {ticket.assignee && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Assigned to</span>
                      <div className="flex items-center mt-1">
                        <Avatar className="w-6 h-6 mr-2">
                          <AvatarImage src={ticket.assignee.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                            {ticket.assignee.first_name[0]}
                            {ticket.assignee.last_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900">
                          {ticket.assignee.first_name} {ticket.assignee.last_name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span>{formatDate(ticket.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span>{formatDate(ticket.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-lg">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ticket.activities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {activity.user && (
                            <span>
                              {activity.user.first_name} {activity.user.last_name}
                            </span>
                          )}
                          <span>{formatDate(activity.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
