"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Mail, Shield, User, LogOut } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function PendingApproval() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Pending Approval</h1>
          <p className="text-gray-600">Your account is waiting for administrator approval</p>
        </div>

        <Card className="shadow-xl border-0 animate-slide-up">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center">
              <Shield className="w-5 h-5 mr-2 text-orange-600" />
              Welcome, {user?.firstName}!
            </CardTitle>
            <CardDescription>Your account has been created successfully</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-orange-200 bg-orange-50">
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-orange-800">
                Your account is currently pending approval from an administrator. You'll receive an email notification
                once your account is activated.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Account Status</p>
                  <p className="text-sm text-gray-600">Pending Administrator Approval</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Email Address</p>
                  <p className="text-sm text-gray-600">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                While you wait, an administrator will review your account and activate it soon. You'll be able to:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Create and manage support tickets</li>
                <li>• Collaborate with team members</li>
                <li>• Access department resources</li>
                <li>• Participate in ticket discussions</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
                Check Status
              </Button>
              <Button variant="outline" onClick={logout} className="flex-1 bg-transparent">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact your system administrator</p>
        </div>
      </div>
    </div>
  )
}
