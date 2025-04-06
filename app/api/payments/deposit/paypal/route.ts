import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { amount, userId } = data

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

    // In a real implementation, you would integrate with PayPal SDK here
    // For demo purposes, we'll just return a mock redirect URL

    return NextResponse.json({
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/deposit/paypal/callback?amount=${amount}&userId=${userId}`,
    })
  } catch (error) {
    console.error("Error creating PayPal checkout:", error)
    return NextResponse.json({ error: "Failed to create PayPal checkout" }, { status: 500 })
  }
}

