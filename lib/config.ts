// Configuration management system
import { z } from "zod"

// Define schema for configuration
const configSchema = z.object({
  // App settings
  app: z.object({
    name: z.string().default("Slot King Casino"),
    url: z.string().default("http://localhost:3000"),
    environment: z.enum(["development", "test", "production"]).default("development"),
    debug: z.boolean().default(false),
  }),

  // Authentication settings
  auth: z.object({
    sessionSecret: z.string().min(32).default("slot_king_session_secret_change_this_in_production"),
    tokenExpiry: z.number().default(86400), // 24 hours in seconds
    saltRounds: z.number().default(10),
  }),

  // Payment settings
  payment: z.object({
    // Stripe
    stripe: z.object({
      publishableKey: z.string().optional(),
      secretKey: z.string().optional(),
      webhookSecret: z.string().optional(),
    }),

    // PayPal
    paypal: z.object({
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
      environment: z.enum(["sandbox", "live"]).default("sandbox"),
    }),

    // Crypto
    crypto: z.object({
      enabled: z.boolean().default(false),
      provider: z.string().optional(),
      apiKey: z.string().optional(),
    }),

    // General payment settings
    minDeposit: z.number().default(10),
    maxDeposit: z.number().default(10000),
    minWithdrawal: z.number().default(20),
    maxWithdrawal: z.number().default(5000),
    withdrawalFee: z.number().default(0),
    withdrawalProcessingTime: z.number().default(24), // hours
  }),

  // Game settings
  game: z.object({
    defaultInitialBalance: z.number().default(1000),
    maxWinMultiplier: z.number().default(5000),
    houseEdge: z.number().default(0.05), // 5%
    bonusEnabled: z.boolean().default(true),
    provablyFairEnabled: z.boolean().default(true),
  }),

  // Database settings
  database: z.object({
    url: z.string().optional(),
    type: z.enum(["memory", "postgres", "mysql", "mongodb"]).default("memory"),
  }),

  // Redis settings (for session, cache, etc.)
  redis: z.object({
    url: z.string().optional(),
    enabled: z.boolean().default(false),
  }),

  // Email settings
  email: z.object({
    from: z.string().email().default("noreply@slotking.com"),
    provider: z.enum(["smtp", "sendgrid", "mailgun"]).default("smtp"),
    smtp: z.object({
      host: z.string().optional(),
      port: z.number().default(587),
      secure: z.boolean().default(false),
      user: z.string().optional(),
      pass: z.string().optional(),
    }),
    sendgrid: z.object({
      apiKey: z.string().optional(),
    }),
    mailgun: z.object({
      apiKey: z.string().optional(),
      domain: z.string().optional(),
    }),
  }),
})

// Type for our configuration
export type AppConfig = z.infer<typeof configSchema>

// Load configuration from environment variables
function loadConfigFromEnv(): Partial<AppConfig> {
  return {
    app: {
      name: process.env.APP_NAME,
      url: process.env.APP_URL,
      environment: process.env.NODE_ENV as any,
      debug: process.env.DEBUG === "true",
    },
    auth: {
      sessionSecret: process.env.SESSION_SECRET,
      tokenExpiry: process.env.TOKEN_EXPIRY ? Number.parseInt(process.env.TOKEN_EXPIRY) : undefined,
      saltRounds: process.env.SALT_ROUNDS ? Number.parseInt(process.env.SALT_ROUNDS) : undefined,
    },
    payment: {
      stripe: {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      },
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        environment: process.env.PAYPAL_ENVIRONMENT as any,
      },
      crypto: {
        enabled: process.env.CRYPTO_ENABLED === "true",
        provider: process.env.CRYPTO_PROVIDER,
        apiKey: process.env.CRYPTO_API_KEY,
      },
      minDeposit: process.env.MIN_DEPOSIT ? Number.parseInt(process.env.MIN_DEPOSIT) : undefined,
      maxDeposit: process.env.MAX_DEPOSIT ? Number.parseInt(process.env.MAX_DEPOSIT) : undefined,
      minWithdrawal: process.env.MIN_WITHDRAWAL ? Number.parseInt(process.env.MIN_WITHDRAWAL) : undefined,
      maxWithdrawal: process.env.MAX_WITHDRAWAL ? Number.parseInt(process.env.MAX_WITHDRAWAL) : undefined,
      withdrawalFee: process.env.WITHDRAWAL_FEE ? Number.parseFloat(process.env.WITHDRAWAL_FEE) : undefined,
      withdrawalProcessingTime: process.env.WITHDRAWAL_PROCESSING_TIME
        ? Number.parseInt(process.env.WITHDRAWAL_PROCESSING_TIME)
        : undefined,
    },
    game: {
      defaultInitialBalance: process.env.DEFAULT_INITIAL_BALANCE
        ? Number.parseInt(process.env.DEFAULT_INITIAL_BALANCE)
        : undefined,
      maxWinMultiplier: process.env.MAX_WIN_MULTIPLIER ? Number.parseInt(process.env.MAX_WIN_MULTIPLIER) : undefined,
      houseEdge: process.env.HOUSE_EDGE ? Number.parseFloat(process.env.HOUSE_EDGE) : undefined,
      bonusEnabled: process.env.BONUS_ENABLED === "true",
      provablyFairEnabled: process.env.PROVABLY_FAIR_ENABLED === "true",
    },
    database: {
      url: process.env.DATABASE_URL,
      type: process.env.DATABASE_TYPE as any,
    },
    redis: {
      url: process.env.REDIS_URL || process.env.KV_URL,
      enabled: process.env.REDIS_ENABLED === "true" || !!process.env.KV_URL,
    },
    email: {
      from: process.env.EMAIL_FROM,
      provider: process.env.EMAIL_PROVIDER as any,
      smtp: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number.parseInt(process.env.SMTP_PORT) : undefined,
        secure: process.env.SMTP_SECURE === "true",
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
      },
      mailgun: {
        apiKey: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN,
      },
    },
  }
}

// Default configuration
const defaultConfig: AppConfig = configSchema.parse({})

// Merge environment variables with default config
let config: AppConfig = defaultConfig

// Initialize configuration
export function initConfig(overrides?: Partial<AppConfig>): AppConfig {
  // Load from environment
  const envConfig = loadConfigFromEnv()

  // Merge configs: default <- env <- overrides
  config = configSchema.parse({
    ...defaultConfig,
    ...removeUndefined(envConfig),
    ...removeUndefined(overrides || {}),
  })

  return config
}

// Helper to remove undefined values from an object
function removeUndefined(obj: any): any {
  const result: any = {}

  for (const key in obj) {
    const value = obj[key]

    if (value === undefined) {
      continue
    }

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      result[key] = removeUndefined(value)
    } else {
      result[key] = value
    }
  }

  return result
}

// Get the current configuration
export function getConfig(): AppConfig {
  return config
}

// Update configuration at runtime
export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  config = configSchema.parse({
    ...config,
    ...removeUndefined(updates),
  })

  return config
}

// Initialize config on import
initConfig()

export default config

