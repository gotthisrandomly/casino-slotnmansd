import { v4 as uuidv4 } from "uuid"
import type { User, GameSession, Spin, LeaderboardEntry } from "@/types"
import { persistence } from "./persistence"
import { hashPassword, verifyPassword, DEFAULT_ADMIN } from "./auth-utils"

// In-memory database with persistence
class MemoryDB {
  private users: Map<string, User> = new Map()
  private usersByUsername: Map<string, string> = new Map() // username -> userId
  private sessions: Map<string, GameSession> = new Map()
  private userSessions: Map<string, string[]> = new Map() // userId -> sessionIds[]
  private spins: Map<string, Spin[]> = new Map() // sessionId -> spins[]
  private leaderboard: Map<string, LeaderboardEntry> = new Map() // userId -> leaderboardEntry
  private initialized = false
  private autoSave = true
  private isClient = false

  constructor() {
    // Set initialized to true by default
    this.initialized = true

    // Create default admin user immediately
    this.initializeDefaultAdmin()

    // Safely check if we're in a browser environment
    if (typeof window !== "undefined") {
      this.isClient = true
      try {
        this.initializeFromStorage()
      } catch (error) {
        console.error("Failed to initialize from storage:", error)
      }
    }
  }

  // Initialize data from localStorage
  private initializeFromStorage(): void {
    if (!this.isClient) return

    try {
      const data = persistence.loadData()

      if (data) {
        // Load users
        data.users.forEach((user) => {
          this.users.set(user.id, user)
          this.usersByUsername.set(user.username, user.id)
        })

        // Load sessions and spins
        data.sessions.forEach((session) => {
          this.sessions.set(session.id, session)

          // Add to user's sessions
          const userSessions = this.userSessions.get(session.userId) || []
          userSessions.push(session.id)
          this.userSessions.set(session.userId, userSessions)

          // Store spins
          if (session.spins && session.spins.length > 0) {
            this.spins.set(session.id, session.spins)
          }
        })

        // Load leaderboard
        data.leaderboard.forEach((entry) => {
          this.leaderboard.set(entry.userId, entry)
        })

        console.log("Data loaded from localStorage:", {
          users: this.users.size,
          sessions: this.sessions.size,
          leaderboard: this.leaderboard.size,
        })
      }
    } catch (error) {
      console.error("Failed to initialize from storage:", error)
    }
  }

  // Initialize with default admin
  initializeDefaultAdmin(): void {
    // Check if admin already exists in memory
    const adminUsername = DEFAULT_ADMIN.username
    let adminExists = false

    for (const user of this.users.values()) {
      if (user.username === adminUsername && user.isAdmin) {
        adminExists = true
        break
      }
    }

    if (!adminExists) {
      const userId = uuidv4()
      const now = new Date().toISOString()

      const admin: User = {
        id: userId,
        username: DEFAULT_ADMIN.username,
        password: DEFAULT_ADMIN.password,
        balance: 10000, // Give admin a big balance
        createdAt: now,
        lastLogin: now,
        isAdmin: true,
      }

      this.users.set(userId, admin)
      this.usersByUsername.set(admin.username, userId)

      console.log("Default admin user created")
    }
  }

  // Save current state to localStorage
  private saveToStorage(): void {
    if (!this.autoSave || !this.isClient) return

    try {
      const data = {
        users: Array.from(this.users.values()),
        sessions: Array.from(this.sessions.values()).map((session) => ({
          ...session,
          spins: [], // Don't include spins in the session objects to avoid duplication
        })),
        leaderboard: Array.from(this.leaderboard.values()),
        lastSaved: new Date().toISOString(),
      }

      persistence.saveData(data)
    } catch (error) {
      console.error("Failed to save to storage:", error)
    }
  }

  // Enable or disable auto-save
  setAutoSave(enabled: boolean): void {
    this.autoSave = enabled
  }

  // Export all data
  exportData(): void {
    if (!this.isClient) return

    try {
      const data = {
        users: Array.from(this.users.values()),
        sessions: Array.from(this.sessions.values()).map((session) => {
          // Include spins in each session for export
          const sessionSpins = this.spins.get(session.id) || []
          return {
            ...session,
            spins: sessionSpins,
          }
        }),
        leaderboard: Array.from(this.leaderboard.values()),
        lastSaved: new Date().toISOString(),
      }

      persistence.exportData(data)
    } catch (error) {
      console.error("Failed to export data:", error)
    }
  }

  // Import data from a file
  async importData(file: File): Promise<boolean> {
    if (!this.isClient) return false

    try {
      const data = await persistence.importData(file)

      if (!data) return false

      // Clear existing data
      this.users.clear()
      this.usersByUsername.clear()
      this.sessions.clear()
      this.userSessions.clear()
      this.spins.clear()
      this.leaderboard.clear()

      // Load users
      data.users.forEach((user) => {
        this.users.set(user.id, user)
        this.usersByUsername.set(user.username, user.id)
      })

      // Load sessions and spins
      data.sessions.forEach((session) => {
        // Store session without spins
        const { spins, ...sessionWithoutSpins } = session
        this.sessions.set(session.id, sessionWithoutSpins)

        // Add to user's sessions
        const userSessions = this.userSessions.get(session.userId) || []
        userSessions.push(session.id)
        this.userSessions.set(session.userId, userSessions)

        // Store spins separately
        if (spins && spins.length > 0) {
          this.spins.set(session.id, spins)
        }
      })

      // Load leaderboard
      data.leaderboard.forEach((entry) => {
        this.leaderboard.set(entry.userId, entry)
      })

      // Save to storage
      this.saveToStorage()

      return true
    } catch (error) {
      console.error("Failed to import data:", error)
      return false
    }
  }

  // Clear all data
  clearAllData(): boolean {
    try {
      this.users.clear()
      this.usersByUsername.clear()
      this.sessions.clear()
      this.userSessions.clear()
      this.spins.clear()
      this.leaderboard.clear()

      // Clear localStorage
      if (this.isClient) {
        persistence.clearData()
      }

      // Re-initialize default admin
      this.initializeDefaultAdmin()

      return true
    } catch (error) {
      console.error("Failed to clear data:", error)
      return false
    }
  }

  // User methods
  getUserById(userId: string): User | null {
    return this.users.get(userId) || null
  }

  getUserByUsername(username: string): User | null {
    const userId = this.usersByUsername.get(username)
    if (!userId) return null
    return this.users.get(userId) || null
  }

  createUser(username: string, initialBalance = 1000): User {
    const userId = uuidv4()
    const now = new Date().toISOString()

    const user: User = {
      id: userId,
      username,
      balance: initialBalance,
      createdAt: now,
      lastLogin: now,
    }

    this.users.set(userId, user)
    this.usersByUsername.set(username, userId)

    // Save to storage
    this.saveToStorage()

    return user
  }

  // Create a new user with password
  createUserWithCredentials(username: string, password: string, email?: string, initialBalance = 1000): User | null {
    // Check if username already exists
    if (this.getUserByUsername(username)) {
      return null
    }

    const userId = uuidv4()
    const now = new Date().toISOString()
    const hashedPassword = hashPassword(password)

    const user: User = {
      id: userId,
      username,
      password: hashedPassword,
      email,
      balance: initialBalance,
      createdAt: now,
      lastLogin: now,
      isAdmin: false,
    }

    this.users.set(userId, user)
    this.usersByUsername.set(username, userId)

    // Save to storage
    this.saveToStorage()

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  // Verify user credentials
  verifyCredentials(username: string, password: string): User | null {
    const user = this.getUserByUsername(username)

    if (!user || !user.password) {
      return null
    }

    if (verifyPassword(password, user.password)) {
      // Return user without password
      const { password: _, ...userWithoutPassword } = user
      return userWithoutPassword as User
    }

    return null
  }

  updateUserBalance(userId: string, newBalance: number): User | null {
    const user = this.users.get(userId)
    if (!user) return null

    user.balance = newBalance
    this.users.set(userId, user)

    // Save to storage
    this.saveToStorage()

    return user
  }

  updateUserLastLogin(userId: string): User | null {
    const user = this.users.get(userId)
    if (!user) return null

    user.lastLogin = new Date().toISOString()
    this.users.set(userId, user)

    // Save to storage
    this.saveToStorage()

    return user
  }

  // Session methods
  createSession(userId: string): GameSession | null {
    const user = this.users.get(userId)
    if (!user) return null

    const sessionId = uuidv4()
    const now = new Date().toISOString()

    const session: GameSession = {
      id: sessionId,
      userId,
      startTime: now,
      initialBalance: user.balance,
      spins: [],
    }

    this.sessions.set(sessionId, session)

    // Add to user's sessions
    const userSessions = this.userSessions.get(userId) || []
    userSessions.push(sessionId)
    this.userSessions.set(userId, userSessions)

    // Initialize empty spins array
    this.spins.set(sessionId, [])

    // Save to storage
    this.saveToStorage()

    return session
  }

  getSessionById(sessionId: string): GameSession | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    // Get spins for this session
    const sessionSpins = this.spins.get(sessionId) || []

    return {
      ...session,
      spins: sessionSpins,
    }
  }

  endSession(sessionId: string): GameSession | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const user = this.users.get(session.userId)
    if (!user) return null

    session.endTime = new Date().toISOString()
    session.finalBalance = user.balance

    this.sessions.set(sessionId, session)

    // Save to storage
    this.saveToStorage()

    return this.getSessionById(sessionId)
  }

  getUserSessions(userId: string): GameSession[] {
    const sessionIds = this.userSessions.get(userId) || []
    const sessions: GameSession[] = []

    for (const sessionId of sessionIds) {
      const session = this.getSessionById(sessionId)
      if (session) sessions.push(session)
    }

    // Sort by start time (newest first)
    return sessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  }

  // Spin methods
  recordSpin(sessionId: string, bet: number, result: string[][], winAmount: number, paylines?: number[]): Spin | null {
    const session = this.sessions.get(sessionId)
    if (!session) return null

    const user = this.users.get(session.userId)
    if (!user) return null

    // Check if user has enough balance
    if (user.balance < bet) return null

    // Update user balance
    const newBalance = user.balance - bet + winAmount
    this.updateUserBalance(session.userId, newBalance)

    const spinId = uuidv4()
    const now = new Date().toISOString()

    const spin: Spin = {
      id: spinId,
      timestamp: now,
      bet,
      result,
      winAmount,
      paylines,
    }

    // Add spin to session
    const sessionSpins = this.spins.get(sessionId) || []
    sessionSpins.push(spin)
    this.spins.set(sessionId, sessionSpins)

    // If this is a win, update leaderboard
    if (winAmount > 0) {
      this.recordWin(session.userId, user.username, winAmount)
    }

    // Save to storage
    this.saveToStorage()

    return spin
  }

  // Leaderboard methods
  recordWin(userId: string, username: string, winAmount: number): void {
    const now = new Date().toISOString()

    // Get existing entry
    const entry = this.leaderboard.get(userId)

    if (entry) {
      // Update existing entry
      if (winAmount > entry.highestWin) {
        entry.highestWin = winAmount
        entry.timestamp = now
      }

      entry.totalWinnings += winAmount
      this.leaderboard.set(userId, entry)
    } else {
      // Create new entry
      const newEntry: LeaderboardEntry = {
        userId,
        username,
        highestWin: winAmount,
        totalWinnings: winAmount,
        timestamp: now,
      }

      this.leaderboard.set(userId, newEntry)
    }

    // Save to storage
    this.saveToStorage()
  }

  getTopHighestWins(limit = 10): LeaderboardEntry[] {
    return Array.from(this.leaderboard.values())
      .sort((a, b) => b.highestWin - a.highestWin)
      .slice(0, limit)
  }

  getTopTotalWinnings(limit = 10): LeaderboardEntry[] {
    return Array.from(this.leaderboard.values())
      .sort((a, b) => b.totalWinnings - a.totalWinnings)
      .slice(0, limit)
  }

  // Database status
  isConnected(): boolean {
    // Always return a boolean value
    return this.initialized === true
  }

  // Get all users (for admin)
  getAllUsers(): User[] {
    return Array.from(this.users.values()).map((user) => {
      // Remove password from response
      const { password, ...userWithoutPassword } = user
      return userWithoutPassword as User
    })
  }
}

// Create a singleton instance
const db = new MemoryDB()

export { db }

