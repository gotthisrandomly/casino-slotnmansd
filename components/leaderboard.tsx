"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { LeaderboardEntry } from "@/types"

export function Leaderboard() {
  const [highestWins, setHighestWins] = useState<LeaderboardEntry[]>([])
  const [totalWinnings, setTotalWinnings] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError("")

        // Fetch highest wins
        const highestResponse = await fetch("/api/leaderboard?type=highest&limit=10")
        if (!highestResponse.ok) {
          console.error("Failed to fetch highest wins:", await highestResponse.text())
          throw new Error("Failed to fetch highest wins")
        }

        const highestData = await highestResponse.json()
        setHighestWins(Array.isArray(highestData) ? highestData : [])

        // Fetch total winnings
        const totalResponse = await fetch("/api/leaderboard?type=total&limit=10")
        if (!totalResponse.ok) {
          console.error("Failed to fetch total winnings:", await totalResponse.text())
          throw new Error("Failed to fetch total winnings")
        }

        const totalData = await totalResponse.json()
        setTotalWinnings(Array.isArray(totalData) ? totalData : [])
      } catch (error) {
        console.error("Leaderboard error:", error)
        setError("Failed to load leaderboard. Please try again later.")
        // Set empty arrays to prevent rendering issues
        setHighestWins([])
        setTotalWinnings([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
        <CardDescription>See who's winning big!</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">Loading leaderboard...</div>
        ) : error ? (
          <div className="text-center text-red-500 p-4">
            {error}
            <Button variant="outline" size="sm" className="mt-2" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="highest">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="highest">Highest Wins</TabsTrigger>
              <TabsTrigger value="total">Total Winnings</TabsTrigger>
            </TabsList>
            <TabsContent value="highest">
              <div className="space-y-2">
                {!highestWins || highestWins.length === 0 ? (
                  <div className="text-center py-4">No wins recorded yet. Be the first!</div>
                ) : (
                  highestWins.map((entry, index) => (
                    <div key={`highest-${index}`} className="flex items-center justify-between p-2 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{index + 1}.</span>
                        <span>{entry.username}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-green-600">{formatCurrency(entry.highestWin)}</span>
                        <span className="text-xs text-gray-500">{formatDate(entry.timestamp)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            <TabsContent value="total">
              <div className="space-y-2">
                {!totalWinnings || totalWinnings.length === 0 ? (
                  <div className="text-center py-4">No wins recorded yet. Be the first!</div>
                ) : (
                  totalWinnings.map((entry, index) => (
                    <div key={`total-${index}`} className="flex items-center justify-between p-2 border-b">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{index + 1}.</span>
                        <span>{entry.username}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-green-600">{formatCurrency(entry.totalWinnings)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}

