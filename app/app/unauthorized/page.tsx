"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, ArrowLeft, Home } from "lucide-react"
import { useRouter } from "next/navigation"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page</p>
        </div>

        <Card className="shadow-xl border-0 animate-slide-up">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Unauthorized Access</CardTitle>
            <CardDescription>This page requires special permissions that your account doesn't have</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                If you believe you should have access to this page, please contact your system administrator.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => router.push("/dashboard")} className="flex-1 bg-purple-600 hover:bg-purple-700">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
