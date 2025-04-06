export default function ApiDocsPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          Back to Dashboard
        </a>
      </div>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">API Documentation</h1>

        <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="text-2xl font-semibold leading-none tracking-tight">API Documentation</h3>
            <p className="text-sm text-muted-foreground">Slot King Casino REST API v1</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-4 mb-4">
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Users
              </button>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Sessions
              </button>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Leaderboard
              </button>
              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                System
              </button>
            </div>

            <div className="border rounded-md p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">GET</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">/api/v1/users</code>
              </div>
              <p className="text-sm mb-4">Get a list of all users (admin only)</p>
            </div>

            <div className="border rounded-md p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">POST</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">/api/v1/users</code>
              </div>
              <p className="text-sm mb-4">Create a new user</p>
            </div>

            <div className="border rounded-md p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">GET</span>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">/api/v1/users/{"{userId}"}</code>
              </div>
              <p className="text-sm mb-4">Get a user by ID</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

