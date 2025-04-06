export interface Game {
  id: string
  name: string
  type: string
  description: string
  thumbnail: string
  minBet: number
  maxBet: number
  rtp: number // Return to player percentage
  volatility: "low" | "medium" | "high"
  features: string[]
  config: Record<string, any>
}

export interface GameSession {
  id: string
  userId: string
  gameId: string
  startTime: string
  endTime?: string
  initialBalance: number
  finalBalance?: number
  bets: GameBet[]
  provablyFairData: {
    clientSeed: string
    serverSeedHash: string
  }
}

export interface GameBet {
  id: string
  sessionId: string
  userId: string
  gameId: string
  amount: number
  winAmount: number
  result: Record<string, any>
  timestamp: string
  provablyFairData: {
    clientSeed: string
    serverSeedHash: string
    nonce: number
  }
}

export interface ProvablyFairData {
  clientSeed: string
  serverSeedHash: string
  serverSeed?: string
  nonce: number
}

export interface GameResult {
  gameType?: string
  bet: number
  totalWin: number
  reels?: string[][]
  winningLines?: number[]
  winningCombinations?: any[]
  bonusFeatures?: any[]
  data?: Record<string, any>
}

// Slot game specific types
export interface SlotGameConfig {
  name: string
  reelsCount: number
  rowsCount: number
  betMultiplier: number
  symbols: SlotSymbol[]
  paylines: PaylineDefinition[]
  bonusFeatures?: BonusFeature[]
  reelSets?: Record<string, ReelSet>
}

export interface SlotSymbol {
  id: string
  name: string
  image: string
  weight?: number
  isWild?: boolean
  isScatter?: boolean
  wildMultiplier?: number
  payTable: PayTableEntry[]
}

export interface PayTableEntry {
  count: number
  multiplier: number
}

export type PaylineDefinition = [number, number][]

export interface ReelSet {
  reels: string[][]
}

export interface BonusFeature {
  type: string
  triggerSymbolId: string
  minCount: number
  config: Record<string, any>
}

export interface SlotGameResult extends GameResult {
  reels: string[][]
  totalWin: number
  winningLines: number[]
  winningCombinations: any[]
  bonusFeatures: any[]
}

