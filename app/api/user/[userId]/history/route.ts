import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get all sessions for this user
    const history = db.getUserSessions(userId)

    return NextResponse.json(history)
  } catch (error) {
    console.error("Game history error:", error)
    return NextResponse.json({ error: "Failed to fetch game history" }, { status: 500 })
  }
}

