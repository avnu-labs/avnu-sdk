# CLAUDE.md

This file provides detailed guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**AVNU SDK** is a TypeScript SDK for building exchange functionality on Starknet Layer 2 with the AVNU API. It provides:

- **Swap**: Token exchange execution with route optimization
- **DCA (Dollar Cost Averaging)**: Automated recurring purchase orders
- **Staking**: AVNU stake delegation and management
- **Market Data (Impulse)**: Prices, volumes, TVL, market data feeds
- **Token Information**: Token metadata and information
- **Paymaster**: Gasless and gasfree transaction support

## Development Commands

### Build
```bash
yarn build              # Full build: CJS, ESM, IIFE, and type definitions
yarn start              # Build with watch mode for development
yarn build:esm          # Build ESM format only
yarn build:iife         # Build IIFE format for browsers
yarn build:dts          # Build TypeScript definitions only
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

### Source File Structure

```
src/
├── index.ts              # Entry point, exports all modules
├── constants.ts          # API URLs and version constants
├── enums.ts              # Enumerations (FeedDateRange, PriceFeedType, etc.)
├── types.ts              # Complete TypeScript definitions
├── schemas.ts            # Zod schemas with transformers
├── utils.ts              # Shared utilities
├── swap.services.ts      # Swap service
├── dca.services.ts       # DCA service
├── token.services.ts     # Token service
├── paymaster.services.ts # Paymaster service
├── impulse.services.ts   # Market data service
├── staking.services.ts   # Staking service
├── fixtures.ts           # Test fixtures
├── test-utils.ts         # Shared test utilities (mocks, URL builders)
└── *.spec.ts             # Unit tests
```

### Services

The SDK is organized into **6 service modules** that map to AVNU API endpoints:

---

#### 1. **swap.services.ts** - Token Swaps

```typescript
getSources(options?: AvnuOptions): Promise<Source[]>
```
Get available liquidity sources (DEXs, market makers, orderbooks, token wrappers).

```typescript
getQuotes(request: QuoteRequest, options?: AvnuOptions): Promise<Quote[]>
```
Get best optimized quotes from on-chain and off-chain liquidity, sorted by best first.

```typescript
quoteToCalls(params: QuoteToCallsParams, options?: AvnuOptions): Promise<SwapCalls>
```
Build Starknet calls from a quote, including approval and slippage handling.

```typescript
executeSwap(params: InvokeSwapParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute a swap with optional paymaster support (gasless/gasfree).

**Slippage helpers:**
```typescript
calculateMinReceivedAmount(amount: bigint, slippage: number): bigint
calculateMaxSpendAmount(amount: bigint, slippage: number): bigint
```
Calculate min/max amounts with slippage (slippage in bps: 100 = 1%).

**Key types:**
- `QuoteRequest`: sellTokenAddress, buyTokenAddress, sellAmount, takerAddress, size
- `Quote`: routes, sellAmount, buyAmount, sellAmountInUsd, buyAmountInUsd, priceImpact, gasFeesInUsd
- `Route`: percent, sellAmount, buyAmount, routes (sub-routes)
- `SwapCalls`: calls, approvalCalls, contractAddress, calldata

---

#### 2. **dca.services.ts** - Dollar Cost Averaging

The DCA pattern separates **call construction** and **execution**:

**Fetching orders:**
```typescript
getDcaOrders(params: GetDcaOrdersParams, options?: AvnuOptions): Promise<Page<DcaOrder>>
```
Get DCA orders for a trader with pagination.

**Creating orders (2 methods):**
```typescript
createDcaToCalls(order: CreateDcaOrder, options?: AvnuOptions): Promise<Call[]>
```
Build calls to create a DCA order.

```typescript
executeCreateDca(params: InvokeCreateDcaParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute DCA order creation with paymaster support.

**Canceling orders (2 methods):**
```typescript
cancelDcaToCalls(orderAddress: string, options?: AvnuOptions): Promise<Call[]>
```
Build calls to cancel a DCA order.

```typescript
executeCancelDca(params: InvokeCancelDcaParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute cancellation with paymaster support.

**Key types:**
- `CreateDcaOrder`: sellTokenAddress, buyTokenAddress, sellAmountPerRepetition, repetitionCount, repetitionInterval, creatorAddress
- `DcaOrder`: orderAddress, creatorAddress, sellToken, buyToken, totalSellAmount, soldAmount, trades, status
- `DcaTrade`: sellAmount, buyAmount, timestamp, status (PENDING/SUCCEEDED/CANCELLED)
- `DcaOrderStatus`: INDEXING, ACTIVE, CLOSED
- `GetDcaOrdersParams`: traderAddress, limit?, offset?

---

#### 3. **token.services.ts** - Token Information

```typescript
fetchTokens(request?: GetTokensRequest, options?: AvnuOptions): Promise<Page<Token>>
```
Get exchangeable tokens with pagination, search, and tag filtering.

```typescript
fetchTokenByAddress(tokenAddress: string, options?: AvnuOptions): Promise<Token>
```
Get a specific token by its address.

```typescript
fetchVerifiedTokenBySymbol(symbol: string, options?: AvnuOptions): Promise<Token | undefined>
```
Get a verified or "unruggable" token by its symbol.

**Key types:**
- `Token`: address, chainId, decimals, name, symbol, tags, logoUri, usdPrice
- `GetTokensRequest`: limit?, offset?, search?, tags?
- `Page<T>`: content, totalElements, totalPages, size, page, hasNext

---

#### 4. **paymaster.services.ts** - Gasless/Gasfree Transactions

Complete workflow for paymaster transactions:

```typescript
buildPaymasterTransaction(params: BuildPaymasterTransactionParams, options?: AvnuOptions): Promise<PreparedInvokeTransaction>
```
Build a transaction for the paymaster.

```typescript
signPaymasterTransaction(params: SignPaymasterTransactionParams, options?: AvnuOptions): Promise<SignedPaymasterTransaction>
```
Sign typed data for the paymaster.

```typescript
executePaymasterTransaction(params: ExecutePaymasterTransactionParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute the signed paymaster transaction.

```typescript
executeAllPaymasterFlow(params: ExecuteAllPaymasterFlowParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Helper that chains build -> sign -> execute in a single function.

**Key types:**
- `PreparedInvokeTransaction`: contractAddress, entrypoint, calldata, typedDataMessage
- `SignedPaymasterTransaction`: signature, typedDataMessage
- `PaymasterOptions`: gasless (with gasTokenAddress + maxGasTokenAmount) | gasfree

---

#### 5. **impulse.services.ts** - Market Data and Price Feeds

Dedicated market data service (uses `IMPULSE_BASE_URL` instead of `BASE_URL`).

**General market data:**
```typescript
getMarketData(options?: AvnuOptions): Promise<TokenMarketData[]>
```
Get popular tokens on Starknet with their market data.

```typescript
getTokenMarketData(tokenAddress: string, options?: AvnuOptions): Promise<TokenMarketData>
```
Get market data for a specific token.

**Price feeds:**
```typescript
getPriceFeed(
  tokenAddress: string,
  feedProps: PriceFeedProps,
  quoteTokenAddress?: string,
  options?: AvnuOptions
): Promise<SimplePriceData[] | CandlePriceData[]>
```
Get price feed (LINE or CANDLE) for a token.

```typescript
getPrices(tokenAddresses: string[], options?: AvnuOptions): Promise<TokenPriceResponse>
```
Get market prices for a list of tokens.

**Volume feeds:**
```typescript
getVolumeByExchange(tokenAddress: string, simpleProps: SimpleFeedProps, options?: AvnuOptions): Promise<ByExchangeVolumeData[]>
```
Volume by exchange for a date range.

```typescript
getExchangeVolumeFeed(tokenAddress: string, feedProps: FeedProps, options?: AvnuOptions): Promise<SimpleVolumeData[]>
```
Exchange volume feed data.

```typescript
getTransferVolumeFeed(tokenAddress: string, feedProps: FeedProps, options?: AvnuOptions): Promise<SimpleVolumeData[]>
```
Transfer volume feed data.

**TVL feeds:**
```typescript
getTVLByExchange(tokenAddress: string, simpleProps: SimpleFeedProps, options?: AvnuOptions): Promise<ByExchangeTVLData[]>
```
TVL by exchange for a date range.

```typescript
getExchangeTVLFeed(tokenAddress: string, feedProps: FeedProps, options?: AvnuOptions): Promise<SimpleVolumeData[]>
```
Exchange TVL feed data.

**Key types:**
- `TokenMarketData`: position, symbol, address, price, marketCap, volume24h, tvl, priceChange24h, allTimeHigh, allTimeLow
- `PriceFeedProps`: type (LINE/CANDLE), dateRange, resolution
- `FeedDateRange`: ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR
- `FeedResolution`: 1, 5, 15, 1H, 4H, 1D, 1W, 1M, 1Y
- `SimplePriceData`: timestamp, price
- `CandlePriceData`: timestamp, open, high, low, close, volume

---

#### 6. **staking.services.ts** - AVNU Staking

Similar pattern to DCA: separation of **build** and **execute**.

**Fetching information:**
```typescript
getAvnuStakingInfo(options?: AvnuOptions): Promise<StakingInfo>
```
Get AVNU staking information (self-staked amount, pools, commission).

```typescript
getUserStakingInfo(
  tokenAddress: string,
  userAddress: string,
  options?: AvnuOptions
): Promise<UserStakingInfo>
```
Get staking information for a specific user (amount, rewards, history).

**Staking (2 methods):**
```typescript
stakeToCalls(params: StakeToCallsParams, options?: AvnuOptions): Promise<Call[]>
```
Build calls for staking.

```typescript
executeStake(params: InvokeStakeParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute staking with paymaster support.

**Initiate Unstake (2 methods):**
```typescript
initiateUnstakeToCalls(params: StakeToCallsParams, options?: AvnuOptions): Promise<Call[]>
```
Build calls to initiate unstaking (starts cool-down period).

```typescript
executeInitiateUnstake(params: InvokeInitiateUnstakeParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute unstake initiation.

**Unstake (2 methods):**
```typescript
unstakeToCalls(params: UnstakeToCallsParams, options?: AvnuOptions): Promise<Call[]>
```
Build calls for unstaking (after cool-down).

```typescript
executeUnstake(params: InvokeUnstakeParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute unstaking.

**Claim Rewards (2 methods):**
```typescript
claimRewardsToCalls(params: ClaimRewardsToCallsParams, options?: AvnuOptions): Promise<Call[]>
```
Build calls to claim rewards.

```typescript
executeClaimRewards(params: InvokeClaimRewardsParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute rewards claiming.

**Key types:**
- `StakingInfo`: selfStakedAmount, operationalAddress, operationalSignerPubKey, unclaimedRewards, poolMembersCount, delegationPools
- `DelegationPool`: poolAddress, tokenAddress, delegatedAmount, apr
- `UserStakingInfo`: amount, unclaimedRewards, claimedRewards, unpoolingInfo, unpooledAmount, actionsHistory, aprHistory
- `Action`: id, index, type (Swap/Refund/DCA/Stake/Unstake/ClaimRewards/InitiateUnstake), timestamp, metadata
- `Apr`: date, apr

---

### Enumerations (enums.ts)

```typescript
export enum FeedDateRange {
  ONE_HOUR = '1H',
  ONE_DAY = '1D',
  ONE_WEEK = '1W',
  ONE_MONTH = '1M',
  ONE_YEAR = '1Y',
}

export enum PriceFeedType {
  LINE = 'LINE',
  CANDLE = 'CANDLE',
}

export enum VolumeFeedType {
  LINE = 'LINE',
  BAR = 'BAR',
}

export enum FeedResolution {
  ONE_MIN = '1',
  FIVE_MIN = '5',
  FIFTEEN_MIN = '15',
  HOURLY = '1H',
  FOUR_HOUR = '4H',
  DAILY = '1D',
  WEEKLY = '1W',
  MONTHLY = '1M',
  YEARLY = '1Y',
}

export enum SourceType {
  DEX = 'DEX',
  MARKET_MAKER = 'MARKET_MAKER',
  TOKEN_WRAPPER = 'TOKEN_WRAPPER',
  ORDERBOOK = 'ORDERBOOK',
}

export enum DcaTradeStatus {
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
}

export enum DcaOrderStatus {
  INDEXING = 'INDEXING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}
```

### Type System (types.ts)

The `types.ts` file contains all TypeScript definitions:

**Main categories:**
- **API Requests/Responses**: `Quote`, `Price`, `Token`, `OrderReceipt`, `Page<T>`
- **Execution types**: `InvokeSwapParams`, `InvokeCreateDcaParams`, `ExecuteSwapOptions`, `PaymasterOptions`
- **Market Data**: `TokenMarketData`, `PriceData`, `VolumeData`, `FeedProps`
- **Staking**: `StakingInfo`, `UserStakingInfo`, `Action`, `Apr`
- **Options**: `AvnuOptions` (baseUrl, sepoliaNetwork, signal, avnuPublicKey)

**Important convention:** All amount fields (sellAmount, buyAmount, fees, etc.) are exposed as **BigInt** in the SDK, even though they are transmitted as **hex strings** by the API.

### Zod Validation (schemas.ts)

The SDK uses **Zod** for runtime validation and data transformation:

**Custom transformers:**
```typescript
hexToBigInt         // Converts "0x..." to BigInt
isoStringToDate     // Converts ISO string to Date
hexTimestampToDate  // Converts hex timestamp to Date
```

**Pattern:**
```typescript
const TokenSchema = z.object({...}).transform(...) satisfies z.ZodType<Token>
```

Each schema:
1. Validates API data structure
2. Transforms types (hex -> BigInt, ISO -> Date)
3. Guarantees consistency with TypeScript types via `satisfies`

**Usage:**
```typescript
parseResponseWithSchema<T>(response, schema, avnuPublicKey?)
```

### Utilities (utils.ts)

**URLs:**
```typescript
getBaseUrl(options?: AvnuOptions): string
```
Returns `BASE_URL` (mainnet) or `SEPOLIA_BASE_URL` based on `options.sepoliaNetwork`.

```typescript
getImpulseBaseUrl(options?: AvnuOptions): string
```
Returns `IMPULSE_BASE_URL` or `SEPOLIA_IMPULSE_BASE_URL` for market data service.

**Response parsing:**
```typescript
parseResponse<T>(response: Response, avnuPublicKey?: string): Promise<T>
```
Parse JSON response with optional AVNU signature verification.

```typescript
parseResponseWithSchema<T>(response: Response, schema: z.ZodType<T>, avnuPublicKey?: string): Promise<T>
```
Parse with Zod validation and transformation.

**Request builders:**
```typescript
getRequest(options?: AvnuOptions): RequestInit
postRequest(body: object, options?: AvnuOptions): RequestInit
```
Build fetch options with abort signal support.

### Constants (constants.ts)

**Base URLs:**
```typescript
export const BASE_URL = 'https://starknet.api.avnu.fi'
export const SEPOLIA_BASE_URL = 'https://sepolia.api.avnu.fi'
export const IMPULSE_BASE_URL = 'https://starknet.impulse.avnu.fi'
export const SEPOLIA_IMPULSE_BASE_URL = 'https://sepolia.impulse.avnu.fi'
```

**API Version Constants:**
```typescript
export const TOKEN_API_VERSION = 'v1'
export const IMPULSE_API_VERSION = 'v1'
export const SWAP_API_VERSION = 'v3'
export const PRICES_API_VERSION = 'v3'
export const STAKING_API_VERSION = 'v3'
export const DCA_API_VERSION = 'v3'
```

## Key Patterns

### 1. BigInt Conversion

All amount fields (sellAmount, buyAmount, fees, etc.):
- **API transmission**: hex strings (`"0x1234..."`)
- **SDK exposure**: BigInt
- **Conversion**: Automatic via Zod schemas with `hexToBigInt`

### 2. Build/Execute Pattern

DCA and Staking services follow the pattern:
1. `*ToCalls()`: Build Starknet `Call[]`
2. `execute*()`: Execute with paymaster support

This allows:
- Flexibility (use calls directly or via execute)
- Transparent paymaster support
- Batching multiple transactions

### 3. Pagination

Endpoints returning lists use the `Page<T>` type:
```typescript
{
  content: T[],
  totalElements: number,
  totalPages: number,
  size: number,
  page: number,
  hasNext: boolean
}
```

### 4. Abort Signals

All requests support `AbortSignal` via `AvnuOptions.signal` to cancel in-flight requests.

### 5. Signature Verification

The SDK can verify AVNU response signatures via `AvnuOptions.avnuPublicKey`. When provided, each response is cryptographically validated.

## Error Handling

**ContractError**: Blockchain errors with revert information
```typescript
class ContractError extends Error {
  revertReason: string
}
```

**RequestError**: API errors
```typescript
interface RequestError {
  message: string
  statusCode?: number
}
```

## Dependencies

### Peer Dependencies (installed by consumers)
```json
{
  "starknet": "^8.9.0",
  "ethers": "^6.15.0",
  "moment": "^2.30.1",
  "qs": "^6.14.0"
}
```

### Dependencies (included in SDK)
```json
{
  "dayjs": "^1.11.19",  // Date handling (lightweight)
  "zod": "^4.1.12"      // Runtime validation
}
```

## Testing

**Framework**: Jest with `fetch-mock` for API mocking

**Test files**: `*.spec.ts`
- `swap.services.spec.ts` - Swap service tests (quotes, sources, execution)
- `dca.services.spec.ts` - DCA order creation, cancellation, execution
- `token.services.spec.ts` - Token fetching and search
- `impulse.services.spec.ts` - Market data, price feeds, volume, TVL
- `staking.services.spec.ts` - Staking info, stake/unstake/claim execution
- `paymaster.services.spec.ts` - Build, sign, execute paymaster flow

**Test Utilities** (`test-utils.ts`):
```typescript
// Mock factories for starknet interfaces
createMockAccount(address?: string): jest.Mocked<AccountInterface>
createMockPaymaster(): jest.Mocked<PaymasterInterface>
mockExecutionParams: ExecutionParameters

// URL builders for consistent test setup
buildSwapUrl(path: string): string      // BASE_URL/swap/v3{path}
buildDcaUrl(path: string): string       // BASE_URL/dca/v3{path}
buildTokenUrl(path: string): string     // BASE_URL/v1/starknet/tokens{path}
buildStakingUrl(path: string): string   // BASE_URL/staking/v3{path}
buildImpulseUrl(path: string): string   // IMPULSE_BASE_URL/v1{path}
```

**Fixtures** (`fixtures.ts`):
```typescript
// Swap fixtures
aQuote(), aQuoteRequest(), aPrice(), aPriceRequest()
aSwapCalls(), anInvokeTransactionResponse(), aCall()
ethToken(), btcToken(), aPage<T>(), aSource()

// DCA fixtures
aDCAOrder(), aDCACreateOrder()

// Staking fixtures
aDelegationPool(), aStakingInfo(), aUserStakingInfo()
anApr(), anAction()

// Paymaster fixtures
aPreparedTypedData(), aSignedPaymasterTransaction()

// Impulse/Market data fixtures
aSimplePriceData(), aCandlePriceData()
aSimpleVolumeData(), aByExchangeVolumeData(), aByExchangeTVLData()
aTokenMarketData()
```

Helper pattern: `aX()` with optional overrides.

## Build and Output

**Tool**: `tsup` (configuration in `tsup.config.ts`)

**Formats produced** (in `dist/`):
- **CommonJS**: `index.js`
- **ESM**: `index.mjs`
- **IIFE** (browsers): `index.global.js`
- **TypeScript definitions**: `index.d.ts`

**Target**: ES2022

## Examples

The `examples/` directory contains integrations:
- `starknetjs/`: Using SDK with Starknet.js
- `starknet-react/`: Using SDK with React and Starknet React
- `get-starknet/`: Using SDK with get-starknet wallet connector

## Environment

**Node.js**: >= 22 (specified in `package.json` engines)

## Key Points for LLMs

1. **Function naming**: Functions use `get*`, `fetch*`, `*ToCalls`, `execute*` (not `fetchPrices` or `createOrder` alone)

2. **BigInt everywhere**: All amounts are BigInt, not number or string in the public API

3. **2 base URLs**: `getBaseUrl()` for swap/dca/token/paymaster/staking, `getImpulseBaseUrl()` for impulse

4. **6 services**: swap, dca, token, paymaster, impulse, staking (not 4)

5. **Zod validation**: Use `parseResponseWithSchema` with schemas defined in `schemas.ts`

6. **Enums**: 7 enums in `enums.ts` for typed constants

7. **Build/Execute pattern**: DCA and Staking have separate functions for building and executing

8. **Integrated paymaster**: All `execute*` functions natively support gasless/gasfree

9. **Pagination**: Use `Page<T>` type for lists, not simple arrays

10. **Action tracking**: Staking tracks user action history (Swap, DCA, Stake, etc.)
