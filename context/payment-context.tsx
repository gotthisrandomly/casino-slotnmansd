"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { toast } from "@/components/ui/use-toast"
import { loadStripe } from "@stripe/stripe-js"
import type { PaymentMethod, Transaction, PaymentGateway } from "@/types/payment"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "")

interface PaymentContextType {
  isLoading: boolean
  paymentMethods: PaymentMethod[]
  transactions: Transaction[]
  addPaymentMethod: (method: Omit<PaymentMethod, "id">) => Promise<boolean>
  removePaymentMethod: (id: string) => Promise<boolean>
  deposit: (amount: number, gateway: PaymentGateway, methodId?: string) => Promise<boolean>
  withdraw: (amount: number, gateway: PaymentGateway, methodId?: string) => Promise<boolean>
  getTransactions: () => Promise<Transaction[]>
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUserBalance } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Load payment methods when user changes
  useEffect(() => {
    if (user) {
      fetchPaymentMethods()
      fetchTransactions()
    } else {
      setPaymentMethods([])
      setTransactions([])
    }
  }, [user])

  const fetchPaymentMethods = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/payments/methods?userId=${user.id}`)
      if (!response.ok) throw new Error("Failed to fetch payment methods")

      const data = await response.json()
      setPaymentMethods(data)
    } catch (error) {
      console.error("Error fetching payment methods:", error)
      toast({
        title: "Error",
        description: "Failed to load payment methods",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTransactions = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/payments/transactions?userId=${user.id}`)
      if (!response.ok) throw new Error("Failed to fetch transactions")

      const data = await response.json()
      setTransactions(data)
    } catch (error) {
      console.error("Error fetching transactions:", error)
    }
  }

  const addPaymentMethod = async (method: Omit<PaymentMethod, "id">): Promise<boolean> => {
    if (!user) return false

    try {
      setIsLoading(true)
      const response = await fetch("/api/payments/methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...method, userId: user.id }),
      })

      if (!response.ok) throw new Error("Failed to add payment method")

      await fetchPaymentMethods()
      toast({
        title: "Success",
        description: "Payment method added successfully",
      })
      return true
    } catch (error) {
      console.error("Error adding payment method:", error)
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const removePaymentMethod = async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      setIsLoading(true)
      const response = await fetch(`/api/payments/methods/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to remove payment method")

      await fetchPaymentMethods()
      toast({
        title: "Success",
        description: "Payment method removed successfully",
      })
      return true
    } catch (error) {
      console.error("Error removing payment method:", error)
      toast({
        title: "Error",
        description: "Failed to remove payment method",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const deposit = async (amount: number, gateway: PaymentGateway, methodId?: string): Promise<boolean> => {
    if (!user) return false

    try {
      setIsLoading(true)

      // Different handling based on gateway
      let response

      switch (gateway) {
        case "stripe":
          // Create a Stripe checkout session
          response = await fetch("/api/payments/deposit/stripe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, userId: user.id, methodId }),
          })

          if (!response.ok) throw new Error("Failed to create Stripe checkout")

          const { sessionId } = await response.json()
          const stripe = await stripePromise

          // Redirect to Stripe checkout
          if (stripe) {
            const { error } = await stripe.redirectToCheckout({ sessionId })
            if (error) throw error
          }

          return true

        case "paypal":
          response = await fetch("/api/payments/deposit/paypal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, userId: user.id }),
          })

          if (!response.ok) throw new Error("Failed to create PayPal checkout")

          const { redirectUrl } = await response.json()
          window.location.href = redirectUrl
          return true

        case "crypto":
          response = await fetch("/api/payments/deposit/crypto", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, userId: user.id, currency: methodId }),
          })

          if (!response.ok) throw new Error("Failed to create crypto deposit")

          const cryptoData = await response.json()
          // Show crypto payment modal with address and amount
          toast({
            title: "Crypto Deposit",
            description: `Send ${cryptoData.cryptoAmount} ${cryptoData.currency} to ${cryptoData.address}`,
            duration: 10000,
          })
          return true

        default:
          // Direct deposit (for demo/testing)
          response = await fetch("/api/payments/deposit/direct", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, userId: user.id, gateway }),
          })

          if (!response.ok) throw new Error(`Failed to process ${gateway} deposit`)

          const result = await response.json()

          if (result.success) {
            // Update user balance
            updateUserBalance(result.newBalance)

            toast({
              title: "Deposit Successful",
              description: `$${amount.toFixed(2)} has been added to your account`,
            })

            await fetchTransactions()
            return true
          }

          throw new Error(result.message || "Deposit failed")
      }
    } catch (error) {
      console.error("Error processing deposit:", error)
      toast({
        title: "Deposit Failed",
        description: error instanceof Error ? error.message : "Failed to process deposit",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const withdraw = async (amount: number, gateway: PaymentGateway, methodId?: string): Promise<boolean> => {
    if (!user) return false

    try {
      setIsLoading(true)

      // Check if user has sufficient balance
      if (user.balance < amount) {
        toast({
          title: "Insufficient Balance",
          description: "You don't have enough funds to withdraw this amount",
          variant: "destructive",
        })
        return false
      }

      const response = await fetch("/api/payments/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, userId: user.id, gateway, methodId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Withdrawal failed")
      }

      const result = await response.json()

      // Update user balance
      updateUserBalance(result.newBalance)

      toast({
        title: "Withdrawal Requested",
        description: `Your withdrawal of $${amount.toFixed(2)} is being processed`,
      })

      await fetchTransactions()
      return true
    } catch (error) {
      console.error("Error processing withdrawal:", error)
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "Failed to process withdrawal",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const getTransactions = async (): Promise<Transaction[]> => {
    await fetchTransactions()
    return transactions
  }

  return (
    <PaymentContext.Provider
      value={{
        isLoading,
        paymentMethods,
        transactions,
        addPaymentMethod,
        removePaymentMethod,
        deposit,
        withdraw,
        getTransactions,
      }}
    >
      {children}
    </PaymentContext.Provider>
  )
}

export function usePayment() {
  const context = useContext(PaymentContext)
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider")
  }
  return context
}

