"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Paperclip, X, MessageSquare, Shield, Crown, UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import toast from "react-hot-toast"

interface CommentSectionProps {
  ticketId: string
  comments: any[]
  onCommentAdded: () => void
  userRole: "admin" | "supervisor" | "user"
  ticketCreatedBy: number
}

export default function CommentSection({
  ticketId,
  comments,
  onCommentAdded,
  userRole,
  ticketCreatedBy,
}: CommentSectionProps) {
  const { profile } = useAuth()
  const [newComment, setNewComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [attachments, setAttachments] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      return true
    })
    setAttachments((prev) => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadCommentAttachments = async (commentId: number) => {
    if (attachments.length === 0) return

    const uploadPromises = attachments.map(async (file) => {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `ticket-attachments/${profile?.organization_id}/${ticketId}/comments/${fileName}`

      const { error: uploadError } = await supabase.storage.from("ticket-attachments").upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("ticket-attachments").getPublicUrl(filePath)

      await supabase.from("file_attachments").insert({
        organization_id: profile?.organization_id,
        uploaded_by: profile?.id,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: urlData.publicUrl,
        storage_path: filePath,
        related_to: "comment",
        related_id: commentId,
        is_image: file.type.startsWith("image/"),
      })
    })

    await Promise.all(uploadPromises)
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment")
      return
    }

    setSubmitting(true)
    try {
      // Create comment
      const { data: comment, error: commentError } = await supabase
        .from("ticket_comments")
        .insert({
          ticket_id: Number.parseInt(ticketId),
          user_id: profile?.id,
          content: newComment.trim(),
          is_internal: isInternal && (userRole === "admin" || userRole === "supervisor"),
        })
        .select()
        .single()

      if (commentError) throw commentError

      // Upload attachments if any
      if (attachments.length > 0) {
        await uploadCommentAttachments(comment.id)
      }

      // Create notifications for relevant users
      const notificationPromises = []

      // Notify ticket creator if comment is not from them and not internal
      if (profile?.id !== ticketCreatedBy && !isInternal) {
        notificationPromises.push(
          supabase.from("notifications").insert({
            organization_id: profile?.organization_id,
            user_id: ticketCreatedBy,
            type: "ticket_comment",
            title: "New Comment on Your Ticket",
            message: `${profile?.full_name} commented on your ticket`,
            data: {
              ticket_id: ticketId,
              comment_id: comment.id,
              commenter: profile?.full_name,
            },
          }),
        )
      }

      // Notify other commenters (excluding current user and if not internal)
      if (!isInternal) {
        const otherCommenters = [
          ...new Set(comments.filter((c) => c.user_id !== profile?.id && !c.is_internal).map((c) => c.user_id)),
        ]

        otherCommenters.forEach((userId) => {
          notificationPromises.push(
            supabase.from("notifications").insert({
              organization_id: profile?.organization_id,
              user_id: userId,
              type: "ticket_comment",
              title: "New Comment on Ticket",
              message: `${profile?.full_name} added a comment to a ticket you're following`,
              data: {
                ticket_id: ticketId,
                comment_id: comment.id,
                commenter: profile?.full_name,
              },
            }),
          )
        })
      }

      await Promise.all(notificationPromises)

      toast.success("Comment added successfully")
      setNewComment("")
      setAttachments([])
      setIsInternal(false)
      onCommentAdded()
    } catch (error: any) {
      toast.error("Failed to add comment")
      console.error("Error adding comment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="w-3 h-3 text-red-600" />
      case "supervisor":
        return <Shield className="w-3 h-3 text-blue-600" />
      default:
        return <UserIcon className="w-3 h-3 text-gray-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-100 text-red-800 text-xs">Admin</Badge>
      case "supervisor":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Supervisor</Badge>
      default:
        return null
    }
  }

  const canSeeInternalComments = userRole === "admin" || userRole === "supervisor"
  const canCreateInternalComments = userRole === "admin" || userRole === "supervisor"

  const visibleComments = comments.filter((comment) => {
    if (comment.is_internal && !canSeeInternalComments) {
      return false
    }
    return true
  })

  return (
    <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <MessageSquare className="w-5 h-5 mr-2" />
          Comments ({visibleComments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comments List */}
        <div className="space-y-4">
          <AnimatePresence>
            {visibleComments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${
                  comment.is_internal ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user_profiles?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                      {comment.user_profiles?.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">{comment.user_profiles?.full_name}</p>
                      {getRoleBadge(comment.user_profiles?.role)}
                      {comment.is_internal && <Badge className="bg-yellow-100 text-yellow-800 text-xs">Internal</Badge>}
                      <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {visibleComments.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Add Comment Form */}
        <div className="border-t pt-6">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                  {profile?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-20 resize-none"
                />

                {/* File Attachments */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="comment-file-upload"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <label htmlFor="comment-file-upload">
                        <Button type="button" variant="ghost" size="sm" asChild>
                          <span className="cursor-pointer">
                            <Paperclip className="w-4 h-4 mr-2" />
                            Attach Files
                          </span>
                        </Button>
                      </label>
                    </div>

                    {canCreateInternalComments && (
                      <div className="flex items-center space-x-2">
                        <Switch id="internal-comment" checked={isInternal} onCheckedChange={setIsInternal} size="sm" />
                        <Label htmlFor="internal-comment" className="text-sm text-gray-600">
                          Internal comment
                        </Label>
                      </div>
                    )}
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleSubmitComment}
                      disabled={submitting || !newComment.trim()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {submitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
                          Posting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Comment
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
