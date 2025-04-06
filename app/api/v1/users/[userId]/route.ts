import type { NextRequest } from "next/server"
import { db } from "@/lib/db/database"
import { successResponse, errorResponse } from "@/lib/api/api-utils"

// Get user by ID
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    // Get user
    const user = db.getUserById(userId)
    if (!user) {
      return errorResponse("User not found", 404)
    }

    return successResponse(user)
  } catch (error) {
    console.error("Error fetching user:", error)
    return errorResponse("Failed to fetch user", 500)
  }
}

// Update user
export async function PATCH(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    const data = await request.json()

    // Get user
    const user = db.getUserById(userId)
    if (!user) {
      return errorResponse("User not found", 404)
    }

    // Update balance if provided
    if (data.balance !== undefined) {
      const updatedUser = await db.updateUserBalance(userId, data.balance, data.reason || "API update")

      if (!updatedUser) {
        return errorResponse("Failed to update user balance", 500)
      }

      return successResponse(updatedUser, "User balance updated successfully")
    }

    return errorResponse("No updates provided", 400)
  } catch (error) {
    console.error("Error updating user:", error)
    return errorResponse("Failed to update user", 500)
  }
}

