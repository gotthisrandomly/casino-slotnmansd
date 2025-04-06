import { generateRandomNumbers } from "./provably-fair"
import type { SlotGameConfig, SlotSymbol, SlotGameResult, ReelSet } from "@/types/game"

// Main slot game engine
export class SlotEngine {
  private config: SlotGameConfig
  private reelSets: Record<string, ReelSet>

  constructor(config: SlotGameConfig) {
    this.config = config
    this.reelSets = config.reelSets || { default: this.generateDefaultReelSet() }
  }

  // Generate a default reel set if none provided
  private generateDefaultReelSet(): ReelSet {
    const { reelsCount = 5, rowsCount = 3, symbols = [] } = this.config

    // Create a balanced distribution of symbols based on their weight
    const reels: string[][] = []

    for (let i = 0; i < reelsCount; i++) {
      const reel: string[] = []
      const reelLength = 30 // Standard virtual reel length

      // Fill the reel with symbols based on their weights
      for (let j = 0; j < reelLength; j++) {
        // Calculate total weight
        const totalWeight = symbols.reduce((sum, symbol) => sum + (symbol.weight || 1), 0)

        // Select a random position based on weights
        let randomPosition = Math.random() * totalWeight
        let selectedSymbol: SlotSymbol | undefined

        // Find the symbol at the random position
        for (const symbol of symbols) {
          randomPosition -= symbol.weight || 1
          if (randomPosition <= 0) {
            selectedSymbol = symbol
            break
          }
        }

        reel.push(selectedSymbol?.id || symbols[0].id)
      }

      reels.push(reel)
    }

    return { reels }
  }

  // Spin the reels using provably fair random numbers
  public spin(
    clientSeed: string,
    serverSeedHash: string,
    nonce: number,
    bet: number,
    activePaylines?: number[],
    reelSetId = "default",
  ): SlotGameResult {
    const { reelsCount = 5, rowsCount = 3, symbols = [], paylines = [] } = this.config
    const reelSet = this.reelSets[reelSetId] || this.reelSets.default

    // Generate random numbers for each reel
    const randomNumbers = generateRandomNumbers(clientSeed, serverSeedHash, nonce, reelsCount)

    // Determine which paylines to use
    const linesToCheck = activePaylines || paylines.map((_, index) => index)

    // Calculate the visible window for each reel
    const visibleSymbols: string[][] = []

    for (let i = 0; i < reelsCount; i++) {
      const reel = reelSet.reels[i]
      const reelLength = reel.length

      // Calculate starting position based on random number
      const startPosition = Math.floor(randomNumbers[i] * reelLength)

      // Get visible symbols for this reel
      const reelSymbols: string[] = []
      for (let j = 0; j < rowsCount; j++) {
        const position = (startPosition + j) % reelLength
        reelSymbols.push(reel[position])
      }

      visibleSymbols.push(reelSymbols)
    }

    // Transpose the result to get rows instead of reels
    const rows: string[][] = []
    for (let i = 0; i < rowsCount; i++) {
      const row: string[] = []
      for (let j = 0; j < reelsCount; j++) {
        row.push(visibleSymbols[j][i])
      }
      rows.push(row)
    }

    // Check for winning combinations
    const { totalWin, winningLines, winningCombinations } = this.evaluateWin(rows, bet, linesToCheck)

    // Check for bonus features
    const bonusFeatures = this.checkBonusFeatures(rows)

    return {
      reels: rows,
      totalWin,
      winningLines,
      winningCombinations,
      bonusFeatures,
      bet,
    }
  }

  // Evaluate winning combinations
  private evaluateWin(
    rows: string[][],
    bet: number,
    activePaylines: number[],
  ): { totalWin: number; winningLines: number[]; winningCombinations: any[] } {
    const { paylines = [], symbols = [], betMultiplier = 1 } = this.config

    let totalWin = 0
    const winningLines: number[] = []
    const winningCombinations: any[] = []

    // Check each active payline
    activePaylines.forEach((lineIndex) => {
      const payline = paylines[lineIndex]
      if (!payline) return

      // Get symbols on this payline
      const lineSymbols: string[] = []
      const linePositions: [number, number][] = []

      payline.forEach(([row, col]) => {
        if (rows[row] && rows[row][col]) {
          lineSymbols.push(rows[row][col])
          linePositions.push([row, col])
        }
      })

      // Check for winning combinations
      const { win, multiplier, length, symbolId } = this.checkWinningCombination(lineSymbols, symbols)

      if (win) {
        const lineWin = bet * multiplier * betMultiplier
        totalWin += lineWin
        winningLines.push(lineIndex)

        winningCombinations.push({
          paylineIndex: lineIndex,
          symbolId,
          count: length,
          positions: linePositions.slice(0, length),
          win: lineWin,
        })
      }
    })

    // Check for scatter wins (not tied to paylines)
    const scatterWin = this.checkScatterWin(rows, bet, symbols)
    if (scatterWin.win > 0) {
      totalWin += scatterWin.win
      winningCombinations.push(scatterWin)
    }

    return {
      totalWin: Math.round(totalWin * 100) / 100, // Round to 2 decimal places
      winningLines,
      winningCombinations,
    }
  }

  // Check for winning combinations on a single payline
  private checkWinningCombination(
    lineSymbols: string[],
    symbols: SlotSymbol[],
  ): { win: boolean; multiplier: number; length: number; symbolId: string } {
    if (lineSymbols.length === 0) {
      return { win: false, multiplier: 0, length: 0, symbolId: "" }
    }

    // Get the first symbol
    const firstSymbol = lineSymbols[0]
    const symbolData = symbols.find((s) => s.id === firstSymbol)

    if (!symbolData) {
      return { win: false, multiplier: 0, length: 0, symbolId: "" }
    }

    // Skip if it's a scatter (handled separately)
    if (symbolData.isScatter) {
      return { win: false, multiplier: 0, length: 0, symbolId: "" }
    }

    // Count consecutive matching symbols
    let count = 1
    for (let i = 1; i < lineSymbols.length; i++) {
      const currentSymbol = lineSymbols[i]
      const currentSymbolData = symbols.find((s) => s.id === currentSymbol)

      // Match if same symbol or current symbol is wild
      if (currentSymbol === firstSymbol || (currentSymbolData && currentSymbolData.isWild)) {
        count++
      }
      // If first symbol is wild, match with next non-wild
      else if (symbolData.isWild) {
        // Find the first non-wild symbol
        let nextNonWild = ""
        for (let j = 1; j < lineSymbols.length; j++) {
          const nextSymbol = lineSymbols[j]
          const nextSymbolData = symbols.find((s) => s.id === nextSymbol)
          if (nextSymbolData && !nextSymbolData.isWild) {
            nextNonWild = nextSymbol
            break
          }
        }

        // If no non-wild found or current matches the non-wild
        if (nextNonWild === "" || currentSymbol === nextNonWild) {
          count++
        } else {
          break
        }
      } else {
        break
      }
    }

    // Get the pay table for this symbol
    const payTable = symbolData.payTable || []

    // Find the highest matching pay entry
    let multiplier = 0
    for (const pay of payTable) {
      if (count >= pay.count && pay.multiplier > multiplier) {
        multiplier = pay.multiplier
      }
    }

    // Apply wild multiplier if applicable
    const hasWild = lineSymbols.some((symbol) => {
      const symbolData = symbols.find((s) => s.id === symbol)
      return symbolData && symbolData.isWild
    })

    if (hasWild && symbolData.wildMultiplier) {
      multiplier *= symbolData.wildMultiplier
    }

    return {
      win: multiplier > 0,
      multiplier,
      length: count,
      symbolId: firstSymbol,
    }
  }

  // Check for scatter wins
  private checkScatterWin(rows: string[][], bet: number, symbols: SlotSymbol[]): any {
    // Find scatter symbols
    const scatterSymbols = symbols.filter((s) => s.isScatter)

    if (scatterSymbols.length === 0) {
      return { win: 0 }
    }

    // Count scatters for each type
    const scatterCounts: Record<string, { count: number; positions: [number, number][] }> = {}

    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        const symbolId = rows[i][j]
        const symbolData = symbols.find((s) => s.id === symbolId)

        if (symbolData && symbolData.isScatter) {
          if (!scatterCounts[symbolId]) {
            scatterCounts[symbolId] = { count: 0, positions: [] }
          }

          scatterCounts[symbolId].count++
          scatterCounts[symbolId].positions.push([i, j])
        }
      }
    }

    // Find the highest paying scatter win
    let highestWin = 0
    let winningScatter = null

    for (const scatterId in scatterCounts) {
      const { count, positions } = scatterCounts[scatterId]
      const symbolData = symbols.find((s) => s.id === scatterId)

      if (symbolData && symbolData.payTable) {
        // Find the highest matching pay entry
        let multiplier = 0
        for (const pay of symbolData.payTable) {
          if (count >= pay.count && pay.multiplier > multiplier) {
            multiplier = pay.multiplier
          }
        }

        const win = bet * multiplier

        if (win > highestWin) {
          highestWin = win
          winningScatter = {
            type: "scatter",
            symbolId: scatterId,
            count,
            positions,
            win,
          }
        }
      }
    }

    return winningScatter || { win: 0 }
  }

  // Check for bonus features like free spins
  private checkBonusFeatures(rows: string[][]): any[] {
    const { symbols = [], bonusFeatures = [] } = this.config
    const features: any[] = []

    // Count symbols for potential features
    const symbolCounts: Record<string, { count: number; positions: [number, number][] }> = {}

    for (let i = 0; i < rows.length; i++) {
      for (let j = 0; j < rows[i].length; j++) {
        const symbolId = rows[i][j]

        if (!symbolCounts[symbolId]) {
          symbolCounts[symbolId] = { count: 0, positions: [] }
        }

        symbolCounts[symbolId].count++
        symbolCounts[symbolId].positions.push([i, j])
      }
    }

    // Check each bonus feature
    for (const feature of bonusFeatures) {
      const { triggerSymbolId, minCount, type, config } = feature

      if (symbolCounts[triggerSymbolId] && symbolCounts[triggerSymbolId].count >= minCount) {
        features.push({
          type,
          config,
          positions: symbolCounts[triggerSymbolId].positions,
        })
      }
    }

    return features
  }
}

// Create a slot game instance with configuration
export function createSlotGame(config: SlotGameConfig): SlotEngine {
  return new SlotEngine(config)
}

// Predefined slot game configurations
export const slotGameConfigs: Record<string, SlotGameConfig> = {
  classicFruits: {
    name: "Classic Fruits",
    reelsCount: 5,
    rowsCount: 3,
    betMultiplier: 1,
    symbols: [
      {
        id: "cherry",
        name: "Cherry",
        image: "🍒",
        weight: 8,
        payTable: [
          { count: 3, multiplier: 5 },
          { count: 4, multiplier: 10 },
          { count: 5, multiplier: 20 },
        ],
      },
      {
        id: "lemon",
        name: "Lemon",
        image: "🍋",
        weight: 8,
        payTable: [
          { count: 3, multiplier: 5 },
          { count: 4, multiplier: 10 },
          { count: 5, multiplier: 25 },
        ],
      },
      {
        id: "orange",
        name: "Orange",
        image: "🍊",
        weight: 6,
        payTable: [
          { count: 3, multiplier: 8 },
          { count: 4, multiplier: 15 },
          { count: 5, multiplier: 30 },
        ],
      },
      {
        id: "plum",
        name: "Plum",
        image: "🍇",
        weight: 6,
        payTable: [
          { count: 3, multiplier: 10 },
          { count: 4, multiplier: 20 },
          { count: 5, multiplier: 40 },
        ],
      },
      {
        id: "watermelon",
        name: "Watermelon",
        image: "🍉",
        weight: 4,
        payTable: [
          { count: 3, multiplier: 15 },
          { count: 4, multiplier: 30 },
          { count: 5, multiplier: 60 },
        ],
      },
      {
        id: "bell",
        name: "Bell",
        image: "🔔",
        weight: 4,
        payTable: [
          { count: 3, multiplier: 20 },
          { count: 4, multiplier: 40 },
          { count: 5, multiplier: 80 },
        ],
      },
      {
        id: "seven",
        name: "Seven",
        image: "7️⃣",
        weight: 2,
        payTable: [
          { count: 3, multiplier: 25 },
          { count: 4, multiplier: 50 },
          { count: 5, multiplier: 150 },
        ],
      },
      {
        id: "wild",
        name: "Wild",
        image: "⭐",
        weight: 1,
        isWild: true,
        wildMultiplier: 2,
        payTable: [
          { count: 3, multiplier: 30 },
          { count: 4, multiplier: 60 },
          { count: 5, multiplier: 200 },
        ],
      },
      {
        id: "scatter",
        name: "Scatter",
        image: "🎰",
        weight: 1,
        isScatter: true,
        payTable: [
          { count: 3, multiplier: 5 },
          { count: 4, multiplier: 20 },
          { count: 5, multiplier: 50 },
        ],
      },
    ],
    paylines: [
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ], // Top row
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [1, 4],
      ], // Middle row
      [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
        [2, 4],
      ], // Bottom row
      [
        [0, 0],
        [1, 1],
        [2, 2],
        [1, 3],
        [0, 4],
      ], // V shape
      [
        [2, 0],
        [1, 1],
        [0, 2],
        [1, 3],
        [2, 4],
      ], // Inverted V
      [
        [0, 0],
        [0, 1],
        [1, 2],
        [2, 3],
        [2, 4],
      ], // Diagonal top-left to bottom-right
      [
        [2, 0],
        [2, 1],
        [1, 2],
        [0, 3],
        [0, 4],
      ], // Diagonal bottom-left to top-right
      [
        [1, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 4],
      ], // Top zigzag
      [
        [1, 0],
        [2, 1],
        [2, 2],
        [2, 3],
        [1, 4],
      ], // Bottom zigzag
    ],
    bonusFeatures: [
      {
        type: "freeSpins",
        triggerSymbolId: "scatter",
        minCount: 3,
        config: {
          spinsCount: 10,
          multiplier: 2,
        },
      },
    ],
  },

  treasureHunt: {
    name: "Treasure Hunt",
    reelsCount: 5,
    rowsCount: 3,
    betMultiplier: 1,
    symbols: [
      {
        id: "map",
        name: "Map",
        image: "🗺️",
        weight: 8,
        payTable: [
          { count: 3, multiplier: 5 },
          { count: 4, multiplier: 10 },
          { count: 5, multiplier: 20 },
        ],
      },
      {
        id: "compass",
        name: "Compass",
        image: "🧭",
        weight: 8,
        payTable: [
          { count: 3, multiplier: 8 },
          { count: 4, multiplier: 15 },
          { count: 5, multiplier: 30 },
        ],
      },
      {
        id: "key",
        name: "Key",
        image: "🔑",
        weight: 6,
        payTable: [
          { count: 3, multiplier: 10 },
          { count: 4, multiplier: 20 },
          { count: 5, multiplier: 40 },
        ],
      },
      {
        id: "skull",
        name: "Skull",
        image: "💀",
        weight: 6,
        payTable: [
          { count: 3, multiplier: 15 },
          { count: 4, multiplier: 30 },
          { count: 5, multiplier: 50 },
        ],
      },
      {
        id: "ship",
        name: "Ship",
        image: "⛵",
        weight: 4,
        payTable: [
          { count: 3, multiplier: 20 },
          { count: 4, multiplier: 40 },
          { count: 5, multiplier: 70 },
        ],
      },
      {
        id: "parrot",
        name: "Parrot",
        image: "🦜",
        weight: 4,
        payTable: [
          { count: 3, multiplier: 25 },
          { count: 4, multiplier: 50 },
          { count: 5, multiplier: 100 },
        ],
      },
      {
        id: "chest",
        name: "Treasure Chest",
        image: "📦",
        weight: 2,
        payTable: [
          { count: 3, multiplier: 30 },
          { count: 4, multiplier: 60 },
          { count: 5, multiplier: 150 },
        ],
      },
      {
        id: "wild",
        name: "Pirate",
        image: "🏴‍☠️",
        weight: 1,
        isWild: true,
        wildMultiplier: 2,
        payTable: [
          { count: 3, multiplier: 40 },
          { count: 4, multiplier: 80 },
          { count: 5, multiplier: 200 },
        ],
      },
      {
        id: "scatter",
        name: "Island",
        image: "🏝️",
        weight: 1,
        isScatter: true,
        payTable: [
          { count: 3, multiplier: 5 },
          { count: 4, multiplier: 20 },
          { count: 5, multiplier: 50 },
        ],
      },
    ],
    paylines: [
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ], // Top row
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [1, 4],
      ], // Middle row
      [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
        [2, 4],
      ], // Bottom row
      [
        [0, 0],
        [1, 1],
        [2, 2],
        [1, 3],
        [0, 4],
      ], // V shape
      [
        [2, 0],
        [1, 1],
        [0, 2],
        [1, 3],
        [2, 4],
      ], // Inverted V
      [
        [0, 0],
        [0, 1],
        [1, 2],
        [2, 3],
        [2, 4],
      ], // Diagonal top-left to bottom-right
      [
        [2, 0],
        [2, 1],
        [1, 2],
        [0, 3],
        [0, 4],
      ], // Diagonal bottom-left to top-right
      [
        [1, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 4],
      ], // Top zigzag
      [
        [1, 0],
        [2, 1],
        [2, 2],
        [2, 3],
        [1, 4],
      ], // Bottom zigzag
      [
        [0, 0],
        [1, 0],
        [2, 1],
        [1, 2],
        [0, 3],
      ], // Custom path 1
      [
        [2, 0],
        [1, 1],
        [0, 1],
        [1, 2],
        [2, 3],
      ], // Custom path 2
      [
        [1, 0],
        [1, 1],
        [0, 2],
        [1, 3],
        [1, 4],
      ], // Custom path 3
      [
        [1, 0],
        [1, 1],
        [2, 2],
        [1, 3],
        [1, 4],
      ], // Custom path 4
      [
        [0, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [0, 4],
      ], // Custom path 5
      [
        [2, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 4],
      ], // Custom path 6
    ],
    bonusFeatures: [
      {
        type: "freeSpins",
        triggerSymbolId: "scatter",
        minCount: 3,
        config: {
          spinsCount: 15,
          multiplier: 3,
        },
      },
      {
        type: "treasureBonus",
        triggerSymbolId: "chest",
        minCount: 3,
        config: {
          picks: 3,
          multiplierRange: [5, 100],
        },
      },
    ],
  },

  luckyDiamonds: {
    name: "Lucky Diamonds",
    reelsCount: 5,
    rowsCount: 3,
    betMultiplier: 1,
    symbols: [
      {
        id: "diamond_blue",
        name: "Blue Diamond",
        image: "🔹",
        weight: 8,
        payTable: [
          { count: 3, multiplier: 5 },
          { count: 4, multiplier: 15 },
          { count: 5, multiplier: 30 },
        ],
      },
      {
        id: "diamond_red",
        name: "Red Diamond",
        image: "🔻",
        weight: 7,
        payTable: [
          { count: 3, multiplier: 8 },
          { count: 4, multiplier: 20 },
          { count: 5, multiplier: 40 },
        ],
      },
      {
        id: "diamond_green",
        name: "Green Diamond",
        image: "🟢",
        weight: 6,
        payTable: [
          { count: 3, multiplier: 10 },
          { count: 4, multiplier: 25 },
          { count: 5, multiplier: 50 },
        ],
      },
      {
        id: "diamond_purple",
        name: "Purple Diamond",
        image: "🟣",
        weight: 5,
        payTable: [
          { count: 3, multiplier: 15 },
          { count: 4, multiplier: 30 },
          { count: 5, multiplier: 60 },
        ],
      },
      {
        id: "diamond_yellow",
        name: "Yellow Diamond",
        image: "🟡",
        weight: 4,
        payTable: [
          { count: 3, multiplier: 20 },
          { count: 4, multiplier: 40 },
          { count: 5, multiplier: 80 },
        ],
      },
      {
        id: "crown",
        name: "Crown",
        image: "👑",
        weight: 3,
        payTable: [
          { count: 3, multiplier: 25 },
          { count: 4, multiplier: 50 },
          { count: 5, multiplier: 100 },
        ],
      },
      {
        id: "gem",
        name: "Gem",
        image: "💎",
        weight: 2,
        payTable: [
          { count: 3, multiplier: 30 },
          { count: 4, multiplier: 60 },
          { count: 5, multiplier: 150 },
        ],
      },
      {
        id: "wild",
        name: "Wild",
        image: "🌟",
        weight: 1,
        isWild: true,
        wildMultiplier: 3,
        payTable: [
          { count: 3, multiplier: 50 },
          { count: 4, multiplier: 100 },
          { count: 5, multiplier: 250 },
        ],
      },
      {
        id: "scatter",
        name: "Scatter",
        image: "🎁",
        weight: 1,
        isScatter: true,
        payTable: [
          { count: 3, multiplier: 5 },
          { count: 4, multiplier: 20 },
          { count: 5, multiplier: 50 },
        ],
      },
    ],
    paylines: [
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ], // Top row
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [1, 4],
      ], // Middle row
      [
        [2, 0],
        [2, 1],
        [2, 2],
        [2, 3],
        [2, 4],
      ], // Bottom row
      [
        [0, 0],
        [1, 1],
        [2, 2],
        [1, 3],
        [0, 4],
      ], // V shape
      [
        [2, 0],
        [1, 1],
        [0, 2],
        [1, 3],
        [2, 4],
      ], // Inverted V
      [
        [0, 0],
        [0, 1],
        [1, 2],
        [2, 3],
        [2, 4],
      ], // Diagonal top-left to bottom-right
      [
        [2, 0],
        [2, 1],
        [1, 2],
        [0, 3],
        [0, 4],
      ], // Diagonal bottom-left to top-right
      [
        [1, 0],
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 4],
      ], // Top zigzag
      [
        [1, 0],
        [2, 1],
        [2, 2],
        [2, 3],
        [1, 4],
      ], // Bottom zigzag
      [
        [0, 0],
        [1, 0],
        [2, 1],
        [1, 2],
        [0, 3],
      ], // Custom path 1
      [
        [2, 0],
        [1, 1],
        [0, 1],
        [1, 2],
        [2, 3],
      ], // Custom path 2
      [
        [1, 0],
        [1, 1],
        [0, 2],
        [1, 3],
        [1, 4],
      ], // Custom path 3
      [
        [1, 0],
        [1, 1],
        [2, 2],
        [1, 3],
        [1, 4],
      ], // Custom path 4
      [
        [0, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [0, 4],
      ], // Custom path 5
      [
        [2, 0],
        [1, 1],
        [1, 2],
        [1, 3],
        [2, 4],
      ], // Custom path 6
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 4],
      ], // Custom path 7
      [
        [2, 0],
        [2, 1],
        [2, 2],
        [1, 3],
        [0, 4],
      ], // Custom path 8
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
        [2, 2],
      ], // Custom path 9
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [2, 3],
        [2, 4],
      ], // Custom path 10
    ],
    bonusFeatures: [
      {
        type: "freeSpins",
        triggerSymbolId: "scatter",
        minCount: 3,
        config: {
          spinsCount: 12,
          multiplier: 2,
        },
      },
      {
        type: "diamondPick",
        triggerSymbolId: "gem",
        minCount: 3,
        config: {
          picks: 5,
          multiplierRange: [2, 50],
        },
      },
    ],
  },
}

// Helper function to get a slot game configuration by ID
export function getSlotGameConfig(gameId: string): SlotGameConfig {
  return slotGameConfigs[gameId] || slotGameConfigs.classicFruits
}

