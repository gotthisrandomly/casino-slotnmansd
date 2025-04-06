"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface EndpointProps {
  method: string
  path: string
  description: string
  requestBody?: string
  responseBody?: string
  parameters?: { name: string; description: string; required: boolean }[]
}

const Endpoint = ({ method, path, description, requestBody, responseBody, parameters }: EndpointProps) => {
  const methodColor =
    {
      GET: "bg-blue-100 text-blue-800",
      POST: "bg-green-100 text-green-800",
      PUT: "bg-yellow-100 text-yellow-800",
      PATCH: "bg-orange-100 text-orange-800",
      DELETE: "bg-red-100 text-red-800",
    }[method] || "bg-gray-100 text-gray-800"

  return (
    <div className="border rounded-md p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`px-2 py-1 rounded text-xs font-bold ${methodColor}`}>{method}</span>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{path}</code>
      </div>
      <p className="text-sm mb-4">{description}</p>

      {parameters && parameters.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Parameters</h4>
          <div className="bg-gray-50 p-2 rounded">
            {parameters.map((param, index) => (
              <div key={index} className="text-xs mb-1">
                <span className="font-mono">{param.name}</span>
                {param.required && <span className="text-red-500 ml-1">*</span>}
                <span className="text-gray-500 ml-2">{param.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {requestBody && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2">Request Body</h4>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">{requestBody}</pre>
        </div>
      )}

      {responseBody && (
        <div>
          <h4 className="text-sm font-semibold mb-2">Response</h4>
          <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">{responseBody}</pre>
        </div>
      )}
    </div>
  )
}

export function ApiDocs() {
  const [activeTab, setActiveTab] = useState("users")

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Documentation</CardTitle>
        <CardDescription>Slot King Casino REST API v1</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Accordion type="single" collapsible>
              <AccordionItem value="users-get">
                <AccordionTrigger>List Users</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="GET"
                    path="/api/v1/users"
                    description="Get a list of all users (admin only)"
                    parameters={[
                      { name: "page", description: "Page number (default: 1)", required: false },
                      { name: "pageSize", description: "Items per page (default: 20, max: 100)", required: false },
                    ]}
                    responseBody={`{
  "success": true,
  "data": {
    "items": [
      {
        "id": "user-id",
        "username": "username",
        "email": "user@example.com",
        "balance": 1000,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "lastLogin": "2023-01-01T00:00:00.000Z",
        "isAdmin": false
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}`}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="users-post">
                <AccordionTrigger>Create User</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="POST"
                    path="/api/v1/users"
                    description="Create a new user"
                    requestBody={`{
  "username": "username",
  "password": "password",
  "email": "user@example.com",
  "initialBalance": 1000
}`}
                    responseBody={`{
  "success": true,
  "data": {
    "id": "user-id",
    "username": "username",
    "email": "user@example.com",
    "balance": 1000,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "lastLogin": "2023-01-01T00:00:00.000Z",
    "isAdmin": false
  },
  "message": "User created successfully"
}`}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="users-get-id">
                <AccordionTrigger>Get User</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="GET"
                    path="/api/v1/users/{userId}"
                    description="Get a user by ID"
                    responseBody={`{
  "success": true,
  "data": {
    "id": "user-id",
    "username": "username",
    "email": "user@example.com",
    "balance": 1000,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "lastLogin": "2023-01-01T00:00:00.000Z",
    "isAdmin": false
  }
}`}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="users-patch">
                <AccordionTrigger>Update User</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="PATCH"
                    path="/api/v1/users/{userId}"
                    description="Update a user"
                    requestBody={`{
  "balance": 2000,
  "reason": "Bonus credit"
}`}
                    responseBody={`{
  "success": true,
  "data": {
    "id": "user-id",
    "username": "username",
    "email": "user@example.com",
    "balance": 2000,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "lastLogin": "2023-01-01T00:00:00.000Z",
    "isAdmin": false
  },
  "message": "User balance updated successfully"
}`}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="users-transactions">
                <AccordionTrigger>User Transactions</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="GET"
                    path="/api/v1/users/{userId}/transactions"
                    description="Get user transactions"
                    parameters={[
                      { name: "page", description: "Page number (default: 1)", required: false },
                      { name: "pageSize", description: "Items per page (default: 20, max: 100)", required: false },
                    ]}
                    responseBody={`{
  "success": true,
  "data": {
    "items": [
      {
        "id": "transaction-id",
        "userId": "user-id",
        "type": "bet",
        "amount": 10,
        "description": "Bet placed in session session-id",
        "relatedId": "session-id",
        "timestamp": "2023-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  }
}`}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="sessions">
            <Accordion type="single" collapsible>
              <AccordionItem value="sessions-post">
                <AccordionTrigger>Create Session</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="POST"
                    path="/api/v1/sessions"
                    description="Create a new game session"
                    requestBody={`{
  "userId": "user-id"
}`}
                    responseBody={`{
  "success": true,
  "data": {
    "id": "session-id",
    "userId": "user-id",
    "startTime": "2023-01-01T00:00:00.000Z",
    "initialBalance": 1000,
    "spins": []
  },
  "message": "Session created successfully"
}`}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sessions-get">
                <AccordionTrigger>Get Session</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="GET"
                    path="/api/v1/sessions/{sessionId}"
                    description="Get a session by ID"
                    responseBody={`{
  "success": true,
  "data": {
    "id": "session-id",
    "userId": "user-id",
    "startTime": "2023-01-01T00:00:00.000Z",
    "initialBalance": 1000,
    "spins": [
      {
        "id": "spin-id",
        "timestamp": "2023-01-01T00:00:00.000Z",
        "bet": 10,
        "result": [["CHERRY", "LEMON", "ORANGE"], ["PLUM", "BELL", "BAR"], ["SEVEN", "WILD", "CHERRY"]],
        "winAmount": 20,
        "paylines": [0, 2]
      }
    ]
  }
}`}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sessions-patch">
                <AccordionTrigger>End Session</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="PATCH"
                    path="/api/v1/sessions/{sessionId}"
                    description="End a game session"
                    requestBody={`{
  "action": "end"
}`}
                    responseBody={`{
  "success": true,
  "data": {
    "id": "session-id",
    "userId": "user-id",
    "startTime": "2023-01-01T00:00:00.000Z",
    "endTime": "2023-01-01T01:00:00.000Z",
    "initialBalance": 1000,
    "finalBalance": 1200,
    "spins": [
      {
        "id": "spin-id",
        "timestamp": "2023-01-01T00:00:00.000Z",
        "bet": 10,
        "result": [["CHERRY", "LEMON", "ORANGE"], ["PLUM", "BELL", "BAR"], ["SEVEN", "WILD", "CHERRY"]],
        "winAmount": 20,
        "paylines": [0, 2]
      }
    ]
  },
  "message": "Session ended successfully"
}`}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sessions-spins">
                <AccordionTrigger>Record Spin</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="POST"
                    path="/api/v1/sessions/{sessionId}/spins"
                    description="Record a spin in a session"
                    requestBody={`{
  "bet": 10,
  "result": [["CHERRY", "LEMON", "ORANGE"], ["PLUM", "BELL", "BAR"], ["SEVEN", "WILD", "CHERRY"]],
  "winAmount": 20,
  "paylines": [0, 2]
}`}
                    responseBody={`{
  "success": true,
  "data": {
    "spin": {
      "id": "spin-id",
      "timestamp": "2023-01-01T00:00:00.000Z",
      "bet": 10,
      "result": [["CHERRY", "LEMON", "ORANGE"], ["PLUM", "BELL", "BAR"], ["SEVEN", "WILD", "CHERRY"]],
      "winAmount": 20,
      "paylines": [0, 2]
    },
    "user": {
      "id": "user-id",
      "username": "username",
      "email": "user@example.com",
      "balance": 1010,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "lastLogin": "2023-01-01T00:00:00.000Z",
      "isAdmin": false
    }
  },
  "message": "Spin recorded successfully"
}`}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Accordion type="single" collapsible>
              <AccordionItem value="leaderboard-get">
                <AccordionTrigger>Get Leaderboard</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="GET"
                    path="/api/v1/leaderboard"
                    description="Get the leaderboard"
                    parameters={[
                      { name: "type", description: "Leaderboard type (highest or total)", required: false },
                      { name: "limit", description: "Number of entries to return (default: 10)", required: false },
                    ]}
                    responseBody={`{
  "success": true,
  "data": [
    {
      "userId": "user-id",
      "username": "username",
      "highestWin": 500,
      "totalWinnings": 2000,
      "timestamp": "2023-01-01T00:00:00.000Z"
    }
  ]
}`}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          <TabsContent value="system">
            <Accordion type="single" collapsible>
              <AccordionItem value="system-status">
                <AccordionTrigger>System Status</AccordionTrigger>
                <AccordionContent>
                  <Endpoint
                    method="GET"
                    path="/api/v1/system/status"
                    description="Get the system status"
                    responseBody={`{
  "success": true,
  "data": {
    "status": "online",
    "database": {
      "connected": true,
      "stats": {
        "users": 10,
        "sessions": 25,
        "spins": 150,
        "transactions": 300,
        "leaderboardEntries": 8
      }
    },
    "version": "1.0.0",
    "timestamp": "2023-01-01T00:00:00.000Z"
  }
}`}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

