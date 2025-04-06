"use client"

import type React from "react"

import { useState } from "react"
import { usePayment } from "@/context/payment-context"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, CreditCard, Wallet, Bitcoin } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import type { PaymentGateway } from "@/types/payment"

export function DepositForm() {
  const { user } = useAuth()
  const { deposit, isLoading, paymentMethods } = usePayment()

  const [amount, setAmount] = useState(100)
  const [activeTab, setActiveTab] = useState<PaymentGateway>("stripe")
  const [selectedMethod, setSelectedMethod] = useState<string>("")

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setAmount(value)
    }
  }

  const handleDeposit = async () => {
    if (amount < 10) {
      return
    }

    await deposit(amount, activeTab, selectedMethod || undefined)
  }

  const renderPaymentMethodOptions = () => {
    const methods = paymentMethods.filter((method) => method.gateway === activeTab)

    if (methods.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No saved payment methods</p>
        </div>
      )
    }

    return (
      <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
        {methods.map((method) => (
          <div key={method.id} className="flex items-center space-x-2 border p-3 rounded-md">
            <RadioGroupItem value={method.id} id={method.id} />
            <Label htmlFor={method.id} className="flex-1">
              {method.type === "card" && (
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>
                    {method.details.brand} •••• {method.details.last4}
                  </span>
                </div>
              )}
              {method.type === "bank" && (
                <div className="flex items-center">
                  <Wallet className="mr-2 h-4 w-4" />
                  <span>
                    {method.details.bankName} •••• {method.details.last4}
                  </span>
                </div>
              )}
              {method.type === "crypto" && (
                <div className="flex items-center">
                  <Bitcoin className="mr-2 h-4 w-4" />
                  <span>{method.details.currency} Wallet</span>
                </div>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Funds</CardTitle>
        <CardDescription>Add money to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (USD)</Label>
            <div className="flex items-center">
              <span className="mr-2 text-lg">$</span>
              <Input
                id="amount"
                type="number"
                min="10"
                value={amount}
                onChange={handleAmountChange}
                className="text-lg"
              />
            </div>
            <p className="text-sm text-muted-foreground">Minimum deposit: $10</p>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PaymentGateway)}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="stripe">Credit Card</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
              <TabsTrigger value="crypto">Crypto</TabsTrigger>
            </TabsList>

            <TabsContent value="stripe" className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Credit/Debit Card</h3>
                {renderPaymentMethodOptions()}
                <Button variant="outline" className="w-full mt-2">
                  <CreditCard className="mr-2 h-4 w-4" /> Add New Card
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="paypal" className="space-y-4">
              <div className="p-4 border rounded-md text-center">
                <p>You'll be redirected to PayPal to complete your deposit</p>
              </div>
            </TabsContent>

            <TabsContent value="crypto" className="space-y-4">
              <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                <div className="flex items-center space-x-2 border p-3 rounded-md">
                  <RadioGroupItem value="BTC" id="BTC" />
                  <Label htmlFor="BTC" className="flex-1">
                    <div className="flex items-center">
                      <Bitcoin className="mr-2 h-4 w-4" />
                      <span>Bitcoin (BTC)</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-md">
                  <RadioGroupItem value="ETH" id="ETH" />
                  <Label htmlFor="ETH" className="flex-1">
                    <div className="flex items-center">
                      <Bitcoin className="mr-2 h-4 w-4" />
                      <span>Ethereum (ETH)</span>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-md">
                  <RadioGroupItem value="USDT" id="USDT" />
                  <Label htmlFor="USDT" className="flex-1">
                    <div className="flex items-center">
                      <Bitcoin className="mr-2 h-4 w-4" />
                      <span>Tether (USDT)</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          size="lg"
          onClick={handleDeposit}
          disabled={isLoading || amount < 10 || (activeTab === "crypto" && !selectedMethod)}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            `Deposit ${formatCurrency(amount)}`
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

