import { parseUnits, toBeHex } from 'ethers';
import moment from 'moment';
import { constants } from 'starknet';
import { DcaOrderStatus, SourceType } from './enums';
import {
  CreateDcaOrder,
  DcaOrder,
  InvokeTransactionResponse,
  Page,
  Quote,
  QuoteRequest,
  Source,
  SwapCalls,
  Token,
  TokenPrice,
} from './types';

/* SWAP PART */

export const aPriceRequest = (): { tokens: string[] } => ({
  tokens: ['0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'],
});

export const aQuoteRequest = (): QuoteRequest => ({
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  size: 1,
  takerAddress: '0x0',
});

export const aPrice = (): TokenPrice => ({
  address: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  decimals: 18,
  globalMarket: { usd: 1700 },
  starknetMarket: { usd: 1700 },
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
  chainId: constants.StarknetChainId.SN_SEPOLIA,
  expiry: 100000000000,
  routes: [
    {
      name: 'AMM1',
      address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
      percent: 1,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
      routes: [],
      alternativeSwapCount: 0,
    },
  ],
  gasFees: BigInt('0x0'),
  gasFeesInUsd: 0,
  avnuFees: BigInt('0x0'),
  avnuFeesInUsd: 0,
  avnuFeesBps: BigInt('0x0'),
  integratorFees: BigInt('0x0'),
  integratorFeesInUsd: 0,
  integratorFeesBps: BigInt('0x0'),
  priceImpactInUsd: 0,
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
  chainId: constants.StarknetChainId.SN_SEPOLIA,
  expiry: 100000000000,
  priceImpactInUsd: 0,
  routes: [
    {
      name: 'AMM1',
      address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
      percent: 1,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buyTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
      alternativeSwapCount: 0,
      routes: [
        {
          name: 'AMM2',
          address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c662',
          percent: 1,
          sellTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
          buyTokenAddress: '0x2e2faab2cad8ecdde5e991798673ddcc08983b872304a66e5f99fbb24e14abc',
          alternativeSwapCount: 0,
          routes: [
            {
              name: 'AMM1',
              address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
              percent: 1,
              sellTokenAddress: '0x2e2faab2cad8ecdde5e991798673ddcc08983b872304a66e5f99fbb24e14abc',
              buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
              routes: [],
              alternativeSwapCount: 0,
            },
          ],
        },
      ],
    },
  ],
  gasFees: BigInt('0x0'),
  gasFeesInUsd: 0,
  avnuFees: BigInt('0x0'),
  avnuFeesInUsd: 0,
  avnuFeesBps: BigInt('0x0'),
  integratorFees: BigInt('0x0'),
  integratorFeesInUsd: 0,
  integratorFeesBps: BigInt('0x0'),
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
  chainId: constants.StarknetChainId.SN_SEPOLIA,
  expiry: 100000000000,
  gasFees: BigInt('0x0'),
  gasFeesInUsd: 0,
  avnuFees: BigInt('0x0'),
  avnuFeesInUsd: 0,
  avnuFeesBps: BigInt('0x0'),
  integratorFees: BigInt('0x0'),
  integratorFeesInUsd: 0,
  integratorFeesBps: BigInt('0x0'),
  priceImpactInUsd: 0,
  routes: [
    {
      name: 'AMM1',
      address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
      percent: 0.5,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buyTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
      alternativeSwapCount: 0,
      routes: [
        {
          name: 'AMM2',
          address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c662',
          percent: 0.5,
          sellTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
          buyTokenAddress: '0x2e2faab2cad8ecdde5e991798673ddcc08983b872304a66e5f99fbb24e14abc',
          alternativeSwapCount: 0,
          routes: [
            {
              name: 'AMM1',
              address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
              percent: 1,
              sellTokenAddress: '0x2e2faab2cad8ecdde5e991798673ddcc08983b872304a66e5f99fbb24e14abc',
              buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
              routes: [],
              alternativeSwapCount: 0,
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
          alternativeSwapCount: 0,
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
      alternativeSwapCount: 0,
    },
    {
      name: 'AMM1',
      address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
      percent: 0.3,
      sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      buyTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
      alternativeSwapCount: 0,
      routes: [
        {
          name: 'AMM2',
          address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c662',
          percent: 0.2,
          sellTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
          buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
          routes: [],
          alternativeSwapCount: 0,
        },
        {
          name: 'AMM1',
          address: '0x975910cd99bc56bd289eaaa5cee6cd557f0ddafdb2ce6ebea15b158eb2c661',
          percent: 0.8,
          sellTokenAddress: '0x3e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9',
          buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
          routes: [],
          alternativeSwapCount: 0,
        },
      ],
    },
  ],
});

export const anInvokeTransactionResponse = (): InvokeTransactionResponse => ({
  transactionHash: '0x0',
});

export const aSwapCalls = (): SwapCalls => ({
  chainId: constants.StarknetChainId.SN_SEPOLIA,
  calls: [
    {
      contractAddress: '0x0',
      entrypoint: 'execute',
      calldata: [],
    },
  ],
});

export const ethToken = (): Token => ({
  name: 'Ethereum',
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  symbol: 'ETH',
  decimals: 18,
  logoUri:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png',
  tags: ['AVNU'],
  lastDailyVolumeUsd: 0,
  extensions: {},
});

export const btcToken = (): Token => ({
  name: 'Wrapped Bitcoin',
  address: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  symbol: 'WBTC',
  decimals: 18,
  logoUri:
    'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png',
  tags: ['AVNU'],
  lastDailyVolumeUsd: 0,
  extensions: {},
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
  type: SourceType.DEX,
});

/* DCA PART */

export const aDCACreateOrder = (): CreateDcaOrder => ({
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: toBeHex(parseUnits('1', 18)),
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  sellAmountPerCycle: toBeHex(parseUnits('1', 18)),
  frequency: moment.duration('1'),
  pricingStrategy: {
    tokenToMinAmount: toBeHex(parseUnits('1', 18)),
    tokenToMaxAmount: toBeHex(parseUnits('1', 18)),
  },
  traderAddress: '0x0',
});

export const anOrderReceipt = (): DcaOrder => ({
  id: '1',
  blockNumber: 1,
  timestamp: new Date(),
  traderAddress: '0x0',
  orderAddress: '0x123',
  creationTransactionHash: '0x123',
  orderClassHash: '0x123',
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  sellAmountPerCycle: parseUnits('1', 18),
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  startDate: new Date(),
  endDate: new Date(),
  closeDate: new Date(),
  frequency: '1',
  iterations: 1,
  status: DcaOrderStatus.ACTIVE,
  pricingStrategy: {
    tokenToMinAmount: '1',
    tokenToMaxAmount: '1',
  },
  amountSold: parseUnits('1', 18),
  amountBought: parseUnits('1', 18),
  averageAmountBought: parseUnits('1', 18),
  executedTradesCount: 1,
  cancelledTradesCount: 1,
  pendingTradesCount: 1,
  trades: [],
});
