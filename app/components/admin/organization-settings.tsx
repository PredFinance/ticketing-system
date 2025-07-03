"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Upload, Save, RefreshCw, Mail, Phone, MapPin, Globe } from "lucide-react"
import toast from "react-hot-toast"

interface Organization {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  website?: string
  description?: string
  created_at: string
  updated_at: string
}

export function AdminOrganizationSettings() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      const response = await fetch("/api/admin/organization", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        if (data.logo_url) {
          setLogoPreview(data.logo_url)
        }
      } else {
        toast.error("Failed to load organization settings")
      }
    } catch (error) {
      toast.error("Failed to load organization settings")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Logo file size must be less than 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file")
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (field: keyof Organization, value: string) => {
    if (organization) {
      setOrganization({ ...organization, [field]: value })
    }
  }

  const saveOrganization = async () => {
    if (!organization) return

    setSaving(true)
    try {
      const formData = new FormData()

      // Add organization data
      Object.entries(organization).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value.toString())
        }
      })

      // Add logo file if selected
      if (logoFile) {
        formData.append("logo", logoFile)
      }

      const response = await fetch("/api/admin/organization", {
        method: "PUT",
        credentials: "include",
        body: formData,
      })

      if (response.ok) {
        toast.success("Organization settings saved successfully")
        fetchOrganization()
        setLogoFile(null)
      } else {
        toast.error("Failed to save organization settings")
      }
    } catch (error) {
      toast.error("Failed to save organization settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner mr-2"></div>
        <span>Loading organization settings...</span>
      </div>
    )
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No organization data found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Organization Settings
            </CardTitle>
            <CardDescription>Manage your organization's profile and branding</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={fetchOrganization}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={saveOrganization} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving ? (
                <>
                  <div className="spinner mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

            <div>
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={organization.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter organization name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={organization.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Enter organization description"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={organization.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="contact@organization.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  value={organization.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="website"
                  type="url"
                  value={organization.website || ""}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://www.organization.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                <Textarea
                  id="address"
                  value={organization.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter organization address"
                  rows={3}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Branding</h3>

            {/* Logo Upload */}
            <div>
              <Label htmlFor="logo">Organization Logo</Label>
              <div className="mt-2 flex items-center space-x-4">
                <Avatar className="w-20 h-20 rounded-lg">
                  <AvatarImage src={logoPreview || "/placeholder.svg"} className="object-cover" />
                  <AvatarFallback className="bg-gray-100 text-gray-600 rounded-lg">
                    <Building2 className="w-8 h-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById("logo-upload")?.click()}
                      className="relative"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Logo
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Recommended: 200x200px, PNG or JPG, max 5MB</p>
                  {logoFile && <p className="text-sm text-green-600 mt-1">New logo selected: {logoFile.name}</p>}
                </div>
              </div>
            </div>

            {/* Color Scheme */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-300"
                    style={{ backgroundColor: organization.primary_color }}
                  />
                  <Input
                    id="primary_color"
                    type="color"
                    value={organization.primary_color}
                    onChange={(e) => handleInputChange("primary_color", e.target.value)}
                    className="w-20 h-10 p-1 border border-gray-300 rounded"
                  />
                  <Input
                    value={organization.primary_color}
                    onChange={(e) => handleInputChange("primary_color", e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-300"
                    style={{ backgroundColor: organization.secondary_color }}
                  />
                  <Input
                    id="secondary_color"
                    type="color"
                    value={organization.secondary_color}
                    onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                    className="w-20 h-10 p-1 border border-gray-300 rounded"
                  />
                  <Input
                    value={organization.secondary_color}
                    onChange={(e) => handleInputChange("secondary_color", e.target.value)}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Color Preview</h4>
              <div className="space-y-2">
                <div
                  className="h-8 rounded flex items-center px-3 text-white text-sm font-medium"
                  style={{ backgroundColor: organization.primary_color }}
                >
                  Primary Color Sample
                </div>
                <div
                  className="h-8 rounded flex items-center px-3 text-white text-sm font-medium"
                  style={{ backgroundColor: organization.secondary_color }}
                >
                  Secondary Color Sample
                </div>
              </div>
            </div>

            {/* Organization Stats */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Organization Stats</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="font-medium">
                    {new Date(organization.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="font-medium">
                    {new Date(organization.updated_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
