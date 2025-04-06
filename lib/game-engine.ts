import { generateRandomNumbers } from "./provably-fair"
import type { Game, ProvablyFairData, GameResult } from "@/types/game"

// Process a game bet
export async function processGameBet(
  game: Game,
  amount: number,
  provablyFairData: ProvablyFairData,
  options?: any,
): Promise<GameResult> {
  // Different handling based on game type
  switch (game.type) {
    case "slots":
      return processSlotsBet(game, amount, provablyFairData, options)
    case "roulette":
      return processRouletteBet(game, amount, provablyFairData, options)
    case "blackjack":
      return processBlackjackBet(game, amount, provablyFairData, options)
    default:
      throw new Error(`Unsupported game type: ${game.type}`)
  }
}

// Process a slots bet
async function processSlotsBet(
  game: Game,
  amount: number,
  provablyFairData: ProvablyFairData,
  options?: any,
): Promise<GameResult> {
  const { clientSeed, serverSeedHash, nonce } = provablyFairData

  // Get game configuration
  const { reelsCount = 5, rowsCount = 3, symbols = [] } = game.config

  // Generate random numbers for each position
  const totalPositions = reelsCount * rowsCount
  const randomNumbers = generateRandomNumbers(clientSeed, serverSeedHash, nonce, totalPositions)

  // Generate reels
  const reels: string[][] = []
  let index = 0

  for (let i = 0; i < rowsCount; i++) {
    const row: string[] = []
    for (let j = 0; j < reelsCount; j++) {
      // Convert random number to symbol index
      const symbolIndex = Math.floor(randomNumbers[index] * symbols.length)
      row.push(symbols[symbolIndex].id)
      index++
    }
    reels.push(row)
  }

  // Calculate win amount based on paylines
  const { winAmount, winningLines } = calculateSlotsWin(game, reels, amount, options?.lines)

  return {
    gameType: "slots",
    bet: amount,
    winAmount,
    reels,
    symbols: symbols.map((s) => s.id),
    winningLines,
    data: {
      reels,
      winningLines,
    },
  }
}

// Calculate slots win amount
function calculateSlotsWin(
  game: Game,
  reels: string[][],
  betAmount: number,
  selectedLines?: number[],
): { winAmount: number; winningLines: number[] } {
  const { paylines = [], symbols = [] } = game.config

  // Use all paylines if none selected
  const lines = selectedLines || paylines.map((_, index) => index)

  let totalWin = 0
  const winningLines: number[] = []

  // Check each selected payline
  lines.forEach((lineIndex) => {
    const payline = paylines[lineIndex]
    if (!payline) return

    // Get symbols on this payline
    const lineSymbols = payline.map(([row, col]) => {
      return reels[row]?.[col] || ""
    })

    // Check for winning combinations
    const { win, multiplier } = checkSlotsWinningCombination(lineSymbols, symbols)

    if (win) {
      const lineWin = (betAmount * multiplier) / lines.length
      totalWin += lineWin
      winningLines.push(lineIndex)
    }
  })

  return {
    winAmount: Math.round(totalWin * 100) / 100, // Round to 2 decimal places
    winningLines,
  }
}

// Check for winning combinations in slots
function checkSlotsWinningCombination(lineSymbols: string[], symbols: any[]): { win: boolean; multiplier: number } {
  // Get the first symbol
  const firstSymbol = lineSymbols[0]
  if (!firstSymbol) return { win: false, multiplier: 0 }

  // Count consecutive matching symbols
  let count = 1
  for (let i = 1; i < lineSymbols.length; i++) {
    if (lineSymbols[i] === firstSymbol || lineSymbols[i] === "wild") {
      count++
    } else if (firstSymbol === "wild") {
      // If first symbol is wild, check if current symbol matches the next non-wild
      let nextNonWild = ""
      for (let j = 1; j < lineSymbols.length; j++) {
        if (lineSymbols[j] !== "wild") {
          nextNonWild = lineSymbols[j]
          break
        }
      }

      if (nextNonWild === "" || lineSymbols[i] === nextNonWild) {
        count++
      } else {
        break
      }
    } else {
      break
    }
  }

  // Need at least 3 matching symbols to win
  if (count < 3) return { win: false, multiplier: 0 }

  // Find symbol value
  let symbolValue = 0
  if (firstSymbol === "wild") {
    // Find highest value symbol in the line
    let highestValue = 0
    lineSymbols.forEach((symbol) => {
      if (symbol !== "wild") {
        const symbolObj = symbols.find((s) => s.id === symbol)
        if (symbolObj && symbolObj.value > highestValue) {
          highestValue = symbolObj.value
          symbolValue = highestValue
        }
      }
    })

    // If all wilds, use highest value symbol
    if (symbolValue === 0) {
      const highestValueSymbol = symbols.reduce(
        (prev, curr) => (curr.id !== "wild" && curr.value > prev.value ? curr : prev),
        { value: 0 },
      )
      symbolValue = highestValueSymbol.value
    }
  } else {
    const symbolObj = symbols.find((s) => s.id === firstSymbol)
    symbolValue = symbolObj?.value || 0
  }

  // Calculate multiplier based on count and symbol value
  const countMultiplier = count - 2 // 3 matches = 1x, 4 matches = 2x, 5 matches = 3x
  const hasWild = lineSymbols.includes("wild")
  const wildMultiplier = hasWild ? 2 : 1

  return {
    win: true,
    multiplier: (symbolValue * countMultiplier * wildMultiplier) / 100, // Convert to multiplier
  }
}

// Process a roulette bet
async function processRouletteBet(
  game: Game,
  amount: number,
  provablyFairData: ProvablyFairData,
  options?: any,
): Promise<GameResult> {
  // Implementation for roulette
  // This is a placeholder - would need to be implemented based on roulette rules
  return {
    gameType: "roulette",
    bet: amount,
    winAmount: 0,
    data: {},
  }
}

// Process a blackjack bet
async function processBlackjackBet(
  game: Game,
  amount: number,
  provablyFairData: ProvablyFairData,
  options?: any,
): Promise<GameResult> {
  // Implementation for blackjack
  // This is a placeholder - would need to be implemented based on blackjack rules
  return {
    gameType: "blackjack",
    bet: amount,
    winAmount: 0,
    data: {},
  }
}

