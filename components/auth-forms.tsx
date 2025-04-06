"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, User, UserCog } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { AuthCredentials } from "@/types"

export function AuthForms() {
  const { login, signup, adminLogin, loading, error } = useAuth()
  const [activeForm, setActiveForm] = useState<"login" | "signup" | "admin">("login")

  const [credentials, setCredentials] = useState<AuthCredentials>({
    username: "",
    password: "",
    email: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await login(credentials)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    await signup(credentials)
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await adminLogin(credentials)
  }

  const renderForm = () => {
    switch (activeForm) {
      case "signup":
        return (
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                name="username"
                placeholder="Choose a username"
                value={credentials.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={credentials.email || ""}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                placeholder="Choose a password"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </Button>
            <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setActiveForm("login")}>
              Back to Login
            </Button>
          </form>
        )

      case "admin":
        return (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username">Admin Username</Label>
              <Input
                id="admin-username"
                name="username"
                placeholder="Admin username"
                value={credentials.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input
                id="admin-password"
                name="password"
                type="password"
                placeholder="Admin password"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Admin Login"}
            </Button>
            <Button type="button" variant="outline" className="w-full mt-2" onClick={() => setActiveForm("login")}>
              Back to Login
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Default admin: username "admin", password "admin123"
            </p>
          </form>
        )

      default: // login
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        )
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome to Slot King</CardTitle>
        <CardDescription>Sign in to start playing or create a new account</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {activeForm === "login" && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button onClick={() => setActiveForm("signup")} variant="outline" className="flex items-center gap-2">
              <User size={16} />
              Sign Up
            </Button>
            <Button onClick={() => setActiveForm("admin")} variant="outline" className="flex items-center gap-2">
              <UserCog size={16} />
              Admin Login
            </Button>
          </div>
        )}

        {renderForm()}
      </CardContent>
    </Card>
  )
}

