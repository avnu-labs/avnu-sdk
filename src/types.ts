import { BigNumber } from 'ethers';

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
  sellAmount?: BigNumber;
  buyAmount?: BigNumber;
  takerAddress?: string;
  size?: number;
}

export interface Source {
  name: string;
  icon?: string;
  percent: number;
  sellTokenAddress: string;
  sellAmount: BigNumber;
  buyTokenAddress: string;
  buyAmount: BigNumber;
}

export interface Quote {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: BigNumber;
  buyTokenAddress: string;
  buyAmount: BigNumber;
  blockNumber?: number;
  chainId: string;
  slippage: number;
  expiry: number;
  sources: Source[];
}

export interface InvokeSwapResponse {
  transactionHash: string;
}

export interface RequestError {
  messages: string[];
}

export interface AvnuOptions {
  baseUrl?: string;
  abortSignal?: AbortSignal;
}
