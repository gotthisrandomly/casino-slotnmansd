import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add Service-Worker-Allowed header to all responses
  response.headers.set("Service-Worker-Allowed", "/")

  // Handle service worker requests
  if (request.nextUrl.pathname === "/sw.js") {
    response.headers.set("Content-Type", "application/javascript")
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate")
  }

  return response
}

export const config = {
  matcher: [
    // Match all paths except for:
    // - API routes
    // - Static files (images, fonts, etc)
    // - _next files
    "/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)",
    // Match service worker explicitly
    "/sw.js",
  ],
}

