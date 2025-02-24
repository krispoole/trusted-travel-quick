"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/base/toaster"
import { ThemeProvider } from "@/components/shared/common/theme-provider"
import { useEffect } from "react"
import { useLocations } from "@/lib/stores/locations.store"
import { metadata } from "./metadata"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { initializeAuthListener } = useLocations()

  useEffect(() => {
    // Initialize auth listener and store unsubscribe function
    const unsubscribe = initializeAuthListener()
    
    // Cleanup on unmount
    return () => {
      unsubscribe()
    }
  }, [initializeAuthListener])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}