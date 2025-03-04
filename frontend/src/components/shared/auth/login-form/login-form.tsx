"use client"

import { useState } from "react"
import { useAuth } from "@/lib/services/auth/auth"
import { Button } from "@/components/base/button"
import { Input } from "@/components/base/input"
import { useToast } from "@/components/base/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/base/card"
import { Label } from "@/components/base/label"
import { SignupModal } from "../signup-modal"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showSignup, setShowSignup] = useState(false)
  const router = useRouter()
  const { signIn, isLoading } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await signIn(email, password)
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSignup(true)}
                  disabled={isLoading}
                >
                  Create account
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <SignupModal open={showSignup} onOpenChange={setShowSignup} />
    </>
  )
}
