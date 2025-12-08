'use client';

import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { Button } from '@/components/ui/button';

export function ConnectWallet() {
  const { address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (address) {
    return (
      <Button variant="outline" size="sm" onClick={() => disconnect()}>
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          variant="outline"
          size="sm"
          onClick={() => connect({ connector })}
        >
          {connector.name}
        </Button>
      ))}
    </div>
  );
}
