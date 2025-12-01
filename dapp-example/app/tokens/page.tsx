'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function TokensPage() {
  const [search, setSearch] = useState('');

  // Mock loading state for demo
  const isLoading = false;
  const tokens: { address: string; symbol: string; name: string; logoUri?: string }[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tokens</h1>
        <p className="text-muted-foreground">Browse and search available tokens</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token List</CardTitle>
          <CardDescription>
            Uses <code className="text-xs bg-muted px-1 rounded">fetchTokens()</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name, symbol or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-md">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))
            ) : tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click &quot;Load Tokens&quot; to fetch token list
              </p>
            ) : (
              tokens.map((token) => (
                <div key={token.address} className="flex items-center gap-3 p-3 border rounded-md">
                  {token.logoUri && (
                    <Image
                      src={token.logoUri}
                      alt={token.symbol}
                      width={32}
                      height={32}
                      className="rounded-full"
                      unoptimized
                    />
                  )}
                  <div>
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-sm text-muted-foreground">{token.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button className="w-full" disabled>
            Load Tokens
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SDK Functions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <code>fetchTokens(request)</code> - Get tokens with pagination
          </p>
          <p>
            <code>fetchTokenByAddress(address)</code> - Get specific token
          </p>
          <p>
            <code>fetchVerifiedTokenBySymbol(symbol)</code> - Get verified token
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
