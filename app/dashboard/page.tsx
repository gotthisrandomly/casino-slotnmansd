import { GameSelector } from "@/components/game-selector"
import { UserProfile } from "@/components/user-profile"
import { Leaderboard } from "@/components/leaderboard"

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <GameSelector />
        </div>
        <div className="space-y-6">
          <UserProfile />
          <Leaderboard />
        </div>
      </div>
    </div>
  )
}

