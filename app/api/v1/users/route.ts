import type { NextRequest } from "next/server"
import { db } from "@/lib/db/database"
import { successResponse, errorResponse, validateRequest, getPaginationParams } from "@/lib/api/api-utils"

// Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters
    const { page, pageSize } = getPaginationParams(request.nextUrl.searchParams)

    // Get all users
    const allUsers = db.getAllUsers()

    // Paginate results
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedUsers = allUsers.slice(startIndex, endIndex)

    return successResponse({
      items: paginatedUsers,
      total: allUsers.length,
      page,
      pageSize,
      totalPages: Math.ceil(allUsers.length / pageSize),
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return errorResponse("Failed to fetch users", 500)
  }
}

// Create a new user
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    const validationError = validateRequest(data, ["username", "password"])
    if (validationError) {
      return errorResponse(validationError, 400)
    }

    // Check if username already exists
    const existingUser = db.getUserByUsername(data.username)
    if (existingUser) {
      return errorResponse("Username already exists", 409)
    }

    // Create new user
    const user = await db.createUserWithCredentials(
      data.username,
      data.password,
      data.email,
      data.initialBalance || 1000,
    )

    if (!user) {
      return errorResponse("Failed to create user", 500)
    }

    return successResponse(user, "User created successfully")
  } catch (error) {
    console.error("Error creating user:", error)
    return errorResponse("Failed to create user", 500)
  }
}

