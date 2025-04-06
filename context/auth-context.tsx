"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import type { User, AuthCredentials } from "@/types/auth"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (credentials: AuthCredentials) => Promise<boolean>
  signup: (credentials: AuthCredentials) => Promise<boolean>
  logout: () => void
  updateUserBalance: (newBalance: number) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/session")
        if (response.ok) {
          const userData = await response.json()
          if (userData && userData.id) {
            setUser(userData)
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (credentials: AuthCredentials): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Login failed")
      }

      const userData = await response.json()
      setUser(userData)

      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.username}`,
      })

      router.push("/dashboard")
      return true
    } catch (error) {
      console.error("Login error:", error)
      setError(error instanceof Error ? error.message : "Login failed")

      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      })

      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (credentials: AuthCredentials): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Signup failed")
      }

      const userData = await response.json()
      setUser(userData)

      toast({
        title: "Account Created",
        description: "Your account has been created successfully",
      })

      router.push("/dashboard")
      return true
    } catch (error) {
      console.error("Signup error:", error)
      setError(error instanceof Error ? error.message : "Signup failed")

      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      })

      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setUser(null)
      router.push("/")

      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      })
    }
  }

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        signup,
        logout,
        updateUserBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

