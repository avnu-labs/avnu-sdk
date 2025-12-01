'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Area, AreaChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { STRK } from '@/lib/tokens';
import { getPriceFeed, FeedDateRange, FeedResolution, PriceFeedType, type SimplePriceData } from '@avnu/avnu-sdk';

const chartConfig = {
  price: { label: 'Price (USD)', color: 'hsl(var(--chart-1))' },
} satisfies ChartConfig;

export default function MarketPage() {
  const [priceData, setPriceData] = useState<SimplePriceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPriceFeed(STRK.address, {
      type: PriceFeedType.LINE,
      dateRange: FeedDateRange.ONE_WEEK,
      resolution: FeedResolution.HOURLY,
    })
      .then((data) => setPriceData(data as SimplePriceData[]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Data</h1>
        <p className="text-muted-foreground">STRK price feed and market insights</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image src={STRK.logoUri!} alt={STRK.symbol} width={24} height={24} className="rounded-full" />
            {STRK.symbol} Price Chart
          </CardTitle>
          <CardDescription>
            Uses <code className="text-xs bg-muted px-1 rounded">getPriceFeed()</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <AreaChart data={priceData}>
                <defs>
                  <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-price)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-price)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  minTickGap={50}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toFixed(3)}`}
                  domain={['auto', 'auto']}
                  width={60}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value) => [`$${Number(value).toFixed(4)}`, 'Price']}
                    />
                  }
                />
                <Area dataKey="value" type="monotone" fill="url(#fillPrice)" stroke="var(--color-price)" />
              </AreaChart>
            </ChartContainer>
          )}
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
