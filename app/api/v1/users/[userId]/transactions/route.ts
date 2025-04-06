import type { NextRequest } from "next/server"
import { db } from "@/lib/db/database"
import { successResponse, errorResponse, getPaginationParams } from "@/lib/api/api-utils"

// Get user transactions
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    // Get user
    const user = db.getUserById(userId)
    if (!user) {
      return errorResponse("User not found", 404)
    }

    // Get pagination parameters
    const { page, pageSize } = getPaginationParams(request.nextUrl.searchParams)

    // Get transactions
    const transactions = db.getUserTransactions(userId, page * pageSize)

    // Paginate results
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedTransactions = transactions.slice(startIndex, endIndex)

    return successResponse({
      items: paginatedTransactions,
      total: transactions.length,
      page,
      pageSize,
      totalPages: Math.ceil(transactions.length / pageSize),
    })
  } catch (error) {
    console.error("Error fetching user transactions:", error)
    return errorResponse("Failed to fetch user transactions", 500)
  }
}

