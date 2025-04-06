import type { NextRequest } from "next/server"
import { db } from "@/lib/db/database"
import { successResponse, errorResponse, validateRequest } from "@/lib/api/api-utils"

// Create a new session
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    const validationError = validateRequest(data, ["userId"])
    if (validationError) {
      return errorResponse(validationError, 400)
    }

    // Check if user exists
    const user = db.getUserById(data.userId)
    if (!user) {
      return errorResponse("User not found", 404)
    }

    // Create session
    const session = await db.createSession(data.userId)

    if (!session) {
      return errorResponse("Failed to create session", 500)
    }

    return successResponse(session, "Session created successfully")
  } catch (error) {
    console.error("Error creating session:", error)
    return errorResponse("Failed to create session", 500)
  }
}

