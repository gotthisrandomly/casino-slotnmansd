import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { userId, gameId, provablyFairData } = data

    if (!userId || !gameId || !provablyFairData) {
      return NextResponse.json({ error: "User ID, game ID, and provably fair data are required" }, { status: 400 })
    }

    // Validate the request
    const validation = await validateRequest(request)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    // Check if the user is authorized
    if (validation.userId !== userId && !validation.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get the user
    const user = await db.getUserById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the game
    const game = await db.getGameById(gameId)
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Create a new session
    const session = await db.createGameSession({
      userId,
      gameId,
      initialBalance: user.balance,
      provablyFairData,
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error("Error starting game session:", error)
    return NextResponse.json({ error: "Failed to start game session" }, { status: 500 })
  }
}

