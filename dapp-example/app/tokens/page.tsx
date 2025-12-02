'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { fetchTokens, type Token } from '@avnu/avnu-sdk';

const FETCH_TOKENS_SIZE = 5;
export default function TokensPage() {
  const [search, setSearch] = useState('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(true);
      fetchTokens({ search: search || undefined, size: FETCH_TOKENS_SIZE })
        .then((page) => setTokens(page.content))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Tokens</h1>
        <p className="text-muted-foreground">Browse and search available tokens</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token List (first {tokens.length} tokens)</CardTitle>
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
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
            ) : tokens.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tokens found</p>
            ) : (
              tokens.map((token) => (
                <div key={token.address} className="flex items-center gap-3 p-3 border rounded-md">
                  {token.logoUri ? (
                    <Image
                      src={token.logoUri}
                      alt={token.symbol}
                      width={32}
                      height={32}
                      className="rounded-full"
                      unoptimized
                    />
                  ) : (
                    <div className="size-8 rounded-full bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-sm text-muted-foreground truncate">{token.name}</p>
                  </div>
                  <div className="flex gap-1">
                    {token.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
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
