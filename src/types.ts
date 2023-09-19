import { Call, Signature } from 'starknet';

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string;
}

export type GetTokensRequest = Pageable;

export interface GetPairsRequest extends Pageable {
  token?: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface Token {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  chainId: string;
  logoUri: string;
}

export interface Pair {
  token1: Token;
  token2: Token;
}

export interface PriceRequest {
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount: bigint;
}

export interface QuoteRequest {
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount: bigint;
  takerAddress?: string;
  size?: number;
  excludeSources?: string[];
  integratorFees?: bigint;
  integratorFeeRecipient?: string;
  integratorName?: string;
  mode?: 'CLASSIC' | 'TURBO';
}

export interface Route {
  name: string;
  address: string;
  percent: number;
  sellTokenAddress: string;
  buyTokenAddress: string;
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
}

export interface Quote {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: bigint;
  sellAmountInUsd: number;
  buyTokenAddress: string;
  buyAmount: bigint;
  buyAmountInUsd: number;
  blockNumber?: number;
  chainId: string;
  expiry?: number;
  routes: Route[];
  avnuFees: bigint;
  avnuFeesInUsd: number;
  avnuFeesBps: bigint;
  integratorFees: bigint;
  integratorFeesInUsd: number;
  integratorFeesBps: bigint;
  priceRatioUsd: number;
  sellTokenPriceInUsd?: number;
  buyTokenPriceInUsd?: number;
  liquiditySource: 'DEX_AGGREGATOR' | 'MARKET_MAKER';
  suggestedSolution?: SuggestedSolution;
}

export interface SuggestedSolution {
  sellAmount: bigint;
  sellAmountInUsd?: number;
  buyAmount: bigint;
  buyAmountInUsd?: number;
}

export interface InvokeSwapResponse {
  transactionHash: string;
}

export interface RequestError {
  messages: string[];
}

export interface AvnuOptions {
  baseUrl?: string;
  dev?: boolean;
  abortSignal?: AbortSignal;
  avnuPublicKey?: string;
}

export interface ExecuteSwapOptions {
  executeApprove?: boolean;
  gasless?: boolean;
  takerSignature?: Signature;
  slippage?: number;
}

export interface BuildSwapTransaction extends Call {
  chainId: string;
}

export enum SourceType {
  DEX = 'DEX',
  MARKET_MAKER = 'MARKET_MAKER',
}

export interface Source {
  name: string;
  address: string;
  icon?: string;
  type: SourceType;
}
