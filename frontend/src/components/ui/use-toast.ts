"use client"



import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

import { create } from "zustand"
import { v4 as uuidv4 } from "uuid"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: string
  description?: string
  action?: ToastActionElement
}

type ToastStore = {
  toasts: ToasterToast[]
  addToast: (toast: Omit<ToasterToast, "id">) => void
  removeToast: (id: string) => void
  toast: (props: Omit<ToasterToast, "id">) => void
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    set((state) => {
      const newToast = {
        ...toast,
        id: uuidv4(),
      }

      const newToasts = [newToast, ...state.toasts].slice(0, TOAST_LIMIT)

      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== newToast.id),
        }))
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
  toast: (props) => {
    const { addToast } = useToast.getState()
    addToast(props)
  }
}))
