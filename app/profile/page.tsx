export default function Profile() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Profile</h1>
          <p className="text-xl">Account details</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Player</h2>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className="text-xl font-bold">$1000</p>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-bold mb-2">Game History</h3>
            <p className="text-gray-600">No games played yet.</p>
          </div>

          <div className="mt-8">
            <a
              href="/dashboard"
              className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded hover:bg-blue-700 mb-2"
            >
              Back to Dashboard
            </a>
            <a
              href="/"
              className="block w-full bg-gray-200 text-gray-800 text-center py-2 px-4 rounded hover:bg-gray-300"
            >
              Logout
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

