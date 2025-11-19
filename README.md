# AVNU SDK

TypeScript SDK for building exchange functionality on Starknet Layer 2 with the AVNU API.

## Features

- **Swap**: Token exchange execution with optimized routing
- **DCA (Dollar Cost Averaging)**: Automated recurring orders
- **Staking**: AVNU token staking and rewards management
- **Market Data**: Real-time prices, volumes, TVL and market feeds
- **Paymaster**: Gasless and gasfree transaction support
- **Token Information**: Comprehensive token metadata

## Installation

```bash
npm install @avnu/avnu-sdk
```

or

```bash
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
  slippage: 100, // 1%
  account,
});
```

## Documentation

For complete documentation, examples, and API reference, visit:

**[https://doc.avnu.fi/](https://doc.avnu.fi/)**

## Examples

Check out the [`/examples`](/examples) folder for integration examples with:
- Starknet.js
- Starknet React
- get-starknet

## Requirements

- Node.js >= 22
- Starknet.js >= 8.9.0

## License

MIT
