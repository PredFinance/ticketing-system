"use client"

import type React from "react"

import { useAuth } from "@/lib/auth/auth-context"
import Navigation from "./navigation"
import ProtectedRoute from "../auth/protected-route"

interface DashboardLayoutProps {
  children: React.ReactNode
  allowedRoles?: ("admin" | "supervisor" | "user")[]
}

export default function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const { profile } = useAuth()

  if (!profile) return null

  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <div className="min-h-screen bg-gray-50">
        <Navigation role={profile.role} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
