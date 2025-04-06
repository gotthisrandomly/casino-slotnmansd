// Define symbols and their values
export const SYMBOLS = {
  CHERRY: { id: "cherry", value: 10, image: "🍒" },
  LEMON: { id: "lemon", value: 20, image: "🍋" },
  ORANGE: { id: "orange", value: 30, image: "🍊" },
  PLUM: { id: "plum", value: 40, image: "🍇" },
  BELL: { id: "bell", value: 50, image: "🔔" },
  BAR: { id: "bar", value: 100, image: "📊" },
  SEVEN: { id: "seven", value: 200, image: "7️⃣" },
  WILD: { id: "wild", value: 0, image: "⭐" }, // Wild symbol
}

// Define paylines (for a 3x5 slot machine)
export const PAYLINES = [
  [0, 1, 2, 3, 4], // Top row
  [5, 6, 7, 8, 9], // Middle row
  [10, 11, 12, 13, 14], // Bottom row
  [0, 6, 12, 8, 4], // Diagonal from top-left to bottom-right
  [10, 6, 2, 8, 14], // Diagonal from bottom-left to top-right
]

// Generate a random reel result
export function spinReels(rows = 3, cols = 5): string[][] {
  const result: string[][] = []
  const symbolKeys = Object.keys(SYMBOLS)

  for (let i = 0; i < rows; i++) {
    const row: string[] = []
    for (let j = 0; j < cols; j++) {
      const randomIndex = Math.floor(Math.random() * symbolKeys.length)
      row.push(symbolKeys[randomIndex])
    }
    result.push(row)
  }

  return result
}

// Calculate winnings based on the result
export function calculateWinnings(result: string[][], bet: number): { winAmount: number; paylines: number[] } {
  let totalWin = 0
  const winningPaylines: number[] = []

  // Check each payline
  PAYLINES.forEach((payline, index) => {
    const symbols = payline.map((position) => {
      const row = Math.floor(position / 5)
      const col = position % 5
      return result[row][col]
    })

    // Check for winning combinations
    const firstSymbol = symbols[0]
    let count = 1
    let hasWild = false

    for (let i = 1; i < symbols.length; i++) {
      if (symbols[i] === firstSymbol || symbols[i] === "WILD") {
        count++
        if (symbols[i] === "WILD") hasWild = true
      } else if (firstSymbol === "WILD") {
        // If first symbol is wild, check if current symbol matches the next non-wild
        let nextNonWild = ""
        for (let j = 1; j < symbols.length; j++) {
          if (symbols[j] !== "WILD") {
            nextNonWild = symbols[j]
            break
          }
        }

        if (nextNonWild === "" || symbols[i] === nextNonWild) {
          count++
          hasWild = true
        } else {
          break
        }
      } else {
        break
      }
    }

    // Calculate win based on matching symbols
    if (count >= 3) {
      let symbolValue = 0

      if (firstSymbol === "WILD") {
        // Find the highest value symbol in the payline
        let highestValue = 0
        symbols.forEach((symbol) => {
          if (symbol !== "WILD" && SYMBOLS[symbol as keyof typeof SYMBOLS].value > highestValue) {
            highestValue = SYMBOLS[symbol as keyof typeof SYMBOLS].value
            symbolValue = highestValue
          }
        })

        // If all wilds, use the highest value symbol
        if (symbolValue === 0) {
          symbolValue = SYMBOLS.SEVEN.value
        }
      } else {
        symbolValue = SYMBOLS[firstSymbol as keyof typeof SYMBOLS].value
      }

      // Calculate win amount based on symbol value, count, and bet
      // Wilds increase the win multiplier
      const wildMultiplier = hasWild ? 2 : 1
      const winMultiplier = count - 2 // 3 matches = 1x, 4 matches = 2x, 5 matches = 3x
      const lineWin = (symbolValue * winMultiplier * wildMultiplier * bet) / 10

      totalWin += lineWin
      winningPaylines.push(index)
    }
  })

  return { winAmount: Math.round(totalWin), paylines: winningPaylines }
}

