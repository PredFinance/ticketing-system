"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Settings, Mail, Shield, Clock, Bell, Database, Save, RefreshCw, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"

interface SystemSetting {
  id: number
  setting_key: string
  setting_value: string | null
  setting_type: "string" | "number" | "boolean" | "json"
  description: string | null
  is_public: boolean
}

export function AdminSystemSettings() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settingsData, setSettingsData] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings", { credentials: "include" })
      if (response.ok) {
        const data = await response.json()
        setSettings(data)

        // Convert settings array to object for easier manipulation
        const settingsObj: Record<string, any> = {}
        data.forEach((setting: SystemSetting) => {
          let value = setting.setting_value
          if (setting.setting_type === "boolean") {
            value = (value === "true").toString()
          } else if (setting.setting_type === "number") {
            value = value ? Number.parseFloat(value).toString() : "0"
          } else if (setting.setting_type === "json") {
            try {
              value = value ? JSON.parse(value) : ""
            } catch {
              value = ""
            }
          }
          settingsObj[setting.setting_key] = value
        })
        setSettingsData(settingsObj)
      } else {
        toast.error("Failed to load settings")
      }
    } catch (error) {
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettingsData((prev) => ({ ...prev, [key]: value }))
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settingsData),
      })

      if (response.ok) {
        toast.success("Settings saved successfully")
        fetchSettings()
      } else {
        toast.error("Failed to save settings")
      }
    } catch (error) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const resetToDefaults = async () => {
    try {
      const response = await fetch("/api/admin/settings/reset", {
        method: "POST",
        credentials: "include",
      })

      if (response.ok) {
        toast.success("Settings reset to defaults")
        fetchSettings()
      } else {
        toast.error("Failed to reset settings")
      }
    } catch (error) {
      toast.error("Failed to reset settings")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner mr-2"></div>
        <span>Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-600">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={resetToDefaults} className="text-orange-600 bg-transparent">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} disabled={saving} className="bg-green-600 hover:bg-green-700">
            {saving ? (
              <>
                <div className="spinner mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              General Settings
            </CardTitle>
            <CardDescription>Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="system_name">System Name</Label>
              <Input
                id="system_name"
                value={settingsData.system_name || ""}
                onChange={(e) => updateSetting("system_name", e.target.value)}
                placeholder="Enter system name"
              />
            </div>
            <div>
              <Label htmlFor="system_description">System Description</Label>
              <Textarea
                id="system_description"
                value={settingsData.system_description || ""}
                onChange={(e) => updateSetting("system_description", e.target.value)}
                placeholder="Enter system description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="default_language">Default Language</Label>
              <Select
                value={settingsData.default_language || "en"}
                onValueChange={(value) => updateSetting("default_language", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="default_timezone">Default Timezone</Label>
              <Select
                value={settingsData.default_timezone || "UTC"}
                onValueChange={(value) => updateSetting("default_timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Email Settings
            </CardTitle>
            <CardDescription>Configure email notifications and SMTP</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_notifications_enabled">Email Notifications</Label>
                <p className="text-sm text-gray-500">Send email notifications for ticket updates</p>
              </div>
              <Switch
                id="email_notifications_enabled"
                checked={settingsData.email_notifications_enabled || false}
                onCheckedChange={(checked) => updateSetting("email_notifications_enabled", checked)}
              />
            </div>
            <Separator />
            <div>
              <Label htmlFor="smtp_host">SMTP Host</Label>
              <Input
                id="smtp_host"
                value={settingsData.smtp_host || ""}
                onChange={(e) => updateSetting("smtp_host", e.target.value)}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtp_port">SMTP Port</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  value={settingsData.smtp_port || 587}
                  onChange={(e) => updateSetting("smtp_port", Number.parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="smtp_encryption">Encryption</Label>
                <Select
                  value={settingsData.smtp_encryption || "tls"}
                  onValueChange={(value) => updateSetting("smtp_encryption", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="tls">TLS</SelectItem>
                    <SelectItem value="ssl">SSL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="smtp_username">SMTP Username</Label>
              <Input
                id="smtp_username"
                value={settingsData.smtp_username || ""}
                onChange={(e) => updateSetting("smtp_username", e.target.value)}
                placeholder="username@example.com"
              />
            </div>
            <div>
              <Label htmlFor="from_email">From Email Address</Label>
              <Input
                id="from_email"
                type="email"
                value={settingsData.from_email || ""}
                onChange={(e) => updateSetting("from_email", e.target.value)}
                placeholder="noreply@example.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security and authentication</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
              <Input
                id="session_timeout"
                type="number"
                value={settingsData.session_timeout || 60}
                onChange={(e) => updateSetting("session_timeout", Number.parseInt(e.target.value))}
                min="5"
                max="1440"
              />
            </div>
            <div>
              <Label htmlFor="password_min_length">Minimum Password Length</Label>
              <Input
                id="password_min_length"
                type="number"
                value={settingsData.password_min_length || 8}
                onChange={(e) => updateSetting("password_min_length", Number.parseInt(e.target.value))}
                min="6"
                max="50"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_password_complexity">Password Complexity</Label>
                <p className="text-sm text-gray-500">Require uppercase, lowercase, numbers, and symbols</p>
              </div>
              <Switch
                id="require_password_complexity"
                checked={settingsData.require_password_complexity || false}
                onCheckedChange={(checked) => updateSetting("require_password_complexity", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_email_verification">Email Verification</Label>
                <p className="text-sm text-gray-500">Require email verification for new accounts</p>
              </div>
              <Switch
                id="require_email_verification"
                checked={settingsData.require_email_verification || true}
                onCheckedChange={(checked) => updateSetting("require_email_verification", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto_approve_users">Auto-approve Users</Label>
                <p className="text-sm text-gray-500">Automatically approve new user registrations</p>
              </div>
              <Switch
                id="auto_approve_users"
                checked={settingsData.auto_approve_users || false}
                onCheckedChange={(checked) => updateSetting("auto_approve_users", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ticket Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Ticket Settings
            </CardTitle>
            <CardDescription>Configure ticket behavior and defaults</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="default_ticket_priority">Default Ticket Priority</Label>
              <Select
                value={settingsData.default_ticket_priority || "medium"}
                onValueChange={(value) => updateSetting("default_ticket_priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ticket_number_prefix">Ticket Number Prefix</Label>
              <Input
                id="ticket_number_prefix"
                value={settingsData.ticket_number_prefix || "TKT"}
                onChange={(e) => updateSetting("ticket_number_prefix", e.target.value)}
                placeholder="TKT"
                maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor="auto_close_resolved_after">Auto-close Resolved Tickets (days)</Label>
              <Input
                id="auto_close_resolved_after"
                type="number"
                value={settingsData.auto_close_resolved_after || 7}
                onChange={(e) => updateSetting("auto_close_resolved_after", Number.parseInt(e.target.value))}
                min="0"
                max="365"
              />
              <p className="text-sm text-gray-500 mt-1">Set to 0 to disable auto-closing</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow_public_ticket_creation">Public Ticket Creation</Label>
                <p className="text-sm text-gray-500">Allow users to create public tickets by default</p>
              </div>
              <Switch
                id="allow_public_ticket_creation"
                checked={settingsData.allow_public_ticket_creation || false}
                onCheckedChange={(checked) => updateSetting("allow_public_ticket_creation", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="require_category_selection">Require Category</Label>
                <p className="text-sm text-gray-500">Require users to select a category when creating tickets</p>
              </div>
              <Switch
                id="require_category_selection"
                checked={settingsData.require_category_selection || false}
                onCheckedChange={(checked) => updateSetting("require_category_selection", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_on_ticket_created">New Ticket Notifications</Label>
                <p className="text-sm text-gray-500">Notify supervisors when new tickets are created</p>
              </div>
              <Switch
                id="notify_on_ticket_created"
                checked={settingsData.notify_on_ticket_created || true}
                onCheckedChange={(checked) => updateSetting("notify_on_ticket_created", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_on_ticket_assigned">Assignment Notifications</Label>
                <p className="text-sm text-gray-500">Notify users when tickets are assigned to them</p>
              </div>
              <Switch
                id="notify_on_ticket_assigned"
                checked={settingsData.notify_on_ticket_assigned || true}
                onCheckedChange={(checked) => updateSetting("notify_on_ticket_assigned", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_on_status_change">Status Change Notifications</Label>
                <p className="text-sm text-gray-500">Notify users when ticket status changes</p>
              </div>
              <Switch
                id="notify_on_status_change"
                checked={settingsData.notify_on_status_change || true}
                onCheckedChange={(checked) => updateSetting("notify_on_status_change", checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify_on_comment_added">Comment Notifications</Label>
                <p className="text-sm text-gray-500">Notify users when comments are added to their tickets</p>
              </div>
              <Switch
                id="notify_on_comment_added"
                checked={settingsData.notify_on_comment_added || true}
                onCheckedChange={(checked) => updateSetting("notify_on_comment_added", checked)}
              />
            </div>
            <div>
              <Label htmlFor="notification_digest_frequency">Digest Frequency</Label>
              <Select
                value={settingsData.notification_digest_frequency || "daily"}
                onValueChange={(value) => updateSetting("notification_digest_frequency", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* File Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              File Upload Settings
            </CardTitle>
            <CardDescription>Configure file upload limits and restrictions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max_file_size">Maximum File Size (MB)</Label>
              <Input
                id="max_file_size"
                type="number"
                value={settingsData.max_file_size || 10}
                onChange={(e) => updateSetting("max_file_size", Number.parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>
            <div>
              <Label htmlFor="max_files_per_ticket">Maximum Files per Ticket</Label>
              <Input
                id="max_files_per_ticket"
                type="number"
                value={settingsData.max_files_per_ticket || 5}
                onChange={(e) => updateSetting("max_files_per_ticket", Number.parseInt(e.target.value))}
                min="1"
                max="20"
              />
            </div>
            <div>
              <Label htmlFor="allowed_file_types">Allowed File Types</Label>
              <Textarea
                id="allowed_file_types"
                value={settingsData.allowed_file_types || "jpg,jpeg,png,gif,pdf,doc,docx,txt"}
                onChange={(e) => updateSetting("allowed_file_types", e.target.value)}
                placeholder="jpg,jpeg,png,gif,pdf,doc,docx,txt"
                rows={2}
              />
              <p className="text-sm text-gray-500 mt-1">Comma-separated list of allowed file extensions</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="scan_uploaded_files">Virus Scanning</Label>
                <p className="text-sm text-gray-500">Scan uploaded files for viruses (requires external service)</p>
              </div>
              <Switch
                id="scan_uploaded_files"
                checked={settingsData.scan_uploaded_files || false}
                onCheckedChange={(checked) => updateSetting("scan_uploaded_files", checked)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Status */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">
                Settings Status: {Object.keys(settingsData).length} configurations loaded
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                Last Updated: {new Date().toLocaleDateString()}
              </Badge>
              <Badge variant="outline" className="text-green-700 border-green-300">
                All Systems Operational
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
