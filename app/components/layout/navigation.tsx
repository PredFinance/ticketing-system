"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Menu,
  X,
  LogOut,
  Settings,
  User,
  ChevronDown,
  Home,
  Ticket,
  Users,
  Building,
  BarChart3,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

// Import the NotificationCenter component at the top
import NotificationCenter from "@/components/notifications/notification-center"

interface NavigationProps {
  role: "admin" | "supervisor" | "user"
}

export default function Navigation({ role }: NavigationProps) {
  const { profile, signOut } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notifications] = useState(3) // TODO: Connect to real notifications
  const router = useRouter()
  const pathname = usePathname()

  const getNavigationItems = () => {
    const baseItems = [
      { href: `/${role}/dashboard`, icon: Home, label: "Dashboard" },
      { href: `/${role}/tickets`, icon: Ticket, label: "Tickets" },
    ]

    switch (role) {
      case "admin":
        return [
          ...baseItems,
          { href: "/admin/users", icon: Users, label: "Users" },
          { href: "/admin/departments", icon: Building, label: "Departments" },
          { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
          { href: "/admin/settings", icon: Settings, label: "Settings" },
        ]
      case "supervisor":
        return [
          ...baseItems,
          { href: "/supervisor/department", icon: Building, label: "Department" },
          { href: "/supervisor/analytics", icon: BarChart3, label: "Analytics" },
          { href: "/supervisor/reports", icon: FileText, label: "Reports" },
        ]
      case "user":
        return [...baseItems, { href: "/user/my-tickets", icon: FileText, label: "My Tickets" }]
      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/login")
  }

  const getRoleColor = () => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "supervisor":
        return "bg-blue-100 text-blue-800"
      case "user":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">ComplaintMS</span>
              </motion.div>

              <Badge className={getRoleColor()}>{role.charAt(0).toUpperCase() + role.slice(1)}</Badge>
            </div>

            {/* Desktop Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {/* Right Side Items */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search tickets..."
                  className="pl-10 w-64 h-9 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Notifications */}
              <NotificationCenter />

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" className="flex items-center space-x-2 h-9">
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-purple-100 text-purple-700 text-sm">
                          {profile?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:block text-sm font-medium text-gray-700">{profile?.full_name}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{profile?.full_name}</p>
                    <p className="text-xs text-gray-500">{profile?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Preferences
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-200"
          >
            <div className="px-4 py-2 space-y-1">
              {/* Mobile Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search tickets..."
                  className="pl-10 w-full h-9 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              {/* Mobile Navigation Items */}
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
