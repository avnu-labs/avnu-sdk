'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import moment from 'moment';
import { parseUnits, toBeHex } from 'ethers';
import { useAccount } from '@starknet-react/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STRK, ETH } from '@/lib/tokens';
import { executeCreateDca, getDcaOrders, type DcaOrder } from '@avnu/avnu-sdk';
import { getSourceUrl } from '@/lib/utils';

export default function DcaPage() {
  const { account, address } = useAccount();
  const [amountPerCycle, setAmountPerCycle] = useState('');
  const [repetitions, setRepetitions] = useState('7');
  const [frequency, setFrequency] = useState('86400');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<DcaOrder[]>([]);

  useEffect(() => {
    if (!address) return;
    getDcaOrders({ traderAddress: address }).then((page) => setOrders(page.content));
  }, [address]);

  const handleCreate = async () => {
    if (!account || !address || !amountPerCycle) return;
    setLoading(true);
    try {
      const amountPerCycleWei = toBeHex(parseUnits(amountPerCycle, STRK.decimals));
      const totalAmount = toBeHex(BigInt(amountPerCycleWei) * BigInt(repetitions));
      await executeCreateDca({
        // @ts-expect-error - account in this repo comes from main repo node-modules
        provider: account,
        order: {
          sellTokenAddress: STRK.address,
          buyTokenAddress: ETH.address,
          sellAmount: totalAmount,
          sellAmountPerCycle: amountPerCycleWei,
          frequency: moment.duration(Number(frequency), 'seconds'),
          pricingStrategy: {},
          traderAddress: address,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">DCA</h1>
        <p className="text-muted-foreground">
          Dollar Cost Averaging STRK → ETH •{' '}
          <a href={getSourceUrl('app/dca/page.tsx')} target="_blank" className="underline">
            View source
          </a>
        </p>
      </div>

      <div className="flex gap-6">
        <Card className="w-md">
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

            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!account || !amountPerCycle || loading}
            >
              {loading ? 'Creating...' : 'Create DCA Order'}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Your Orders</CardTitle>
            <CardDescription>
              Uses <code className="text-xs bg-muted px-1 rounded">getDcaOrders()</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!address ? (
              <p className="text-sm text-muted-foreground text-center py-8">Connect wallet</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 border rounded-md flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {order.executedTradesCount}/{order.iterations} trades
                    </span>
                    <Badge variant={order.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            SDK Functions
            <a href={getSourceUrl('app/dca/page.tsx')} target="_blank" className="text-muted-foreground font-normal underline">
              View source
            </a>
          </CardTitle>
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
