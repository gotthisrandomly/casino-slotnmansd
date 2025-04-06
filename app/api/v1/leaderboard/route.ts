import type { NextRequest } from "next/server"
import { db } from "@/lib/db/database"
import { successResponse, errorResponse } from "@/lib/api/api-utils"

// Get leaderboard
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") || "highest"
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    let leaderboard = []

    if (type === "total") {
      // Get top total winnings
      leaderboard = db.getTopTotalWinnings(limit)
    } else {
      // Get top highest wins
      leaderboard = db.getTopHighestWins(limit)
    }

    return successResponse(leaderboard)
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
    return errorResponse("Failed to fetch leaderboard", 500)
  }
}

