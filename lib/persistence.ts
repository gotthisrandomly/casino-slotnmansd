import type { User, GameSession, LeaderboardEntry } from "@/types"

// Define the structure of our persisted data
interface PersistedData {
  users: User[]
  sessions: GameSession[]
  leaderboard: LeaderboardEntry[]
  lastSaved: string
}

// Keys for localStorage
const STORAGE_KEY = "slot-king-data"

// Safe localStorage access
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return localStorage.getItem(key)
      }
      return null
    } catch (e) {
      console.error("Error accessing localStorage.getItem:", e)
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(key, value)
        return true
      }
      return false
    } catch (e) {
      console.error("Error accessing localStorage.setItem:", e)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.removeItem(key)
        return true
      }
      return false
    } catch (e) {
      console.error("Error accessing localStorage.removeItem:", e)
      return false
    }
  },
}

// Client-side persistence functions
export const persistence = {
  // Save data to localStorage
  saveData: (data: PersistedData): boolean => {
    return safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  },

  // Load data from localStorage
  loadData: (): PersistedData | null => {
    try {
      const data = safeLocalStorage.getItem(STORAGE_KEY)
      if (!data) return null

      return JSON.parse(data) as PersistedData
    } catch (error) {
      console.error("Failed to load data from localStorage:", error)
      return null
    }
  },

  // Clear all data from localStorage
  clearData: (): boolean => {
    return safeLocalStorage.removeItem(STORAGE_KEY)
  },

  // Export data as a JSON file for download
  exportData: (data: PersistedData): void => {
    if (typeof window === "undefined") return

    try {
      const dataStr = JSON.stringify(data, null, 2)
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

      const exportFileDefaultName = `slot-king-backup-${new Date().toISOString().slice(0, 10)}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()
    } catch (error) {
      console.error("Failed to export data:", error)
    }
  },

  // Import data from a JSON file
  importData: async (file: File): Promise<PersistedData | null> => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (event) => {
          try {
            if (event.target?.result) {
              const data = JSON.parse(event.target.result as string) as PersistedData
              resolve(data)
            } else {
              reject(new Error("Failed to read file"))
            }
          } catch (error) {
            reject(error)
          }
        }

        reader.onerror = (error) => {
          reject(error)
        }

        reader.readAsText(file)
      })
    } catch (error) {
      console.error("Failed to import data:", error)
      return null
    }
  },
}

