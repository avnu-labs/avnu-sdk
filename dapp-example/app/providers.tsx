'use client';

import { ReactNode } from 'react';
import { mainnet } from '@starknet-react/chains';
import { StarknetConfig, jsonRpcProvider, argent, braavos } from '@starknet-react/core';

const connectors = [argent(), braavos()];

function rpc() {
  return { nodeUrl: 'https://starknet-mainnet.public.blastapi.io' };
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StarknetConfig chains={[mainnet]} provider={jsonRpcProvider({ rpc })} connectors={connectors}>
      {children}
    </StarknetConfig>
  );
}
