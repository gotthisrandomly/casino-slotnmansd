import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"
import { TransactionType } from "@/types/payment"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { amount, userId, gateway } = data

    if (!amount || !userId || !gateway) {
      return NextResponse.json({ error: "Amount, user ID, and gateway are required" }, { status: 400 })
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

    // Process the deposit
    const transaction = await db.createTransaction({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      gateway,
      status: "completed",
      description: `Deposit via ${gateway}`,
    })

    // Update user balance
    const newBalance = user.balance + amount
    await db.updateUserBalance(userId, newBalance)

    return NextResponse.json({
      success: true,
      transaction,
      newBalance,
    })
  } catch (error) {
    console.error("Error processing direct deposit:", error)
    return NextResponse.json({ error: "Failed to process deposit" }, { status: 500 })
  }
}

