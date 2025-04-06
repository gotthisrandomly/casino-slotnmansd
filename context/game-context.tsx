"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { toast } from "@/components/ui/use-toast"
import { generateServerSeed, generateClientSeed, verifyGameResult } from "@/lib/provably-fair"
import type { Game, GameSession, GameResult, ProvablyFairData } from "@/types/game"

interface GameContextType {
  isLoading: boolean
  availableGames: Game[]
  currentGame: Game | null
  currentSession: GameSession | null
  provablyFairData: ProvablyFairData | null
  loadGames: () => Promise<Game[]>
  selectGame: (gameId: string) => Promise<boolean>
  startSession: () => Promise<boolean>
  endSession: () => Promise<boolean>
  placeBet: (amount: number, options?: any) => Promise<GameResult | null>
  verifyResult: (result: GameResult) => boolean
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUserBalance } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [availableGames, setAvailableGames] = useState<Game[]>([])
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null)
  const [provablyFairData, setProvablyFairData] = useState<ProvablyFairData | null>(null)

  // Load available games on mount
  useEffect(() => {
    loadGames()
  }, [])

  // Reset session when user changes
  useEffect(() => {
    if (!user) {
      setCurrentSession(null)
    }
  }, [user])

  const loadGames = async (): Promise<Game[]> => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/games")
      if (!response.ok) throw new Error("Failed to load games")

      const games = await response.json()
      setAvailableGames(games)
      return games
    } catch (error) {
      console.error("Error loading games:", error)
      toast({
        title: "Error",
        description: "Failed to load games",
        variant: "destructive",
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }

  const selectGame = async (gameId: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      // End current session if exists
      if (currentSession) {
        await endSession()
      }

      const game = availableGames.find((g) => g.id === gameId)
      if (!game) throw new Error("Game not found")

      setCurrentGame(game)

      // Generate new provably fair data
      const clientSeed = generateClientSeed()
      const serverSeedData = generateServerSeed()

      setProvablyFairData({
        clientSeed,
        serverSeedHash: serverSeedData.hash,
        serverSeed: serverSeedData.seed,
        nonce: 0,
      })

      return true
    } catch (error) {
      console.error("Error selecting game:", error)
      toast({
        title: "Error",
        description: "Failed to select game",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const startSession = async (): Promise<boolean> => {
    if (!user || !currentGame) return false

    try {
      setIsLoading(true)

      const response = await fetch("/api/games/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          gameId: currentGame.id,
          provablyFairData: {
            clientSeed: provablyFairData?.clientSeed,
            serverSeedHash: provablyFairData?.serverSeedHash,
          },
        }),
      })

      if (!response.ok) throw new Error("Failed to start game session")

      const session = await response.json()
      setCurrentSession(session)

      toast({
        title: "Session Started",
        description: `You're now playing ${currentGame.name}`,
      })

      return true
    } catch (error) {
      console.error("Error starting session:", error)
      toast({
        title: "Error",
        description: "Failed to start game session",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const endSession = async (): Promise<boolean> => {
    if (!currentSession) return false

    try {
      setIsLoading(true)

      const response = await fetch("/api/games/session/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.id,
        }),
      })

      if (!response.ok) throw new Error("Failed to end game session")

      const result = await response.json()

      // Reveal server seed for verification
      if (provablyFairData) {
        toast({
          title: "Provably Fair Verification",
          description: `Server Seed: ${provablyFairData.serverSeed}`,
          duration: 10000,
        })
      }

      setCurrentSession(null)
      setProvablyFairData(null)

      return true
    } catch (error) {
      console.error("Error ending session:", error)
      toast({
        title: "Error",
        description: "Failed to end game session",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const placeBet = async (amount: number, options?: any): Promise<GameResult | null> => {
    if (!user || !currentGame || !currentSession || !provablyFairData) return null

    try {
      setIsLoading(true)

      // Check if user has sufficient balance
      if (user.balance < amount) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough funds to place this bet",
          variant: "destructive",
        })
        return null
      }

      // Increment nonce for provably fair
      const updatedProvablyFairData = {
        ...provablyFairData,
        nonce: provablyFairData.nonce + 1,
      }
      setProvablyFairData(updatedProvablyFairData)

      const response = await fetch("/api/games/bet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: currentSession.id,
          userId: user.id,
          gameId: currentGame.id,
          amount,
          provablyFairData: {
            clientSeed: updatedProvablyFairData.clientSeed,
            serverSeedHash: updatedProvablyFairData.serverSeedHash,
            nonce: updatedProvablyFairData.nonce,
          },
          options,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to place bet")
      }

      const result = await response.json()

      // Update user balance
      updateUserBalance(result.user.balance)

      // Show win/loss toast
      if (result.winAmount > 0) {
        toast({
          title: "You Won!",
          description: `$${result.winAmount.toFixed(2)}`,
          variant: "default",
        })
      }

      return result
    } catch (error) {
      console.error("Error placing bet:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place bet",
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const verifyResult = (result: GameResult): boolean => {
    if (!provablyFairData) return false

    return verifyGameResult(result, provablyFairData.clientSeed, provablyFairData.serverSeed, provablyFairData.nonce)
  }

  return (
    <GameContext.Provider
      value={{
        isLoading,
        availableGames,
        currentGame,
        currentSession,
        provablyFairData,
        loadGames,
        selectGame,
        startSession,
        endSession,
        placeBet,
        verifyResult,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}

