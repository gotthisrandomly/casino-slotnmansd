export interface User {
  id: string
  username: string
  email?: string
  balance: number
  createdAt: string
  lastLogin: string
  isAdmin?: boolean
}

export interface AuthCredentials {
  username: string
  password: string
  email?: string
}

