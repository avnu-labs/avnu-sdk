'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymasterPage() {
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Paymaster</h1>
        <p className="text-muted-foreground">Gasless and gasfree transactions</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gasless</CardTitle>
            <CardDescription>Pay gas with any token</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            User pays gas fees using an alternative token (e.g., USDC instead of ETH).
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gasfree</CardTitle>
            <CardDescription>No gas fees at all</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Protocol sponsors the transaction. User pays nothing for gas.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Flow</CardTitle>
          <CardDescription>
            Uses <code className="text-xs bg-muted px-1 rounded">executeAllPaymasterFlow()</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Build Transaction</p>
                <p className="text-sm text-muted-foreground">
                  <code>buildPaymasterTransaction()</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Sign Typed Data</p>
                <p className="text-sm text-muted-foreground">
                  <code>signPaymasterTransaction()</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Execute</p>
                <p className="text-sm text-muted-foreground">
                  <code>executePaymasterTransaction()</code>
                </p>
              </div>
            </div>
          </div>

          <Button className="w-full" disabled>
            Demo Paymaster Flow
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SDK Functions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <code>buildPaymasterTransaction(params)</code> - Prepare transaction
          </p>
          <p>
            <code>signPaymasterTransaction(params)</code> - Sign typed data
          </p>
          <p>
            <code>executePaymasterTransaction(params)</code> - Submit transaction
          </p>
          <p>
            <code>executeAllPaymasterFlow(params)</code> - All-in-one helper
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Integration with Other Services</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Paymaster can be used with <code>executeSwap()</code>, <code>executeCreateDca()</code>,
            and <code>executeStake()</code> by passing <code>paymaster</code> options.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
