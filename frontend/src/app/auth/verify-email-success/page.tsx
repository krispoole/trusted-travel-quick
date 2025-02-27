"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/services/auth/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/base/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/base/card"
import { CheckCircle, Loader2 } from "lucide-react"
import { Metadata } from "next"

export default function VerifyEmailSuccessPage() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const { refreshUserState, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Refresh user state to check if email is verified
        const verified = await refreshUserState()
        setIsVerified(verified)
      } catch (error) {
        console.error("Error verifying email:", error)
      } finally {
        setIsVerifying(false)
      }
    }

    if (user) {
      verifyEmail()
    } else {
      // If no user is logged in, redirect to login
      setIsVerifying(false)
    }
  }, [user, refreshUserState])

  const handleContinue = () => {
    router.push("/dashboard")
  }

  const handleLogin = () => {
    router.push("/auth/login")
  }

  if (isVerifying) {
    return (
      <div className="container mx-auto py-20 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verifying your email</CardTitle>
            <CardDescription>Please wait while we verify your email address</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-20 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Session expired</CardTitle>
            <CardDescription>Please log in again to verify your email</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={handleLogin}>Go to Login</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-20 flex flex-col items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle>Email Verified!</CardTitle>
          <CardDescription>
            {isVerified 
              ? "Your email has been successfully verified. You can now access all features."
              : "There was an issue verifying your email. Please try again or contact support."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          {isVerified ? (
            <Button onClick={handleContinue}>Continue to Dashboard</Button>
          ) : (
            <Button variant="outline" onClick={handleLogin}>Back to Login</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
} 