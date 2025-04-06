"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Gamepad2, LogOut, Trophy, User } from "lucide-react"

interface GameOption {
  id: string
  title: string
  description: string
  image: string
}

const GAME_OPTIONS: GameOption[] = [
  {
    id: "classic-slots",
    title: "Classic Slots",
    description: "Play the traditional slot machine game",
    image: "🎰",
  },
  {
    id: "fruit-frenzy",
    title: "Fruit Frenzy",
    description: "Spin the reels with colorful fruits",
    image: "🍎",
  },
  {
    id: "jackpot-jungle",
    title: "Jackpot Jungle",
    description: "Adventure through the jungle for big wins",
    image: "🌴",
  },
  {
    id: "lucky-sevens",
    title: "Lucky Sevens",
    description: "Classic 7s slot with massive payouts",
    image: "7️⃣",
  },
]

export function PlayerDashboard() {
  const { user, logout } = useAuth()

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Player Dashboard</h1>
        <div className="flex items-center gap-4">
          <a href="/profile">
            <Button variant="outline" className="flex items-center gap-2">
              <User size={16} />
              Profile
            </Button>
          </a>
          <Button variant="outline" onClick={logout} className="flex items-center gap-2">
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {GAME_OPTIONS.map((game) => (
          <Card key={game.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <span className="text-3xl">{game.image}</span>
                {game.title}
              </CardTitle>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <a href="/play">
                <Button className="w-full">
                  <Gamepad2 className="mr-2 h-4 w-4" /> Play Now
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Your Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="text-2xl font-bold">${user.balance}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Games Played</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Biggest Win</p>
              <p className="text-2xl font-bold">$0</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

