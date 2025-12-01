'use client';

import { useState } from 'react';
import Image from 'next/image';
import { parseUnits, formatUnits } from 'ethers';
import { useAccount } from '@starknet-react/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { STRK, ETH } from '@/lib/tokens';
import { getQuotes, executeSwap, type Quote } from '@avnu/avnu-sdk';

const SLIPPAGE = 100; // 1% = 100 bps

export default function SwapPage() {
  const { account, address } = useAccount();
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetQuote = async () => {
    if (!amount || !address) return;
    setIsLoading(true);
    setError(null);
    setQuote(null);
    setTxHash(null);

    try {
      const sellAmount = parseUnits(amount, STRK.decimals);
      const quotes = await getQuotes({
        sellTokenAddress: STRK.address,
        buyTokenAddress: ETH.address,
        sellAmount,
        takerAddress: address,
      });
      if (quotes.length > 0) {
        setQuote(quotes[0]);
      } else {
        setError('No quotes available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get quote');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteSwap = async () => {
    if (!account || !quote) return;
    setIsExecuting(true);
    setError(null);

    try {
      const result = await executeSwap({
        provider: account as unknown as Parameters<typeof executeSwap>[0]['provider'],
        quote,
        slippage: SLIPPAGE,
      });
      setTxHash(result.transactionHash);
      setQuote(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const formatBuyAmount = () => {
    if (!quote) return '0.0';
    return formatUnits(quote.buyAmount, ETH.decimals);
  };

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
                className="flex-1"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                <Image
                  src={STRK.logoUri!}
                  alt={STRK.symbol}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="font-medium">{STRK.symbol}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>You receive</Label>
            <div className="flex items-center gap-2">
              <Input
                className="flex-1"
                type="number"
                placeholder="0.0"
                value={formatBuyAmount()}
                disabled
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
                <Image
                  src={ETH.logoUri!}
                  alt={ETH.symbol}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="font-medium">{ETH.symbol}</span>
              </div>
            </div>
          </div>

          {quote && (
            <div className="p-3 bg-muted/50 rounded-md text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price impact</span>
                <span>{(quote.priceImpact * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gas fees</span>
                <span>${quote.gasFeesInUsd?.toFixed(4) ?? '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slippage</span>
                <span>{SLIPPAGE / 100}%</span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          {txHash && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
              <p className="font-medium text-green-600">Swap executed!</p>
              <p className="text-xs text-muted-foreground break-all mt-1">Tx: {txHash}</p>
            </div>
          )}

          {!address ? (
            <Button className="w-full" disabled>
              Connect Wallet
            </Button>
          ) : !quote ? (
            <Button className="w-full" onClick={handleGetQuote} disabled={isLoading || !amount}>
              {isLoading ? 'Getting Quote...' : 'Get Quote'}
            </Button>
          ) : (
            <Button className="w-full" onClick={handleExecuteSwap} disabled={isExecuting}>
              {isExecuting ? 'Executing...' : 'Execute Swap'}
            </Button>
          )}
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
