'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { STRK, ETH } from '@/lib/tokens';

export default function SwapPage() {
  const [amount, setAmount] = useState('');

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">Swap</h1>
        <p className="text-muted-foreground">Exchange STRK for ETH</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Swap STRK → ETH</CardTitle>
          <CardDescription>
            Uses <code className="text-xs bg-muted px-1 rounded">getQuotes()</code> and{' '}
            <code className="text-xs bg-muted px-1 rounded">executeSwap()</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>You sell</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                <img src={STRK.logoUri} alt={STRK.symbol} className="size-5 rounded-full" />
                <span className="font-medium">{STRK.symbol}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>You receive</Label>
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="0.0" disabled />
              <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
                <img src={ETH.logoUri} alt={ETH.symbol} className="size-5 rounded-full" />
                <span className="font-medium">{ETH.symbol}</span>
              </div>
            </div>
          </div>

          <Button className="w-full" disabled>
            Get Quote
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SDK Functions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <code>getSources()</code> - Get available liquidity sources
          </p>
          <p>
            <code>getQuotes(request)</code> - Get optimized quotes
          </p>
          <p>
            <code>quoteToCalls(params)</code> - Build Starknet calls
          </p>
          <p>
            <code>executeSwap(params)</code> - Execute the swap
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
