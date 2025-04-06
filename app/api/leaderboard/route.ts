import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

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

    // Always return an array, even if empty
    return NextResponse.json(leaderboard || [])
  } catch (error) {
    console.error("Leaderboard error:", error)
    // Return an empty array instead of an error to prevent UI crashes
    return NextResponse.json([])
  }
}

