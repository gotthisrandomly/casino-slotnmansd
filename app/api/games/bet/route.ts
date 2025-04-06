import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"
import { processGameBet } from "@/lib/game-engine"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { sessionId, userId, gameId, amount, provablyFairData, options } = data

    if (!sessionId || !userId || !gameId || amount === undefined || !provablyFairData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    // Check if user has sufficient balance
    if (user.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Get the session
    const session = await db.getGameSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check if session belongs to user
    if (session.userId !== userId) {
      return NextResponse.json({ error: "Session does not belong to user" }, { status: 403 })
    }

    // Get the game
    const game = await db.getGameById(gameId)
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Process the bet
    const result = await processGameBet(game, amount, provablyFairData, options)

    // Update user balance
    const newBalance = user.balance - amount + result.winAmount
    await db.updateUserBalance(userId, newBalance)

    // Record the bet
    const bet = await db.recordGameBet({
      sessionId,
      userId,
      gameId,
      amount,
      winAmount: result.winAmount,
      result: result.data,
      provablyFairData,
    })

    // Get updated user
    const updatedUser = await db.getUserById(userId)

    return NextResponse.json({
      ...result,
      bet,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Error processing bet:", error)
    return NextResponse.json({ error: "Failed to process bet" }, { status: 500 })
  }
}

