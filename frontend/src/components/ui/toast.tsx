"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

type ToastProps = {
  message: string
  type: "success" | "error" | "info"
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-blue-500"

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg flex items-center`}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 focus:outline-none">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null)

  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type })
  }

  const closeToast = () => {
    setToast(null)
  }

  return { toast, showToast, closeToast }
}

