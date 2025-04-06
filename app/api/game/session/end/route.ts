import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // End the session
    const session = db.endSession(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Failed to end game session" }, { status: 500 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error("End session error:", error)
    return NextResponse.json({ error: "Failed to end game session" }, { status: 500 })
  }
}

