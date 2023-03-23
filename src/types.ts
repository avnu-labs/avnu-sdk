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
}

export interface Route {
  name: string;
  address: string;
  percent: number;
  sellTokenAddress: string;
  buyTokenAddress: string;
  routes: Route[];
}

export interface Quote {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: bigint;
  buyTokenAddress: string;
  buyAmount: bigint;
  blockNumber?: number;
  chainId: string;
  expiry?: number;
  routes: Route[];
  avnuFees: bigint;
  avnuFeesBps: bigint;
  integratorFees: bigint;
  integratorFeesBps: bigint;
}

export interface Quotee {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: string;
  buyTokenAddress: string;
  buyAmount: string;
  blockNumber?: number;
  chainId: string;
  expiry?: number;
  routes: Route[];
  avnuFees: string;
  integratorFees: string;
  avnuFeesBps: string;
  integratorFeesBps: string;
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
  nonce?: string;
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
