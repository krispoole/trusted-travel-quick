"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

type CustomToastProps = {
  message: string
  type: "success" | "error" | "info"
  onClose: () => void
}

export function CustomToast({ message, type, onClose }: CustomToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500"

  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-lg flex items-center`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 focus:outline-none">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<
    { id: string; message: string; type: "success" | "error" | "info" }[]
  >([])

  const showToast = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prevToasts) => [...prevToasts, { id, message, type }])
  }

  const closeToast = (id: string) => {
    setToasts((prevToasts) =>
      prevToasts.filter((toast) => toast.id !== id)
    )
  }

  return { toasts, showToast, closeToast }
}

