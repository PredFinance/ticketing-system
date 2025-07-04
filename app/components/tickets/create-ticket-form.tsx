"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Send, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import toast from "react-hot-toast"

interface CreateTicketFormProps {
  onSuccess?: () => void
}

export default function CreateTicketForm({ onSuccess }: CreateTicketFormProps) {
  const { profile } = useAuth()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    categoryId: "",
    departmentId: "",
    visibility: "public",
    tags: [] as string[],
  })
  const [files, setFiles] = useState<File[]>([])
  const [newTag, setNewTag] = useState("")
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Fetch categories and departments on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data for profile:", profile)

        if (!profile?.organization_id) {
          console.log("No organization_id found")
          setDataLoading(false)
          return
        }

        console.log("Fetching categories for org:", profile.organization_id)

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("ticket_categories")
          .select("*")
          .eq("organization_id", profile.organization_id)
          .eq("is_active", true)

        console.log("Categories result:", { categoriesData, categoriesError })

        // Fetch user's departments
        const { data: userDepts, error: deptsError } = await supabase
          .from("user_departments")
          .select(`
            departments (
              id,
              name
            )
          `)
          .eq("user_id", profile.id)

        console.log("User departments result:", { userDepts, deptsError })

        if (categoriesError) {
          console.error("Categories error:", categoriesError)
          toast.error("Failed to load categories")
        } else {
          setCategories(categoriesData || [])
        }

        if (deptsError) {
          console.error("Departments error:", deptsError)
          toast.error("Failed to load departments")
        } else {
          const deptList = userDepts?.map((ud: any) => ud.departments).filter(Boolean) || []
          setDepartments(deptList)

          // Set default department if user has only one
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
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]

      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not supported. Please upload images or documents only.`)
        return false
      }

      return true
    })

    setFiles((prev) => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("Starting ticket creation...")
      console.log("Form data:", formData)
      console.log("Profile:", profile)

      if (!profile?.id || !profile?.organization_id) {
        throw new Error("User profile not found")
      }

      if (!formData.title.trim() || !formData.description.trim()) {
        throw new Error("Title and description are required")
      }

      if (!formData.departmentId) {
        throw new Error("Please select a department")
      }

      console.log("Creating ticket with data:", {
        organization_id: profile.organization_id,
        department_id: Number.parseInt(formData.departmentId),
        category_id: formData.categoryId ? Number.parseInt(formData.categoryId) : null,
        created_by: profile.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        visibility: formData.visibility,
        tags: formData.tags.length > 0 ? formData.tags : null,
      })

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("tickets")
        .insert({
          organization_id: profile.organization_id,
          department_id: Number.parseInt(formData.departmentId),
          category_id: formData.categoryId ? Number.parseInt(formData.categoryId) : null,
          created_by: profile.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          priority: formData.priority,
          visibility: formData.visibility,
          tags: formData.tags.length > 0 ? formData.tags : null,
        })
        .select()
        .single()

      console.log("Ticket creation result:", { ticket, ticketError })

      if (ticketError) {
        console.error("Ticket creation error:", ticketError)
        throw ticketError
      }

      if (!ticket) {
        throw new Error("Failed to create ticket - no data returned")
      }

      console.log("Ticket created successfully:", ticket)

      toast.success("Ticket created successfully!")

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(`/user/tickets/${ticket.id}`)
      }
    } catch (error: any) {
      console.error("Submit error:", error)
      toast.error(error.message || "Failed to create ticket")
    } finally {
      setLoading(false)
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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">Create New Ticket</CardTitle>
          <CardDescription>
            Describe your issue or complaint in detail. Our team will review and respond promptly.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>Profile ID: {profile?.id}</p>
            <p>Organization ID: {profile?.organization_id}</p>
            <p>Departments: {departments.length}</p>
            <p>Categories: {categories.length}</p>
          </div>

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
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept: any) => (
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
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.priority === priority.value
                        ? getPriorityColor(priority.value)
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => handleInputChange("priority", priority.value)}
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
              />
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
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                      Creating...
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
