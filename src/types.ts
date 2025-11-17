import { OutsideExecutionTypedData } from '@starknet-io/starknet-types-09';
import type { Duration } from 'moment';
import { AccountInterface, Call, ExecutionParameters, PaymasterInterface } from 'starknet';

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string;
}

export interface GetTokensRequest extends Pageable {
  search?: string;
  tags?: TokenTag[];
}

export interface GetTokenRequest {
  search?: string;
  tags?: TokenTag[];
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

/* GLOBAL PART */

interface InvokeParams {
  provider: AccountInterface;
  paymaster?: InvokePaymasterParams;
}

/* PAYMASTER PART */

export interface PaymasterParams {
  provider: PaymasterInterface;
  params: ExecutionParameters;
}

export interface InvokePaymasterParams extends PaymasterParams {
  active: boolean;
}

/* TOKEN PART */

export interface Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUri: string;
  lastDailyVolumeUsd: number;
  extensions: { [key: string]: string };
  tags: TokenTag[];
}

export interface TokenBalance {
  userAddress: string;
  tokenAddress: string;
  balance: bigint;
  balanceInUsd: number;
}

export type TokenTag = 'Unknown' | 'Verified' | 'Community' | 'Unruggable' | 'AVNU';

/* MARKET PART */

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

export interface SimpleFeedProps {
  dateRange: FeedDateRange;
}

export interface FeedProps extends SimpleFeedProps {
  resolution: FeedResolution;
}

export interface PriceFeedProps extends FeedProps {
  type: PriceFeedType;
}

export interface PriceData {
  value: number;
  valueUsd?: number;
}

export interface SimplePriceData extends PriceData {
  date: string;
}

export interface SimpleVolumeData {
  date: string;
  value: number;
}

export interface ByExchangeVolumeData extends SimpleVolumeData {
  exchange: string;
}

export interface ByExchangeTVLData extends SimplePriceData {
  exchange: string;
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
  position: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUri: string;
  verified: boolean;
  linePriceFeedInUsd: SimplePriceData[];
  coingeckoId?: string;
  website?: string;
  market: {
    currentPrice: number;
    fullyDilutedValuation?: number | null;
    totalSupply?: number | null;
    priceChange1h: number;
    priceChangePercentage1h?: number | null;
    priceChange24h: number;
    priceChangePercentage24h?: number | null;
    priceChange7d: number;
    priceChangePercentage7d?: number | null;
    marketCap: number;
    marketCapChange24h?: number | null;
    marketCapChangePercentage24h?: number | null;
    starknetVolume24h: number;
    starknetTradingVolume24h: number;
    starknetTvl: number;
  };
}

/* ACTION PART */
export interface Action {
  blockNumber: bigint;
  date: Date;
  transactionHash: string;
  gasFee: GasFeeInfo | null;
  type: ActionType;
  metadata: ActionMetadataDto;
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
  gasFeeAmount: number;
  gasFeeAmountUsd?: number;
  gasFeeTokenAddress: string;
}

export type ActionMetadataDto =
  | SwapMetadataDto
  | OpenDcaOrderMetadataDto
  | CancelDcaOrderActionMetadataDto
  | DcaTradeActionMetadataDto
  | StakingInitiateWithdrawalActionMetadataDto
  | StakingCancelWithdrawalActionMetadataDto
  | StakingStakeActionMetadataDto
  | StakingClaimRewardsActionMetadataDto
  | StakingWithdrawalActionMetadataDto;

export interface SwapMetadataDto {
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountUsd?: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountUsd?: number;
}

export interface OpenDcaOrderMetadataDto {
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

export interface CancelDcaOrderActionMetadataDto {
  orderAddress: string;
}

export interface DcaTradeActionMetadataDto {
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountUsd?: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountUsd?: number;
}

export interface StakingInitiateWithdrawalActionMetadataDto {
  delegationPoolAddress: string;
  exitTimestamp: Date;
  amount: bigint;
  amountUsd?: number;
  oldDelegatedStake: bigint;
  oldDelegatedStakeUsd?: number;
  newDelegatedStake: bigint;
  newDelegatedStakeUsd?: number;
}

export interface StakingCancelWithdrawalActionMetadataDto {
  delegationPoolAddress: string;
  oldDelegatedStake: bigint;
  oldDelegatedStakeUsd?: number;
  newDelegatedStake: bigint;
  newDelegatedStakeUsd?: number;
}

export interface StakingStakeActionMetadataDto {
  delegationPoolAddress: string;
  oldDelegatedStake: bigint;
  oldDelegatedStakeUsd?: number;
  newDelegatedStake: bigint;
  newDelegatedStakeUsd?: number;
}

export interface StakingClaimRewardsActionMetadataDto {
  delegationPoolAddress: string;
  rewardAddress: string;
  amount: bigint;
  amountUsd?: number;
}

export interface StakingWithdrawalActionMetadataDto {
  delegationPoolAddress: string;
  amount: bigint;
  amountUsd?: number;
}

/* PRICE PART */
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

/* STAKING PART */
interface StakingActionToCallsParams {
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

export interface PoolMemberInfo {
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
  totalClaimedRewardsHistoricalUsd: number;
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
/* SWAP PART */

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
  routeInfo?: Map<string, string>;
  routes: Route[];
  alternativeSwapCount: number;
}

export interface Quote {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountInUsd: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountInUsd: number;
  buyAmountWithoutFees: bigint;
  buyAmountWithoutFeesInUsd: number;
  blockNumber?: number;
  chainId: string;
  expiry?: number;
  routes: Route[];
  gasFees: bigint;// In FRI
  gasFeesInUsd: number;
  avnuFees: bigint;
  avnuFeesInUsd: number;
  avnuFeesBps: bigint;
  integratorFees: bigint;
  integratorFeesInUsd: number;
  integratorFeesBps: bigint;
  priceImpactInUsd: number;
  sellTokenPriceInUsd?: number;
  buyTokenPriceInUsd?: number;
  exactTokenTo?: boolean;
  estimatedSlippage?: number;
}

export interface Gasless {
  active: boolean;
  gasTokenPrices: { tokenAddress: string; gasFeesInUsd: number; gasFeesInGasToken: bigint }[];
}

export interface InvokeTransactionResponse {
  transactionHash: string;
}

export interface RequestError {
  messages: string[];
  revertError: string | undefined;
}

export interface AvnuOptions {
  baseUrl?: string;
  impulseBaseUrl?: string;
  abortSignal?: AbortSignal;
  avnuPublicKey?: string;
}

export interface SignedPaymasterTransaction {
  typedData: OutsideExecutionTypedData;
  signature: string[];
}

export interface QuoteToCallsParams {
  quoteId: string;
  slippage: number;
  takerAddress?: string;
  executeApprove?: boolean;
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

export interface InvokeSwapParams extends InvokeParams {
  quote: Quote;
  slippage: number;
  executeApprove?: boolean;
}

export interface SwapCalls {
  chainId: string;
  calls: Call[];
}

export enum SourceType {
  DEX = 'DEX',
  MARKET_MAKER = 'MARKET_MAKER',
  TOKEN_WRAPPER = 'TOKEN_WRAPPER',
  ORDERBOOK = 'ORDERBOOK',
}

export interface Source {
  name: string;
  type: SourceType;
}

export class ContractError {
  constructor(
    public message: string,
    public revertError: string,
  ) {}
}

export interface GetOrdersParams {
  traderAddress: string;
  status?: OrderStatus;
  page?: number;
  size?: number;
  sort?: Sort;
}

export interface Sort {
  field: string;
  label: string;
  direction: 'ASC' | 'DESC';
}

interface PricingStrategy {
  tokenToMinAmount: string | undefined;
  tokenToMaxAmount: string | undefined;
}

export enum TradeStatus {
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
}

interface Trade {
  sellAmount: bigint;
  sellAmountInUsd: number;
  buyAmount?: bigint;
  buyAmountInUsd?: number;
  expectedTradeDate: Date;
  actualTradeDate?: Date;
  status: TradeStatus;
  txHash?: string;
  errorReason?: string;
}

export enum OrderStatus {
  INDEXING = 'INDEXING',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface OrderReceipt {
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
  status: OrderStatus;
  pricingStrategy: PricingStrategy | Record<string, never>;
  amountSold: bigint;
  amountBought: bigint;
  averageAmountBought: bigint;
  executedTradesCount: number;
  cancelledTradesCount: number;
  pendingTradesCount: number;
  trades: Trade[];
}

export interface EstimatedGasFees {
  overallFee: bigint;
  overallFeeInUsd: number;
  paymaster: EstimatedGasFeesPaymaster;
}

export interface EstimatedGasFeesPaymaster {
  active: boolean;
  gasTokenPrices: EstimateFeeGasTokenPrice[];
}

export interface EstimateFeeGasTokenPrice {
  tokenAddress: string;
  gasFeesInGasToken: bigint;
  gasFeesInUsd: number;
}

export interface PaymasterOptions {
  gasless?: boolean;
  gasfree?: boolean;
  gasTokenAddress?: string;
  maxGasTokenAmount?: bigint;
  executeGaslessTxCallback?: () => unknown;
}

export interface CreateOrderDto {
  sellTokenAddress: string | undefined;
  buyTokenAddress: string | undefined;
  sellAmount: string;
  sellAmountPerCycle: string;
  frequency: Duration;
  pricingStrategy: PricingStrategy | Record<string, never>;
  traderAddress: string;
}
