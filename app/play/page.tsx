export default function Play() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Classic Slots</h1>
          <p className="text-xl">Try your luck!</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex justify-between mb-4">
            <div>
              <p className="text-sm text-gray-600">Balance</p>
              <p className="text-xl font-bold">$1000</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bet</p>
              <p className="text-xl font-bold">$10</p>
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg mb-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-700 h-16 flex items-center justify-center text-2xl">🍒</div>
              <div className="bg-gray-700 h-16 flex items-center justify-center text-2xl">🍋</div>
              <div className="bg-gray-700 h-16 flex items-center justify-center text-2xl">🍊</div>
              <div className="bg-gray-700 h-16 flex items-center justify-center text-2xl">🍇</div>
              <div className="bg-gray-700 h-16 flex items-center justify-center text-2xl">🔔</div>
              <div className="bg-gray-700 h-16 flex items-center justify-center text-2xl">📊</div>
              <div className="bg-gray-700 h-16 flex items-center justify-center text-2xl">7️⃣</div>
              <div className="bg-gray-700 h-16 flex items-center justify-center text-2xl">⭐</div>
              <div className="bg-gray-700 h-16 flex items-center justify-center text-2xl">🍒</div>
            </div>
          </div>

          <a
            href="/play"
            className="block w-full bg-blue-600 text-white text-center py-3 px-4 rounded hover:bg-blue-700 text-xl font-bold"
          >
            SPIN
          </a>

          <div className="mt-8">
            <a
              href="/dashboard"
              className="block w-full bg-gray-200 text-gray-800 text-center py-2 px-4 rounded hover:bg-gray-300"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

