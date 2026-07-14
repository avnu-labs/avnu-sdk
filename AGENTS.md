# AGENTS.md

This file provides detailed guidance to coding agents (Claude Code, and others via the AGENTS.md standard) when working with code in this repository.

## Overview

**AVNU SDK** is a TypeScript SDK for building exchange functionality on Starknet Layer 2 with the AVNU API. It provides:

- **Swap**: Token exchange execution with route optimization
- **DCA (Dollar Cost Averaging)**: Automated recurring purchase orders
- **Staking**: AVNU stake delegation and management
- **Market Data (Impulse)**: Prices, volumes, TVL, market data feeds
- **Token Information**: Token metadata and information
- **Paymaster**: Sponsored transaction support via starknet.js PaymasterInterface
- **Private Swaps (Privacy)**: Shielded swaps routed through AVNU's private executor and privacy paymaster

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
├── privacy.services.ts   # Private swap service
├── fixtures.ts           # Test fixtures
├── test-utils.ts         # Shared test utilities (mocks, URL builders)
└── *.spec.ts             # Unit tests
```

### Services

The SDK is organized into **7 service modules** that map to AVNU API endpoints:

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
quoteToCalls(params: QuoteToCallsParams, options?: AvnuOptions): Promise<AvnuCalls>
```
Build Starknet calls from a quote, including approval and slippage handling. Set `private: true` to build a **private swap**: the flag is forwarded to `/swap/v3/build` and the response includes the `executorAddress` used to route the trade privately.

```typescript
executeSwap(params: InvokeSwapParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute a swap with optional paymaster support for sponsored transactions.

**Slippage helpers:**
```typescript
calculateMinReceivedAmount(amount: bigint, slippage: number): bigint
calculateMaxSpendAmount(amount: bigint, slippage: number): bigint
```
Calculate min/max amounts with slippage (slippage as decimal: 0.01 = 1%).

**Key types:**
- `QuoteRequest`: sellTokenAddress, buyTokenAddress, sellAmount, takerAddress, size
- `Quote`: quoteId, sellTokenAddress, sellAmount, sellAmountInUsd, buyTokenAddress, buyAmount, buyAmountInUsd, fee, chainId, routes, gasFees, gasFeesInUsd?, priceImpact
- `Route`: name, address, percent, sellTokenAddress, buyTokenAddress, routeInfo?, routes (sub-routes), alternativeSwapCount
- `QuoteToCallsParams`: quoteId, slippage, takerAddress?, executeApprove?, private? (build a private swap)
- `AvnuCalls`: chainId, calls, executorAddress? (returned when private=true)

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
createDcaToCalls(order: CreateDcaOrder, options?: AvnuOptions): Promise<AvnuCalls>
```
Build calls to create a DCA order.

```typescript
executeCreateDca(params: InvokeCreateDcaParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute DCA order creation with paymaster support.

**Canceling orders (2 methods):**
```typescript
cancelDcaToCalls(orderAddress: string, options?: AvnuOptions): Promise<AvnuCalls>
```
Build calls to cancel a DCA order.

```typescript
executeCancelDca(params: InvokeCancelDcaParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute cancellation with paymaster support.

**Key types:**
- `CreateDcaOrder`: sellTokenAddress, buyTokenAddress, sellAmount, sellAmountPerCycle, frequency (moment Duration), pricingStrategy, traderAddress
- `DcaOrder`: id, orderAddress, traderAddress, sellTokenAddress, buyTokenAddress, sellAmount, sellAmountPerCycle, amountSold, amountBought, frequency, iterations, trades, status
- `DcaTrade`: sellAmount, buyAmount?, expectedTradeDate, actualTradeDate?, status (PENDING/SUCCEEDED/CANCELLED), txHash?
- `DcaOrderStatus`: INDEXING, ACTIVE, CLOSED
- `GetDcaOrdersParams`: traderAddress, status?, page?, size?, sort? (extends Pageable)

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
- `Token`: address, name, symbol, decimals, logoUri, lastDailyVolumeUsd, extensions, tags
- `GetTokensRequest`: page?, size?, sort?, search?, tags?
- `Page<T>`: content, totalPages, totalElements, size, number

---

#### 4. **paymaster.services.ts** - Sponsored Transactions

Complete workflow for paymaster transactions:

```typescript
buildPaymasterTransaction(params: BuildPaymasterTransactionParams): Promise<PreparedInvokeTransaction>
```
Build a transaction for the paymaster.

```typescript
signPaymasterTransaction(params: SignTransactionParams): Promise<SignedPaymasterTransaction>
```
Sign typed data for the paymaster.

```typescript
executePaymasterTransaction(params: ExecutePaymasterTransactionParams): Promise<InvokeTransactionResponse>
```
Execute the signed paymaster transaction.

```typescript
executeAllPaymasterFlow(params: { paymaster: InvokePaymasterParams; provider: AccountInterface; calls: Call[] }): Promise<InvokeTransactionResponse>
```
Helper that chains build -> sign -> execute in a single function. (Note: these paymaster functions do not take an `AvnuOptions` argument.)

**Key types:**
- `PaymasterParams`: provider (PaymasterInterface from starknet.js), params (ExecutionParameters)
- `InvokePaymasterParams`: extends PaymasterParams with active (boolean) to enable/disable
- `SignedPaymasterTransaction`: typedData, signature

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
): Promise<DataPoint[] | CandleDataPoint[]>
```
Get price feed (LINE or CANDLE) for a token.

```typescript
getPrices(tokenAddresses: string[], options?: AvnuOptions): Promise<TokenPriceResponse>
```
Get market prices for a list of tokens.

**Volume feeds:**
```typescript
getVolumeByExchange(tokenAddress: string, simpleProps: SimpleFeedProps, options?: AvnuOptions): Promise<ExchangeRangeDataPoint[]>
```
Volume by exchange for a date range.

```typescript
getExchangeVolumeFeed(tokenAddress: string, feedProps: FeedProps, options?: AvnuOptions): Promise<ExchangeDataPoint[]>
```
Exchange volume feed data with per-exchange breakdown.

```typescript
getTransferVolumeFeed(tokenAddress: string, feedProps: FeedProps, options?: AvnuOptions): Promise<DataPointWithUsd[]>
```
Transfer volume feed data.

**TVL feeds:**
```typescript
getTVLByExchange(tokenAddress: string, simpleDateProps: SimpleDateProps, options?: AvnuOptions): Promise<ExchangeDataPoint[]>
```
TVL snapshot by exchange at a specific date.

```typescript
getExchangeTVLFeed(tokenAddress: string, feedProps: FeedProps, options?: AvnuOptions): Promise<ExchangeDataPoint[]>
```
Historical exchange TVL feed data.

**Key types:**
- `TokenMarketData`: name, symbol, address, decimals, logoUri?, coingeckoId?, verified, starknet (StarknetMarket), global (GlobalMarket | null), tags (default []), linePriceFeedInUsd
- `StarknetMarket`: usd, usdTvl, usdPriceChange1h, usdPriceChangePercentage1h, usdPriceChange24h, usdPriceChangePercentage24h, usdPriceChange7d, usdPriceChangePercentage7d, usdVolume24h, usdTradingVolume24h
- `GlobalMarket`: usd, usdMarketCap, usdFdv, usdMarketCapChange24h, usdMarketCapChangePercentage24h
- `PriceFeedProps`: type (LINE/CANDLE), dateRange, resolution
- `FeedDateRange`: ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR
- `FeedResolution`: 1, 5, 15, 1H, 4H, 1D, 1W, 1M, 1Y
- `DataPoint`: date, value
- `CandleDataPoint`: date, open, high, low, close, volume
- `SimpleDateProps`: date (optional string or Date for snapshot queries)
- `ExchangeDataPoint`: extends DataPointWithUsd + exchange (date, value, valueUsd, exchange)
- `ExchangeRangeDataPoint`: value, valueUsd, exchange, startDate, endDate
- `DataPointWithUsd`: date, value, valueUsd

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
stakeToCalls(params: StakeToCallsParams, options?: AvnuOptions): Promise<AvnuCalls>
```
Build calls for staking.

```typescript
executeStake(params: InvokeStakeParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute staking with paymaster support.

**Initiate Unstake (2 methods):**
```typescript
initiateUnstakeToCalls(params: StakeToCallsParams, options?: AvnuOptions): Promise<AvnuCalls>
```
Build calls to initiate unstaking (starts cool-down period).

```typescript
executeInitiateUnstake(params: InvokeInitiateUnstakeParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute unstake initiation.

**Unstake (2 methods):**
```typescript
unstakeToCalls(params: UnstakeToCallsParams, options?: AvnuOptions): Promise<AvnuCalls>
```
Build calls for unstaking (after cool-down).

```typescript
executeUnstake(params: InvokeUnstakeParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute unstaking.

**Claim Rewards (2 methods):**
```typescript
claimRewardsToCalls(params: ClaimRewardsToCallsParams, options?: AvnuOptions): Promise<AvnuCalls>
```
Build calls to claim rewards.

```typescript
executeClaimRewards(params: InvokeClaimRewardsParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Execute rewards claiming.

**Key types:**
- `StakingInfo`: selfStakedAmount, selfStakedAmountInUsd, operationalAddress, rewardAddress, stakerAddress, commission, delegationPools
- `DelegationPool`: poolAddress, tokenAddress, stakedAmount, stakedAmountInUsd, apr
- `UserStakingInfo`: amount, unclaimedRewards, totalClaimedRewards, unpoolAmount, unpoolTime, userActions, aprs
- `Action`: blockNumber, date, transactionHash, gasFee, type (Swap/OpenDcaOrder/CancelDcaOrder/DcaTrade/StakingStake/StakingInitiateWithdrawal/StakingCancelWithdrawal/StakingWithdraw/StakingClaimRewards), metadata
- `Apr`: date, apr

---

#### 7. **privacy.services.ts** - Private Swaps

Shielded swaps routed through AVNU's private executor and the AVNU privacy paymaster (uses `getPaymasterBaseUrl()` and the paymaster JSON-RPC endpoints). The paymaster settles the swap directly from a zero-knowledge proof; **the SDK never handles private keys, notes, or proof generation** — the caller injects a `PrivateSwapProver` that produces the `{ call, proof }` artifact.

```typescript
buildPrivateSwapFee(params: BuildPrivateSwapFeeParams, options?: AvnuOptions): Promise<PrivateSwapFee>
```
Fetch the pool fee from the AVNU privacy paymaster via the `apply_action` build step (`sponsored_private` fee mode). The returned fee must be withdrawn to `recipient` inside the private transaction so the paymaster is reimbursed for the sponsored gas.

```typescript
submitPrivateSwap(params: SubmitPrivateSwapParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
Submit a proven private swap through the paymaster `apply_action` execute step. No user signature is required: the transaction settles on-chain straight from the proof.

```typescript
executePrivateSwap(params: ExecutePrivateSwapParams, options?: AvnuOptions): Promise<InvokeTransactionResponse>
```
End-to-end orchestrator that keeps all cryptography outside the SDK. Four steps:
1. Fetch the pool fee from the paymaster (`buildPrivateSwapFee`, `apply_action` build).
2. Build the private swap calls via `quoteToCalls({ private: true })` → `executorAddress` + `calls`.
3. Delegate proof generation to the injected `prover` (a STRK20-capable wallet via `wallet_strk20PrepareInvoke`, or the Starknet privacy SDK) → `PrivateSwapCallAndProof`.
4. Submit the proven transaction through the paymaster (`submitPrivateSwap`, `apply_action` execute).

Both proving backends (wallet or privacy SDK) converge to the same `PrivateSwapCallAndProof` artifact.

**STRK20 wallet prover helpers:**
```typescript
createStrk20WalletProver(account: Strk20ProverAccount): PrivateSwapProver
```
Build a ready-made `PrivateSwapProver` backed by a STRK20-capable wallet (starknet.js `WalletAccountV6` / `wallet_strk20PrepareInvoke`). The wallet keeps the keys and notes and generates the proof.

```typescript
buildStrk20Actions(plan: PrivateSwapPlan): STRK20_ACTION[]
```
Translate a `PrivateSwapPlan` into the STRK20 action vocabulary. Use it directly when driving `wallet_strk20PrepareInvoke` yourself; prefer `createStrk20WalletProver` otherwise.

```typescript
toPaymasterCall(call: Call): PaymasterCall
```
Convert a starknet.js `Call` into the paymaster call shape (to/selector/calldata).

**Key types:**
- `PrivacyTip`: priority tip for the paymaster ('slow' / 'normal' / 'fast', default 'normal')
- `PrivateFeeMode`: poolFeeToken, tip? (maps to the `sponsored_private` paymaster fee mode)
- `PaymasterCall`: to, selector, calldata (call shape for the paymaster JSON-RPC endpoints)
- `PrivateSwapFee`: token, recipient, amount (pool fee returned by the `apply_action` build step)
- `PrivacyProof`: data, proofFacts (forwarded verbatim to the paymaster)
- `PrivateSwapCallAndProof`: call, proof (artifact both proving backends converge to)
- `PrivateSwapPlan`: sellTokenAddress, sellAmount, buyTokenAddress, executorAddress, executorCalls, fee, takerAddress (backend-neutral description passed to the prover)
- `PrivateSwapProver`: buildAndProve(plan) → PrivateSwapCallAndProof (injected; wallet or privacy SDK)
- `Strk20ProverAccount`: strk20PrepareInvoke(actions, simulate?) → STRK20_CALL_AND_PROOF (STRK20 wallet API surface consumed by `createStrk20WalletProver`)
- `BuildPrivateSwapFeeParams`: poolAddress, feeMode, paymasterApiKey?
- `SubmitPrivateSwapParams`: callAndProof, feeMode, paymasterApiKey?
- `ExecutePrivateSwapParams`: quote, slippage, takerAddress, poolAddress, feeMode, prover, paymasterApiKey?, chainId? (fail-fast network check against quote.chainId)

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
- **API Requests/Responses**: `Quote`, `Token`, `Page<T>`, `TokenPrice`
- **Execution types**: `InvokeSwapParams`, `InvokeCreateDcaParams`, `InvokeParams`, `InvokePaymasterParams`
- **Market Data**: `TokenMarketData`, `StarknetMarket`, `GlobalMarket`, `FeedProps`
- **Staking**: `StakingInfo`, `UserStakingInfo`, `Action`, `Apr`
- **Options**: `AvnuOptions` (baseUrl, impulseBaseUrl, paymasterBaseUrl, abortSignal, avnuPublicKey)

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
Returns `options.baseUrl` if provided, otherwise defaults to `BASE_URL` (mainnet).

```typescript
getImpulseBaseUrl(options?: AvnuOptions): string
```
Returns `options.impulseBaseUrl` if provided, otherwise defaults to `IMPULSE_BASE_URL`.

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
postRequest(body: unknown, options?: AvnuOptions): RequestInit
```
Build fetch options with abort signal support.

### Constants (constants.ts)

**Base URLs:**
```typescript
export const BASE_URL = 'https://starknet.api.avnu.fi'
export const SEPOLIA_BASE_URL = 'https://sepolia.api.avnu.fi'
export const IMPULSE_BASE_URL = 'https://starknet.impulse.avnu.fi'
export const SEPOLIA_IMPULSE_BASE_URL = 'https://sepolia.impulse.avnu.fi'
export const PAYMASTER_BASE_URL = 'https://starknet.paymaster.avnu.fi'
export const SEPOLIA_PAYMASTER_BASE_URL = 'https://sepolia.paymaster.avnu.fi'
```

**Privacy pool addresses** (whitelisted by the privacy paymaster; `poolAddress` stays an explicit parameter because pools may be redeployed):
```typescript
export const PRIVACY_POOL_ADDRESS = '0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a'
export const SEPOLIA_PRIVACY_POOL_ADDRESS = '0x254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91'
```

**API Version Constants:**
```typescript
export const TOKEN_API_VERSION = 'v1'
export const IMPULSE_API_VERSION = 'v3'
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
  totalPages: number,
  totalElements: number,
  size: number,
  number: number  // current page number (0-indexed)
}
```

### 4. Abort Signals

All requests support `AbortSignal` via `AvnuOptions.abortSignal` to cancel in-flight requests.

### 5. Signature Verification

The SDK can verify AVNU response signatures via `AvnuOptions.avnuPublicKey`. When provided, each response is cryptographically validated.

## Error Handling

**ContractError**: Blockchain errors with revert information
```typescript
class ContractError extends Error {
  revertError: string
}
```

**RequestError**: API errors
```typescript
interface RequestError {
  messages: string[]
  revertError: string | undefined
}
```

**PaymasterRpcError**: Errors returned by the privacy paymaster JSON-RPC endpoints
```typescript
class PaymasterRpcError extends Error {
  method: string
  code: number
  data?: unknown
}
```

## Dependencies

### Peer Dependencies (installed by consumers)
```json
{
  "ethers": "^6.15.0",
  "starknet": "^10.0.0"
}
```

### Dependencies (included in SDK)
```json
{
  "dayjs": "^1.11.19",  // Date handling (lightweight)
  "moment": "^2.30.1",  // Duration handling (DCA frequency)
  "qs": "^6.14.1",      // Query string serialization
  "zod": "^4.3.6"       // Runtime validation
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
- `privacy.services.spec.ts` - Private swap fee, submit, and end-to-end orchestration

**Test Utilities** (`test-utils.ts`):
```typescript
// Mock factories for starknet interfaces
createMockAccount(address?: string): jest.Mocked<AccountInterface>
createMockPaymaster(): jest.Mocked<PaymasterInterface>
createMockPrivateSwapProver(): jest.Mocked<PrivateSwapProver>
mockExecutionParams: ExecutionParameters
```

**Fixtures** (`fixtures.ts`):
```typescript
// Swap fixtures
aQuote(), aQuoteRequest(), aPrice(), aPriceRequest()
aQuoteWithManySubRoutes(), aQuoteWithManyComplexRoutes()
aAvnuCalls(), anInvokeTransactionResponse(), aCall()
ethToken(), btcToken(), aPage<T>(), aSource()

// DCA fixtures
aDCAOrder(), aDCACreateOrder()

// Staking fixtures
aDelegationPool(), aStakingInfo(), aUserStakingInfo()
anApr(), anAction()

// Paymaster fixtures
aPreparedTypedData(), aSignedPaymasterTransaction()

// Privacy (private swap) fixtures
aPrivateFeeMode(), aPrivateSwapFee(), aPrivacyProof()
aPrivateSwapCallAndProof(), aPrivateSwapPlan()

// Impulse/Market data fixtures
aDataPoint(), aCandleDataPoint()
aDataPointWithUsd(), anExchangeDataPoint(), anExchangeRangeDataPoint()
aTokenMarketData(), aStarknetMarket(), aGlobalMarket()
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

3. **3 base URLs**: `getBaseUrl()` for swap/dca/token/paymaster/staking, `getImpulseBaseUrl()` for impulse, `getPaymasterBaseUrl()` for the privacy paymaster

4. **7 services**: swap, dca, token, paymaster, impulse, staking, privacy (not 4)

5. **Zod validation**: Use `parseResponseWithSchema` with schemas defined in `schemas.ts`

6. **Enums**: 7 enums in `enums.ts` for typed constants

7. **Build/Execute pattern**: DCA and Staking have separate functions for building and executing

8. **Integrated paymaster**: All `execute*` functions accept `InvokePaymasterParams` (provider, params, active) for sponsored transactions

9. **Pagination**: Use `Page<T>` type for lists (content, totalPages, totalElements, size, number)

10. **Action tracking**: Staking tracks user action history (Swap, DCA, Stake, etc.)
