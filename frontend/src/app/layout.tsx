import "../styles/globals.css"
import { Inter } from "next/font/google"
import type React from "react"
import { AuthProvider } from "../lib/auth/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Location Notifier",
  description: "Get notified when appointments are available at your favorite locations",
    generator: 'v0.dev'
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