import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Check if user exists
    const user = db.getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Start a new game session
    const session = db.createSession(userId)

    if (!session) {
      return NextResponse.json({ error: "Failed to start game session" }, { status: 500 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("Start session error:", error)
    return NextResponse.json({ error: "Failed to start game session" }, { status: 500 })
  }
}

