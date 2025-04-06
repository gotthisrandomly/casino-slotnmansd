import { getDatabaseConfig, type DatabaseConfig } from "./database-config"
import { SQLiteAdapter } from "./sqlite-adapter"
import { SupabaseAdapter } from "./supabase-adapter"

// Database adapter interface
export interface DatabaseAdapter {
  initialize(): Promise<void>
  close(): Promise<void>

  // User methods
  getUser(id: string): Promise<any | null>
  getUserByUsername(username: string): Promise<any | null>
  createUser(user: any): Promise<any | null>
  updateUser(id: string, updates: any): Promise<any | null>
  getAllUsers(limit?: number, offset?: number): Promise<any[]>
  countUsers(): Promise<number>

  // Session methods
  createSession(session: any): Promise<any | null>
  getSession(id: string): Promise<any | null>
  endSession(id: string, finalBalance: number): Promise<any | null>
  getUserSessions(userId: string, limit?: number): Promise<any[]>

  // Spin methods
  recordSpin(spin: any): Promise<any | null>
  getSpin(id: string): Promise<any | null>
  getSpinsBySessionId(sessionId: string): Promise<any[]>

  // Transaction methods
  createTransaction(transaction: any): Promise<any | null>
  getTransaction(id: string): Promise<any | null>
  getUserTransactions(userId: string, limit?: number): Promise<any[]>

  // Leaderboard methods
  updateLeaderboard(entry: any): Promise<any | null>
  getLeaderboardEntry(userId: string): Promise<any | null>
  getTopHighestWins(limit?: number): Promise<any[]>
  getTopTotalWinnings(limit?: number): Promise<any[]>

  // Payment method methods
  addPaymentMethod(method: any): Promise<any | null>
  getPaymentMethod(id: string): Promise<any | null>
  getUserPaymentMethods(userId: string): Promise<any[]>
  deletePaymentMethod(id: string): Promise<boolean>

  // Database status
  getDatabaseStats(): Promise<Record<string, number>>
}

// Create database adapter based on configuration
export function createDatabaseAdapter(config?: DatabaseConfig): DatabaseAdapter {
  const dbConfig = config || getDatabaseConfig()

  switch (dbConfig.type) {
    case "sqlite":
      return new SQLiteAdapter(dbConfig)
    case "supabase":
      return new SupabaseAdapter(dbConfig)
    default:
      // Default to SQLite for development
      console.warn(`Database type '${dbConfig.type}' not supported, using SQLite instead`)
      return new SQLiteAdapter(dbConfig)
  }
}

