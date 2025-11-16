import { z } from 'zod';
import {
  type EstimatedGasFees,
  type OrderReceipt,
  OrderStatus,
  type PoolMemberInfo,
  type Quote,
  type StakingInfo,
  TradeStatus,
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
 * DCA (Dollar Cost Averaging) Schemas
 */

export const TradeStatusSchema = z.enum(TradeStatus);

export const TradeSchema = z.object({
  sellAmount: hexToBigInt,
  sellAmountInUsd: z.number(),
  buyAmount: hexToBigInt.optional(),
  buyAmountInUsd: z.number().optional(),
  expectedTradeDate: isoStringToDate,
  actualTradeDate: isoStringToDate.optional(),
  status: TradeStatusSchema,
  txHash: z.string().optional(),
  errorReason: z.string().optional(),
});

export const OrderStatusSchema = z.enum(OrderStatus);

export const PricingStrategySchema = z.union([
  z.object({
    tokenToMinAmount: z.string().or(z.undefined()),
    tokenToMaxAmount: z.string().or(z.undefined()),
  }),
  z.object({}).strict(),
]) as z.ZodType<{ tokenToMinAmount: string | undefined; tokenToMaxAmount: string | undefined } | Record<string, never>>;

export const OrderReceiptSchema = z.object({
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
  status: OrderStatusSchema,
  pricingStrategy: PricingStrategySchema,
  amountSold: hexToBigInt,
  amountBought: hexToBigInt,
  averageAmountBought: hexToBigInt,
  executedTradesCount: z.number(),
  cancelledTradesCount: z.number(),
  pendingTradesCount: z.number(),
  trades: z.array(TradeSchema),
}) satisfies z.ZodType<OrderReceipt>;

export const EstimateFeeGasTokenPriceSchema = z.object({
  tokenAddress: z.string(),
  gasFeesInGasToken: hexToBigInt,
  gasFeesInUsd: z.number(),
});

export const EstimatedGasFeesPaymasterSchema = z.object({
  active: z.boolean(),
  gasTokenPrices: z.array(EstimateFeeGasTokenPriceSchema),
});

export const EstimatedGasFeesSchema = z.object({
  overallFee: hexToBigInt,
  overallFeeInUsd: z.number(),
  paymaster: EstimatedGasFeesPaymasterSchema,
}) satisfies z.ZodType<EstimatedGasFees>;

/**
 * Swap Schemas
 */

type RouteType = {
  name: string;
  address: string;
  percent: number;
  sellTokenAddress: string;
  buyTokenAddress: string;
  routeInfo?: Map<string, string>;
  routes: RouteType[];
};

export const RouteSchema: z.ZodType<RouteType> = z.lazy(() =>
  z.object({
    name: z.string(),
    address: z.string(),
    percent: z.number(),
    sellTokenAddress: z.string(),
    buyTokenAddress: z.string(),
    routeInfo: z.map(z.string(), z.string()).optional(),
    routes: z.array(RouteSchema),
  }),
);

export const GaslessSchema = z.object({
  active: z.boolean(),
  gasTokenPrices: z.array(
    z.object({
      tokenAddress: z.string(),
      gasFeesInUsd: z.number(),
      gasFeesInGasToken: hexToBigInt,
    }),
  ),
});

export const QuoteSchema = z.object({
  quoteId: z.string(),
  sellTokenAddress: z.string(),
  sellAmount: hexToBigInt,
  sellAmountInUsd: z.number(),
  buyTokenAddress: z.string(),
  buyAmount: hexToBigInt,
  buyAmountInUsd: z.number(),
  buyAmountWithoutFees: hexToBigInt,
  buyAmountWithoutFeesInUsd: z.number(),
  blockNumber: z.number().optional(),
  chainId: z.string(),
  expiry: z.number().optional(),
  routes: z.array(RouteSchema),
  gasFees: hexToBigInt,
  gasFeesInUsd: z.number(),
  avnuFees: hexToBigInt,
  avnuFeesInUsd: z.number(),
  avnuFeesBps: hexToBigInt,
  integratorFees: hexToBigInt,
  integratorFeesInUsd: z.number(),
  integratorFeesBps: hexToBigInt,
  priceRatioUsd: z.number(),
  sellTokenPriceInUsd: z.number().optional(),
  buyTokenPriceInUsd: z.number().optional(),
  liquiditySource: z.enum(['DEX_AGGREGATOR', 'MARKET_MAKER', 'SOLVER', 'ORDERBOOK']),
  gasless: GaslessSchema,
  exactTokenTo: z.boolean().optional(),
}) satisfies z.ZodType<Quote>;

/**
 * Staking Schemas
 */

export const GasFeeInfoSchema = z.object({
  gasFeeAmount: z.number(),
  gasFeeAmountUsd: z.number().optional(),
  gasFeeTokenAddress: z.string(),
});

export const SwapMetadataSchema = z.object({
  sellTokenAddress: z.string(),
  sellAmount: hexToBigInt,
  sellAmountUsd: z.number().optional(),
  buyTokenAddress: z.string(),
  buyAmount: hexToBigInt,
  buyAmountUsd: z.number().optional(),
});

export const OpenDcaOrderMetadataSchema = z.object({
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

export const CancelDcaOrderActionMetadataSchema = z.object({
  orderAddress: z.string(),
});

export const DcaTradeActionMetadataSchema = z.object({
  sellTokenAddress: z.string(),
  sellAmount: hexToBigInt,
  sellAmountUsd: z.number().optional(),
  buyTokenAddress: z.string(),
  buyAmount: hexToBigInt,
  buyAmountUsd: z.number().optional(),
});

export const StakingInitiateWithdrawalActionMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  exitTimestamp: isoStringToDate,
  amount: hexToBigInt,
  amountUsd: z.number().optional(),
  oldDelegatedStake: hexToBigInt,
  oldDelegatedStakeUsd: z.number().optional(),
  newDelegatedStake: hexToBigInt,
  newDelegatedStakeUsd: z.number().optional(),
});

export const StakingCancelWithdrawalActionMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  oldDelegatedStake: hexToBigInt,
  oldDelegatedStakeUsd: z.number().optional(),
  newDelegatedStake: hexToBigInt,
  newDelegatedStakeUsd: z.number().optional(),
});

export const StakingStakeActionMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  oldDelegatedStake: hexToBigInt,
  oldDelegatedStakeUsd: z.number().optional(),
  newDelegatedStake: hexToBigInt,
  newDelegatedStakeUsd: z.number().optional(),
});

export const StakingClaimRewardsActionMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  rewardAddress: z.string(),
  amount: hexToBigInt,
  amountUsd: z.number().optional(),
});

export const StakingWithdrawalActionMetadataSchema = z.object({
  delegationPoolAddress: z.string(),
  amount: hexToBigInt,
  amountUsd: z.number().optional(),
});

export const ActionMetadataSchema = z.union([
  SwapMetadataSchema,
  OpenDcaOrderMetadataSchema,
  CancelDcaOrderActionMetadataSchema,
  DcaTradeActionMetadataSchema,
  StakingInitiateWithdrawalActionMetadataSchema,
  StakingCancelWithdrawalActionMetadataSchema,
  StakingStakeActionMetadataSchema,
  StakingClaimRewardsActionMetadataSchema,
  StakingWithdrawalActionMetadataSchema,
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

export const PoolMemberInfoSchema = z.object({
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
  totalClaimedRewardsHistoricalUsd: z.number(),
  totalClaimedRewardsUsd: z.number(),
  userActions: z.array(ActionSchema),
  totalUserActionsCount: z.number(),
  expectedYearlyStrkRewards: hexToBigInt,
  aprs: z.array(AprSchema),
}) satisfies z.ZodType<PoolMemberInfo>;

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
