"use client"

import { useState, useEffect } from "react"
import { useGame } from "@/context/game-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Volume2, VolumeX } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export function SlotMachine() {
  const { user } = useAuth()
  const { currentGame, currentSession, placeBet, isLoading } = useGame()

  const [reels, setReels] = useState<string[][][]>([])
  const [spinning, setSpinning] = useState(false)
  const [bet, setBet] = useState(10)
  const [winAmount, setWinAmount] = useState(0)
  const [winningLines, setWinningLines] = useState<number[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlayCount, setAutoPlayCount] = useState(0)

  // Initialize reels
  useEffect(() => {
    if (currentGame?.config?.reelsCount && currentGame?.config?.rowsCount) {
      const { reelsCount, rowsCount, symbols } = currentGame.config

      // Create empty reels
      const initialReels: string[][][] = []

      for (let i = 0; i < rowsCount; i++) {
        const row: string[][] = []
        for (let j = 0; j < reelsCount; j++) {
          // Start with random symbols
          const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)]
          row.push([randomSymbol.id])
        }
        initialReels.push(row)
      }

      setReels(initialReels)
    }
  }, [currentGame])

  // Handle auto play
  useEffect(() => {
    let autoPlayTimer: NodeJS.Timeout | null = null

    if (autoPlay && autoPlayCount > 0 && !spinning && user && user.balance >= bet) {
      autoPlayTimer = setTimeout(() => {
        handleSpin()
      }, 1000)
    }

    return () => {
      if (autoPlayTimer) clearTimeout(autoPlayTimer)
    }
  }, [autoPlay, autoPlayCount, spinning, user, bet])

  const handleSpin = async () => {
    if (!user || !currentGame || !currentSession) {
      toast({
        title: "Error",
        description: "Please select a game and start a session first",
        variant: "destructive",
      })
      return
    }

    // Check if user has enough balance
    if (user.balance < bet) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough credits to place this bet",
        variant: "destructive",
      })
      return
    }

    setSpinning(true)
    setWinAmount(0)
    setWinningLines([])

    // Play spin sound
    if (soundEnabled) {
      playSound("spin")
    }

    // Simulate spinning animation
    const spinAnimation = async () => {
      const { reelsCount, rowsCount, symbols } = currentGame.config
      const animationFrames = 20
      const animationDuration = 1000 // ms

      for (let frame = 0; frame < animationFrames; frame++) {
        const animatedReels: string[][][] = []

        for (let i = 0; i < rowsCount; i++) {
          const row: string[][] = []
          for (let j = 0; j < reelsCount; j++) {
            // Slow down animation towards the end
            const speed = 1 - Math.min(1, frame / (animationFrames * 0.7))

            // Only change symbols with a certain probability based on speed
            if (Math.random() < speed) {
              const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)]
              row.push([randomSymbol.id])
            } else if (reels[i] && reels[i][j]) {
              row.push(reels[i][j])
            } else {
              const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)]
              row.push([randomSymbol.id])
            }
          }
          animatedReels.push(row)
        }

        setReels(animatedReels)
        await new Promise((resolve) => setTimeout(resolve, animationDuration / animationFrames))
      }
    }

    // Start animation
    spinAnimation().catch(console.error)

    try {
      // Place bet
      const result = await placeBet(bet)

      if (result) {
        // Update reels with result
        const resultReels: string[][][] = []

        for (let i = 0; i < result.reels!.length; i++) {
          const row: string[][] = []
          for (let j = 0; j < result.reels![i].length; j++) {
            row.push([result.reels![i][j]])
          }
          resultReels.push(row)
        }

        // Wait for animation to finish
        setTimeout(() => {
          setReels(resultReels)
          setWinAmount(result.winAmount)
          setWinningLines(result.winningLines || [])

          // Play win sound if won
          if (result.winAmount > 0 && soundEnabled) {
            playSound("win")
          }

          setSpinning(false)

          // Update auto play count
          if (autoPlay) {
            setAutoPlayCount((prev) => prev - 1)
          }
        }, 1000)
      } else {
        setSpinning(false)

        // Stop auto play on error
        setAutoPlay(false)
        setAutoPlayCount(0)
      }
    } catch (error) {
      console.error("Error placing bet:", error)
      toast({
        title: "Error",
        description: "Failed to place bet. Please try again.",
        variant: "destructive",
      })

      setSpinning(false)

      // Stop auto play on error
      setAutoPlay(false)
      setAutoPlayCount(0)
    }
  }

  const playSound = (type: "spin" | "win") => {
    // In a real implementation, you would play actual sounds here
    console.log(`Playing ${type} sound`)
  }

  const handleAutoPlay = () => {
    if (autoPlay) {
      // Stop auto play
      setAutoPlay(false)
      setAutoPlayCount(0)
    } else {
      // Start auto play with 10 spins
      setAutoPlay(true)
      setAutoPlayCount(10)
    }
  }

  const getSymbolImage = (symbolId: string) => {
    if (!currentGame?.config?.symbols) return "❓"

    const symbol = currentGame.config.symbols.find((s: any) => s.id === symbolId)
    return symbol?.image || "❓"
  }

  if (!currentGame) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Please select a game</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{currentGame.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Mute" : "Unmute"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col items-center gap-6">
          {/* Balance and Bet Controls */}
          <div className="w-full flex justify-between items-center">
            <div className="text-lg">
              Balance: <span className="font-bold">{formatCurrency(user?.balance || 0)}</span>
            </div>
            <div className="text-lg">
              Bet: <span className="font-bold">{formatCurrency(bet)}</span>
            </div>
          </div>

          {/* Bet Slider */}
          <div className="w-full flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBet(Math.max(currentGame.minBet, bet - 10))}
              disabled={spinning || bet <= currentGame.minBet}
            >
              -
            </Button>
            <Slider
              value={[bet]}
              min={currentGame.minBet}
              max={currentGame.maxBet}
              step={1}
              onValueChange={(value) => setBet(value[0])}
              disabled={spinning}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBet(Math.min(currentGame.maxBet, bet + 10))}
              disabled={spinning || bet >= currentGame.maxBet}
            >
              +
            </Button>
          </div>

          {/* Slot Machine Display */}
          <div className="w-full bg-black/20 rounded-lg p-4">
            <div className="grid grid-rows-3 gap-2">
              {reels.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-5 gap-2">
                  {row.map((symbols, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`flex items-center justify-center bg-black/40 rounded-md h-16 text-3xl
                        ${
                          winningLines.some((line) => {
                            const payline = currentGame.config.paylines[line]
                            return payline?.some(([r, c]) => r === rowIndex && c === colIndex)
                          })
                            ? "border-2 border-yellow-400 bg-yellow-400/20"
                            : ""
                        }`}
                    >
                      {symbols[0] ? getSymbolImage(symbols[0]) : ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Win Display */}
          {winAmount > 0 && <div className="text-2xl font-bold text-yellow-400">Win: {formatCurrency(winAmount)}</div>}

          {/* Spin and Auto Play Buttons */}
          <div className="w-full grid grid-cols-2 gap-4">
            <Button
              size="lg"
              className="text-lg py-6"
              onClick={handleSpin}
              disabled={spinning || isLoading || !user || user.balance < bet || !currentSession}
            >
              {spinning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Spinning...
                </>
              ) : (
                "SPIN"
              )}
            </Button>
            <Button
              size="lg"
              variant={autoPlay ? "destructive" : "outline"}
              className="text-lg py-6"
              onClick={handleAutoPlay}
              disabled={spinning || isLoading || !user || user.balance < bet || !currentSession}
            >
              {autoPlay ? `Stop (${autoPlayCount})` : "Auto Play"}
            </Button>
          </div>

          {/* Game Info */}
          <div className="w-full text-sm text-muted-foreground">
            <p>
              RTP: {currentGame.rtp}% | Volatility: {currentGame.volatility}
            </p>
            <p>
              Min Bet: {formatCurrency(currentGame.minBet)} | Max Bet: {formatCurrency(currentGame.maxBet)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

