'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STRK } from '@/lib/tokens';

export default function StakingPage() {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">Staking</h1>
        <p className="text-muted-foreground">Stake STRK tokens</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <img src={STRK.logoUri} alt={STRK.symbol} className="size-6 rounded-full" />
            STRK Staking
          </CardTitle>
          <CardDescription>
            Uses <code className="text-xs bg-muted px-1 rounded">executeStake()</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Staked</p>
              <p className="font-bold">0 STRK</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Rewards</p>
              <p className="font-bold">0 STRK</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">APR</p>
              <p className="font-bold">--%</p>
            </div>
          </div>

          <Tabs defaultValue="stake">
            <TabsList className="w-full">
              <TabsTrigger value="stake" className="flex-1">
                Stake
              </TabsTrigger>
              <TabsTrigger value="unstake" className="flex-1">
                Unstake
              </TabsTrigger>
            </TabsList>
            <TabsContent value="stake" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Amount to stake</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled>
                Stake STRK
              </Button>
            </TabsContent>
            <TabsContent value="unstake" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Amount to unstake</Label>
                <Input
                  type="number"
                  placeholder="0.0"
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                />
              </div>
              <Button className="w-full" disabled>
                Initiate Unstake
              </Button>
            </TabsContent>
          </Tabs>

          <Button variant="outline" className="w-full" disabled>
            Claim Rewards
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SDK Functions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <code>getAvnuStakingInfo()</code> - Get staking info
          </p>
          <p>
            <code>getUserStakingInfo(token, user)</code> - User staking info
          </p>
          <p>
            <code>executeStake(params)</code> - Stake tokens
          </p>
          <p>
            <code>executeInitiateUnstake(params)</code> - Start unstaking
          </p>
          <p>
            <code>executeUnstake(params)</code> - Complete unstaking
          </p>
          <p>
            <code>executeClaimRewards(params)</code> - Claim rewards
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
