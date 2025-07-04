"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Settings,
  Save,
  Building,
  Mail,
  Phone,
  MapPin,
  Palette,
  Bell,
  Shield,
  Database,
  Upload,
  Download,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth/auth-context"
import toast from "react-hot-toast"

interface OrganizationSettings {
  id: number
  name: string
  admin_email: string
  admin_name: string
  phone: string | null
  address: string | null
  logo_url: string | null
  settings: {
    theme_color: string
    allow_public_tickets: boolean
    require_approval: boolean
    email_notifications: boolean
    auto_assign_tickets: boolean
    max_file_size: number
    allowed_file_types: string[]
  }
}

export default function AdminSettings() {
  const { profile } = useAuth()
  const [organization, setOrganization] = useState<OrganizationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizationSettings()
  }, [profile])

  const fetchOrganizationSettings = async () => {
    try {
      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single()

      if (error) throw error

      // Set default settings if none exist
      const defaultSettings = {
        theme_color: "#7c3aed",
        allow_public_tickets: true,
        require_approval: true,
        email_notifications: true,
        auto_assign_tickets: false,
        max_file_size: 10,
        allowed_file_types: ["image/jpeg", "image/png", "application/pdf", "text/plain"],
      }

      setOrganization({
        ...data,
        settings: { ...defaultSettings, ...(data.settings || {}) },
      })
    } catch (error) {
      console.error("Error fetching organization settings:", error)
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!organization) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: organization.name,
          admin_email: organization.admin_email,
          admin_name: organization.admin_name,
          phone: organization.phone,
          address: organization.address,
          logo_url: organization.logo_url,
          settings: organization.settings,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organization.id)

      if (error) throw error

      toast.success("Settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const updateOrganization = (field: string, value: any) => {
    if (!organization) return
    setOrganization({ ...organization, [field]: value })
  }

  const updateSettings = (field: string, value: any) => {
    if (!organization) return
    setOrganization({
      ...organization,
      settings: { ...organization.settings, [field]: value },
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Not Found</h3>
        <p className="text-gray-600">Unable to load organization settings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure your organization settings and preferences</p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {saving ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </motion.div>
      </motion.div>

      {/* Settings Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Organization Information</span>
                </CardTitle>
                <CardDescription>Basic information about your organization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Organization Name</Label>
                    <Input
                      id="org-name"
                      value={organization.name}
                      onChange={(e) => updateOrganization("name", e.target.value)}
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-name">Admin Name</Label>
                    <Input
                      id="admin-name"
                      value={organization.admin_name}
                      onChange={(e) => updateOrganization("admin_name", e.target.value)}
                      placeholder="Enter admin name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="admin-email"
                        type="email"
                        value={organization.admin_email}
                        onChange={(e) => updateOrganization("admin_email", e.target.value)}
                        placeholder="admin@example.com"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="phone"
                        value={organization.phone || ""}
                        onChange={(e) => updateOrganization("phone", e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <Textarea
                      id="address"
                      value={organization.address || ""}
                      onChange={(e) => updateOrganization("address", e.target.value)}
                      placeholder="Enter organization address"
                      className="pl-10 min-h-20"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center space-x-2">
                    <Palette className="w-5 h-5" />
                    <span>Appearance</span>
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="theme-color">Theme Color</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="theme-color"
                        type="color"
                        value={organization.settings.theme_color}
                        onChange={(e) => updateSettings("theme_color", e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        value={organization.settings.theme_color}
                        onChange={(e) => updateSettings("theme_color", e.target.value)}
                        placeholder="#7c3aed"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Settings</span>
                </CardTitle>
                <CardDescription>Configure how and when notifications are sent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send email notifications for ticket updates</p>
                  </div>
                  <Switch
                    checked={organization.settings.email_notifications}
                    onCheckedChange={(checked) => updateSettings("email_notifications", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-assign Tickets</Label>
                    <p className="text-sm text-gray-500">Automatically assign tickets to available team members</p>
                  </div>
                  <Switch
                    checked={organization.settings.auto_assign_tickets}
                    onCheckedChange={(checked) => updateSettings("auto_assign_tickets", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription>Configure security and access control settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Require User Approval</Label>
                    <p className="text-sm text-gray-500">New users must be approved before accessing the system</p>
                  </div>
                  <Switch
                    checked={organization.settings.require_approval}
                    onCheckedChange={(checked) => updateSettings("require_approval", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow Public Tickets</Label>
                    <p className="text-sm text-gray-500">Allow users to create tickets visible to their department</p>
                  </div>
                  <Switch
                    checked={organization.settings.allow_public_tickets}
                    onCheckedChange={(checked) => updateSettings("allow_public_tickets", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>System Configuration</span>
                </CardTitle>
                <CardDescription>Configure system-wide settings and file upload limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="max-file-size">Maximum File Size (MB)</Label>
                  <Input
                    id="max-file-size"
                    type="number"
                    value={organization.settings.max_file_size}
                    onChange={(e) => updateSettings("max_file_size", Number.parseInt(e.target.value))}
                    min="1"
                    max="100"
                  />
                  <p className="text-sm text-gray-500">Maximum file size for ticket attachments</p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Data Management</h3>
                  <div className="flex space-x-4">
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Import Data
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
