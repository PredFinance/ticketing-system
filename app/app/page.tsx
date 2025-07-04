"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, Ticket, Shield, Users, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && profile) {
      // Redirect authenticated users to their appropriate dashboard
      if (!profile.is_approved) {
        router.push("/auth/pending-approval")
        return
      }

      switch (profile.role) {
        case "admin":
          router.push("/admin/dashboard")
          break
        case "supervisor":
          router.push("/supervisor/dashboard")
          break
        case "user":
          router.push("/user/dashboard")
          break
        default:
          router.push("/auth/login")
      }
    }
  }, [user, profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </motion.div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ComplaintMS</span>
            </motion.div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push("/auth/login")}>
                Sign In
              </Button>
              <Button onClick={() => router.push("/auth/register")} className="bg-purple-600 hover:bg-purple-700">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Professional
              <span className="text-purple-600"> Complaint Management</span>
              <br />
              System
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your organization's complaint handling process with our comprehensive ticket management system.
              Built for teams, designed for efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  onClick={() => router.push("/auth/register")}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                >
                  Start Free Trial
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/auth/login")}
                  className="border-purple-200 text-purple-600 hover:bg-purple-50 px-8 py-3 text-lg"
                >
                  Sign In
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to manage complaints
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From ticket creation to resolution, our platform provides all the tools your organization needs.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Role-Based Access",
                description: "Admin, Supervisor, and User roles with appropriate permissions and dashboards.",
                color: "bg-red-500",
              },
              {
                icon: Ticket,
                title: "Smart Ticketing",
                description: "Create, track, and manage tickets with priorities, categories, and file attachments.",
                color: "bg-purple-500",
              },
              {
                icon: Users,
                title: "Team Collaboration",
                description: "Department-wide collaboration with public tickets and real-time comments.",
                color: "bg-blue-500",
              },
              {
                icon: Building,
                title: "Multi-Department",
                description: "Support for multiple departments with dedicated supervisors and workflows.",
                color: "bg-green-500",
              },
              {
                icon: Loader2,
                title: "Real-Time Updates",
                description: "Instant notifications and live updates across all users and departments.",
                color: "bg-yellow-500",
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description: "Built with security in mind, powered by Supabase with enterprise-grade infrastructure.",
                color: "bg-indigo-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm h-full">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`w-12 h-12 ${feature.color} rounded-xl flex items-center justify-center mx-auto mb-4`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to streamline your complaint management?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join organizations worldwide who trust ComplaintMS for their ticket management needs.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                onClick={() => router.push("/auth/register")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
              >
                Get Started Today
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ComplaintMS</span>
          </div>
          <p className="text-gray-400 mb-4">Professional complaint management for modern organizations</p>
          <p className="text-sm text-gray-500">© 2024 ComplaintMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
