import type { Duration } from 'moment';
import { Call } from 'starknet';

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string;
}

export interface GetTokensRequest extends Pageable {
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

export type TokenTag = 'Unknown' | 'Verified' | 'Community' | 'Unruggable' | 'AVNU';

export interface PriceRequest {
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount: bigint;
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
}

export interface Route {
  name: string;
  address: string;
  percent: number;
  sellTokenAddress: string;
  buyTokenAddress: string;
  routeInfo?: Map<string, string>;
  routes: Route[];
}

export interface Price {
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountInUsd: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountInUsd: number;
  blockNumber?: number;
  chainId: string;
  sourceName: string;
  priceRatioUsd: number;
  gasFees: bigint;
  gasFeesInUsd: number;
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
  gasFees: bigint;
  gasFeesInUsd: number;
  avnuFees: bigint;
  avnuFeesInUsd: number;
  avnuFeesBps: bigint;
  integratorFees: bigint;
  integratorFeesInUsd: number;
  integratorFeesBps: bigint;
  priceRatioUsd: number;
  sellTokenPriceInUsd?: number;
  buyTokenPriceInUsd?: number;
  liquiditySource: 'DEX_AGGREGATOR' | 'MARKET_MAKER' | 'SOLVER' | 'ORDERBOOK';
  gasless: Gasless;
}

export interface Gasless {
  active: boolean;
  gasTokenPrices: { tokenAddress: string; gasFeesInUsd: number; gasFeesInGasToken: bigint }[];
}

export interface InvokeSwapResponse {
  transactionHash: string;
  gasTokenAddress?: string;
  gasTokenAmount?: bigint;
}

export interface RequestError {
  messages: string[];
  revertError: string | undefined;
}

export interface AvnuOptions {
  baseUrl?: string;
  abortSignal?: AbortSignal;
  avnuPublicKey?: string;
}

export interface ExecuteSwapOptions {
  executeApprove?: boolean;
  gasless?: boolean;
  gasTokenAddress?: string;
  maxGasTokenAmount?: bigint;
  slippage?: number;
  executeGaslessTxCallback?: () => unknown;
}

export interface BuildSwapTransaction {
  chainId: string;
  calls: Call[];
}

export enum SourceType {
  DEX = 'DEX',
  MARKET_MAKER = 'MARKET_MAKER',
  SOLVER = 'SOLVER',
  ORDERBOOK = 'ORDERBOOK',
}

export interface Source {
  name: string;
  address: string;
  icon?: string;
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
