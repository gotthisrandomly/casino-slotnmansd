import { Database } from "sqlite3"
import { open, type Database as SQLiteDatabase } from "sqlite"
import fs from "fs"
import path from "path"
import type { DatabaseConfig } from "./database-config"

export class SQLiteAdapter {
  private db: SQLiteDatabase | null = null
  private config: DatabaseConfig
  private initialized = false

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Ensure directory exists
      const dbDir = path.dirname(this.config.sqliteFilePath)
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true })
      }

      // Open database connection
      this.db = await open({
        filename: this.config.sqliteFilePath,
        driver: Database,
      })

      // Enable foreign keys
      await this.db.exec("PRAGMA foreign_keys = ON")

      // Create tables if they don't exist
      await this.createTables()

      this.initialized = true
      console.log("SQLite database initialized successfully")
    } catch (error) {
      console.error("Failed to initialize SQLite database:", error)
      throw new Error(`SQLite initialization error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
      this.initialized = false
    }
  }

  async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    // Users table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT,
        email TEXT,
        balance REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        last_login TEXT NOT NULL,
        is_admin INTEGER NOT NULL DEFAULT 0
      )
    `)

    // Sessions table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        game_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        initial_balance REAL NOT NULL,
        final_balance REAL,
        provably_fair_data TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `)

    // Spins table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS spins (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        game_id TEXT NOT NULL,
        amount REAL NOT NULL,
        win_amount REAL NOT NULL,
        result TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        provably_fair_data TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `)

    // Transactions table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        gateway TEXT,
        method_id TEXT,
        status TEXT NOT NULL,
        description TEXT,
        metadata TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `)

    // Leaderboard table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS leaderboard (
        user_id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        highest_win REAL NOT NULL DEFAULT 0,
        total_winnings REAL NOT NULL DEFAULT 0,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `)

    // Payment methods table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        gateway TEXT NOT NULL,
        details TEXT NOT NULL,
        is_default INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `)

    // Create indexes for performance
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
      CREATE INDEX IF NOT EXISTS idx_spins_session_id ON spins (session_id);
      CREATE INDEX IF NOT EXISTS idx_spins_user_id ON spins (user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions (user_id);
      CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods (user_id);
    `)
  }

  // User methods
  async getUser(id: string): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const user = await this.db.get("SELECT * FROM users WHERE id = ?", id)
      return user || null
    } catch (error) {
      console.error("Error getting user:", error)
      return null
    }
  }

  async getUserByUsername(username: string): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const user = await this.db.get("SELECT * FROM users WHERE username = ?", username)
      return user || null
    } catch (error) {
      console.error("Error getting user by username:", error)
      return null
    }
  }

  async createUser(user: any): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      await this.db.run(
        `INSERT INTO users (id, username, password, email, balance, created_at, last_login, is_admin)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        user.id,
        user.username,
        user.password,
        user.email,
        user.balance,
        user.createdAt,
        user.lastLogin,
        user.isAdmin ? 1 : 0,
      )

      return this.getUser(user.id)
    } catch (error) {
      console.error("Error creating user:", error)
      return null
    }
  }

  async updateUser(id: string, updates: any): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const setClause = Object.keys(updates)
        .map((key) => {
          // Convert camelCase to snake_case for database
          const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()
          return `${dbKey} = ?`
        })
        .join(", ")

      const values = Object.values(updates)

      await this.db.run(`UPDATE users SET ${setClause} WHERE id = ?`, ...values, id)

      return this.getUser(id)
    } catch (error) {
      console.error("Error updating user:", error)
      return null
    }
  }

  async getAllUsers(limit = 100, offset = 0): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const users = await this.db.all("SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?", limit, offset)

      return users || []
    } catch (error) {
      console.error("Error getting all users:", error)
      return []
    }
  }

  async countUsers(): Promise<number> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const result = await this.db.get("SELECT COUNT(*) as count FROM users")
      return result?.count || 0
    } catch (error) {
      console.error("Error counting users:", error)
      return 0
    }
  }

  // Session methods
  async createSession(session: any): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      await this.db.run(
        `INSERT INTO sessions (id, user_id, game_id, start_time, initial_balance, provably_fair_data)
         VALUES (?, ?, ?, ?, ?, ?)`,
        session.id,
        session.userId,
        session.gameId,
        session.startTime,
        session.initialBalance,
        JSON.stringify(session.provablyFairData),
      )

      return this.getSession(session.id)
    } catch (error) {
      console.error("Error creating session:", error)
      return null
    }
  }

  async getSession(id: string): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const session = await this.db.get("SELECT * FROM sessions WHERE id = ?", id)

      if (!session) return null

      // Parse JSON fields
      session.provablyFairData = JSON.parse(session.provably_fair_data)

      // Get spins for this session
      const spins = await this.getSpinsBySessionId(id)

      return {
        id: session.id,
        userId: session.user_id,
        gameId: session.game_id,
        startTime: session.start_time,
        endTime: session.end_time,
        initialBalance: session.initial_balance,
        finalBalance: session.final_balance,
        provablyFairData: session.provablyFairData,
        spins,
      }
    } catch (error) {
      console.error("Error getting session:", error)
      return null
    }
  }

  async endSession(id: string, finalBalance: number): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const now = new Date().toISOString()

      await this.db.run("UPDATE sessions SET end_time = ?, final_balance = ? WHERE id = ?", now, finalBalance, id)

      return this.getSession(id)
    } catch (error) {
      console.error("Error ending session:", error)
      return null
    }
  }

  async getUserSessions(userId: string, limit = 10): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const sessions = await this.db.all(
        "SELECT * FROM sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT ?",
        userId,
        limit,
      )

      // Get spins for each session
      const sessionsWithSpins = await Promise.all(
        sessions.map(async (session) => {
          const spins = await this.getSpinsBySessionId(session.id)

          return {
            id: session.id,
            userId: session.user_id,
            gameId: session.game_id,
            startTime: session.start_time,
            endTime: session.end_time,
            initialBalance: session.initial_balance,
            finalBalance: session.final_balance,
            provablyFairData: JSON.parse(session.provably_fair_data),
            spins,
          }
        }),
      )

      return sessionsWithSpins
    } catch (error) {
      console.error("Error getting user sessions:", error)
      return []
    }
  }

  // Spin methods
  async recordSpin(spin: any): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      await this.db.run(
        `INSERT INTO spins (id, session_id, user_id, game_id, amount, win_amount, result, timestamp, provably_fair_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        spin.id,
        spin.sessionId,
        spin.userId,
        spin.gameId,
        spin.amount,
        spin.winAmount,
        JSON.stringify(spin.result),
        spin.timestamp,
        JSON.stringify(spin.provablyFairData),
      )

      return this.getSpin(spin.id)
    } catch (error) {
      console.error("Error recording spin:", error)
      return null
    }
  }

  async getSpin(id: string): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const spin = await this.db.get("SELECT * FROM spins WHERE id = ?", id)

      if (!spin) return null

      return {
        id: spin.id,
        sessionId: spin.session_id,
        userId: spin.user_id,
        gameId: spin.game_id,
        amount: spin.amount,
        winAmount: spin.win_amount,
        result: JSON.parse(spin.result),
        timestamp: spin.timestamp,
        provablyFairData: JSON.parse(spin.provably_fair_data),
      }
    } catch (error) {
      console.error("Error getting spin:", error)
      return null
    }
  }

  async getSpinsBySessionId(sessionId: string): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const spins = await this.db.all("SELECT * FROM spins WHERE session_id = ? ORDER BY timestamp ASC", sessionId)

      return spins.map((spin) => ({
        id: spin.id,
        sessionId: spin.session_id,
        userId: spin.user_id,
        gameId: spin.game_id,
        amount: spin.amount,
        winAmount: spin.win_amount,
        result: JSON.parse(spin.result),
        timestamp: spin.timestamp,
        provablyFairData: JSON.parse(spin.provably_fair_data),
      }))
    } catch (error) {
      console.error("Error getting spins by session ID:", error)
      return []
    }
  }

  // Transaction methods
  async createTransaction(transaction: any): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      await this.db.run(
        `INSERT INTO transactions (id, user_id, type, amount, gateway, method_id, status, description, metadata, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        transaction.id,
        transaction.userId,
        transaction.type,
        transaction.amount,
        transaction.gateway,
        transaction.methodId,
        transaction.status,
        transaction.description,
        transaction.metadata ? JSON.stringify(transaction.metadata) : null,
        transaction.createdAt,
        transaction.updatedAt,
      )

      return this.getTransaction(transaction.id)
    } catch (error) {
      console.error("Error creating transaction:", error)
      return null
    }
  }

  async getTransaction(id: string): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const transaction = await this.db.get("SELECT * FROM transactions WHERE id = ?", id)

      if (!transaction) return null

      return {
        id: transaction.id,
        userId: transaction.user_id,
        type: transaction.type,
        amount: transaction.amount,
        gateway: transaction.gateway,
        methodId: transaction.method_id,
        status: transaction.status,
        description: transaction.description,
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      }
    } catch (error) {
      console.error("Error getting transaction:", error)
      return null
    }
  }

  async getUserTransactions(userId: string, limit = 50): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const transactions = await this.db.all(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        userId,
        limit,
      )

      return transactions.map((transaction) => ({
        id: transaction.id,
        userId: transaction.user_id,
        type: transaction.type,
        amount: transaction.amount,
        gateway: transaction.gateway,
        methodId: transaction.method_id,
        status: transaction.status,
        description: transaction.description,
        metadata: transaction.metadata ? JSON.parse(transaction.metadata) : null,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at,
      }))
    } catch (error) {
      console.error("Error getting user transactions:", error)
      return []
    }
  }

  // Leaderboard methods
  async updateLeaderboard(entry: any): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      // Check if entry exists
      const existingEntry = await this.db.get("SELECT * FROM leaderboard WHERE user_id = ?", entry.userId)

      if (existingEntry) {
        // Update existing entry
        await this.db.run(
          `UPDATE leaderboard 
           SET highest_win = CASE WHEN ? > highest_win THEN ? ELSE highest_win END,
               total_winnings = total_winnings + ?,
               timestamp = CASE WHEN ? > highest_win THEN ? ELSE timestamp END
           WHERE user_id = ?`,
          entry.highestWin,
          entry.highestWin,
          entry.winAmount,
          entry.highestWin,
          entry.timestamp,
          entry.userId,
        )
      } else {
        // Create new entry
        await this.db.run(
          `INSERT INTO leaderboard (user_id, username, highest_win, total_winnings, timestamp)
           VALUES (?, ?, ?, ?, ?)`,
          entry.userId,
          entry.username,
          entry.highestWin,
          entry.winAmount,
          entry.timestamp,
        )
      }

      return this.getLeaderboardEntry(entry.userId)
    } catch (error) {
      console.error("Error updating leaderboard:", error)
      return null
    }
  }

  async getLeaderboardEntry(userId: string): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const entry = await this.db.get("SELECT * FROM leaderboard WHERE user_id = ?", userId)

      if (!entry) return null

      return {
        userId: entry.user_id,
        username: entry.username,
        highestWin: entry.highest_win,
        totalWinnings: entry.total_winnings,
        timestamp: entry.timestamp,
      }
    } catch (error) {
      console.error("Error getting leaderboard entry:", error)
      return null
    }
  }

  async getTopHighestWins(limit = 10): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const entries = await this.db.all("SELECT * FROM leaderboard ORDER BY highest_win DESC LIMIT ?", limit)

      return entries.map((entry) => ({
        userId: entry.user_id,
        username: entry.username,
        highestWin: entry.highest_win,
        totalWinnings: entry.total_winnings,
        timestamp: entry.timestamp,
      }))
    } catch (error) {
      console.error("Error getting top highest wins:", error)
      return []
    }
  }

  async getTopTotalWinnings(limit = 10): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const entries = await this.db.all("SELECT * FROM leaderboard ORDER BY total_winnings DESC LIMIT ?", limit)

      return entries.map((entry) => ({
        userId: entry.user_id,
        username: entry.username,
        highestWin: entry.highest_win,
        totalWinnings: entry.total_winnings,
        timestamp: entry.timestamp,
      }))
    } catch (error) {
      console.error("Error getting top total winnings:", error)
      return []
    }
  }

  // Payment method methods
  async addPaymentMethod(method: any): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      await this.db.run(
        `INSERT INTO payment_methods (id, user_id, type, gateway, details, is_default, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        method.id,
        method.userId,
        method.type,
        method.gateway,
        JSON.stringify(method.details),
        method.isDefault ? 1 : 0,
        method.createdAt,
      )

      return this.getPaymentMethod(method.id)
    } catch (error) {
      console.error("Error adding payment method:", error)
      return null
    }
  }

  async getPaymentMethod(id: string): Promise<any | null> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const method = await this.db.get("SELECT * FROM payment_methods WHERE id = ?", id)

      if (!method) return null

      return {
        id: method.id,
        userId: method.user_id,
        type: method.type,
        gateway: method.gateway,
        details: JSON.parse(method.details),
        isDefault: Boolean(method.is_default),
        createdAt: method.created_at,
      }
    } catch (error) {
      console.error("Error getting payment method:", error)
      return null
    }
  }

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const methods = await this.db.all(
        "SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
        userId,
      )

      return methods.map((method) => ({
        id: method.id,
        userId: method.user_id,
        type: method.type,
        gateway: method.gateway,
        details: JSON.parse(method.details),
        isDefault: Boolean(method.is_default),
        createdAt: method.created_at,
      }))
    } catch (error) {
      console.error("Error getting user payment methods:", error)
      return []
    }
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const result = await this.db.run("DELETE FROM payment_methods WHERE id = ?", id)
      return result.changes > 0
    } catch (error) {
      console.error("Error deleting payment method:", error)
      return false
    }
  }

  // Database status
  async getDatabaseStats(): Promise<Record<string, number>> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      const userCount = await this.countUsers()

      const sessionCount = await this.db.get("SELECT COUNT(*) as count FROM sessions")
      const spinCount = await this.db.get("SELECT COUNT(*) as count FROM spins")
      const transactionCount = await this.db.get("SELECT COUNT(*) as count FROM transactions")
      const leaderboardCount = await this.db.get("SELECT COUNT(*) as count FROM leaderboard")

      return {
        users: userCount,
        sessions: sessionCount?.count || 0,
        spins: spinCount?.count || 0,
        transactions: transactionCount?.count || 0,
        leaderboardEntries: leaderboardCount?.count || 0,
      }
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

  // Run a raw query (for advanced use cases)
  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error("Database not initialized")

    try {
      if (sql.trim().toLowerCase().startsWith("select")) {
        return await this.db.all(sql, ...params)
      } else {
        return await this.db.run(sql, ...params)
      }
    } catch (error) {
      console.error("Error running query:", error)
      throw error
    }
  }
}

