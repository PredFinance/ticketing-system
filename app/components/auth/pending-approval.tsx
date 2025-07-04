"use client"

import { motion } from "framer-motion"
import { Clock, Mail, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function PendingApproval() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-4"
            >
              <Clock className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900">Account Pending</CardTitle>
            <CardDescription className="text-gray-600">
              Your account is waiting for administrator approval
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-800">Account created successfully</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-3 p-3 bg-amber-50 rounded-lg"
              >
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span className="text-sm text-amber-800">Waiting for admin approval</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
              >
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm text-blue-800">Email notification will be sent</span>
              </motion.div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Your account has been created and is pending approval from your organization's administrator. You will
                receive an email notification once your account is approved and you can start using the system.
              </p>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => router.push("/auth/login")}
                variant="outline"
                className="w-full h-11 border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                Back to Login
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
