export interface QuoteRequest {
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount?: string;
  buyAmount?: string;
  takerAddress: string;
  excludeSources?: string[];
  size?: number;
}

export interface Source {
  name: string;
  icon?: string;
  percent: number;
  sellTokenAddress: string;
  sellAmount: string;
  buyTokenAddress: string;
  buyAmount: string;
}

export interface Quote {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: string;
  buyTokenAddress: string;
  buyAmount: string;
  blockNumber: number;
  chainId: string;
  slippage: number;
  expiry: number;
  sources: Source[];
}

export interface Transaction {
  chainId: string;
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export interface RequestError {
  messages: string[];
}

export interface AvnuOptions {
  baseUrl?: string;
  abortSignal?: AbortSignal;
}
