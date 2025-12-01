'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { parseUnits, formatUnits } from 'ethers';
import { useAccount } from '@starknet-react/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { STRK } from '@/lib/tokens';
import {
  getAvnuStakingInfo,
  getUserStakingInfo,
  executeStake,
  executeInitiateUnstake,
  executeClaimRewards,
  type StakingInfo,
  type UserStakingInfo,
} from '@avnu/avnu-sdk';

export default function StakingPage() {
  const { account, address } = useAccount();
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserStakingInfo | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [restake, setRestake] = useState(false);
  const [loading, setLoading] = useState(false);

  const poolAddress = stakingInfo?.delegationPools[0]?.poolAddress;
  const apr = stakingInfo?.delegationPools[0]?.apr;

  const fetchUserInfo = () => {
    if (!address || !poolAddress) return;
    getUserStakingInfo(poolAddress, address).then(setUserInfo);
  };

  useEffect(() => {
    getAvnuStakingInfo().then(setStakingInfo);
  }, []);

  useEffect(() => {
    fetchUserInfo();
  }, [address, poolAddress]);

  const handleStake = async () => {
    if (!account || !poolAddress || !stakeAmount) return;
    setLoading(true);
    try {
      await executeStake({
        // @ts-expect-error - starknet version mismatch
        provider: account,
        poolAddress,
        amount: parseUnits(stakeAmount, STRK.decimals),
      });
      setStakeAmount('');
      fetchUserInfo();
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateUnstake = async () => {
    if (!account || !poolAddress || !unstakeAmount) return;
    setLoading(true);
    try {
      await executeInitiateUnstake({
        // @ts-expect-error - starknet version mismatch
        provider: account,
        poolAddress,
        amount: parseUnits(unstakeAmount, STRK.decimals),
      });
      setUnstakeAmount('');
      fetchUserInfo();
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!account || !poolAddress) return;
    setLoading(true);
    try {
      await executeClaimRewards({
        // @ts-expect-error - starknet version mismatch
        provider: account,
        poolAddress,
        restake,
      });
      fetchUserInfo();
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: bigint) => parseFloat(formatUnits(amount, STRK.decimals)).toFixed(2);

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-bold">Staking</h1>
        <p className="text-muted-foreground">Stake STRK tokens</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image src={STRK.logoUri!} alt={STRK.symbol} width={24} height={24} className="rounded-full" />
            STRK Staking
          </CardTitle>
          <CardDescription>
            Uses <code className="text-xs bg-muted px-1 rounded">getAvnuStakingInfo()</code> +{' '}
            <code className="text-xs bg-muted px-1 rounded">getUserStakingInfo()</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Staked</p>
              <p className="font-bold">{userInfo ? formatAmount(userInfo.amount) : '0'} STRK</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">Rewards</p>
              <p className="font-bold">{userInfo ? formatAmount(userInfo.unclaimedRewards) : '0'} STRK</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">APR</p>
              <p className="font-bold">{apr ? `${apr.toFixed(1)}%` : '--%'}</p>
            </div>
          </div>

          <Tabs defaultValue="stake">
            <TabsList className="w-full">
              <TabsTrigger value="stake" className="flex-1">Stake</TabsTrigger>
              <TabsTrigger value="unstake" className="flex-1">Unstake</TabsTrigger>
            </TabsList>
            <TabsContent value="stake" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Amount to stake</Label>
                <Input type="number" placeholder="0.0" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleStake} disabled={!account || !stakeAmount || loading}>
                {loading ? 'Staking...' : 'Stake STRK'}
              </Button>
            </TabsContent>
            <TabsContent value="unstake" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Amount to unstake</Label>
                <Input type="number" placeholder="0.0" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleInitiateUnstake} disabled={!account || !unstakeAmount || loading}>
                {loading ? 'Processing...' : 'Initiate Unstake'}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <Switch id="restake" checked={restake} onCheckedChange={setRestake} />
              <Label htmlFor="restake" className="text-sm">Restake rewards</Label>
            </div>
            <Button variant="outline" onClick={handleClaimRewards} disabled={!account || !userInfo?.unclaimedRewards || loading}>
              Claim Rewards
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">SDK Functions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p><code>getAvnuStakingInfo()</code> - Get staking info</p>
          <p><code>getUserStakingInfo(token, user)</code> - User staking info</p>
          <p><code>executeStake(params)</code> - Stake tokens</p>
          <p><code>executeInitiateUnstake(params)</code> - Start unstaking</p>
          <p><code>executeUnstake(params)</code> - Complete unstaking</p>
          <p><code>executeClaimRewards(params)</code> - Claim rewards</p>
        </CardContent>
      </Card>
    </div>
  );
}
