# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

AVNU-SDK is a TypeScript SDK for building exchange functionality on Starknet Layer 2 with the AVNU API. It provides swap execution, DCA (Dollar Cost Averaging) orders, token information, and paymaster transaction support.

## Development Commands

### Build
```bash
yarn build              # Full build: CJS, ESM, IIFE, and type definitions
yarn start              # Build with watch mode for development
yarn build:esm          # Build ESM format only
yarn build:iife         # Build IIFE format for browsers
yarn build:dts          # Build type definitions only
```

### Testing
```bash
yarn test               # Run all tests with Jest
yarn test:watch         # Run tests in watch mode
```

### Linting
```bash
yarn lint               # Type check and lint
yarn lint:fix           # Type check, format with Prettier, and fix lint issues
```

### Bundle Analysis
```bash
yarn size               # Check bundle size against limits
yarn analyze            # Analyze bundle with size-limit
```

## Architecture

### Core Services

The SDK is organized into service modules that map to AVNU API endpoints:

1. **swap.services.ts** - Core swap functionality
   - `fetchPrices()`: Get prices from DEXs without path optimization
   - `fetchQuotes()`: Get optimized quotes from on-chain and off-chain liquidity
   - `quoteToCalls()`: Build Starknet calls from a quote
   - `executeSwap()`: Execute swap with optional gasless/paymaster support
   - `fetchSources()`: Get available liquidity sources

2. **dca.services.ts** - Dollar Cost Averaging orders
   - `createOrder()`: Create DCA order
   - `closeOrder()`: Close existing DCA order
   - `estimateFees()`: Estimate gas fees for DCA operations
   - `fetchOrders()`: Retrieve user's DCA orders
   - Common pattern: Supports both regular and gasless/gasfree execution modes

3. **token.services.ts** - Token information
   - `fetchTokens()`: Get exchangeable tokens with filtering and pagination

4. **paymaster.services.ts** - Paymaster transaction handling
   - `buildPaymasterTransaction()`: Build transaction for paymaster
   - `signPaymasterTransaction()`: Sign typed data for paymaster
   - `executePaymasterTransaction()`: Execute paymaster transaction

### Type System

All types are defined in `types.ts`, including:
- API request/response types (`Quote`, `Price`, `Token`, `OrderReceipt`)
- Execution types (`InvokeSwapParams`, `ExecuteSwapOptions`, `PaymasterOptions`)
- BigInt conversion: API responses use hex strings that are converted to BigInt
- Paymaster support: Gasless and gasfree transaction options

### Utilities

`utils.ts` contains shared helpers:
- `getBaseUrl()`: Returns mainnet or sepolia API URL
- `parseResponse()`: Handles API responses with optional signature verification
- Request builders with abort signal support

### Constants

`constants.ts` defines API endpoints:
- `BASE_URL`: Production Starknet API
- `SEPOLIA_BASE_URL`: Sepolia testnet API

## Key Patterns

### BigInt Conversion
All amount fields (sellAmount, buyAmount, fees, etc.) are transmitted as hex strings but exposed as BigInt in the SDK. The conversion happens in the service layer.

### Gasless/Gasfree Execution
Many functions support gasless or gasfree execution via PaymasterOptions:
- `gasless`: User pays with alternative gas token (requires `gasTokenAddress` and `maxGasTokenAmount`)
- `gasfree`: AVNU covers gas fees (no additional params needed)
- When enabled, transactions use typed data + signature instead of direct execution

### Error Handling
- `ContractError` class for blockchain errors with revert information
- `RequestError` interface for API errors with messages

### Peer Dependencies
The SDK has peer dependencies that must be installed by consumers:
- `starknet`: ^7.5.0 (Starknet.js library)
- `ethers`: ^6.14.3 (BigNumber utilities)
- `moment`: ^2.30.1 (Date/time for DCA)
- `qs`: ^6.14.0 (Query string serialization)

## Testing

Tests use Jest with `fetch-mock` for API mocking. Test fixtures are in `fixtures.ts` with helper functions like `aQuote()`, `aPrice()`, etc.

Test file naming: `*.spec.ts`

## Build Output

The build produces multiple formats in the `dist/` directory:
- CommonJS (`index.js`)
- ESM (`index.mjs`)
- IIFE for browsers (`index.global.js`)
- TypeScript declarations (`index.d.ts`)

Build tool: `tsup` with configuration in `tsup.config.ts`

## Examples

The `examples/` directory contains integration examples:
- `starknetjs/`: Using SDK with Starknet.js
- `starknet-react/`: Using SDK with React and Starknet React
- `get-starknet/`: Using SDK with get-starknet wallet connector

## Node Version

Requires Node.js >= 22 (specified in package.json engines)