import { NextResponse } from "next/server"
import { validateRequest } from "@/lib/auth-utils"
import { getConfig, updateConfig } from "@/lib/config"
import { envManager } from "@/lib/env-manager"

// Get current configuration
export async function GET(request: Request) {
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

    // Get current configuration
    const config = getConfig()

    // Remove sensitive data
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
    console.error("Error fetching configuration:", error)
    return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 })
  }
}

// Update configuration
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

    // Get current configuration
    const currentConfig = getConfig()

    // Get updated configuration from request
    const updatedConfig = await request.json()

    // Merge configurations, preserving sensitive data if masked
    const mergedConfig = mergeConfigs(currentConfig, updatedConfig)

    // Update configuration
    const newConfig = updateConfig(mergedConfig)

    // Update environment variables
    updateEnvironmentVariables(newConfig)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating configuration:", error)
    return NextResponse.json({ error: "Failed to update configuration" }, { status: 500 })
  }
}

// Helper function to merge configurations
function mergeConfigs(current: any, updated: any): any {
  const result: any = { ...current }

  // Iterate through updated config
  for (const section in updated) {
    if (typeof updated[section] === "object" && updated[section] !== null) {
      // Merge nested objects
      result[section] = mergeConfigs(current[section] || {}, updated[section])
    } else {
      // Skip masked sensitive values
      if (updated[section] === "********") {
        continue
      }

      // Update value
      result[section] = updated[section]
    }
  }

  return result
}

// Update environment variables based on configuration
function updateEnvironmentVariables(config: any) {
  // App settings
  envManager.set("APP_NAME", config.app.name)
  envManager.set("APP_URL", config.app.url)
  envManager.set("NODE_ENV", config.app.environment)
  envManager.set("DEBUG", config.app.debug.toString())

  // Auth settings
  if (config.auth.sessionSecret) {
    envManager.set("SESSION_SECRET", config.auth.sessionSecret)
  }
  envManager.set("TOKEN_EXPIRY", config.auth.tokenExpiry.toString())

  // Payment settings
  if (config.payment.stripe.publishableKey) {
    envManager.set("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", config.payment.stripe.publishableKey)
  }
  if (config.payment.stripe.secretKey) {
    envManager.set("STRIPE_SECRET_KEY", config.payment.stripe.secretKey)
  }
  if (config.payment.paypal.clientId) {
    envManager.set("PAYPAL_CLIENT_ID", config.payment.paypal.clientId)
  }
  if (config.payment.paypal.clientSecret) {
    envManager.set("PAYPAL_CLIENT_SECRET", config.payment.paypal.clientSecret)
  }
  envManager.set("PAYPAL_ENVIRONMENT", config.payment.paypal.environment)
  envManager.set("CRYPTO_ENABLED", config.payment.crypto.enabled.toString())
  if (config.payment.crypto.provider) {
    envManager.set("CRYPTO_PROVIDER", config.payment.crypto.provider)
  }

  // Game settings
  envManager.set("DEFAULT_INITIAL_BALANCE", config.game.defaultInitialBalance.toString())
  envManager.set("MAX_WIN_MULTIPLIER", config.game.maxWinMultiplier.toString())
  envManager.set("HOUSE_EDGE", config.game.houseEdge.toString())
  envManager.set("BONUS_ENABLED", config.game.bonusEnabled.toString())
  envManager.set("PROVABLY_FAIR_ENABLED", config.game.provablyFairEnabled.toString())

  // Database settings
  envManager.set("DATABASE_TYPE", config.database.type)
  if (config.database.url) {
    envManager.set("DATABASE_URL", config.database.url)
  }

  // Redis settings
  envManager.set("REDIS_ENABLED", config.redis.enabled.toString())
  if (config.redis.url) {
    envManager.set("REDIS_URL", config.redis.url)
  }

  // Email settings
  if (config.email.from) {
    envManager.set("EMAIL_FROM", config.email.from)
  }
  envManager.set("EMAIL_PROVIDER", config.email.provider)

  // SMTP settings
  if (config.email.smtp.host) {
    envManager.set("SMTP_HOST", config.email.smtp.host)
  }
  envManager.set("SMTP_PORT", config.email.smtp.port.toString())
  if (config.email.smtp.user) {
    envManager.set("SMTP_USER", config.email.smtp.user)
  }
  if (config.email.smtp.pass) {
    envManager.set("SMTP_PASS", config.email.smtp.pass)
  }

  // SendGrid settings
  if (config.email.sendgrid.apiKey) {
    envManager.set("SENDGRID_API_KEY", config.email.sendgrid.apiKey)
  }

  // Mailgun settings
  if (config.email.mailgun.apiKey) {
    envManager.set("MAILGUN_API_KEY", config.email.mailgun.apiKey)
  }
  if (config.email.mailgun.domain) {
    envManager.set("MAILGUN_DOMAIN", config.email.mailgun.domain)
  }

  // Save environment variables
  envManager.save()
}

