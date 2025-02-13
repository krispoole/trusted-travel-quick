"use client"

import {
  ToastProvider,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
  Toast as RadixToast
} from "@radix-ui/react-toast"
import { useToast } from "../../hooks/use-toast"
export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <ToastProvider>
      {toasts.map(({ id, message, type }) => (
        <RadixToast
          key={id}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              dismiss(id)
            }
          }}
        >
          <div className="grid gap-1">
            <ToastTitle>{type.toUpperCase()}</ToastTitle>
            <ToastDescription>{message}</ToastDescription>
          </div>
          <ToastClose />
        </RadixToast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
