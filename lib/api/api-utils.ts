import { NextResponse } from "next/server"
import type { ApiResponse, ApiError } from "@/types"

export function successResponse<T>(data: T, message?: string): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  }

  return NextResponse.json(response)
}

export function errorResponse(error: string | ApiError, status = 400): NextResponse {
  let errorObj: ApiError

  if (typeof error === "string") {
    errorObj = {
      code: "ERROR",
      message: error,
    }
  } else {
    errorObj = error
  }

  const response: ApiResponse<null> = {
    success: false,
    error: errorObj.message,
    message: errorObj.message,
  }

  return NextResponse.json(response, { status })
}

export function validateRequest(data: any, requiredFields: string[]): string | null {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === "") {
      return `Missing required field: ${field}`
    }
  }

  return null
}

export function getPaginationParams(searchParams: URLSearchParams): { page: number; pageSize: number } {
  const page = Number.parseInt(searchParams.get("page") || "1", 10)
  const pageSize = Number.parseInt(searchParams.get("pageSize") || "20", 10)

  return {
    page: isNaN(page) || page < 1 ? 1 : page,
    pageSize: isNaN(pageSize) || pageSize < 1 || pageSize > 100 ? 20 : pageSize,
  }
}

