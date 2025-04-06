import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"

// Get payment methods for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Validate the request
    const validation = await validateRequest(request)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    // Check if the user is authorized to access these payment methods
    if (validation.userId !== userId && !validation.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get payment methods
    const paymentMethods = await db.getPaymentMethods(userId)

    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}

// Add a new payment method
export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!data.userId || !data.type || !data.gateway) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate the request
    const validation = await validateRequest(request)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    // Check if the user is authorized
    if (validation.userId !== data.userId && !validation.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Add payment method
    const paymentMethod = await db.addPaymentMethod(data)

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error("Error adding payment method:", error)
    return NextResponse.json({ error: "Failed to add payment method" }, { status: 500 })
  }
}

