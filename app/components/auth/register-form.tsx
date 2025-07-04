"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Building, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    organizationId: "",
    selectedDepartments: [] as string[],
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Fetch organizations on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      const { data, error } = await supabase.from("organizations").select("id, name").eq("is_active", true)

      if (!error && data) {
        setOrganizations(data)
      }
    }

    fetchOrganizations()
  }, [])

  // Fetch departments when organization is selected
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!formData.organizationId) {
        setDepartments([])
        return
      }

      const { data, error } = await supabase
        .from("departments")
        .select("id, name, description, color")
        .eq("organization_id", formData.organizationId)
        .eq("is_active", true)

      if (!error && data) {
        setDepartments(data)
      }
    }

    fetchDepartments()
    // Reset selected departments when organization changes
    setFormData((prev) => ({ ...prev, selectedDepartments: [] }))
  }, [formData.organizationId])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleDepartmentToggle = (departmentId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedDepartments: prev.selectedDepartments.includes(departmentId)
        ? prev.selectedDepartments.filter((id) => id !== departmentId)
        : [...prev.selectedDepartments, departmentId],
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }

      if (!formData.organizationId) {
        throw new Error("Please select an organization")
      }

      if (formData.selectedDepartments.length === 0) {
        throw new Error("Please select at least one department")
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            auth_id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone || null,
            organization_id: Number.parseInt(formData.organizationId),
            role: "user",
            is_approved: false,
          })
          .select()
          .single()

        if (profileError) throw profileError

        // Assign user to selected departments
        const departmentAssignments = formData.selectedDepartments.map((deptId) => ({
          user_id: profileData.id,
          department_id: Number.parseInt(deptId),
          is_supervisor: false,
          can_assign_tickets: false,
        }))

        const { error: deptError } = await supabase.from("user_departments").insert(departmentAssignments)

        if (deptError) throw deptError

        toast.success("Registration successful! Please wait for admin approval.")
        router.push("/auth/pending-approval")
      }
    } catch (error: any) {
      toast.error(error.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-4"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
            <CardDescription className="text-gray-600">
              Join your organization's complaint management system
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Organization Selection */}
              <div className="space-y-2">
                <Label htmlFor="organization" className="text-sm font-medium text-gray-700">
                  Organization *
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                  <Select
                    value={formData.organizationId}
                    onValueChange={(value) => handleInputChange("organizationId", value)}
                  >
                    <SelectTrigger className="pl-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500">
                      <SelectValue placeholder="Select your organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id.toString()}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Department Selection */}
              {formData.organizationId && departments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Departments * <span className="text-gray-500">(Select all that apply)</span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    {departments.map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`dept-${dept.id}`}
                          checked={formData.selectedDepartments.includes(dept.id.toString())}
                          onCheckedChange={() => handleDepartmentToggle(dept.id.toString())}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`dept-${dept.id}`}
                            className="text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            {dept.name}
                          </label>
                          {dept.description && <p className="text-xs text-gray-500 mt-1">{dept.description}</p>}
                        </div>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: dept.color }}
                          title={dept.name}
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    You can be part of multiple departments. Select all departments you work with.
                  </p>
                </div>
              )}

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10 pr-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Confirm your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors mt-6"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Users className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </motion.div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={() => router.push("/auth/login")}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
