"use client"

import type React from "react"

import { useAuth } from "@/lib/auth/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ("admin" | "supervisor" | "user")[]
  requireApproval?: boolean
}

export default function ProtectedRoute({
  children,
  allowedRoles = ["admin", "supervisor", "user"],
  requireApproval = true,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (!profile) {
        router.push("/auth/login")
        return
      }

      if (requireApproval && !profile.is_approved) {
        router.push("/auth/pending-approval")
        return
      }

      if (!allowedRoles.includes(profile.role)) {
        // Redirect to appropriate dashboard based on role
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
        }
        return
      }
    }
  }, [user, profile, loading, router, allowedRoles, requireApproval])

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

  if (!user || !profile || (requireApproval && !profile.is_approved)) {
    return null
  }

  if (!allowedRoles.includes(profile.role)) {
    return null
  }

  return <>{children}</>
}
