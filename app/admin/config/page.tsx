"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Save, RefreshCw } from "lucide-react"

export default function ConfigPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("app")
  const [config, setConfig] = useState<Record<string, any>>({})

  // Fetch current configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true)

        // Check if user is admin
        if (!user?.isAdmin) {
          router.push("/dashboard")
          return
        }

        const response = await fetch("/api/admin/config")
        if (!response.ok) {
          throw new Error("Failed to fetch configuration")
        }

        const data = await response.json()
        setConfig(data)
      } catch (error) {
        console.error("Error fetching configuration:", error)
        toast({
          title: "Error",
          description: "Failed to load configuration",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchConfig()
  }, [user, router])

  // Save configuration
  const handleSave = async () => {
    try {
      setIsSaving(true)

      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      })

      if (!response.ok) {
        throw new Error("Failed to save configuration")
      }

      toast({
        title: "Success",
        description: "Configuration saved successfully",
      })
    } catch (error) {
      console.error("Error saving configuration:", error)
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Reset configuration to defaults
  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset to default configuration? This cannot be undone.")) {
      return
    }

    try {
      setIsLoading(true)

      const response = await fetch("/api/admin/config/reset", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to reset configuration")
      }

      const data = await response.json()
      setConfig(data)

      toast({
        title: "Success",
        description: "Configuration reset to defaults",
      })
    } catch (error) {
      console.error("Error resetting configuration:", error)
      toast({
        title: "Error",
        description: "Failed to reset configuration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change
  const handleChange = (section: string, key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Configuration</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RefreshCw className="mr-2 h-4 w-4" /> Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>Manage your casino system settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-6 mb-4">
              <TabsTrigger value="app">App</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="game">Game</TabsTrigger>
              <TabsTrigger value="database">Database</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="app" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="app-name">App Name</Label>
                  <Input
                    id="app-name"
                    value={config.app?.name || ""}
                    onChange={(e) => handleChange("app", "name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-url">App URL</Label>
                  <Input
                    id="app-url"
                    value={config.app?.url || ""}
                    onChange={(e) => handleChange("app", "url", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="app-environment">Environment</Label>
                  <select
                    id="app-environment"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={config.app?.environment || "development"}
                    onChange={(e) => handleChange("app", "environment", e.target.value)}
                  >
                    <option value="development">Development</option>
                    <option value="test">Test</option>
                    <option value="production">Production</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="app-debug"
                    checked={config.app?.debug || false}
                    onCheckedChange={(checked) => handleChange("app", "debug", checked)}
                  />
                  <Label htmlFor="app-debug">Debug Mode</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-4">
              <h3 className="text-lg font-medium">Stripe</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-publishable-key">Publishable Key</Label>
                  <Input
                    id="stripe-publishable-key"
                    value={config.payment?.stripe?.publishableKey || ""}
                    onChange={(e) =>
                      handleChange("payment", "stripe", {
                        ...config.payment?.stripe,
                        publishableKey: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret-key">Secret Key</Label>
                  <Input
                    id="stripe-secret-key"
                    type="password"
                    value={config.payment?.stripe?.secretKey || ""}
                    onChange={(e) =>
                      handleChange("payment", "stripe", {
                        ...config.payment?.stripe,
                        secretKey: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">PayPal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-id">Client ID</Label>
                  <Input
                    id="paypal-client-id"
                    value={config.payment?.paypal?.clientId || ""}
                    onChange={(e) =>
                      handleChange("payment", "paypal", {
                        ...config.payment?.paypal,
                        clientId: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-client-secret">Client Secret</Label>
                  <Input
                    id="paypal-client-secret"
                    type="password"
                    value={config.payment?.paypal?.clientSecret || ""}
                    onChange={(e) =>
                      handleChange("payment", "paypal", {
                        ...config.payment?.paypal,
                        clientSecret: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paypal-environment">Environment</Label>
                  <select
                    id="paypal-environment"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={config.payment?.paypal?.environment || "sandbox"}
                    onChange={(e) =>
                      handleChange("payment", "paypal", {
                        ...config.payment?.paypal,
                        environment: e.target.value,
                      })
                    }
                  >
                    <option value="sandbox">Sandbox</option>
                    <option value="live">Live</option>
                  </select>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">Crypto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="crypto-enabled"
                    checked={config.payment?.crypto?.enabled || false}
                    onCheckedChange={(checked) =>
                      handleChange("payment", "crypto", {
                        ...config.payment?.crypto,
                        enabled: checked,
                      })
                    }
                  />
                  <Label htmlFor="crypto-enabled">Enable Cryptocurrency</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="crypto-provider">Provider</Label>
                  <Input
                    id="crypto-provider"
                    value={config.payment?.crypto?.provider || ""}
                    onChange={(e) =>
                      handleChange("payment", "crypto", {
                        ...config.payment?.crypto,
                        provider: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">General Payment Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-deposit">Minimum Deposit ($)</Label>
                  <Input
                    id="min-deposit"
                    type="number"
                    value={config.payment?.minDeposit || 10}
                    onChange={(e) => handleChange("payment", "minDeposit", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-deposit">Maximum Deposit ($)</Label>
                  <Input
                    id="max-deposit"
                    type="number"
                    value={config.payment?.maxDeposit || 10000}
                    onChange={(e) => handleChange("payment", "maxDeposit", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-withdrawal">Minimum Withdrawal ($)</Label>
                  <Input
                    id="min-withdrawal"
                    type="number"
                    value={config.payment?.minWithdrawal || 20}
                    onChange={(e) => handleChange("payment", "minWithdrawal", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-withdrawal">Maximum Withdrawal ($)</Label>
                  <Input
                    id="max-withdrawal"
                    type="number"
                    value={config.payment?.maxWithdrawal || 5000}
                    onChange={(e) => handleChange("payment", "maxWithdrawal", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="game" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initial-balance">Default Initial Balance ($)</Label>
                  <Input
                    id="initial-balance"
                    type="number"
                    value={config.game?.defaultInitialBalance || 1000}
                    onChange={(e) => handleChange("game", "defaultInitialBalance", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-win-multiplier">Maximum Win Multiplier</Label>
                  <Input
                    id="max-win-multiplier"
                    type="number"
                    value={config.game?.maxWinMultiplier || 5000}
                    onChange={(e) => handleChange("game", "maxWinMultiplier", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="house-edge">House Edge (%)</Label>
                  <Input
                    id="house-edge"
                    type="number"
                    step="0.01"
                    value={(config.game?.houseEdge || 0.05) * 100}
                    onChange={(e) => handleChange("game", "houseEdge", Number.parseFloat(e.target.value) / 100)}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="bonus-enabled"
                    checked={config.game?.bonusEnabled || false}
                    onCheckedChange={(checked) => handleChange("game", "bonusEnabled", checked)}
                  />
                  <Label htmlFor="bonus-enabled">Enable Bonuses</Label>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    id="provably-fair-enabled"
                    checked={config.game?.provablyFairEnabled || true}
                    onCheckedChange={(checked) => handleChange("game", "provablyFairEnabled", checked)}
                  />
                  <Label htmlFor="provably-fair-enabled">Enable Provably Fair</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="database" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="database-type">Database Type</Label>
                  <select
                    id="database-type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={config.database?.type || "memory"}
                    onChange={(e) => handleChange("database", "type", e.target.value)}
                  >
                    <option value="memory">In-Memory (Development)</option>
                    <option value="postgres">PostgreSQL</option>
                    <option value="mysql">MySQL</option>
                    <option value="mongodb">MongoDB</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="database-url">Database URL</Label>
                  <Input
                    id="database-url"
                    value={config.database?.url || ""}
                    onChange={(e) => handleChange("database", "url", e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium">Redis Configuration</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="redis-enabled"
                      checked={config.redis?.enabled || false}
                      onCheckedChange={(checked) => handleChange("redis", "enabled", checked)}
                    />
                    <Label htmlFor="redis-enabled">Enable Redis</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redis-url">Redis URL</Label>
                    <Input
                      id="redis-url"
                      value={config.redis?.url || ""}
                      onChange={(e) => handleChange("redis", "url", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-from">From Email</Label>
                  <Input
                    id="email-from"
                    type="email"
                    value={config.email?.from || ""}
                    onChange={(e) => handleChange("email", "from", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-provider">Email Provider</Label>
                  <select
                    id="email-provider"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={config.email?.provider || "smtp"}
                    onChange={(e) => handleChange("email", "provider", e.target.value)}
                  >
                    <option value="smtp">SMTP</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="mailgun">Mailgun</option>
                  </select>
                </div>
              </div>

              {config.email?.provider === "smtp" && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium">SMTP Configuration</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        value={config.email?.smtp?.host || ""}
                        onChange={(e) =>
                          handleChange("email", "smtp", {
                            ...config.email?.smtp,
                            host: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">SMTP Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={config.email?.smtp?.port || 587}
                        onChange={(e) =>
                          handleChange("email", "smtp", {
                            ...config.email?.smtp,
                            port: Number.parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-user">SMTP User</Label>
                      <Input
                        id="smtp-user"
                        value={config.email?.smtp?.user || ""}
                        onChange={(e) =>
                          handleChange("email", "smtp", {
                            ...config.email?.smtp,
                            user: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-pass">SMTP Password</Label>
                      <Input
                        id="smtp-pass"
                        type="password"
                        value={config.email?.smtp?.pass || ""}
                        onChange={(e) =>
                          handleChange("email", "smtp", {
                            ...config.email?.smtp,
                            pass: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {config.email?.provider === "sendgrid" && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium">SendGrid Configuration</h3>
                  <div className="space-y-2 mt-2">
                    <Label htmlFor="sendgrid-api-key">API Key</Label>
                    <Input
                      id="sendgrid-api-key"
                      type="password"
                      value={config.email?.sendgrid?.apiKey || ""}
                      onChange={(e) =>
                        handleChange("email", "sendgrid", {
                          ...config.email?.sendgrid,
                          apiKey: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {config.email?.provider === "mailgun" && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium">Mailgun Configuration</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="space-y-2">
                      <Label htmlFor="mailgun-api-key">API Key</Label>
                      <Input
                        id="mailgun-api-key"
                        type="password"
                        value={config.email?.mailgun?.apiKey || ""}
                        onChange={(e) =>
                          handleChange("email", "mailgun", {
                            ...config.email?.mailgun,
                            apiKey: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mailgun-domain">Domain</Label>
                      <Input
                        id="mailgun-domain"
                        value={config.email?.mailgun?.domain || ""}
                        onChange={(e) =>
                          handleChange("email", "mailgun", {
                            ...config.email?.mailgun,
                            domain: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="auth-session-secret">Session Secret</Label>
                  <Input
                    id="auth-session-secret"
                    type="password"
                    value={config.auth?.sessionSecret || ""}
                    onChange={(e) => handleChange("auth", "sessionSecret", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auth-token-expiry">Token Expiry (seconds)</Label>
                  <Input
                    id="auth-token-expiry"
                    type="number"
                    value={config.auth?.tokenExpiry || 86400}
                    onChange={(e) => handleChange("auth", "tokenExpiry", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium">Raw Configuration</h3>
                <div className="mt-2">
                  <textarea
                    className="w-full h-64 font-mono text-sm p-4 rounded-md border border-input bg-background"
                    value={JSON.stringify(config, null, 2)}
                    readOnly
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

