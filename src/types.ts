export interface QuoteRequest {
  sellTokenAddress: string;
  buyTokenAddress: string;
  sellAmount?: string;
  buyAmount?: string;
  takerAddress: string;
  slippage?: number;
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
  chainId: number;
  slippage: number;
  expiry: number;
  sources: Source[];
}

export interface Transaction {
  chainId: number;
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export interface RequestError {
  messages: string[];
}

export interface AvnuOptions {
  baseUrl?: string;
}
