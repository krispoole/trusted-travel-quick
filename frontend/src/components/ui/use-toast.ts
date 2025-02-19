"use client"

import type {
  ToastActionElement,
  ToastProps,
} from "./toast"

import { create } from "zustand"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
}

interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
  open?: boolean
}

interface ToastStore {
  toasts: Toast[]
  toast: (toast: Omit<Toast, "id" | "open">) => void
  addToast: (toast: Omit<Toast, "id" | "open">) => void
  removeToast: (id: string) => void
  updateToast: (id: string, toast: Partial<Toast>) => void
  dismissToast: (id: string) => void
}

export const useToast = create<ToastStore>((set, get) => ({
  toasts: [],
  toast: (toast) => get().addToast(toast),
  addToast: (toast) => {
    set((state) => {
      const newToast = {
        ...toast,
        id: crypto.randomUUID(),
        open: true,
      }

      const newToasts = [newToast, ...state.toasts].slice(0, TOAST_LIMIT)

      setTimeout(() => {
        get().dismissToast(newToast.id)
      }, TOAST_REMOVE_DELAY)

      return {
        toasts: newToasts,
      }
    })
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
  updateToast: (id, toast) => {
    set((state) => ({
      toasts: state.toasts.map((t) => 
        t.id === id ? { ...t, ...toast } : t
      ),
    }))
  },
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.map((t) => 
        t.id === id ? { ...t, open: false } : t
      ),
    }))
    setTimeout(() => {
      get().removeToast(id)
    }, 300)
  }
}))

export function toast(props: Omit<ToasterToast, "id" | "open">) {
  const { addToast } = useToast.getState()
  addToast(props)
}

export { type Toast }