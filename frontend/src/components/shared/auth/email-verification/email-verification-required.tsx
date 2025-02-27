"use client"

import { useState } from "react"
import { useAuth } from "@/lib/services/auth/auth"
import { Button } from "@/components/base/button"
import { useToast } from "@/components/base/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/base/card"
import { AlertCircle, CheckCircle, Mail } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/base/alert"

export function EmailVerificationRequired() {
  const [isResending, setIsResending] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const { user, isEmailVerified, resendVerificationEmail, refreshUserState } = useAuth()
  const { toast } = useToast()

  const handleResendVerification = async () => {
    setIsResending(true)
    try {
      const result = await resendVerificationEmail()
      setJustSent(true)
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and spam folder",
      })
    } catch (error: any) {
      toast({
        title: "Error sending verification email",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    try {
      const isVerified = await refreshUserState()
      if (isVerified) {
        toast({
          title: "Email verified",
          description: "Your email has been verified successfully",
        })
      } else {
        toast({
          title: "Email not verified",
          description: "Please check your inbox and click the verification link",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error checking verification status",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Email Verification Required
          </CardTitle>
          <CardDescription>
            Please verify your email address to access all features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification needed</AlertTitle>
            <AlertDescription>
              We've sent a verification email to <strong>{user?.email}</strong>. 
              Please check your inbox and spam folder.
            </AlertDescription>
          </Alert>

          {justSent && (
            <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Email sent</AlertTitle>
              <AlertDescription>
                We've sent a new verification email. Please check your inbox.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleResendVerification} 
              disabled={isResending}
              className="w-full"
            >
              {isResending ? (
                "Sending..."
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCheckVerification}
              className="w-full"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              I've verified my email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 