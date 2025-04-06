export enum PaymentGateway {
  STRIPE = "stripe",
  PAYPAL = "paypal",
  CASHAPP = "cashapp",
  VENMO = "venmo",
  CHIME = "chime",
  CRYPTO = "crypto",
}

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  BET = "bet",
  WIN = "win",
  BONUS = "bonus",
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export interface PaymentMethod {
  id: string
  userId: string
  type: string // card, bank, crypto, etc.
  gateway: PaymentGateway
  details: Record<string, any>
  isDefault: boolean
  create  crypto, etc.
  gateway: PaymentGateway
  details: Record<string, any>
  isDefault: boolean
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  amount: number
  gateway: PaymentGateway
  methodId?: string
  status: TransactionStatus
  description: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

