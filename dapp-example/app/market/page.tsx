'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STRK } from '@/lib/tokens';

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Data</h1>
        <p className="text-muted-foreground">STRK price feed and market insights</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image
              src={STRK.logoUri!}
              alt={STRK.symbol}
              width={24}
              height={24}
              className="rounded-full"
            />
            {STRK.symbol} Price Chart
          </CardTitle>
          <CardDescription>
            Uses <code className="text-xs bg-muted px-1 rounded">getPriceFeed()</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
            Price chart placeholder
          </div>
          <Button className="w-full" disabled>
            Load Price Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available SDK Functions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground mt-2">Market Data</p>
          <p>
            <code>getMarketData()</code> - Popular tokens with market data
          </p>
          <p>
            <code>getTokenMarketData(address)</code> - Specific token market data
          </p>
          <p>
            <code>getPrices(addresses)</code> - Batch price fetch
          </p>

          <p className="font-medium text-foreground mt-4">Price Feeds</p>
          <p>
            <code>getPriceFeed(address, props)</code> - Historical prices (LINE/CANDLE)
          </p>

          <p className="font-medium text-foreground mt-4">Volume Feeds</p>
          <p>
            <code>getVolumeByExchange(address, props)</code> - Volume by exchange
          </p>
          <p>
            <code>getExchangeVolumeFeed(address, props)</code> - Exchange volume series
          </p>
          <p>
            <code>getTransferVolumeFeed(address, props)</code> - Transfer volume series
          </p>

          <p className="font-medium text-foreground mt-4">TVL Feeds</p>
          <p>
            <code>getTVLByExchange(address, props)</code> - TVL by exchange
          </p>
          <p>
            <code>getExchangeTVLFeed(address, props)</code> - Exchange TVL series
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
