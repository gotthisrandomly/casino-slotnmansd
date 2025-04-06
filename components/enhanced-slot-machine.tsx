"use client"

import { useState, useEffect, useRef } from "react"
import { useGame } from "@/context/game-context"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Volume2, VolumeX, Zap, RotateCw, Plus, Minus } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { getSlotGameConfig } from "@/lib/slot-engine"

interface EnhancedSlotMachineProps {
  gameId: string
}

export function EnhancedSlotMachine({ gameId }: EnhancedSlotMachineProps) {
  const { user } = useAuth()
  const { currentGame, currentSession, placeBet, isLoading } = useGame()

  // Refs for animation
  const reelsRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // State
  const [reels, setReels] = useState<string[][][]>([])
  const [spinning, setSpinning] = useState(false)
  const [bet, setBet] = useState(10)
  const [winAmount, setWinAmount] = useState(0)
  const [winningLines, setWinningLines] = useState<number[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlayCount, setAutoPlayCount] = useState(0)
  const [activePaylines, setActivePaylines] = useState<number[]>([])
  const [gameConfig, setGameConfig] = useState<any>(null)
  const [balance, setBalance] = useState(0)

  // Initialize game
  useEffect(() => {
    // Get game configuration
    const config = getSlotGameConfig(gameId)
    setGameConfig(config)

    // Set default active paylines (all)
    setActivePaylines(config.paylines.map((_, index) => index))

    // Initialize empty reels
    if (config.reelsCount && config.rowsCount) {
      const { reelsCount, rowsCount, symbols } = config

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

    // Set initial bet
    if (currentGame?.minBet) {
      setBet(currentGame.minBet)
    }

    // Initialize audio
    audioRef.current = new Audio()

    // Update balance
    if (user) {
      setBalance(user.balance)
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [gameId, currentGame, user])

  // Update balance when user changes
  useEffect(() => {
    if (user) {
      setBalance(user.balance)
    }
  }, [user])

  // Handle auto play
  useEffect(() => {
    let autoPlayTimer: NodeJS.Timeout | null = null

    if (autoPlay && autoPlayCount > 0 && !spinning && user && balance >= bet) {
      autoPlayTimer = setTimeout(() => {
        handleSpin()
      }, 1000)
    }

    return () => {
      if (autoPlayTimer) clearTimeout(autoPlayTimer)
    }
  }, [autoPlay, autoPlayCount, spinning, user, bet, balance])

  // Play sound
  const playSound = (type: "spin" | "win" | "button") => {
    if (!soundEnabled || !audioRef.current) return

    let soundUrl = ""

    switch (type) {
      case "spin":
        soundUrl = "/sounds/spin.mp3"
        break
      case "win":
        soundUrl = "/sounds/win.mp3"
        break
      case "button":
        soundUrl = "/sounds/button.mp3"
        break
      default:
        return
    }

    audioRef.current.src = soundUrl
    audioRef.current.play().catch((error) => console.error("Error playing sound:", error))
  }

  // Handle spin
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
    if (balance < bet) {
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
    playSound("spin")

    // Add spinning animation class
    if (reelsRef.current) {
      reelsRef.current.classList.add("spinning")
    }

    // Simulate spinning animation
    const spinAnimation = async () => {
      if (!gameConfig) return

      const { reelsCount, rowsCount, symbols } = gameConfig
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
      const result = await placeBet(bet, {
        paylines: activePaylines,
        gameId,
      })

      if (result) {
        // Update balance
        setBalance(user.balance)

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
          // Remove spinning animation class
          if (reelsRef.current) {
            reelsRef.current.classList.remove("spinning")
          }

          setReels(resultReels)
          setWinAmount(result.totalWin)
          setWinningLines(result.winningLines || [])

          // Play win sound if won
          if (result.totalWin > 0) {
            playSound("win")

            // Show win toast
            toast({
              title: "You Won!",
              description: `${formatCurrency(result.totalWin)}`,
              variant: "default",
            })
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

  // Handle auto play
  const handleAutoPlay = () => {
    playSound("button")

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

  // Handle bet change
  const handleBetChange = (newBet: number) => {
    playSound("button")
    setBet(newBet)
  }

  // Get symbol image
  const getSymbolImage = (symbolId: string) => {
    if (!gameConfig?.symbols) return "❓"

    const symbol = gameConfig.symbols.find((s: any) => s.id === symbolId)
    return symbol?.image || "❓"
  }

  // Get symbol name
  const getSymbolName = (symbolId: string) => {
    if (!gameConfig?.symbols) return "Unknown"

    const symbol = gameConfig.symbols.find((s: any) => s.id === symbolId)
    return symbol?.name || "Unknown"
  }

  if (!gameConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Game...</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{gameConfig.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setSoundEnabled(!soundEnabled)
              playSound("button")
            }}
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
              Balance: <span className="font-bold">{formatCurrency(balance)}</span>
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
              onClick={() => handleBetChange(Math.max(currentGame?.minBet || 1, bet - 10))}
              disabled={spinning || bet <= (currentGame?.minBet || 1)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Slider
              value={[bet]}
              min={currentGame?.minBet || 1}
              max={currentGame?.maxBet || 100}
              step={1}
              onValueChange={(value) => handleBetChange(value[0])}
              disabled={spinning}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBetChange(Math.min(currentGame?.maxBet || 100, bet + 10))}
              disabled={spinning || bet >= (currentGame?.maxBet || 100)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Slot Machine Display */}
          <div ref={reelsRef} className="w-full bg-black/20 rounded-lg p-4 transition-all duration-500">
            <div className="grid grid-rows-3 gap-2">
              {reels.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-5 gap-2">
                  {row.map((symbols, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`flex items-center justify-center bg-black/40 rounded-md h-16 text-3xl transition-all duration-300
                        ${
                          winningLines.some((line) => {
                            const payline = gameConfig.paylines[line]
                            return payline?.some(([r, c]) => r === rowIndex && c === colIndex)
                          })
                            ? "border-2 border-yellow-400 bg-yellow-400/20 animate-pulse"
                            : ""
                        }`}
                      title={getSymbolName(symbols[0])}
                    >
                      {symbols[0] ? getSymbolImage(symbols[0]) : ""}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Win Display */}
          {winAmount > 0 && (
            <div className="text-2xl font-bold text-yellow-400 animate-bounce">Win: {formatCurrency(winAmount)}</div>
          )}

          {/* Spin and Auto Play Buttons */}
          <div className="w-full grid grid-cols-2 gap-4">
            <Button
              size="lg"
              className="text-lg py-6"
              onClick={handleSpin}
              disabled={spinning || isLoading || !user || balance < bet || !currentSession}
            >
              {spinning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Spinning...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" /> SPIN
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant={autoPlay ? "destructive" : "outline"}
              className="text-lg py-6"
              onClick={handleAutoPlay}
              disabled={spinning || isLoading || !user || balance < bet || !currentSession}
            >
              {autoPlay ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" /> Stop ({autoPlayCount})
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" /> Auto Play
                </>
              )}
            </Button>
          </div>

          {/* Game Info */}
          <div className="w-full text-sm text-muted-foreground">
            <p>
              Active Paylines: {activePaylines.length} | Bet Per Line: {formatCurrency(bet / activePaylines.length)}
            </p>
            <p>
              Min Bet: {formatCurrency(currentGame?.minBet || 1)} | Max Bet:{" "}
              {formatCurrency(currentGame?.maxBet || 100)}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </CardFooter>
    </Card>
  )
}

