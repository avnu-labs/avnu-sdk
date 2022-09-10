import { parseUnits } from '@ethersproject/units/src.ts';
import { Quote, QuoteRequest, Transaction } from './types';

export const aQuoteRequest = (): QuoteRequest => ({
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18).toString(),
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  size: 1,
  takerAddress: '0x0',
});

export const aQuote = (): Quote => ({
  quoteId: 'quoteId',
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18).toString(),
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  buyAmount: parseUnits('2', 18).toString(),
  blockNumber: 1,
  chainId: 1001,
  slippage: 0,
  expiry: 100000000000,
  sources: [
    {
      name: 'Market market 1',
      percent: 1,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      sellAmount: parseUnits('1', 18).toString(),
      buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
      buyAmount: parseUnits('2', 18).toString(),
    },
  ],
});

export const aTransaction = (): Transaction => ({
  contractAddress: '0x0',
  chainId: 1001,
  calldata: [],
  entrypoint: 'execute',
});
