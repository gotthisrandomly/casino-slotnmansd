import { z } from "zod"
import { getConfig } from "@/lib/config"

// Database configuration schema
export const databaseConfigSchema = z.object({
  type: z.enum(["sqlite", "postgres", "supabase", "mysql", "mongodb"]).default("sqlite"),
  url: z.string().optional(),

  // SQLite specific
  sqliteFilePath: z.string().default("./data/casino.db"),

  // Supabase specific
  supabaseUrl: z.string().optional(),
  supabaseKey: z.string().optional(),

  // PostgreSQL specific
  pgHost: z.string().optional(),
  pgPort: z.number().optional(),
  pgUser: z.string().optional(),
  pgPassword: z.string().optional(),
  pgDatabase: z.string().optional(),
  pgSsl: z.boolean().optional(),

  // MySQL specific
  mysqlHost: z.string().optional(),
  mysqlPort: z.number().optional(),
  mysqlUser: z.string().optional(),
  mysqlPassword: z.string().optional(),
  mysqlDatabase: z.string().optional(),

  // MongoDB specific
  mongodbUri: z.string().optional(),
  mongodbDatabase: z.string().optional(),

  // General options
  poolSize: z.number().default(10),
  debug: z.boolean().default(false),
  ssl: z.boolean().default(false),
})

export type DatabaseConfig = z.infer<typeof databaseConfigSchema>

// Get database configuration from app config
export function getDatabaseConfig(): DatabaseConfig {
  const config = getConfig()

  // Extract database config from app config
  const dbConfig: Partial<DatabaseConfig> = {
    type: config.database.type as any,
    url: config.database.url,
    debug: config.app.debug,
  }

  // Load specific database config from environment variables
  if (process.env.SQLITE_FILE_PATH) {
    dbConfig.sqliteFilePath = process.env.SQLITE_FILE_PATH
  }

  if (process.env.SUPABASE_URL) {
    dbConfig.supabaseUrl = process.env.SUPABASE_URL
  }

  if (process.env.SUPABASE_KEY) {
    dbConfig.supabaseKey = process.env.SUPABASE_KEY
  }

  if (process.env.PG_HOST) {
    dbConfig.pgHost = process.env.PG_HOST
    dbConfig.pgPort = process.env.PG_PORT ? Number.parseInt(process.env.PG_PORT) : undefined
    dbConfig.pgUser = process.env.PG_USER
    dbConfig.pgPassword = process.env.PG_PASSWORD
    dbConfig.pgDatabase = process.env.PG_DATABASE
    dbConfig.pgSsl = process.env.PG_SSL === "true"
  }

  if (process.env.MYSQL_HOST) {
    dbConfig.mysqlHost = process.env.MYSQL_HOST
    dbConfig.mysqlPort = process.env.MYSQL_PORT ? Number.parseInt(process.env.MYSQL_PORT) : undefined
    dbConfig.mysqlUser = process.env.MYSQL_USER
    dbConfig.mysqlPassword = process.env.MYSQL_PASSWORD
    dbConfig.mysqlDatabase = process.env.MYSQL_DATABASE
  }

  if (process.env.MONGODB_URI) {
    dbConfig.mongodbUri = process.env.MONGODB_URI
    dbConfig.mongodbDatabase = process.env.MONGODB_DATABASE
  }

  // Validate and return config
  return databaseConfigSchema.parse(dbConfig)
}

