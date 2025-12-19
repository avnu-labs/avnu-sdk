import { z } from 'zod';
import { DcaOrderStatus, DcaTradeStatus, SourceType } from './enums';
import {
  type ByExchangeTVLData,
  type ByExchangeVolumeData,
  type CandlePriceData,
  type DcaOrder,
  DcaTrade,
  type ExchangeLineVolumeData,
  Fee,
  type GlobalMarket,
  MarketPrice,
  type Quote,
  Route,
  type SimplePriceData,
  type SimpleVolumeData,
  Source,
  type StakingInfo,
  type StarknetMarket,
  type Token,
  type TokenMarketData,
  TokenPrice,
  type UserStakingInfo,
} from './types';

/**
 * Type-safe schema validation helper
 *
 * This ensures that a Zod schema's inferred type exactly matches the expected TypeScript type.
 * If the schema is missing fields or has incorrect types, TypeScript will show an error.
 *
 * Usage:
 * ```typescript
 * const _MySchema = z.object({ ... });
 * export const MySchema = _MySchema satisfies z.ZodType<MyType>;
 * ```
 *
 * Note: This creates a bidirectional check:
 * - If you forget a field in the schema → TypeScript error
 * - If you add a field in the type but not the schema → TypeScript error
 */

/**
 * Custom Zod transformers for AVNU API responses
 */

// Transform hex string to BigInt
export const hexToBigInt = z.union([z.string(), z.number(), z.bigint()]).transform((val) => {
  if (typeof val === 'bigint') return val;
  return BigInt(val);
});

export const hexToNumber = z.union([z.string(), z.number(), z.bigint()]).transform((val) => {
  if (typeof val === 'number') return val;
  return Number(val);
});

// Transform ISO date string to Date
export const isoStringToDate = z.string().transform((val) => new Date(val));

// Transform hex timestamp to Date (for fields ending with *Time)
export const hexTimestampToDate = z.union([z.string(), z.number(), z.null(), z.undefined()]).transform((val) => {
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'string') {
    // Hex string like "0x..."
    return new Date(parseInt(val, 16) * 1000);
  }
  // Already a number (Unix timestamp in seconds)
  return new Date(val * 1000);
});

/**
 * Token Schema
 */

export const TokenSchema = z.object({
  address: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  logoUri: z.string().nullable(),
  lastDailyVolumeUsd: z.number(),
  extensions: z.record(z.string(), z.string()),
  tags: z.array(z.enum(['Unknown', 'Verified', 'Community', 'Unruggable', 'AVNU'])),
}) satisfies z.ZodType<Token>;

/** Source Schemas */

export const SourceTypeSchema = z.enum(SourceType);

export const SourceSchema = z.object({
  name: z.string(),
  type: SourceTypeSchema,
}) satisfies z.ZodType<Source>;

/**
 * DCA (Dollar Cost Averaging) Schemas
 */

export const DcaTradeStatusSchema = z.enum(DcaTradeStatus);

export const DcaTradeSchema = z.object({
  sellAmount: hexToBigInt,
  sellAmountInUsd: z.number().optional(),
  buyAmount: hexToBigInt.optional(),
  buyAmountInUsd: z.number().optional(),
  expectedTradeDate: isoStringToDate,
  actualTradeDate: isoStringToDate.optional(),
  status: DcaTradeStatusSchema,
  txHash: z.string().optional(),
  errorReason: z.string().optional(),
}) satisfies z.ZodType<DcaTrade>;

export const DcaOrderStatusSchema = z.enum(DcaOrderStatus);

export const PricingStrategySchema = z.union([
  z.object({
    tokenToMinAmount: z.string().or(z.undefined()),
    tokenToMaxAmount: z.string().or(z.undefined()),
  }),
  z.object({}).strict(),
]) as z.ZodType<{ tokenToMinAmount: string | undefined; tokenToMaxAmount: string | undefined } | Record<string, never>>;

export const DcaOrderSchema = z.object({
  id: z.string(),
  blockNumber: z.number(),
  timestamp: isoStringToDate,
  traderAddress: z.string(),
  orderAddress: z.string(),
  creationTransactionHash: z.string(),
  orderClassHash: z.string(),
  sellTokenAddress: z.string(),
  sellAmount: hexToBigInt,
  sellAmountPerCycle: hexToBigInt,
  buyTokenAddress: z.string(),
  startDate: isoStringToDate,
  endDate: isoStringToDate,
  closeDate: isoStringToDate.optional(),
  frequency: z.string(),
  iterations: z.number(),
  status: DcaOrderStatusSchema,
  pricingStrategy: PricingStrategySchema,
  amountSold: hexToBigInt,
  amountBought: hexToBigInt,
  averageAmountBought: hexToBigInt,
  executedTradesCount: z.number(),
  cancelledTradesCount: z.number(),
  pendingTradesCount: z.number(),
  trades: z.array(DcaTradeSchema),
}) satisfies z.ZodType<DcaOrder>;

/**
 * Swap Schemas
 */

export const RouteSchema: z.ZodType<Route> = z.lazy(() =>
  z.object({
    name: z.string(),
    address: z.string(),
    percent: z.number(),
    sellTokenAddress: z.string(),
    buyTokenAddress: z.string(),
    routeInfo: z.record(z.string(), z.string()).optional(),
    routes: z.array(RouteSchema),
    alternativeSwapCount: z.number(),
  }),
);

export const FeeSchema = z.object({
  feeToken: z.string(),
  avnuFees: hexToBigInt,
  avnuFeesInUsd: z.number(),
  avnuFeesBps: hexToBigInt,
  integratorFees: hexToBigInt,
  integratorFeesInUsd: z.number(),
  integratorFeesBps: hexToBigInt,
}) satisfies z.ZodType<Fee>;

export const QuoteSchema = z.object({
  quoteId: z.string(),
  sellTokenAddress: z.string(),
  sellAmount: hexToBigInt,
  sellAmountInUsd: z.number(),
  buyTokenAddress: z.string(),
  buyAmount: hexToBigInt,
  buyAmountInUsd: z.number(),
  fee: FeeSchema,
  blockNumber: hexToNumber.optional(),
  chainId: z.string(),
  expiry: z.number().optional().nullable(),
  routes: z.array(RouteSchema),
  gasFees: hexToBigInt,
  gasFeesInUsd: z.number().optional(),
  priceImpact: z.number(),
  sellTokenPriceInUsd: z.number().optional(),
  buyTokenPriceInUsd: z.number().optional(),
  exactTokenTo: z.boolean().optional(),
  estimatedSlippage: z.number().optional(),
}) satisfies z.ZodType<Quote>;

/**
 * Staking Schemas
 */

export const GasFeeInfoSchema = z.object({
  gasFeeAmount: hexToBigInt.optional(),
  gasFeeAmountUsd: z.number().optional(),
  gasFeeTokenAddress: z.string().optional(),
});

export const SwapMetadataSchema = z.object({
  sellTokenAddress: z.string(),
  sellAmount: hexToBigInt,
  sellAmountUsd: z.number().optional(),
  buyTokenAddress: z.string(),
  buyAmount: hexToBigInt,
  buyAmountUsd: z.number().optional(),
  integratorName: z.string().optional(),
});

export const DcaOrderMetadataSchema = z.object({
  orderClassHash: z.string(),
  orderAddress: z.string(),
  sellTokenAddress: z.string(),
  sellAmount: hexToBigInt,
  sellAmountUsd: z.number().optional(),
  sellAmountPerCycle: hexToBigInt,
  buyTokenAddress: z.string(),
  cycleFrequency: hexToBigInt,
  startDate: isoStringToDate,
  endDate: isoStringToDate,
});

export const CancelDcaOrderMetadataSchema = z.object({
  orderAddress: z.string(),
});

export const DcaTradeMetadataSchema = z.object({
  sellTokenAddress: z.string(),
  sellAmount: hexToBigInt,
  sellAmountUsd: z.number().optional(),
  buyTokenAddress: z.string(),
  buyAmount: hexToBigInt,
  buyAmountUsd: z.number().optional(),
});

export const StakingInitiateUnstakeMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  exitTimestamp: isoStringToDate,
  amount: hexToBigInt,
  amountUsd: z.number().optional(),
  oldDelegatedStake: hexToBigInt,
  oldDelegatedStakeUsd: z.number().optional(),
  newDelegatedStake: hexToBigInt,
  newDelegatedStakeUsd: z.number().optional(),
});

export const StakingCancelUnstakeMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  oldDelegatedStake: hexToBigInt,
  oldDelegatedStakeUsd: z.number().optional(),
  newDelegatedStake: hexToBigInt,
  newDelegatedStakeUsd: z.number().optional(),
});

export const StakingStakeMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  oldDelegatedStake: hexToBigInt,
  oldDelegatedStakeUsd: z.number().optional(),
  newDelegatedStake: hexToBigInt,
  newDelegatedStakeUsd: z.number().optional(),
});

export const StakingClaimRewardsMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  rewardAddress: z.string(),
  amount: hexToBigInt,
  amountUsd: z.number().optional(),
});

export const StakingUnstakeMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  amount: hexToBigInt,
  amountUsd: z.number().optional(),
});

export const ActionMetadataSchema = z.union([
  SwapMetadataSchema,
  DcaOrderMetadataSchema,
  CancelDcaOrderMetadataSchema,
  DcaTradeMetadataSchema,
  StakingInitiateUnstakeMetadataSchema,
  StakingCancelUnstakeMetadataSchema,
  StakingStakeMetadataSchema,
  StakingClaimRewardsMetadataSchema,
  StakingUnstakeMetadataSchema,
]);

export const ActionTypeSchema = z.enum([
  'Swap',
  'OpenDcaOrder',
  'CancelDcaOrder',
  'DcaTrade',
  'StakingStake',
  'StakingInitiateWithdrawal',
  'StakingCancelWithdrawal',
  'StakingWithdraw',
  'StakingClaimRewards',
]);

export const ActionSchema = z.object({
  blockNumber: hexToBigInt,
  date: isoStringToDate,
  transactionHash: z.string(),
  gasFee: GasFeeInfoSchema.nullable(),
  type: ActionTypeSchema,
  metadata: ActionMetadataSchema,
});

export const AprSchema = z.object({
  date: isoStringToDate,
  apr: z.number(),
});

export const UserStakingInfoSchema = z.object({
  tokenAddress: z.string(),
  tokenPriceInUsd: z.number(),
  poolAddress: z.string(),
  userAddress: z.string(),
  amount: hexToBigInt,
  amountInUsd: z.number().or(z.undefined()),
  unclaimedRewards: hexToBigInt,
  unclaimedRewardsInUsd: z.number().or(z.undefined()),
  unpoolAmount: hexToBigInt,
  unpoolAmountInUsd: z.number().or(z.undefined()),
  unpoolTime: hexTimestampToDate,
  totalClaimedRewards: hexToBigInt,
  totalClaimedRewardsHistoricalUsd: z.number().optional(),
  totalClaimedRewardsUsd: z.number(),
  userActions: z.array(ActionSchema),
  totalUserActionsCount: z.number(),
  expectedYearlyStrkRewards: hexToBigInt,
  aprs: z.array(AprSchema),
}) satisfies z.ZodType<UserStakingInfo>;

export const DelegationPoolSchema = z.object({
  poolAddress: z.string(),
  tokenAddress: z.string(),
  stakedAmount: hexToBigInt,
  stakedAmountInUsd: z.number().or(z.undefined()),
  apr: z.number(),
});

export const StakingInfoSchema = z.object({
  selfStakedAmount: hexToBigInt,
  selfStakedAmountInUsd: z.number().or(z.undefined()),
  operationalAddress: z.string(),
  rewardAddress: z.string(),
  stakerAddress: z.string(),
  commission: z.number(),
  delegationPools: z.array(DelegationPoolSchema),
}) satisfies z.ZodType<StakingInfo>;

/**
 * Market Schemas
 */

export const StarknetMarketSchema = z.object({
  usd: z.number(),
  usdTvl: z.number(),
  usdPriceChange1h: z.number(),
  usdPriceChangePercentage1h: z.number().nullable(),
  usdPriceChange24h: z.number(),
  usdPriceChangePercentage24h: z.number().nullable(),
  usdPriceChange7d: z.number(),
  usdPriceChangePercentage7d: z.number().nullable(),
  usdVolume24h: z.number(),
  usdTradingVolume24h: z.number(),
}) satisfies z.ZodType<StarknetMarket>;

export const GlobalMarketSchema = z.object({
  usd: z.number(),
  usdMarketCap: z.number(),
  usdFdv: z.number(),
  usdMarketCapChange24h: z.number(),
  usdMarketCapChangePercentage24h: z.number(),
}) satisfies z.ZodType<GlobalMarket>;

export const SimplePriceDataSchema = z.object({
  date: z.string(),
  value: z.number(),
  valueUsd: z.number(),
}) satisfies z.ZodType<SimplePriceData>;

export const SimpleVolumeDataSchema = z.object({
  date: z.string(),
  value: z.number(),
  valueUsd: z.number(),
}) satisfies z.ZodType<SimpleVolumeData>;

export const ByExchangeVolumeDataSchema = z.object({
  value: z.number(),
  valueUsd: z.number(),
  exchange: z.string(),
  startDate: z.string(),
  endDate: z.string(),
}) satisfies z.ZodType<ByExchangeVolumeData>;

export const ExchangeLineVolumeDataSchema = z.object({
  date: z.string(),
  value: z.number(),
  valueUsd: z.number(),
  exchange: z.string(),
}) satisfies z.ZodType<ExchangeLineVolumeData>;

export const ByExchangeTVLDataSchema = z.object({
  exchange: z.string(),
  value: z.number(),
  valueUsd: z.number(),
  date: z.string(),
}) satisfies z.ZodType<ByExchangeTVLData>;

export const CandlePriceDataSchema = z.object({
  date: z.string(),
  close: z.number(),
  high: z.number(),
  low: z.number(),
  open: z.number(),
  volume: z.number(),
}) satisfies z.ZodType<CandlePriceData>;

export const TokenMarketDataSchema = z.object({
  position: z.number().default(0),
  name: z.string(),
  symbol: z.string(),
  address: z.string(),
  decimals: z.number(),
  logoUri: z.string().nullable(),
  coingeckoId: z.string().nullable(),
  verified: z.boolean(),
  starknet: StarknetMarketSchema,
  global: GlobalMarketSchema.nullable(),
  tags: z.array(z.enum(['Unknown', 'Verified', 'Community', 'Unruggable', 'AVNU'])),
  linePriceFeedInUsd: z.array(SimplePriceDataSchema).default([]),
}) satisfies z.ZodType<TokenMarketData>;

export const MarketPriceSchema = z.object({
  usd: z.number(),
}) satisfies z.ZodType<MarketPrice>;

export const TokenPriceSchema = z.object({
  address: z.string(),
  decimals: z.number(),
  globalMarket: MarketPriceSchema.nullable(),
  starknetMarket: MarketPriceSchema.nullable(),
}) satisfies z.ZodType<TokenPrice>;

/**
 * Pagination Schema
 */
export const PageSchema = <T extends z.ZodTypeAny>(contentSchema: T) =>
  z.object({
    content: z.array(contentSchema),
    totalPages: z.number(),
    totalElements: z.number(),
    size: z.number(),
    number: z.number(),
  });
