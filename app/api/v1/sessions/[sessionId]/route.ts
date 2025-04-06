import type { NextRequest } from "next/server"
import { db } from "@/lib/db/database"
import { successResponse, errorResponse } from "@/lib/api/api-utils"

// Get session by ID
export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId

    // Get session
    const session = db.getSessionById(sessionId)
    if (!session) {
      return errorResponse("Session not found", 404)
    }

    return successResponse(session)
  } catch (error) {
    console.error("Error fetching session:", error)
    return errorResponse("Failed to fetch session", 500)
  }
}

// End session
export async function PATCH(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId
    const data = await request.json()

    if (data.action === "end") {
      // End session
      const session = await db.endSession(sessionId)

      if (!session) {
        return errorResponse("Failed to end session", 500)
      }

      return successResponse(session, "Session ended successfully")
    }

    return errorResponse("Invalid action", 400)
  } catch (error) {
    console.error("Error updating session:", error)
    return errorResponse("Failed to update session", 500)
  }
}

