import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { sessionId } = data

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Validate the request
    const validation = await validateRequest(request)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    // Get the session
    const session = await db.getGameSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check if the user is authorized
    if (validation.userId !== session.userId && !validation.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the user
    const user = await db.getUserById(session.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // End the session
    const endedSession = await db.endGameSession(sessionId, user.balance)

    return NextResponse.json(endedSession)
  } catch (error) {
    console.error("Error ending game session:", error)
    return NextResponse.json({ error: "Failed to end game session" }, { status: 500 })
  }
}

