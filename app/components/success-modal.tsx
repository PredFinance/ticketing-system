"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  ticketNumber: string
}

export function SuccessModal({ isOpen, onClose, ticketNumber }: SuccessModalProps) {
  const router = useRouter()
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setAnimationComplete(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setAnimationComplete(false)
    }
  }, [isOpen])

  const handleViewTicket = () => {
    router.push(`/tickets/${ticketNumber}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="relative mb-4">
            <div
              className={`w-20 h-20 rounded-full bg-green-100 flex items-center justify-center transition-all duration-500 ${
                animationComplete ? "scale-100 opacity-100" : "scale-50 opacity-0"
              }`}
            >
              <CheckCircle
                className={`w-12 h-12 text-green-600 transition-all duration-500 ${
                  animationComplete ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              />
            </div>
            <svg className="absolute top-0 left-0 w-20 h-20 -rotate-90" viewBox="0 0 100 100">
              <circle
                className={`transition-all duration-1000 ease-out ${animationComplete ? "stroke-dashoffset-0" : ""}`}
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="#22c55e"
                strokeWidth="8"
                strokeDasharray="289.027"
                strokeDashoffset="289.027"
                strokeLinecap="round"
                style={{
                  strokeDashoffset: animationComplete ? "0" : "289.027",
                }}
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ticket Created!</h3>
          <p className="text-gray-600 mb-6">
            Your ticket <span className="font-semibold text-purple-600">{ticketNumber}</span> has been created
            successfully.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
              Create Another
            </Button>
            <Button onClick={handleViewTicket} className="w-full bg-purple-600 hover:bg-purple-700">
              View Ticket
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
