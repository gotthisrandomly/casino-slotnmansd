import crypto from "crypto"
import type { GameResult } from "@/types/game"

// Generate a random client seed
export function generateClientSeed(length = 16): string {
  return crypto.randomBytes(length).toString("hex")
}

// Generate a server seed and its hash
export function generateServerSeed(length = 32): { seed: string; hash: string } {
  const seed = crypto.randomBytes(length).toString("hex")
  const hash = crypto.createHash("sha256").update(seed).digest("hex")

  return { seed, hash }
}

// Combine seeds to generate a random number
export function generateRandomNumber(clientSeed: string, serverSeed: string, nonce: number): number {
  const message = `${clientSeed}-${nonce}-${serverSeed}`
  const hash = crypto.createHash("sha256").update(message).digest("hex")

  // Convert first 8 characters of hash to a decimal between 0 and 1
  const decimal = Number.parseInt(hash.substring(0, 8), 16) / 0xffffffff

  return decimal
}

// Generate multiple random numbers
export function generateRandomNumbers(clientSeed: string, serverSeed: string, nonce: number, count: number): number[] {
  const numbers: number[] = []

  for (let i = 0; i < count; i++) {
    const num = generateRandomNumber(clientSeed, serverSeed, nonce + i)
    numbers.push(num)
  }

  return numbers
}

// Verify a game result
export function verifyGameResult(result: GameResult, clientSeed: string, serverSeed: string, nonce: number): boolean {
  // This would need to be implemented specifically for each game type
  // Here's a generic implementation for slot games

  if (result.gameType === "slots") {
    // Generate the same random numbers that should have been used
    const randomNumbers = generateRandomNumbers(clientSeed, serverSeed, nonce, result.reels.flat().length)

    // Reconstruct the reels
    let index = 0
    const reconstructedReels = result.reels.map((reel) =>
      reel.map(() => {
        // Convert random number to symbol index
        const symbolIndex = Math.floor(randomNumbers[index] * result.symbols.length)
        index++
        return result.symbols[symbolIndex]
      }),
    )

    // Compare with the result
    for (let i = 0; i < result.reels.length; i++) {
      for (let j = 0; j < result.reels[i].length; j++) {
        if (result.reels[i][j] !== reconstructedReels[i][j]) {
          return false
        }
      }
    }

    return true
  }

  // For other game types
  return false
}

