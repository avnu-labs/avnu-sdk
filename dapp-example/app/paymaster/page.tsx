'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { parseUnits, formatUnits } from 'ethers';
import { useAccount } from '@starknet-react/core';
import { PaymasterRpc } from 'starknet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STRK, ETH } from '@/lib/tokens';
import { getQuotes, executeSwap, type Quote } from '@avnu/avnu-sdk';
import { getSourceUrl } from '@/lib/utils';

const SELL_AMOUNT = parseUnits('1', STRK.decimals);
const SLIPPAGE = 0.01; // 1 = 100%
const PAYMASTER_URL = 'https://starknet.paymaster.avnu.fi';

const paymasterRpc = new PaymasterRpc({ nodeUrl: PAYMASTER_URL });

export default function PaymasterPage() {
  const { account, address } = useAccount();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    getQuotes({
      sellTokenAddress: STRK.address,
      buyTokenAddress: ETH.address,
      sellAmount: SELL_AMOUNT,
      takerAddress: address,
    }).then((quotes) => setQuote(quotes[0] ?? null));
  }, [address]);

  const handleExecute = async () => {
    if (!account || !quote) return;
    setLoading(true);
    setTxHash(null);
    try {
      const result = await executeSwap({
        // @ts-expect-error - starknet version mismatch
        provider: account,
        quote,
        slippage: SLIPPAGE,
        paymaster: {
          active: true,
          provider: paymasterRpc,
          params: {
            version: '0x1',
            feeMode: { mode: 'default', gasToken: ETH.address },
          },
        },
      });
      setTxHash(result.transactionHash);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Paymaster</h1>
        <p className="text-muted-foreground">
          Gasless transactions - Pay gas with ETH •{' '}
          <a href={getSourceUrl('app/paymaster/page.tsx')} target="_blank" className="underline">
            View source
          </a>
        </p>
      </div>

      <div className="flex gap-6">
        <Card className="w-md">
          <CardHeader>
            <CardTitle>Transaction Flow</CardTitle>
            <CardDescription>
              Uses <code className="text-xs bg-muted px-1 rounded">executeSwap()</code> with
              paymaster
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
              <span className="font-medium">1 {STRK.symbol}</span>
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

            {txHash && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
                <p className="font-medium text-green-600">Swap executed!</p>
                <p className="text-xs text-muted-foreground break-all mt-1">Tx: {txHash}</p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleExecute}
              disabled={!account || !quote || loading}
            >
              {loading ? 'Executing...' : 'Execute Paymaster Swap'}
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Quote & Paymaster Info</CardTitle>
            <CardDescription>Current quote and fee configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!address ? (
              <p className="text-sm text-muted-foreground text-center py-8">Connect wallet</p>
            ) : !quote ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading quote...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quote</p>
                  <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sell Amount</span>
                      <span>1 STRK</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Buy Amount</span>
                      <span>
                        {parseFloat(formatUnits(quote.buyAmount, ETH.decimals)).toFixed(8)} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gas Fees (USD)</span>
                      <span>${quote.gasFeesInUsd?.toFixed(4) ?? '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Paymaster Config</p>
                  <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gas Token</span>
                      <span className="flex items-center gap-1">
                        <Image
                          src={ETH.logoUri!}
                          alt={ETH.symbol}
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                        ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fee Mode</span>
                      <span>default</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span>0x1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paymaster URL</span>
                      <span className="text-xs truncate max-w-[150px]">{PAYMASTER_URL}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            SDK Functions
            <a href={getSourceUrl('app/paymaster/page.tsx')} target="_blank" className="text-muted-foreground font-normal underline">
              View source
            </a>
          </CardTitle>
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
    </div>
  );
}
