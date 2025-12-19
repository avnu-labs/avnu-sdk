import { OutsideExecutionTypedData } from '@starknet-io/starknet-types-09';
import type { Duration } from 'moment';
import { AccountInterface, Call, ExecutionParameters, PaymasterInterface } from 'starknet';
import { DcaOrderStatus, DcaTradeStatus, FeedDateRange, FeedResolution, PriceFeedType, SourceType } from './enums';

export interface AvnuOptions {
  baseUrl?: string;
  impulseBaseUrl?: string;
  abortSignal?: AbortSignal;
  avnuPublicKey?: string;
}

/* Pagination Part */
export interface Pageable {
  page?: number;
  size?: number;
  sort?: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const getLastPageNumber = <T>(page: Page<T> | undefined): number =>
  page ? Math.ceil(page.totalElements / page.size) - 1 : 0;

/* Token Part */

export type TokenTag = 'Unknown' | 'Verified' | 'Community' | 'Unruggable' | 'AVNU';

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUri: string | null;
  lastDailyVolumeUsd: number;
  extensions: { [key: string]: string };
  tags: TokenTag[];
}

export interface GetTokensRequest extends Pageable {
  search?: string;
  tags?: TokenTag[];
}

export interface MarketPrice {
  usd: number;
}

export interface TokenPrice {
  address: string;
  decimals: number;
  globalMarket: MarketPrice | null;
  starknetMarket: MarketPrice | null;
}

export type TokenPriceResponse = TokenPrice[];

/* Transactions Part */

export interface InvokeTransactionResponse {
  transactionHash: string;
}

export interface InvokeParams {
  provider: AccountInterface;
  paymaster?: InvokePaymasterParams;
}

/* Error Part */
export interface RequestError {
  messages: string[];
  revertError: string | undefined;
}

export class ContractError extends Error {
  public readonly revertError: string;
  constructor(message: string, revertError: string) {
    super(message);
    this.revertError = revertError;
  }
}

/* Paymaster Part */

export interface PaymasterParams {
  provider: PaymasterInterface;
  params: ExecutionParameters;
}

export interface InvokePaymasterParams extends PaymasterParams {
  active: boolean;
}

export interface BuildPaymasterTransactionParams {
  takerAddress: string;
  paymaster: PaymasterParams;
  calls: Call[];
}

export interface SignTransactionParams {
  provider: AccountInterface;
  typedData: OutsideExecutionTypedData;
}

export interface ExecutePaymasterTransactionParams {
  takerAddress: string;
  paymaster: PaymasterParams;
  signedTransaction: SignedPaymasterTransaction;
}

export interface SignedPaymasterTransaction {
  typedData: OutsideExecutionTypedData;
  signature: string[];
}

/* Swap Part */

export interface InvokeSwapParams extends InvokeParams {
  quote: Quote;
  slippage: number;
  executeApprove?: boolean;
}

export interface AvnuCalls {
  chainId: string;
  calls: Call[];
}

export interface QuoteRequest {
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount?: bigint;
  buyAmount?: bigint;
  takerAddress?: string;
  size?: number;
  excludeSources?: string[];
  integratorFees?: bigint;
  integratorFeeRecipient?: string;
  integratorName?: string;
  onlyDirect?: boolean;
}

export interface Route {
  name: string;
  address: string;
  percent: number;
  sellTokenAddress: string;
  buyTokenAddress: string;
  routeInfo?: Record<string, string>;
  routes: Route[];
  alternativeSwapCount: number;
}

export interface Fee {
  feeToken: string;
  avnuFees: bigint;
  avnuFeesInUsd: number;
  avnuFeesBps: bigint;
  integratorFees: bigint;
  integratorFeesInUsd: number;
  integratorFeesBps: bigint;
}
export interface Quote {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountInUsd: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountInUsd: number;
  fee: Fee;
  blockNumber?: number;
  chainId: string;
  expiry?: number | null;
  routes: Route[];
  gasFees: bigint; // In FRI
  gasFeesInUsd?: number;
  priceImpact: number;
  sellTokenPriceInUsd?: number;
  buyTokenPriceInUsd?: number;
  exactTokenTo?: boolean;
  estimatedSlippage?: number;
}

export interface QuoteToCallsParams {
  quoteId: string;
  slippage: number;
  takerAddress?: string;
  executeApprove?: boolean;
}

export interface Source {
  name: string;
  type: SourceType;
}

/* Staking Part */

export interface StakingActionToCallsParams {
  poolAddress: string;
  userAddress: string;
}

export interface StakeToCallsParams extends StakingActionToCallsParams {
  amount: bigint;
}

export interface UnstakeToCallsParams extends StakingActionToCallsParams {}

export interface ClaimRewardsToCallsParams extends StakingActionToCallsParams {
  restake: boolean;
}

export interface InvokeStakeParams extends InvokeParams {
  poolAddress: string;
  amount: bigint;
}

export interface InvokeInitiateUnstakeParams extends InvokeParams {
  poolAddress: string;
  amount: bigint;
}

export interface InvokeUnstakeParams extends InvokeParams {
  poolAddress: string;
}

export interface InvokeClaimRewardsParams extends InvokeParams {
  poolAddress: string;
  restake: boolean;
}

export interface StakingInfo {
  selfStakedAmount: bigint;
  selfStakedAmountInUsd: number | undefined;
  operationalAddress: string;
  rewardAddress: string;
  stakerAddress: string;
  commission: number;
  delegationPools: DelegationPool[];
}

export interface DelegationPool {
  poolAddress: string;
  tokenAddress: string;
  stakedAmount: bigint;
  stakedAmountInUsd: number | undefined;
  apr: number;
}

export interface UserStakingInfo {
  tokenAddress: string;
  tokenPriceInUsd: number;
  poolAddress: string;
  userAddress: string;
  amount: bigint;
  amountInUsd: number | undefined;
  unclaimedRewards: bigint;
  unclaimedRewardsInUsd: number | undefined;
  unpoolAmount: bigint;
  unpoolAmountInUsd: number | undefined;
  unpoolTime: Date | undefined;
  totalClaimedRewards: bigint;
  totalClaimedRewardsHistoricalUsd?: number;
  totalClaimedRewardsUsd: number;
  userActions: Action[];
  totalUserActionsCount: number;
  expectedYearlyStrkRewards: bigint;
  aprs: Apr[];
}

export interface Apr {
  date: Date;
  apr: number;
}

/* DCA Part */

export interface GetDcaOrdersParams extends Pageable {
  traderAddress: string;
  status?: DcaOrderStatus;
}

export interface PricingStrategy {
  tokenToMinAmount: string | undefined;
  tokenToMaxAmount: string | undefined;
}

export interface DcaTrade {
  sellAmount: bigint;
  sellAmountInUsd?: number;
  buyAmount?: bigint;
  buyAmountInUsd?: number;
  expectedTradeDate: Date;
  actualTradeDate?: Date;
  status: DcaTradeStatus;
  txHash?: string;
  errorReason?: string;
}

export interface DcaOrder {
  id: string;
  blockNumber: number;
  timestamp: Date;
  traderAddress: string;
  orderAddress: string;
  creationTransactionHash: string;
  orderClassHash: string;
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountPerCycle: bigint;
  buyTokenAddress: string;
  startDate: Date;
  endDate: Date;
  closeDate?: Date;
  frequency: string;
  iterations: number;
  status: DcaOrderStatus;
  pricingStrategy: PricingStrategy | Record<string, never>;
  amountSold: bigint;
  amountBought: bigint;
  averageAmountBought: bigint;
  executedTradesCount: number;
  cancelledTradesCount: number;
  pendingTradesCount: number;
  trades: DcaTrade[];
}

export interface CreateDcaOrder {
  sellTokenAddress: string | undefined;
  buyTokenAddress: string | undefined;
  sellAmount: string;
  sellAmountPerCycle: string;
  frequency: Duration;
  pricingStrategy: PricingStrategy | Record<string, never>;
  traderAddress: string;
}

export interface InvokeCreateDcaParams extends InvokeParams {
  order: CreateDcaOrder;
}

export interface InvokeCancelDcaParams extends InvokeParams {
  orderAddress: string;
}

/* User Actions Part */
export interface Action {
  blockNumber: bigint;
  date: Date;
  transactionHash: string;
  gasFee: GasFeeInfo | null;
  type: ActionType;
  metadata: ActionMetadata;
}

export type ActionType =
  | 'Swap'
  | 'OpenDcaOrder'
  | 'CancelDcaOrder'
  | 'DcaTrade'
  | 'StakingStake'
  | 'StakingInitiateWithdrawal'
  | 'StakingCancelWithdrawal'
  | 'StakingWithdraw'
  | 'StakingClaimRewards';

export interface GasFeeInfo {
  gasFeeAmount?: bigint;
  gasFeeAmountUsd?: number;
  gasFeeTokenAddress?: string;
}

export type ActionMetadata =
  | SwapMetadata
  | DcaOrderMetadata
  | CancelDcaOrderMetadata
  | DcaTradeMetadata
  | StakingInitiateUnstakeMetadata
  | StakingCancelUnstakeMetadata
  | StakingStakeMetadata
  | StakingClaimRewardsMetadata
  | StakingUnstakeMetadata;

export interface SwapMetadata {
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountUsd?: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountUsd?: number;
  integratorName?: string;
}

export interface DcaOrderMetadata {
  orderClassHash: string;
  orderAddress: string;
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountUsd?: number;
  sellAmountPerCycle: bigint;
  buyTokenAddress: string;
  cycleFrequency: bigint;
  startDate: Date;
  endDate: Date;
}

export interface CancelDcaOrderMetadata {
  orderAddress: string;
}

export interface DcaTradeMetadata {
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountUsd?: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountUsd?: number;
}

export interface StakingInitiateUnstakeMetadata {
  delegationPoolAddress: string;
  exitTimestamp: Date;
  amount: bigint;
  amountUsd?: number;
  oldDelegatedStake: bigint;
  oldDelegatedStakeUsd?: number;
  newDelegatedStake: bigint;
  newDelegatedStakeUsd?: number;
}

export interface StakingCancelUnstakeMetadata {
  delegationPoolAddress: string;
  oldDelegatedStake: bigint;
  oldDelegatedStakeUsd?: number;
  newDelegatedStake: bigint;
  newDelegatedStakeUsd?: number;
}

export interface StakingStakeMetadata {
  delegationPoolAddress: string;
  oldDelegatedStake: bigint;
  oldDelegatedStakeUsd?: number;
  newDelegatedStake: bigint;
  newDelegatedStakeUsd?: number;
}

export interface StakingClaimRewardsMetadata {
  delegationPoolAddress: string;
  rewardAddress: string;
  amount: bigint;
  amountUsd?: number;
}

export interface StakingUnstakeMetadata {
  delegationPoolAddress: string;
  amount: bigint;
  amountUsd?: number;
}

/* Impulse Market Part */

export interface SimpleDateProps {
  date?: string | Date;
}

export interface SimpleFeedProps {
  dateRange: FeedDateRange;
}

export interface FeedProps extends SimpleFeedProps {
  resolution: FeedResolution;
}

export interface PriceFeedProps extends FeedProps {
  type: PriceFeedType;
}

export interface StarknetMarket {
  usd: number;
  usdTvl: number;
  usdPriceChange1h: number;
  usdPriceChangePercentage1h: number | null;
  usdPriceChange24h: number;
  usdPriceChangePercentage24h: number | null;
  usdPriceChange7d: number;
  usdPriceChangePercentage7d: number | null;
  usdVolume24h: number;
  usdTradingVolume24h: number;
}

export interface GlobalMarket {
  usd: number;
  usdMarketCap: number;
  usdFdv: number;
  usdMarketCapChange24h: number;
  usdMarketCapChangePercentage24h: number;
}

export interface SimplePriceData {
  date: string;
  value: number;
}

export interface SimpleVolumeData {
  date: string;
  value: number;
  valueUsd: number;
}

export interface ByExchangeVolumeData {
  value: number;
  valueUsd: number;
  exchange: string;
  startDate: string;
  endDate: string;
}

export interface ExchangeLineVolumeData {
  date: string;
  value: number;
  valueUsd: number;
  exchange: string;
}

export interface ByExchangeTVLData {
  exchange: string;
  value: number;
  valueUsd: number;
  date: string;
}

export interface CandlePriceData {
  date: string;
  close: number;
  high: number;
  low: number;
  open: number;
  volume: number;
}

export interface TokenMarketData {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  logoUri?: string | null;
  coingeckoId?: string | null;
  verified: boolean;
  starknet: StarknetMarket;
  global: GlobalMarket | null;
  tags: TokenTag[];
  linePriceFeedInUsd: SimplePriceData[];
}
