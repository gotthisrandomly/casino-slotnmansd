import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { DatabaseConfig } from "./database-config"

export class SupabaseAdapter {
  private client: SupabaseClient | null = null
  private config: DatabaseConfig
  private initialized = false

  constructor(config: DatabaseConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      if (!this.config.supabaseUrl || !this.config.supabaseKey) {
        throw new Error("Supabase URL and key are required")
      }

      // Create Supabase client
      this.client = createClient(this.config.supabaseUrl, this.config.supabaseKey)

      // Check connection
      const { error } = await this.client.from("users").select("id").limit(1)

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "No rows found" which is fine for this
        throw new Error(`Supabase connection error: ${error.message}`)
      }

      // Create tables if they don't exist
      await this.createTables()

      this.initialized = true
      console.log("Supabase database initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Supabase database:", error)
      throw new Error(`Supabase initialization error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async close(): Promise<void> {
    // Supabase client doesn't need explicit closing
    this.client = null
    this.initialized = false
  }

  async createTables(): Promise<void> {
    if (!this.client) throw new Error("Database not initialized")

    // Check if tables exist
    const { data: tables, error } = await this.client.rpc("get_tables")

    if (error) {
      throw new Error(`Failed to check tables: ${error.message}`)
    }

    const tableNames = tables.map((t: any) => t.table_name)

    // Create tables if they don't exist
    if (!tableNames.includes("users")) {
      await this.client.rpc("create_users_table")
    }

    if (!tableNames.includes("sessions")) {
      await this.client.rpc("create_sessions_table")
    }

    if (!tableNames.includes("spins")) {
      await this.client.rpc("create_spins_table")
    }

    if (!tableNames.includes("transactions")) {
      await this.client.rpc("create_transactions_table")
    }

    if (!tableNames.includes("leaderboard")) {
      await this.client.rpc("create_leaderboard_table")
    }

    if (!tableNames.includes("payment_methods")) {
      await this.client.rpc("create_payment_methods_table")
    }
  }

  // User methods
  async getUser(id: string): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client.from("users").select("*").eq("id", id).single()

      if (error) throw error

      return data || null
    } catch (error) {
      console.error("Error getting user:", error)
      return null
    }
  }

  async getUserByUsername(username: string): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client.from("users").select("*").eq("username", username).single()

      if (error && error.code !== "PGRST116") throw error

      return data || null
    } catch (error) {
      console.error("Error getting user by username:", error)
      return null
    }
  }

  async createUser(user: any): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("users")
        .insert([
          {
            id: user.id,
            username: user.username,
            password: user.password,
            email: user.email,
            balance: user.balance,
            created_at: user.createdAt,
            last_login: user.lastLogin,
            is_admin: user.isAdmin,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return data || null
    } catch (error) {
      console.error("Error creating user:", error)
      return null
    }
  }

  async updateUser(id: string, updates: any): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      // Convert camelCase to snake_case for database
      const dbUpdates: Record<string, any> = {}

      for (const [key, value] of Object.entries(updates)) {
        const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase()
        dbUpdates[dbKey] = value
      }

      const { data, error } = await this.client.from("users").update(dbUpdates).eq("id", id).select().single()

      if (error) throw error

      return data || null
    } catch (error) {
      console.error("Error updating user:", error)
      return null
    }
  }

  async getAllUsers(limit = 100, offset = 0): Promise<any[]> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("users")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Error getting all users:", error)
      return []
    }
  }

  async countUsers(): Promise<number> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { count, error } = await this.client.from("users").select("*", { count: "exact", head: true })

      if (error) throw error

      return count || 0
    } catch (error) {
      console.error("Error counting users:", error)
      return 0
    }
  }

  // Session methods
  async createSession(session: any): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("sessions")
        .insert([
          {
            id: session.id,
            user_id: session.userId,
            game_id: session.gameId,
            start_time: session.startTime,
            initial_balance: session.initialBalance,
            provably_fair_data: session.provablyFairData,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return this.getSession(session.id)
    } catch (error) {
      console.error("Error creating session:", error)
      return null
    }
  }

  async getSession(id: string): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client.from("sessions").select("*").eq("id", id).single()

      if (error) throw error

      if (!data) return null

      // Get spins for this session
      const spins = await this.getSpinsBySessionId(id)

      return {
        id: data.id,
        userId: data.user_id,
        gameId: data.game_id,
        startTime: data.start_time,
        endTime: data.end_time,
        initialBalance: data.initial_balance,
        finalBalance: data.final_balance,
        provablyFairData: data.provably_fair_data,
        spins,
      }
    } catch (error) {
      console.error("Error getting session:", error)
      return null
    }
  }

  async endSession(id: string, finalBalance: number): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const now = new Date().toISOString()

      const { data, error } = await this.client
        .from("sessions")
        .update({
          end_time: now,
          final_balance: finalBalance,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return this.getSession(id)
    } catch (error) {
      console.error("Error ending session:", error)
      return null
    }
  }

  async getUserSessions(userId: string, limit = 10): Promise<any[]> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: false })
        .limit(limit)

      if (error) throw error

      if (!data) return []

      // Get spins for each session
      const sessionsWithSpins = await Promise.all(
        data.map(async (session) => {
          const spins = await this.getSpinsBySessionId(session.id)

          return {
            id: session.id,
            userId: session.user_id,
            gameId: session.game_id,
            startTime: session.start_time,
            endTime: session.end_time,
            initialBalance: session.initial_balance,
            finalBalance: session.final_balance,
            provablyFairData: session.provably_fair_data,
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
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("spins")
        .insert([
          {
            id: spin.id,
            session_id: spin.sessionId,
            user_id: spin.userId,
            game_id: spin.gameId,
            amount: spin.amount,
            win_amount: spin.winAmount,
            result: spin.result,
            timestamp: spin.timestamp,
            provably_fair_data: spin.provablyFairData,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return this.getSpin(spin.id)
    } catch (error) {
      console.error("Error recording spin:", error)
      return null
    }
  }

  async getSpin(id: string): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client.from("spins").select("*").eq("id", id).single()

      if (error) throw error

      if (!data) return null

      return {
        id: data.id,
        sessionId: data.session_id,
        userId: data.user_id,
        gameId: data.game_id,
        amount: data.amount,
        winAmount: data.win_amount,
        result: data.result,
        timestamp: data.timestamp,
        provablyFairData: data.provably_fair_data,
      }
    } catch (error) {
      console.error("Error getting spin:", error)
      return null
    }
  }

  async getSpinsBySessionId(sessionId: string): Promise<any[]> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("spins")
        .select("*")
        .eq("session_id", sessionId)
        .order("timestamp", { ascending: true })

      if (error) throw error

      if (!data) return []

      return data.map((spin) => ({
        id: spin.id,
        sessionId: spin.session_id,
        userId: spin.user_id,
        gameId: spin.game_id,
        amount: spin.amount,
        winAmount: spin.win_amount,
        result: spin.result,
        timestamp: spin.timestamp,
        provablyFairData: spin.provably_fair_data,
      }))
    } catch (error) {
      console.error("Error getting spins by session ID:", error)
      return []
    }
  }

  // Transaction methods
  async createTransaction(transaction: any): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("transactions")
        .insert([
          {
            id: transaction.id,
            user_id: transaction.userId,
            type: transaction.type,
            amount: transaction.amount,
            gateway: transaction.gateway,
            method_id: transaction.methodId,
            status: transaction.status,
            description: transaction.description,
            metadata: transaction.metadata,
            created_at: transaction.createdAt,
            updated_at: transaction.updatedAt,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return this.getTransaction(transaction.id)
    } catch (error) {
      console.error("Error creating transaction:", error)
      return null
    }
  }

  async getTransaction(id: string): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client.from("transactions").select("*").eq("id", id).single()

      if (error) throw error

      if (!data) return null

      return {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        amount: data.amount,
        gateway: data.gateway,
        methodId: data.method_id,
        status: data.status,
        description: data.description,
        metadata: data.metadata,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }
    } catch (error) {
      console.error("Error getting transaction:", error)
      return null
    }
  }

  async getUserTransactions(userId: string, limit = 50): Promise<any[]> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      if (!data) return []

      return data.map((transaction) => ({
        id: transaction.id,
        userId: transaction.user_id,
        type: transaction.type,
        amount: transaction.amount,
        gateway: transaction.gateway,
        methodId: transaction.method_id,
        status: transaction.status,
        description: transaction.description,
        metadata: transaction.metadata,
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
    if (!this.client) throw new Error("Database not initialized")

    try {
      // Check if entry exists
      const { data: existingEntry, error: checkError } = await this.client
        .from("leaderboard")
        .select("*")
        .eq("user_id", entry.userId)
        .single()

      if (checkError && checkError.code !== "PGRST116") throw checkError

      if (existingEntry) {
        // Update existing entry
        const { data, error } = await this.client.rpc("update_leaderboard_entry", {
          p_user_id: entry.userId,
          p_highest_win: entry.highestWin,
          p_win_amount: entry.winAmount,
          p_timestamp: entry.timestamp,
        })

        if (error) throw error
      } else {
        // Create new entry
        const { data, error } = await this.client
          .from("leaderboard")
          .insert([
            {
              user_id: entry.userId,
              username: entry.username,
              highest_win: entry.highestWin,
              total_winnings: entry.winAmount,
              timestamp: entry.timestamp,
            },
          ])
          .select()
          .single()

        if (error) throw error
      }

      return this.getLeaderboardEntry(entry.userId)
    } catch (error) {
      console.error("Error updating leaderboard:", error)
      return null
    }
  }

  async getLeaderboardEntry(userId: string): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client.from("leaderboard").select("*").eq("user_id", userId).single()

      if (error) throw error

      if (!data) return null

      return {
        userId: data.user_id,
        username: data.username,
        highestWin: data.highest_win,
        totalWinnings: data.total_winnings,
        timestamp: data.timestamp,
      }
    } catch (error) {
      console.error("Error getting leaderboard entry:", error)
      return null
    }
  }

  async getTopHighestWins(limit = 10): Promise<any[]> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("leaderboard")
        .select("*")
        .order("highest_win", { ascending: false })
        .limit(limit)

      if (error) throw error

      if (!data) return []

      return data.map((entry) => ({
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
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("leaderboard")
        .select("*")
        .order("total_winnings", { ascending: false })
        .limit(limit)

      if (error) throw error

      if (!data) return []

      return data.map((entry) => ({
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
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("payment_methods")
        .insert([
          {
            id: method.id,
            user_id: method.userId,
            type: method.type,
            gateway: method.gateway,
            details: method.details,
            is_default: method.isDefault,
            created_at: method.createdAt,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return this.getPaymentMethod(method.id)
    } catch (error) {
      console.error("Error adding payment method:", error)
      return null
    }
  }

  async getPaymentMethod(id: string): Promise<any | null> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client.from("payment_methods").select("*").eq("id", id).single()

      if (error) throw error

      if (!data) return null

      return {
        id: data.id,
        userId: data.user_id,
        type: data.type,
        gateway: data.gateway,
        details: data.details,
        isDefault: data.is_default,
        createdAt: data.created_at,
      }
    } catch (error) {
      console.error("Error getting payment method:", error)
      return null
    }
  }

  async getUserPaymentMethods(userId: string): Promise<any[]> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error

      if (!data) return []

      return data.map((method) => ({
        id: method.id,
        userId: method.user_id,
        type: method.type,
        gateway: method.gateway,
        details: method.details,
        isDefault: method.is_default,
        createdAt: method.created_at,
      }))
    } catch (error) {
      console.error("Error getting user payment methods:", error)
      return []
    }
  }

  async deletePaymentMethod(id: string): Promise<boolean> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { error } = await this.client.from("payment_methods").delete().eq("id", id)

      if (error) throw error

      return true
    } catch (error) {
      console.error("Error deleting payment method:", error)
      return false
    }
  }

  // Database status
  async getDatabaseStats(): Promise<Record<string, number>> {
    if (!this.client) throw new Error("Database not initialized")

    try {
      const { data, error } = await this.client.rpc("get_database_stats")

      if (error) throw error

      return (
        data || {
          users: 0,
          sessions: 0,
          spins: 0,
          transactions: 0,
          leaderboardEntries: 0,
        }
      )
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
}

