import { parseUnits } from 'ethers';
import { constants } from 'starknet';
import {
  BuildSwapTransaction,
  InvokeSwapResponse,
  Page,
  Pair,
  Price,
  PriceRequest,
  Quote,
  QuoteRequest,
  Source,
  SourceType,
  Token,
} from './types';

export const aPriceRequest = (): PriceRequest => ({
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
});

export const aQuoteRequest = (): QuoteRequest => ({
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  size: 1,
  takerAddress: '0x0',
});

export const aPrice = (): Price => ({
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  sellAmountInUsd: 1700,
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  buyAmount: parseUnits('2', 18),
  buyAmountInUsd: 1700,
  blockNumber: 1,
  chainId: constants.StarknetChainId.SN_GOERLI,
  sourceName: 'AMM1',
  priceRatioUsd: 0,
});

export const aQuote = (): Quote => ({
  quoteId: 'quoteId',
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  sellAmountInUsd: 1700,
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  buyAmount: parseUnits('2', 18),
  buyAmountInUsd: 1700,
  buyAmountWithoutFees: parseUnits('2', 18),
  buyAmountWithoutFeesInUsd: 1700,
  blockNumber: 1,
  chainId: constants.StarknetChainId.SN_GOERLI,
  expiry: 100000000000,
  routes: [
    {
      name: 'AMM1',
      address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
      percent: 1,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
      routes: [],
    },
  ],
  avnuFees: BigInt('0x0'),
  avnuFeesInUsd: 0,
  avnuFeesBps: BigInt('0x0'),
  integratorFees: BigInt('0x0'),
  integratorFeesInUsd: 0,
  integratorFeesBps: BigInt('0x0'),
  priceRatioUsd: 0,
  liquiditySource: 'DEX_AGGREGATOR',
  suggestedSolution: undefined,
});

export const aQuoteWithManySubRoutes = (): Quote => ({
  quoteId: 'quoteId',
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  sellAmountInUsd: 1700,
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  buyAmount: parseUnits('2', 18),
  buyAmountInUsd: 1700,
  buyAmountWithoutFees: parseUnits('2', 18),
  buyAmountWithoutFeesInUsd: 1700,
  blockNumber: 1,
  chainId: constants.StarknetChainId.SN_GOERLI,
  expiry: 100000000000,
  priceRatioUsd: 0,
  liquiditySource: 'DEX_AGGREGATOR',
  routes: [
    {
      name: 'AMM1',
      address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
      percent: 1,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buyTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
      routes: [
        {
          name: 'AMM2',
          address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c662',
          percent: 1,
          sellTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
          buyTokenAddress: '0x2e2faab2cad8ecdde5e991798673ddcc08983b872304a66e5f99fbb24e14abc',
          routes: [
            {
              name: 'AMM1',
              address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
              percent: 1,
              sellTokenAddress: '0x2e2faab2cad8ecdde5e991798673ddcc08983b872304a66e5f99fbb24e14abc',
              buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
              routes: [],
            },
          ],
        },
      ],
    },
  ],
  avnuFees: BigInt('0x0'),
  avnuFeesInUsd: 0,
  avnuFeesBps: BigInt('0x0'),
  integratorFees: BigInt('0x0'),
  integratorFeesInUsd: 0,
  integratorFeesBps: BigInt('0x0'),
  suggestedSolution: undefined,
});

export const aQuoteWithManyComplexRoutes = (): Quote => ({
  quoteId: 'quoteId',
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  sellAmountInUsd: 1700,
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  buyAmount: parseUnits('2', 18),
  buyAmountInUsd: 1700,
  buyAmountWithoutFees: parseUnits('2', 18),
  buyAmountWithoutFeesInUsd: 1700,
  blockNumber: 1,
  chainId: constants.StarknetChainId.SN_GOERLI,
  expiry: 100000000000,
  avnuFees: BigInt('0x0'),
  avnuFeesInUsd: 0,
  avnuFeesBps: BigInt('0x0'),
  integratorFees: BigInt('0x0'),
  integratorFeesInUsd: 0,
  integratorFeesBps: BigInt('0x0'),
  priceRatioUsd: 0,
  liquiditySource: 'DEX_AGGREGATOR',
  routes: [
    {
      name: 'AMM1',
      address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
      percent: 0.5,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buyTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
      routes: [
        {
          name: 'AMM2',
          address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c662',
          percent: 0.5,
          sellTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
          buyTokenAddress: '0x2e2faab2cad8ecdde5e991798673ddcc08983b872304a66e5f99fbb24e14abc',
          routes: [
            {
              name: 'AMM1',
              address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
              percent: 1,
              sellTokenAddress: '0x2e2faab2cad8ecdde5e991798673ddcc08983b872304a66e5f99fbb24e14abc',
              buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
              routes: [],
            },
          ],
        },
        {
          name: 'AMM1',
          address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
          percent: 0.5,
          sellTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
          buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
          routes: [],
        },
      ],
    },
    {
      name: 'AMM1',
      address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
      percent: 0.2,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
      routes: [],
    },
    {
      name: 'AMM1',
      address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
      percent: 0.3,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buyTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
      routes: [
        {
          name: 'AMM2',
          address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c662',
          percent: 0.2,
          sellTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
          buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
          routes: [],
        },
        {
          name: 'AMM1',
          address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
          percent: 0.8,
          sellTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
          buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
          routes: [],
        },
      ],
    },
  ],
  suggestedSolution: undefined,
});

export const anInvokeSwapResponse = (): InvokeSwapResponse => ({
  transactionHash: '0x0',
});

export const aBuildSwapTransaction = (): BuildSwapTransaction => ({
  chainId: constants.StarknetChainId.SN_GOERLI,
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

export const aSource = (): Source => ({
  name: 'AMM1',
  address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
  icon: 'https://pbs.twimg.com/profile_images/1567441002063069184/SGtDtW-C_400x400.jpg',
  type: SourceType.DEX,
});
