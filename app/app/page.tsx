"use client"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Ticket, MessageSquare, Users, Settings, BarChart3, Shield } from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else {
        // Redirect based on user role
        switch (user.role) {
          case "admin":
            router.push("/admin")
            break
          case "supervisor":
            router.push("/supervisor")
            break
          default:
            router.push("/dashboard")
        }
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 animate-fade-in">Professional Ticketing System</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-slide-up">
            Streamline your organization's support workflow with our advanced ticketing system featuring real-time chat,
            comprehensive analytics, and seamless collaboration tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="card-3d card-shadow-3d hover:shadow-2xl transition-all duration-300 animate-slide-up">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Ticket className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Ticketing</h3>
              <p className="text-gray-600">
                Create, track, and manage tickets with intelligent routing and priority management.
              </p>
            </CardContent>
          </Card>

          <Card
            className="card-3d card-shadow-3d hover:shadow-2xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Chat</h3>
              <p className="text-gray-600">
                Collaborate instantly with team members and customers through integrated chat.
              </p>
            </CardContent>
          </Card>

          <Card
            className="card-3d card-shadow-3d hover:shadow-2xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
              <p className="text-gray-600">Gain insights with comprehensive reporting and performance metrics.</p>
            </CardContent>
          </Card>

          <Card
            className="card-3d card-shadow-3d hover:shadow-2xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Team Management</h3>
              <p className="text-gray-600">Organize teams, assign roles, and manage permissions effortlessly.</p>
            </CardContent>
          </Card>

          <Card
            className="card-3d card-shadow-3d hover:shadow-2xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Enterprise Security</h3>
              <p className="text-gray-600">Bank-level security with role-based access control and audit trails.</p>
            </CardContent>
          </Card>

          <Card
            className="card-3d card-shadow-3d hover:shadow-2xl transition-all duration-300 animate-slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Customizable</h3>
              <p className="text-gray-600">Tailor the system to your organization's unique workflow and branding.</p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button
            onClick={() => router.push("/login")}
            className="btn-3d bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg rounded-xl"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}
