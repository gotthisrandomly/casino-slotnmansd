import fs from "fs"
import path from "path"
import { envManager } from "../lib/env-manager"

// This script sets up environment variables for development

// Generate a random string for secrets
function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+"
  let result = ""

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return result
}

// Default environment variables for development
const defaultEnv: Record<string, string> = {
  // App settings
  APP_NAME: "Slot King Casino",
  APP_URL: "http://localhost:3000",
  NODE_ENV: "development",
  DEBUG: "true",

  // Auth settings
  SESSION_SECRET: generateRandomString(64),
  TOKEN_EXPIRY: "86400",

  // Stripe settings (test keys)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_51NxSample1234567890123456789012345678901234",
  STRIPE_SECRET_KEY: "sk_test_51NxSample1234567890123456789012345678901234",

  // PayPal settings
  PAYPAL_CLIENT_ID: "test_client_id",
  PAYPAL_CLIENT_SECRET: "test_client_secret",
  PAYPAL_ENVIRONMENT: "sandbox",

  // Game settings
  DEFAULT_INITIAL_BALANCE: "1000",
  MAX_WIN_MULTIPLIER: "5000",
  HOUSE_EDGE: "0.05",
  BONUS_ENABLED: "true",
  PROVABLY_FAIR_ENABLED: "true",

  // Database settings (default to in-memory)
  DATABASE_TYPE: "memory",
}

// Main function
async function main() {
  console.log("Setting up environment variables for development...")

  // Check if .env file exists
  const envPath = path.join(process.cwd(), ".env")
  const envExists = fs.existsSync(envPath)

  if (envExists) {
    console.log("Found existing .env file")

    // Load existing variables
    const existingEnv = envManager.getAll()

    // Update with defaults for any missing variables
    for (const [key, value] of Object.entries(defaultEnv)) {
      if (!existingEnv[key]) {
        console.log(`Adding missing variable: ${key}`)
        envManager.set(key, value)
      }
    }
  } else {
    console.log("Creating new .env file with default values")

    // Set all default variables
    for (const [key, value] of Object.entries(defaultEnv)) {
      envManager.set(key, value)
    }
  }

  // Save the environment variables
  envManager.save()

  console.log("Environment variables setup complete!")
}

// Run the script
main().catch((error) => {
  console.error("Error setting up environment variables:", error)
  process.exit(1)
})

