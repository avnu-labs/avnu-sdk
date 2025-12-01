'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { STRK, ETH } from '@/lib/tokens';

export default function DcaPage() {
  const [amountPerCycle, setAmountPerCycle] = useState('');
  const [repetitions, setRepetitions] = useState('7');
  const [frequency, setFrequency] = useState('86400'); // 1 day in seconds

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">DCA</h1>
        <p className="text-muted-foreground">Dollar Cost Averaging STRK → ETH</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create DCA Order</CardTitle>
          <CardDescription>
            Uses <code className="text-xs bg-muted px-1 rounded">executeCreateDca()</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <Image
              src={STRK.logoUri!}
              alt={STRK.symbol}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="font-medium">{STRK.symbol}</span>
            <span className="text-muted-foreground">→</span>
            <Image
              src={ETH.logoUri!}
              alt={ETH.symbol}
              width={20}
              height={20}
              className="rounded-full"
            />
            <span className="font-medium">{ETH.symbol}</span>
          </div>

          <div className="space-y-2">
            <Label>Amount per cycle</Label>
            <Input
              type="number"
              placeholder="10"
              value={amountPerCycle}
              onChange={(e) => setAmountPerCycle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Repetitions</Label>
              <Input
                type="number"
                placeholder="7"
                value={repetitions}
                onChange={(e) => setRepetitions(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <select
                className="w-full h-9 px-3 rounded-md border bg-transparent"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="3600">Hourly</option>
                <option value="86400">Daily</option>
                <option value="604800">Weekly</option>
              </select>
            </div>
          </div>

          <Button className="w-full" disabled>
            Create DCA Order
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SDK Functions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <code>getDcaOrders(params)</code> - Fetch DCA orders
          </p>
          <p>
            <code>createDcaToCalls(order)</code> - Build create calls
          </p>
          <p>
            <code>executeCreateDca(params)</code> - Execute creation
          </p>
          <p>
            <code>cancelDcaToCalls(address)</code> - Build cancel calls
          </p>
          <p>
            <code>executeCancelDca(params)</code> - Execute cancellation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
