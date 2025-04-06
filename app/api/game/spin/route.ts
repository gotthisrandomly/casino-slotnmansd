import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId, bet, result, winAmount, paylines } = await request.json()

    // Validate input
    if (!sessionId || !userId || bet === undefined || !result) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user exists
    const user = db.getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has enough balance
    if (user.balance < bet) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Record the spin
    const spin = db.recordSpin(sessionId, bet, result, winAmount, paylines)

    if (!spin) {
      return NextResponse.json({ error: "Failed to record spin" }, { status: 500 })
    }

    // Get updated user data
    const updatedUser = db.getUserById(userId)

    return NextResponse.json({
      spin,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Spin error:", error)
    return NextResponse.json({ error: "Failed to process spin" }, { status: 500 })
  }
}

