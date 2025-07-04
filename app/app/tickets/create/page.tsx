"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Ticket, Upload, X, AlertCircle, Flag, Tag, ArrowLeft, FileText, ImageIcon, File } from "lucide-react"
import toast from "react-hot-toast"
import { SuccessModal } from "@/components/success-modal"
import { Progress } from "@/components/ui/progress"

interface Category {
  id: number
  name: string
  description: string
  color: string
}

interface Department {
  id: number
  name: string
  description: string
}

interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  file: File
  progress?: number
}

export default function CreateTicketPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    isPublic: false,
  })

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdTicketNumber, setCreatedTicketNumber] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      fetchFormData()
    }
  }, [user, loading, router])

  const fetchFormData = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await fetch("/api/categories", { credentials: "include" })
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData)
      }

      // Fetch departments
      const departmentsResponse = await fetch("/api/departments", { credentials: "include" })
      if (departmentsResponse.ok) {
        const departmentsData = await departmentsResponse.json()
        setDepartments(departmentsData)
      }
    } catch (error) {
      console.error("Failed to load form data:", error)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return
      }

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} is not allowed.`)
        return
      }

      const newFile: AttachedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        progress: 0,
      }

      setAttachedFiles((prev) => [...prev, newFile])
    })
  }

  const removeFile = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-4 h-4" />
    if (type === "application/pdf") return <FileText className="w-4 h-4" />
    return <File className="w-4 h-4" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "medium":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  const simulateFileUploadProgress = () => {
    // Simulate upload progress for attached files
    setAttachedFiles((prevFiles) =>
      prevFiles.map((file) => ({
        ...file,
        progress: 0,
      })),
    )

    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setUploadProgress(progress)

      // Update individual file progress
      setAttachedFiles((prevFiles) =>
        prevFiles.map((file) => ({
          ...file,
          progress: Math.min(progress, 100),
        })),
      )

      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      categoryId: "",
      priority: "medium",
      isPublic: false,
    })
    setAttachedFiles([])
    setError("")
    setUploadProgress(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    if (!formData.title.trim()) {
      setError("Title is required")
      setSubmitting(false)
      return
    }

    if (!formData.description.trim()) {
      setError("Description is required")
      setSubmitting(false)
      return
    }

    try {
      // Start simulating upload progress
      const clearProgressSimulation = simulateFileUploadProgress()

      const submitData = new FormData()
      submitData.append("title", formData.title)
      submitData.append("description", formData.description)
      submitData.append("categoryId", formData.categoryId)
      submitData.append("priority", formData.priority)
      submitData.append("isPublic", formData.isPublic ? "true" : "false")

      attachedFiles.forEach((attachedFile) => {
        submitData.append("files", attachedFile.file)
      })

      const response = await fetch("/api/tickets/create", {
        method: "POST",
        credentials: "include",
        body: submitData,
      })

      if (response.ok) {
        const result = await response.json()
        setCreatedTicketNumber(result.ticketNumber)

        // Clear the progress simulation
        clearProgressSimulation()

        // Show success modal instead of toast
        setShowSuccessModal(true)
      } else {
        const data = await response.json()
        setError(data.message || "Failed to create ticket")
        toast.error("Failed to create ticket")
        clearProgressSimulation()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      toast.error("Failed to create ticket")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    resetForm()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Create New Ticket</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit a Support Request</h2>
          <p className="text-gray-600">Provide detailed information about your issue to help us assist you better.</p>
        </div>

        <Card className="shadow-xl border-0 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ticket className="w-5 h-5 mr-2 text-purple-600" />
              Ticket Details
            </CardTitle>
            <CardDescription>Fill out the form below to create your support ticket</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Title *
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Brief description of your issue"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category
                </Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-20 pointer-events-none" />
                  <Select onValueChange={(value) => handleInputChange("categoryId", value)} disabled={submitting}>
                    <SelectTrigger className="pl-10 h-12 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Priority</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(["low", "medium", "high", "urgent"] as const).map((priority) => (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => handleInputChange("priority", priority)}
                      disabled={submitting}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                        formData.priority === priority
                          ? getPriorityColor(priority)
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <Flag className="w-4 h-4 mr-1 inline" />
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about your issue, including steps to reproduce, expected behavior, and any error messages..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="min-h-32 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Ticket Visibility */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Ticket Visibility</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={!formData.isPublic}
                      onChange={() => handleInputChange("isPublic", false)}
                      disabled={submitting}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    Private
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={formData.isPublic}
                      onChange={() => handleInputChange("isPublic", true)}
                      disabled={submitting}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    Public
                  </label>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Attachments</Label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    dragActive ? "border-purple-400 bg-purple-50" : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drag and drop files here, or{" "}
                    <label className="text-purple-600 hover:text-purple-700 cursor-pointer font-medium">
                      browse
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                        accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                        disabled={submitting}
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, GIF, PDF, TXT, DOC, DOCX (Max 10MB each)
                  </p>
                </div>

                {/* Attached Files */}
                {attachedFiles.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm font-medium text-gray-700">Attached Files ({attachedFiles.length})</Label>
                    <div className="space-y-2">
                      {attachedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center mb-2 sm:mb-0">
                            {getFileIcon(file.type)}
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-[300px]">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <div className="flex items-center w-full sm:w-auto">
                            {submitting && typeof file.progress === "number" && (
                              <div className="w-full sm:w-24 mr-2">
                                <Progress value={file.progress} className="h-2" />
                              </div>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              disabled={submitting}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-medium transition-all hover:shadow-lg"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Ticket...
                    </div>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4 mr-2" />
                      Create Ticket
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <SuccessModal isOpen={showSuccessModal} onClose={handleCloseSuccessModal} ticketNumber={createdTicketNumber} />
    </div>
  )
}
