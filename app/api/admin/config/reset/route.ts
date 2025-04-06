import { NextResponse } from "next/server"
import { validateRequest } from "@/lib/auth-utils"
import { initConfig } from "@/lib/config"
import { envManager } from "@/lib/env-manager"

// Reset configuration to defaults
export async function POST(request: Request) {
  try {
    // Validate the request
    const validation = await validateRequest(request)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 401 })
    }

    // Check if the user is an admin
    if (!validation.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Reset configuration to defaults
    const config = initConfig()

    // Generate default environment variables
    envManager.generateDefaultEnv()

    // Remove sensitive data for response
    const sanitizedConfig = {
      ...config,
      auth: {
        ...config.auth,
        sessionSecret: config.auth.sessionSecret ? "********" : "",
      },
      payment: {
        ...config.payment,
        stripe: {
          ...config.payment.stripe,
          secretKey: config.payment.stripe.secretKey ? "********" : "",
        },
        paypal: {
          ...config.payment.paypal,
          clientSecret: config.payment.paypal.clientSecret ? "********" : "",
        },
        crypto: {
          ...config.payment.crypto,
          apiKey: config.payment.crypto.apiKey ? "********" : "",
        },
      },
      email: {
        ...config.email,
        smtp: {
          ...config.email.smtp,
          pass: config.email.smtp.pass ? "********" : "",
        },
        sendgrid: {
          ...config.email.sendgrid,
          apiKey: config.email.sendgrid.apiKey ? "********" : "",
        },
        mailgun: {
          ...config.email.mailgun,
          apiKey: config.email.mailgun.apiKey ? "********" : "",
        },
      },
    }

    return NextResponse.json(sanitizedConfig)
  } catch (error) {
    console.error("Error resetting configuration:", error)
    return NextResponse.json({ error: "Failed to reset configuration" }, { status: 500 })
  }
}

