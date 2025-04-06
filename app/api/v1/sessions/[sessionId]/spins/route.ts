import type { NextRequest } from "next/server"
import { db } from "@/lib/db/database"
import { successResponse, errorResponse, validateRequest } from "@/lib/api/api-utils"

// Record a spin
export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId
    const data = await request.json()

    // Validate required fields
    const validationError = validateRequest(data, ["bet", "result"])
    if (validationError) {
      return errorResponse(validationError, 400)
    }

    // Check if session exists
    const session = db.getSessionById(sessionId)
    if (!session) {
      return errorResponse("Session not found", 404)
    }

    // Record spin
    const spin = await db.recordSpin(sessionId, data.bet, data.result, data.winAmount || 0, data.paylines)

    if (!spin) {
      return errorResponse("Failed to record spin", 500)
    }

    // Get updated user
    const user = db.getUserById(session.userId)

    return successResponse(
      {
        spin,
        user,
      },
      "Spin recorded successfully",
    )
  } catch (error) {
    console.error("Error recording spin:", error)
    return errorResponse("Failed to record spin", 500)
  }
}

