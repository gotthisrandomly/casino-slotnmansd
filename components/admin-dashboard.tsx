"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/db/database"
import { Code, Database, Users } from "lucide-react"
import type { User } from "@/types"

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Fetch users and stats
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch users
        const response = await fetch("/api/v1/users")
        if (!response.ok) {
          throw new Error("Failed to fetch users")
        }
        const data = await response.json()
        setUsers(data.data.items)

        // Get database stats
        setStats(db.getDatabaseStats())
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const handleExportData = () => {
    try {
      db.exportData()
      toast({
        title: "Data Exported",
        description: "Game data has been exported successfully",
      })
    } catch (error) {
      console.error("Error exporting data:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export game data",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Dashboard</CardTitle>
          <CardDescription>Manage your casino</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users size={18} />
                  Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.users || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database size={18} />
                  Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.sessions || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code size={18} />
                  Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.transactions || 0}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium mb-2">Recent Users ({users.length})</h3>
            {loading ? (
              <p>Loading users...</p>
            ) : (
              <div className="border rounded-md divide-y">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="p-2 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Balance: ${user.balance} | Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t mt-6">
            <h3 className="text-lg font-medium mb-2">Admin Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleExportData}>Export Data</Button>
              <a href="/admin/api">
                <Button variant="outline" className="w-full">
                  API Documentation
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

