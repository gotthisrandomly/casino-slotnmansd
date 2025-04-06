import { DepositForm } from "@/components/deposit-form"
import { WithdrawForm } from "@/components/withdraw-form"
import { TransactionHistory } from "@/components/transaction-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function WalletPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Tabs defaultValue="deposit">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="deposit">
              <DepositForm />
            </TabsContent>
            <TabsContent value="withdraw">
              <WithdrawForm />
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <TransactionHistory />
        </div>
      </div>
    </div>
  )
}

