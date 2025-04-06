import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"
import { TransactionType } from "@/types/payment"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { amount, userId, gateway, methodId } = data

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

    // Check if user has sufficient balance
    if (user.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // If methodId is provided, verify it belongs to the user
    if (methodId) {
      const paymentMethod = await db.getPaymentMethodById(methodId)
      if (!paymentMethod || paymentMethod.userId !== userId) {
        return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
      }
    }

    // Process the withdrawal
    const transaction = await db.createTransaction({
      userId,
      type: TransactionType.WITHDRAWAL,
      amount,
      gateway,
      methodId,
      status: "pending", // Withdrawals typically need approval
      description: `Withdrawal via ${gateway}`,
    })

    // Update user balance
    const newBalance = user.balance - amount
    await db.updateUserBalance(userId, newBalance)

    return NextResponse.json({
      success: true,
      transaction,
      newBalance,
    })
  } catch (error) {
    console.error("Error processing withdrawal:", error)
    return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 })
  }
}

