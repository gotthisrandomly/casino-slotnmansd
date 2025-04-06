import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { validateRequest } from "@/lib/auth-utils"

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

    // Check if the user is authorized
    if (validation.userId !== userId && !validation.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get transactions
    const transactions = await db.getUserTransactions(userId)

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

