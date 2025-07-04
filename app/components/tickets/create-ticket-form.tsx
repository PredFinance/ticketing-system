"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Send, AlertCircle, Paperclip, X, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import toast from "react-hot-toast"
import type { Department } from "@/lib/supabase/database.types"

interface Category {
  id: number
  name: string
  description: string | null
}

interface CreateTicketFormProps {
  onSuccess?: () => void
}

export default function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    categoryId: "",
    departmentId: "",
    visibility: "public" as "public" | "private",
  })
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [submitStatus, setSubmitStatus] = useState<{
    step: string
    message: string
    type: "loading" | "success" | "error"
  } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!profile?.organization_id) {
          setDataLoading(false)
          return
        }

        console.log("🔄 Fetching form data...")

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("ticket_categories")
          .select("*")
          .eq("organization_id", profile.organization_id)
          .eq("is_active", true)

        // Fetch user's departments
        const { data: userDepts, error: deptsError } = await supabase
          .from("user_departments")
          .select(`
            departments (
              id,
              name,
              description
            )
          `)
          .eq("user_id", profile.id)

        if (categoriesError) {
          console.error("Categories error:", categoriesError)
        } else {
          setCategories(categoriesData || [])
          console.log("✅ Categories loaded:", categoriesData?.length || 0)
        }

        if (deptsError) {
          console.error("Departments error:", deptsError)
        } else {
          const deptList = userDepts?.map((ud: any) => ud.departments).filter(Boolean) || []
          setDepartments(deptList)
          console.log("✅ Departments loaded:", deptList.length)

          if (deptList.length === 1) {
            setFormData((prev) => ({ ...prev, departmentId: deptList[0].id.toString() }))
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load form data")
      } finally {
        setDataLoading(false)
      }
    }

    if (profile?.id) {
      fetchData()
    }
  }, [profile])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    const validFiles = selectedFiles.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not supported.`)
        return false
      }

      return true
    })

    setFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitStatus({ step: "Preparing", message: "Preparing ticket data...", type: "loading" })

    try {
      console.log("🚀 Starting ticket submission...")

      // Validate profile data
      if (!profile?.id || !profile?.organization_id) {
        throw new Error("User profile not found. Please refresh and try again.")
      }

      // Validate required fields
      if (!formData.title.trim() || !formData.description.trim()) {
        throw new Error("Title and description are required")
      }

      if (!formData.departmentId) {
        throw new Error("Please select a department")
      }

      setSubmitStatus({ step: "Creating", message: "Creating ticket...", type: "loading" })

      // Prepare form data for API
      const apiFormData = new FormData()
      apiFormData.append("title", formData.title.trim())
      apiFormData.append("description", formData.description.trim())
      apiFormData.append("priority", formData.priority)
      apiFormData.append("departmentId", formData.departmentId)
      apiFormData.append("visibility", formData.visibility)

      // Add the missing required fields
      apiFormData.append("organizationId", profile.organization_id.toString())
      apiFormData.append("createdBy", profile.id.toString())

      if (formData.categoryId) {
        apiFormData.append("categoryId", formData.categoryId)
      }

      // Add files
      files.forEach((file) => {
        apiFormData.append("files", file)
      })

      setSubmitStatus({ step: "Uploading", message: "Uploading files...", type: "loading" })

      console.log("📤 Sending request to API with data:", {
        title: formData.title.substring(0, 30) + "...",
        organizationId: profile.organization_id,
        createdBy: profile.id,
        departmentId: formData.departmentId,
        filesCount: files.length,
      })

      // Send to API
      const response = await fetch("/api/tickets/create", {
        method: "POST",
        body: apiFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("❌ API Error:", result)
        throw new Error(result.error || `Server error: ${response.status}`)
      }

      console.log("✅ API Success:", result)

      setSubmitStatus({ step: "Complete", message: "Ticket created successfully!", type: "success" })

      toast.success("Ticket created successfully!")

      // Reset form
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        categoryId: "",
        departmentId: departments.length === 1 ? departments[0].id.toString() : "",
        visibility: "public",
      })
      setFiles([])

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/user/tickets/${result.ticket.id}`)
      }
    } catch (error: any) {
      console.error("💥 Submit error:", error)
      setSubmitStatus({ step: "Error", message: error.message, type: "error" })
      toast.error(error.message || "Failed to create ticket")
    } finally {
      setLoading(false)
      // Clear status after 5 seconds
      setTimeout(() => setSubmitStatus(null), 5000)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-50"
      case "high":
        return "border-orange-500 bg-orange-50"
      case "medium":
        return "border-yellow-500 bg-yellow-50"
      case "low":
        return "border-green-500 bg-green-50"
      default:
        return "border-gray-300 bg-gray-50"
    }
  }

  if (dataLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading form data...</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // Show error if no profile
  if (!profile?.id || !profile?.organization_id) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Required</h3>
            <p className="text-gray-600 mb-4">
              Your user profile is required to create tickets. Please refresh the page or contact support.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">Create New Ticket</CardTitle>
          <CardDescription>
            Describe your issue or complaint in detail. Our team will review and respond promptly.
          </CardDescription>
          {/* Debug info in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
              Debug: User ID: {profile.id}, Org ID: {profile.organization_id}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Status Alert */}
          {submitStatus && (
            <Alert
              className={`mb-6 ${
                submitStatus.type === "success"
                  ? "border-green-500 bg-green-50"
                  : submitStatus.type === "error"
                    ? "border-red-500 bg-red-50"
                    : "border-blue-500 bg-blue-50"
              }`}
            >
              <div className="flex items-center space-x-2">
                {submitStatus.type === "loading" && (
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                )}
                {submitStatus.type === "success" && <CheckCircle className="w-4 h-4 text-green-600" />}
                {submitStatus.type === "error" && <XCircle className="w-4 h-4 text-red-600" />}
                <AlertDescription>
                  <strong>{submitStatus.step}:</strong> {submitStatus.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Title *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Brief description of your issue"
                className="h-11"
                required
                disabled={loading}
              />
            </div>

            {/* Department and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Department *
                </Label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(value) => handleInputChange("departmentId", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {departments.length === 0 && (
                  <p className="text-sm text-red-600">No departments available. Please contact admin.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category
                </Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleInputChange("categoryId", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Priority Level *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "low", label: "Low", desc: "Minor issue" },
                  { value: "medium", label: "Medium", desc: "Standard issue" },
                  { value: "high", label: "High", desc: "Important issue" },
                  { value: "critical", label: "Critical", desc: "Urgent issue" },
                ].map((priority) => (
                  <motion.div
                    key={priority.value}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.priority === priority.value
                        ? getPriorityColor(priority.value)
                        : "border-gray-200 hover:border-gray-300"
                    } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !loading && handleInputChange("priority", priority.value)}
                  >
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{priority.label}</p>
                      <p className="text-xs text-gray-500">{priority.desc}</p>
                    </div>
                  </motion.div>
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
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Provide detailed information about your issue..."
                className="min-h-32 resize-none"
                required
                disabled={loading}
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Attachments</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    disabled={loading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload files or drag and drop</p>
                    <p className="text-xs text-gray-500">Images, PDF, Word documents, Text files (max 10MB each)</p>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Visibility</Label>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Make ticket visible to department</p>
                    <p className="text-xs text-gray-500">
                      Allow other team members to view and contribute to this ticket
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.visibility === "public"}
                  onCheckedChange={(checked) => handleInputChange("visibility", checked ? "public" : "private")}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <motion.div whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}>
                <Button
                  type="submit"
                  disabled={loading || departments.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      {submitStatus?.step || "Creating..."}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Create Ticket
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
