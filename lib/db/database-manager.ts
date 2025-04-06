import { createDatabaseAdapter, type DatabaseAdapter } from "./database-factory"
import { v4 as uuidv4 } from "uuid"
import type { User, GameSession, Spin, LeaderboardEntry, Transaction, PaymentMethod } from "@/types"

// Database manager class
export class DatabaseManager {
  private adapter: DatabaseAdapter
  private initialized = false

  constructor() {
    this.adapter = createDatabaseAdapter()
  }

  // Initialize the database
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      await this.adapter.initialize()
      this.initialized = true

      // Create default admin user if it doesn't exist
      await this.createDefaultAdmin()
    } catch (error) {
      console.error("Failed to initialize database:", error)
      throw error
    }
  }

  // Create default admin user
  private async createDefaultAdmin(): Promise<void> {
    try {
      const adminUsername = "admin"
      const admin = await this.getUserByUsername(adminUsername)

      if (!admin) {
        const now = new Date().toISOString()

        await this.adapter.createUser({
          id: uuidv4(),
          username: adminUsername,
          password: process.env.ADMIN_PASSWORD || "admin123", // Should be hashed in production
          balance: 10000,
          createdAt: now,
          lastLogin: now,
          isAdmin: true,
        })

        console.log("Default admin user created")
      }
    } catch (error) {
      console.error("Error creating default admin:", error)
    }
  }

  // Close the database connection
  async close(): Promise<void> {
    if (!this.initialized) return

    try {
      await this.adapter.close()
      this.initialized = false
    } catch (error) {
      console.error("Failed to close database:", error)
      throw error
    }
  }

  // Check if database is initialized
  isInitialized(): boolean {
    return this.initialized
  }

  // User methods
  async getUser(id: string): Promise<User | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getUser(id)
    } catch (error) {
      console.error("Error getting user:", error)
      return null
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getUserByUsername(username)
    } catch (error) {
      console.error("Error getting user by username:", error)
      return null
    }
  }

  async createUser(user: Omit<User, "id" | "createdAt" | "lastLogin">): Promise<User | null> {
    try {
      await this.ensureInitialized()

      const now = new Date().toISOString()
      const userId = uuidv4()

      return await this.adapter.createUser({
        id: userId,
        ...user,
        createdAt: now,
        lastLogin: now,
      })
    } catch (error) {
      console.error("Error creating user:", error)
      return null
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.updateUser(id, updates)
    } catch (error) {
      console.error("Error updating user:", error)
      return null
    }
  }

  async updateUserBalance(id: string, newBalance: number): Promise<User | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.updateUser(id, { balance: newBalance })
    } catch (error) {
      console.error("Error updating user balance:", error)
      return null
    }
  }

  async getAllUsers(limit = 100, offset = 0): Promise<User[]> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getAllUsers(limit, offset)
    } catch (error) {
      console.error("Error getting all users:", error)
      return []
    }
  }

  async countUsers(): Promise<number> {
    try {
      await this.ensureInitialized()
      return await this.adapter.countUsers()
    } catch (error) {
      console.error("Error counting users:", error)
      return 0
    }
  }

  // Session methods
  async createSession(session: Omit<GameSession, "id" | "startTime" | "spins">): Promise<GameSession | null> {
    try {
      await this.ensureInitialized()

      const now = new Date().toISOString()
      const sessionId = uuidv4()

      return await this.adapter.createSession({
        id: sessionId,
        ...session,
        startTime: now,
      })
    } catch (error) {
      console.error("Error creating session:", error)
      return null
    }
  }

  async getSession(id: string): Promise<GameSession | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getSession(id)
    } catch (error) {
      console.error("Error getting session:", error)
      return null
    }
  }

  async endSession(id: string, finalBalance: number): Promise<GameSession | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.endSession(id, finalBalance)
    } catch (error) {
      console.error("Error ending session:", error)
      return null
    }
  }

  async getUserSessions(userId: string, limit = 10): Promise<GameSession[]> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getUserSessions(userId, limit)
    } catch (error) {
      console.error("Error getting user sessions:", error)
      return []
    }
  }

  // Spin methods
  async recordSpin(spin: Omit<Spin, "id" | "timestamp">): Promise<Spin | null> {
    try {
      await this.ensureInitialized()

      const now = new Date().toISOString()
      const spinId = uuidv4()

      return await this.adapter.recordSpin({
        id: spinId,
        ...spin,
        timestamp: now,
      })
    } catch (error) {
      console.error("Error recording spin:", error)
      return null
    }
  }

  async getSpin(id: string): Promise<Spin | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getSpin(id)
    } catch (error) {
      console.error("Error getting spin:", error)
      return null
    }
  }

  async getSpinsBySessionId(sessionId: string): Promise<Spin[]> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getSpinsBySessionId(sessionId)
    } catch (error) {
      console.error("Error getting spins by session ID:", error)
      return []
    }
  }

  // Transaction methods
  async createTransaction(
    transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<Transaction | null> {
    try {
      await this.ensureInitialized()

      const now = new Date().toISOString()
      const transactionId = uuidv4()

      return await this.adapter.createTransaction({
        id: transactionId,
        ...transaction,
        createdAt: now,
        updatedAt: now,
      })
    } catch (error) {
      console.error("Error creating transaction:", error)
      return null
    }
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getTransaction(id)
    } catch (error) {
      console.error("Error getting transaction:", error)
      return null
    }
  }

  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getUserTransactions(userId, limit)
    } catch (error) {
      console.error("Error getting user transactions:", error)
      return []
    }
  }

  // Leaderboard methods
  async updateLeaderboard(userId: string, username: string, winAmount: number): Promise<LeaderboardEntry | null> {
    try {
      await this.ensureInitialized()

      const now = new Date().toISOString()

      return await this.adapter.updateLeaderboard({
        userId,
        username,
        highestWin: winAmount,
        winAmount,
        timestamp: now,
      })
    } catch (error) {
      console.error("Error updating leaderboard:", error)
      return null
    }
  }

  async getLeaderboardEntry(userId: string): Promise<LeaderboardEntry | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getLeaderboardEntry(userId)
    } catch (error) {
      console.error("Error getting leaderboard entry:", error)
      return null
    }
  }

  async getTopHighestWins(limit = 10): Promise<LeaderboardEntry[]> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getTopHighestWins(limit)
    } catch (error) {
      console.error("Error getting top highest wins:", error)
      return []
    }
  }

  async getTopTotalWinnings(limit = 10): Promise<LeaderboardEntry[]> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getTopTotalWinnings(limit)
    } catch (error) {
      console.error("Error getting top total winnings:", error)
      return []
    }
  }

  // Payment method methods
  async addPaymentMethod(method: Omit<PaymentMethod, "id" | "createdAt">): Promise<PaymentMethod | null> {
    try {
      await this.ensureInitialized()

      const now = new Date().toISOString()
      const methodId = uuidv4()

      return await this.adapter.addPaymentMethod({
        id: methodId,
        ...method,
        createdAt: now,
      })
    } catch (error) {
      console.error("Error adding payment method:", error)
      return null
    }
  }

  async getPaymentMethod(id: string): Promise<PaymentMethod | null> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getPaymentMethod(id)
    } catch (error) {
      console.error("Error getting payment method:", error)
      return null
    }
  }

  async getUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getUserPaymentMethods(userId)
    } catch (error) {
      console.error("Error getting user payment methods:", error)
      return []
    }
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    try {
      await this.ensureInitialized()
      return await this.adapter.deletePaymentMethod(id)
    } catch (error) {
      console.error("Error deleting payment method:", error)
      return false
    }
  }

  // Database status
  async getDatabaseStats(): Promise<Record<string, number>> {
    try {
      await this.ensureInitialized()
      return await this.adapter.getDatabaseStats()
    } catch (error) {
      console.error("Error getting database stats:", error)
      return {
        users: 0,
        sessions: 0,
        spins: 0,
        transactions: 0,
        leaderboardEntries: 0,
      }
    }
  }

  // Ensure database is initialized
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }
}

// Create a singleton instance
export const db = new DatabaseManager()

// Export a function to initialize the database
export async function initDatabase(): Promise<void> {
  await db.initialize()
}

