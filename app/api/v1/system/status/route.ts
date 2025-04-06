import type { NextRequest } from "next/server"
import { db } from "@/lib/db/database"
import { successResponse, errorResponse } from "@/lib/api/api-utils"

// Get system status
export async function GET(request: NextRequest) {
  try {
    const dbConnected = db.isConnected()
    const stats = db.getDatabaseStats()

    return successResponse({
      status: "online",
      database: {
        connected: dbConnected,
        stats,
      },
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error fetching system status:", error)
    return errorResponse("Failed to fetch system status", 500)
  }
}

