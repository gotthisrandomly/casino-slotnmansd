import { SlotMachine } from "@/components/slot-machine"
import { GameControls } from "@/components/game-controls"
import { PayTable } from "@/components/pay-table"

export default function PlayPage({ params }: { params: { gameId: string } }) {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SlotMachine />
          <div className="mt-6">
            <GameControls gameId={params.gameId} />
          </div>
        </div>
        <div>
          <PayTable gameId={params.gameId} />
        </div>
      </div>
    </div>
  )
}

