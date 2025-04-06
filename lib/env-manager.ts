import fs from "fs"

// Environment variable management
export class EnvManager {
  private envFilePath: string
  private envVars: Record<string, string> = {}

  constructor(envFilePath = ".env") {
    this.envFilePath = envFilePath
    this.loadEnvFile()
  }

  // Load environment variables from file
  private loadEnvFile(): void {
    try {
      if (fs.existsSync(this.envFilePath)) {
        const envContent = fs.readFileSync(this.envFilePath, "utf8")
        const lines = envContent.split("\n")

        for (const line of lines) {
          const trimmedLine = line.trim()

          // Skip comments and empty lines
          if (!trimmedLine || trimmedLine.startsWith("#")) {
            continue
          }

          const match = trimmedLine.match(/^([^=]+)=(.*)$/)
          if (match) {
            const key = match[1].trim()
            let value = match[2].trim()

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
              value = value.substring(1, value.length - 1)
            }

            this.envVars[key] = value
          }
        }
      }
    } catch (error) {
      console.error("Error loading .env file:", error)
    }
  }

  // Get all environment variables
  public getAll(): Record<string, string> {
    return { ...this.envVars }
  }

  // Get a specific environment variable
  public get(key: string): string | undefined {
    return this.envVars[key]
  }

  // Set an environment variable
  public set(key: string, value: string): void {
    this.envVars[key] = value

    // Update process.env for runtime access
    process.env[key] = value
  }

  // Save environment variables to file
  public save(): void {
    try {
      const envContent = Object.entries(this.envVars)
        .map(([key, value]) => {
          // Add quotes if value contains spaces
          const formattedValue = value.includes(" ") ? `"${value}"` : value
          return `${key}=${formattedValue}`
        })
        .join("\n")

      fs.writeFileSync(this.envFilePath, envContent)
    } catch (error) {
      console.error("Error saving .env file:", error)
    }
  }

  // Generate a default .env file
  public generateDefaultEnv(): void {
    const defaultEnv: Record<string, string> = {
      // App settings
      APP_NAME: "Slot King Casino",
      APP_URL: "http://localhost:3000",
      NODE_ENV: "development",

      // Auth settings
      SESSION_SECRET: this.generateRandomString(64),

      // Stripe settings
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_your_stripe_publishable_key",
      STRIPE_SECRET_KEY: "sk_test_your_stripe_secret_key",

      // PayPal settings
      PAYPAL_CLIENT_ID: "your_paypal_client_id",
      PAYPAL_CLIENT_SECRET: "your_paypal_client_secret",
      PAYPAL_ENVIRONMENT: "sandbox",

      // Game settings
      DEFAULT_INITIAL_BALANCE: "1000",
      PROVABLY_FAIR_ENABLED: "true",

      // Database settings (default to in-memory)
      DATABASE_TYPE: "memory",
    }

    // Don't overwrite existing values
    for (const [key, value] of Object.entries(defaultEnv)) {
      if (!this.envVars[key]) {
        this.envVars[key] = value
      }
    }

    this.save()
  }

  // Generate a random string for secrets
  private generateRandomString(length: number): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+"
    let result = ""

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return result
  }
}

// Create a singleton instance
export const envManager = new EnvManager()

// Export a function to initialize environment variables
export function initEnv(): void {
  // Check if .env file exists, if not create it
  if (!fs.existsSync(".env")) {
    envManager.generateDefaultEnv()
  }

  // Load environment variables into process.env
  const envVars = envManager.getAll()
  for (const [key, value] of Object.entries(envVars)) {
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

