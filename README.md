<p align="center">
  <a href="https://www.avnu.fi">
    <img alt="avnu" src="assets/avnu-logo.svg" width="300">
  </a>
</p>

<p align="center">TypeScript SDK for building with avnu functionality on Starknet</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@avnu/avnu-sdk">
    <img src='https://img.shields.io/npm/v/@avnu/avnu-sdk' />
  </a>
  <a href="https://bundlephobia.com/package/@avnu/avnu-sdk">
    <img src='https://img.shields.io/bundlephobia/minzip/@avnu/avnu-sdk?color=success&label=size' />
  </a>
  <a href="https://www.npmjs.com/package/@avnu/avnu-sdk">
    <img src='https://img.shields.io/npm/dt/@avnu/avnu-sdk?color=blueviolet' />
  </a>
  <a href="https://github.com/avnu-labs/avnu-sdk/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-black">
  </a>
  <a href="https://github.com/avnu-labs/avnu-sdk/stargazers">
    <img src='https://img.shields.io/github/stars/avnu-labs/avnu-sdk?color=yellow' />
  </a>
  <a href="https://x.com/avnu_fi">
    <img src="https://img.shields.io/badge/follow_us-Twitter-blue">
  </a>

</p>

<p align="center">
  <a href="https://docs.avnu.fi">Documentation</a> •
  <a href="https://www.avnu.fi">Website</a> •
  <a href="https://x.com/avnu_fi">Twitter</a>
</p>

## Features

- **Swap**: Token exchange execution with optimized routing
- **DCA (Dollar Cost Averaging)**: Automated recurring orders
- **Staking**: AVNU token staking and rewards management
- **Market Data**: Real-time prices, volumes, TVL and market feeds
- **Paymaster**: Gasless and gasfree transaction support
- **Token Information**: Comprehensive token metadata

## Installation

```bash
// Using npm
npm install @avnu/avnu-sdk

// or yarn 
yarn add @avnu/avnu-sdk
```

## Quick Start

```typescript
import { getQuotes, executeSwap } from '@avnu/avnu-sdk';

const quotes = await getQuotes({
  sellTokenAddress: '0x...',
  buyTokenAddress: '0x...',
  sellAmount: 1000000n,
  takerAddress: account.address,
});

await executeSwap({
  quote: quotes[0],
  slippage: 0.01, // 1%
  account,
});
```

## Documentation

For complete documentation, examples, and API reference, visit:

**[https://docs.avnu.fi/](https://docs.avnu.fi/)**

## Requirements

- Node.js >= 22
- Starknet.js >= 8.9.0

