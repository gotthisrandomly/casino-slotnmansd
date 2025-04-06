import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { amount, userId, currency = "BTC" } = data

    if (!amount || !userId) {
      return NextResponse.json({ error: "Amount and user ID are required" }, { status: 400 })
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

    // In a real implementation, you would integrate with a crypto payment processor
    // For demo purposes, we'll just return mock data

    // Mock conversion rates
    const conversionRates: Record<string, number> = {
      BTC: 0.000025, // 1 USD = 0.000025 BTC
      ETH: 0.00035, // 1 USD = 0.00035 ETH
      USDT: 1, // 1 USD = 1 USDT
    }

    const rate = conversionRates[currency] || conversionRates.BTC
    const cryptoAmount = amount * rate

    // Generate a mock deposit address
    const address = `${currency.toLowerCase()}_${Math.random().toString(36).substring(2, 15)}`

    return NextResponse.json({
      currency,
      address,
      amount,
      cryptoAmount,
      expiresIn: 3600, // 1 hour
    })
  } catch (error) {
    console.error("Error creating crypto deposit:", error)
    return NextResponse.json({ error: "Failed to create crypto deposit" }, { status: 500 })
  }
}

