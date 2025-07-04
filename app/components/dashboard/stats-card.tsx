"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "increase" | "decrease" | "neutral"
  icon: LucideIcon
  color?: "purple" | "blue" | "green" | "red" | "yellow"
}

export default function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  color = "purple",
}: StatsCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return "bg-blue-500 text-blue-100"
      case "green":
        return "bg-green-500 text-green-100"
      case "red":
        return "bg-red-500 text-red-100"
      case "yellow":
        return "bg-yellow-500 text-yellow-100"
      default:
        return "bg-purple-500 text-purple-100"
    }
  }

  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-green-600"
      case "decrease":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {change && <p className={`text-sm ${getChangeColor()}`}>{change}</p>}
            </div>
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses()}`}
            >
              <Icon className="w-6 h-6" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
