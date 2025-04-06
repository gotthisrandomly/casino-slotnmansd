import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import type { AuthCredentials } from "@/types"

export async function POST(request: NextRequest) {
  try {
    const credentials: AuthCredentials = await request.json()
    const { username, password, email } = credentials

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    // Check if username already exists
    const existingUser = db.getUserByUsername(username)
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 })
    }

    // Create new user
    const user = db.createUserWithCredentials(username, password, email)

    if (!user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ error: "Failed to process signup" }, { status: 500 })
  }
}

