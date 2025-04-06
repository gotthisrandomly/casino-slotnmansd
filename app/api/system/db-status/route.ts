import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Always return connected since we're using in-memory DB
    return NextResponse.json({
      connected: true,
      message: "Database connection successful",
    })
  } catch (error) {
    console.error("Database status check error:", error)
    // Always return a valid JSON response even on error
    return NextResponse.json({
      connected: false,
      error: "Failed to check database status",
      details: error instanceof Error ? error.message : String(error),
    })
  }
}

