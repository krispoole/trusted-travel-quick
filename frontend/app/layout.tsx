import "./globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/lib/auth-context"
import type React from "react" // Added import for React

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Location Notifier",
  description: "Get notified when appointments are available at your favorite locations",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

