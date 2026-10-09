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

- **Swap**: Token exchange execution with optimized routing, including private swaps
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
  provider: account,
});
```

### Custom transaction fees

Direct swap, DCA, and staking executions accept Starknet.js `UniversalDetails`. With a Starknet.js `Account`, set
the tip explicitly while leaving resource bound estimation to Starknet.js:

```typescript
await executeSwap({
  quote: quotes[0],
  slippage: 0.01,
  provider: account,
  executionDetails: {
    tip: 0n, // FRI per L2 gas unit; a zero tip may delay inclusion during congestion
  },
});
```

The tip is charged per L2 gas unit used, in addition to resource fees. `resourceBounds` limit resource amounts and
their unit prices, but **do not cap the tip**. If you need bounds for the exact swap calls, build and estimate those
calls before executing them:

```typescript
import { quoteToCalls } from '@avnu/avnu-sdk';

const { calls } = await quoteToCalls({
  quoteId: quotes[0].quoteId,
  takerAddress: account.address,
  slippage: 0.01,
});
const { resourceBounds } = await account.estimateInvokeFee(calls);
await account.execute(calls, { tip: 0n, resourceBounds });
```

`resourceBounds` is a `ResourceBoundsBN` object with `l1_gas`, `l1_data_gas`, and `l2_gas` entries, each containing
`max_amount` and `max_price_per_unit`. `executionDetails` cannot be combined with an active paymaster. Starknet.js
10.4 `WalletAccount` ignores these details and leaves fee selection to the connected wallet.

## Documentation

For complete documentation, examples, and API reference, visit:

**[https://docs.avnu.fi/](https://docs.avnu.fi/)**

## Requirements

- Node.js >= 22
- Starknet.js >= 10.0.0
