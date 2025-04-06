import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { AuthCredentials } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const credentials: AuthCredentials = await request.json()
    const { username, password } = credentials

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Verify credentials
    const user = db.verifyCredentials(username, password)

    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    // Update last login time
    const updatedUser = db.updateUserLastLogin(user.id)

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Failed to process login" }, { status: 500 })
  }
}

