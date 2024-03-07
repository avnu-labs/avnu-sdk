import { Call } from 'starknet';

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
  sellAmount?: bigint;
  buyAmount?: bigint;
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
  liquiditySource: 'DEX_AGGREGATOR' | 'MARKET_MAKER' | 'SOLVER';
  suggestedSolution?: SuggestedSolution;
  gasless?: Gasless;
  exactTokenTo?: boolean;
}

export interface Gasless {
  active: boolean;
  gasTokenPrices: { tokenAddress: string; gasFeesInUsd: number; gasFeesInGasToken: bigint }[];
}

export interface SuggestedSolution {
  sellAmount: bigint;
  sellAmountInUsd?: number;
  buyAmount: bigint;
  buyAmountInUsd?: number;
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
  dev?: boolean;
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
