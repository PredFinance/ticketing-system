"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Paperclip, Download, Eye, Trash2, File, ImageIcon, FileText, Archive, Video, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import toast from "react-hot-toast"

interface FileAttachmentViewerProps {
  attachments: any[]
  onDelete?: (attachmentId: number) => void
  canDelete?: boolean
}

export default function FileAttachmentViewer({ attachments, onDelete, canDelete = false }: FileAttachmentViewerProps) {
  const { profile } = useAuth()
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<number | null>(null)
  const supabase = createClient()

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return ImageIcon
    if (fileType.startsWith("video/")) return Video
    if (fileType.startsWith("audio/")) return Music
    if (fileType.includes("pdf") || fileType.includes("document")) return FileText
    if (fileType.includes("zip") || fileType.includes("rar")) return Archive
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleDownload = async (attachment: any) => {
    setDownloading(attachment.id)
    try {
      const { data, error } = await supabase.storage.from("ticket-attachments").download(attachment.storage_path)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = attachment.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("File downloaded successfully")
    } catch (error: any) {
      toast.error("Failed to download file")
      console.error("Download error:", error)
    } finally {
      setDownloading(null)
    }
  }

  const handleDelete = async (attachment: any) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("ticket-attachments")
        .remove([attachment.storage_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase.from("file_attachments").delete().eq("id", attachment.id)

      if (dbError) throw dbError

      toast.success("File deleted successfully")
      onDelete?.(attachment.id)
    } catch (error: any) {
      toast.error("Failed to delete file")
      console.error("Delete error:", error)
    }
  }

  const handlePreview = (attachment: any) => {
    if (attachment.is_image) {
      setSelectedImage(attachment.file_url)
    } else {
      // For non-images, trigger download
      handleDownload(attachment)
    }
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Paperclip className="w-12 h-12 mx-auto mb-2 text-gray-300" />
        <p>No attachments</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {attachments.map((attachment, index) => {
          const FileIcon = getFileIcon(attachment.file_type)

          return (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {attachment.is_image ? (
                        <div
                          className="w-12 h-12 rounded-lg bg-cover bg-center border"
                          style={{ backgroundImage: `url(${attachment.file_url})` }}
                          onClick={() => handlePreview(attachment)}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileIcon className="w-6 h-6 text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" title={attachment.file_name}>
                        {attachment.file_name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatFileSize(attachment.file_size)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(attachment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(attachment)}
                        className="h-8 px-2"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(attachment)}
                        disabled={downloading === attachment.id}
                        className="h-8 px-2"
                      >
                        {downloading === attachment.id ? (
                          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                      </Button>
                    </div>

                    {canDelete && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(attachment)}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage || "/placeholder.svg"}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
