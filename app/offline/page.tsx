"use client"

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-4xl font-bold mb-4">You're Offline</h1>
      <p className="text-xl mb-8">Please check your internet connection and try again.</p>
      <button
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        onClick={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  )
}

