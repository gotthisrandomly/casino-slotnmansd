export interface User {
  id: string
  username: string
  password?: string // Hashed password
  email?: string
  balance: number
  createdAt: string
  lastLogin: string
  isAdmin?: boolean
}

export interface GameSession {
  id: string
  userId: string
  startTime: string
  endTime?: string
  initialBalance: number
  finalBalance?: number
  spins: Spin[]
}

export interface Spin {
  id: string
  timestamp: string
  bet: number
  result: string[][]
  winAmount: number
  paylines?: number[]
}

export interface LeaderboardEntry {
  userId: string
  username: string
  highestWin: number
  totalWinnings: number
  timestamp: string
}

export interface AuthCredentials {
  username: string
  password: string
  email?: string
}

export interface Transaction {
  id: string
  userId: string
  type: string
  amount: number
  description: string
  relatedId?: string
  timestamp: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  code: string
  message: string
  details?: any
}

