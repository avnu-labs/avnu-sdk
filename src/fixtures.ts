import { parseUnits } from '@ethersproject/units/src.ts';
import { constants } from 'starknet';
import { BuildSwapTransaction, InvokeSwapResponse, Page, Pair, Quote, QuoteRequest, Token } from './types';

export const aQuoteRequest = (): QuoteRequest => ({
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  size: 1,
  takerAddress: '0x0',
});

export const aQuote = (): Quote => ({
  quoteId: 'quoteId',
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  buyAmount: parseUnits('2', 18),
  blockNumber: 1,
  chainId: constants.StarknetChainId.TESTNET,
  slippage: 0,
  expiry: 100000000000,
  sources: [
    {
      name: 'Market market 1',
      address: '0x02ff3ec57e582ccc0c4ba0ede33cf5ce7b3924d6b8996e23b5046b5e7fdd12c5',
      percent: 1,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      sellAmount: parseUnits('1', 18),
      buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
      buyAmount: parseUnits('2', 18),
    },
  ],
});

export const anInvokeSwapResponse = (): InvokeSwapResponse => ({
  transactionHash: '0x0',
});

export const aBuildSwapTransaction = (): BuildSwapTransaction => ({
  chainId: constants.StarknetChainId.TESTNET,
  contractAddress: '0x0',
  entrypoint: 'execute',
  calldata: [],
});

export const ethToken = (): Token => ({
  name: 'Ethereum',
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  symbol: 'ETH',
  decimals: 18,
  chainId: '0x534e5f474f45524c49',
  logoUri:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
});

export const btcToken = (): Token => ({
  name: 'Wrapped Bitcoin',
  address: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  symbol: 'WBTC',
  decimals: 18,
  chainId: '0x534e5f474f45524c49',
  logoUri:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
});

export const aPair = (): Pair => ({
  token1: ethToken(),
  token2: btcToken(),
});

export const aPage = <T>(content: T[], size = 10, number = 0, totalPages = 1, totalElements = 1): Page<T> => ({
  content,
  size,
  totalPages,
  number,
  totalElements,
});
