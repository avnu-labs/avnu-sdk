import { OutsideExecutionTypedData } from '@starknet-io/starknet-types-09';
import { parseUnits, toBeHex } from 'ethers';
import moment from 'moment';
import { Call, constants } from 'starknet';
import { DcaOrderStatus, SourceType } from './enums';
import {
  Action,
  Apr,
  AvnuCalls,
  CandlePriceData,
  CreateDcaOrder,
  DataPoint,
  DataPointWithUsd,
  DcaOrder,
  DelegationPool,
  ExchangeDataPoint,
  ExchangeRangeDataPoint,
  GlobalMarket,
  InvokeTransactionResponse,
  Page,
  Quote,
  QuoteRequest,
  SignedPaymasterTransaction,
  Source,
  StakingInfo,
  StarknetMarket,
  Token,
  TokenMarketData,
  TokenPrice,
  UserStakingInfo,
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
  fee: {
    feeToken: '0x0',
    avnuFees: BigInt('0x0'),
    avnuFeesInUsd: 0,
    avnuFeesBps: BigInt('0x0'),
    integratorFees: BigInt('0x0'),
    integratorFeesInUsd: 0,
    integratorFeesBps: BigInt('0x0'),
  },
  priceImpact: 0,
});

export const aQuoteWithManySubRoutes = (): Quote => ({
  quoteId: 'quoteId',
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  sellAmountInUsd: 1700,
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  buyAmount: parseUnits('2', 18),
  buyAmountInUsd: 1700,
  fee: {
    feeToken: '0x0',
    avnuFees: BigInt('0x0'),
    avnuFeesInUsd: 0,
    avnuFeesBps: BigInt('0x0'),
    integratorFees: BigInt('0x0'),
    integratorFeesInUsd: 0,
    integratorFeesBps: BigInt('0x0'),
  },
  blockNumber: 1,
  chainId: constants.StarknetChainId.SN_SEPOLIA,
  expiry: 100000000000,
  priceImpact: 0,
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
});

export const aQuoteWithManyComplexRoutes = (): Quote => ({
  quoteId: 'quoteId',
  sellTokenAddress: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  sellAmount: parseUnits('1', 18),
  sellAmountInUsd: 1700,
  buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
  buyAmount: parseUnits('2', 18),
  buyAmountInUsd: 1700,
  fee: {
    feeToken: '0x0',
    avnuFees: BigInt('0x0'),
    avnuFeesInUsd: 0,
    avnuFeesBps: BigInt('0x0'),
    integratorFees: BigInt('0x0'),
    integratorFeesInUsd: 0,
    integratorFeesBps: BigInt('0x0'),
  },
  blockNumber: 1,
  chainId: constants.StarknetChainId.SN_SEPOLIA,
  expiry: 100000000000,
  gasFees: BigInt('0x0'),
  gasFeesInUsd: 0,
  priceImpact: 0,
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

export const aAvnuCalls = (): AvnuCalls => ({
  chainId: constants.StarknetChainId.SN_SEPOLIA,
  calls: [
    {
      contractAddress: '0x0',
      entrypoint: 'execute',
      calldata: [],
    },
  ],
});

export const aCall = (overrides: Partial<Call> = {}): Call => ({
  contractAddress: '0xcontract',
  entrypoint: 'transfer',
  calldata: ['0x1', '0x2'],
  ...overrides,
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

export const aDCAOrder = (): DcaOrder => ({
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

/* STAKING PART */

export const aDelegationPool = (): DelegationPool => ({
  poolAddress: '0x0pool1',
  tokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  stakedAmount: parseUnits('500', 18),
  stakedAmountInUsd: 850000,
  apr: 5.5,
});

export const aStakingInfo = (): StakingInfo => ({
  selfStakedAmount: parseUnits('1000', 18),
  selfStakedAmountInUsd: 1700000,
  operationalAddress: '0x0operational',
  rewardAddress: '0x0reward',
  stakerAddress: '0x0staker',
  commission: 5,
  delegationPools: [aDelegationPool()],
});

export const anApr = (): Apr => ({
  date: new Date('2024-01-01'),
  apr: 5.5,
});

export const anAction = (): Action => ({
  blockNumber: BigInt(1000),
  date: new Date('2024-01-01'),
  transactionHash: '0x0txhash',
  gasFee: {
    gasFeeAmount: BigInt('1000000000000000'),
    gasFeeAmountUsd: 0.01,
    gasFeeTokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  },
  type: 'Swap',
  metadata: {
    sellTokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    sellAmount: parseUnits('1', 18),
    sellAmountUsd: 1700,
    buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
    buyAmount: parseUnits('1700', 6),
    buyAmountUsd: 1700,
  },
});

export const aUserStakingInfo = (): UserStakingInfo => ({
  tokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  tokenPriceInUsd: 1700,
  poolAddress: '0x0pool1',
  userAddress: '0x0user',
  amount: parseUnits('100', 18),
  amountInUsd: 170000,
  unclaimedRewards: parseUnits('10', 18),
  unclaimedRewardsInUsd: 17000,
  unpoolAmount: BigInt(0),
  unpoolAmountInUsd: 0,
  unpoolTime: undefined,
  totalClaimedRewards: parseUnits('5', 18),
  totalClaimedRewardsHistoricalUsd: 8000,
  totalClaimedRewardsUsd: 8500,
  userActions: [],
  totalUserActionsCount: 0,
  expectedYearlyStrkRewards: parseUnits('50', 18),
  aprs: [anApr()],
});

/* PAYMASTER PART */

export const aPreparedTypedData = (): OutsideExecutionTypedData =>
  ({
    domain: { name: 'test', version: '1', chainId: '0x1' },
    message: {},
    types: {},
    primaryType: 'test',
  }) as unknown as OutsideExecutionTypedData;

export const aSignedPaymasterTransaction = (): SignedPaymasterTransaction => ({
  typedData: aPreparedTypedData(),
  signature: ['0x1', '0x2'],
});

/* IMPULSE / MARKET DATA PART */

export const aStarknetMarket = (): StarknetMarket => ({
  usd: 1700,
  usdTvl: 50000000,
  usdPriceChange1h: 0.5,
  usdPriceChangePercentage1h: 0.03,
  usdPriceChange24h: 10,
  usdPriceChangePercentage24h: 0.6,
  usdPriceChange7d: 50,
  usdPriceChangePercentage7d: 3,
  usdVolume24h: 1000000,
  usdTradingVolume24h: 900000,
});

export const aGlobalMarket = (): GlobalMarket => ({
  usd: 1700,
  usdMarketCap: 200000000000,
  usdFdv: 200000000000,
  usdMarketCapChange24h: 1000000,
  usdMarketCapChangePercentage24h: 0.5,
});

export const aDataPoint = (): DataPoint => ({
  date: '2024-01-01T00:00:00Z',
  value: 1700,
});

export const aCandlePriceData = (): CandlePriceData => ({
  date: '2024-01-01T00:00:00Z',
  open: 1690,
  high: 1720,
  low: 1680,
  close: 1700,
  volume: 1000000,
});

export const aDataPointWithUsd = (): DataPointWithUsd => ({
  date: '2024-01-01T00:00:00Z',
  value: 1000000,
  valueUsd: 1000000,
});

export const anExchangeRangeDataPoint = (): ExchangeRangeDataPoint => ({
  value: 500000,
  valueUsd: 500000,
  exchange: 'JediSwap',
  startDate: '2024-01-01',
  endDate: '2024-01-02',
});

export const anExchangeDataPoint = (): ExchangeDataPoint => ({
  date: '2024-01-01T00:00:00Z',
  value: 500000,
  valueUsd: 500000,
  exchange: 'JediSwap',
});

export const aTokenMarketData = (): TokenMarketData => ({
  name: 'Ethereum',
  symbol: 'ETH',
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  decimals: 18,
  logoUri: 'https://example.com/eth.png',
  coingeckoId: 'ethereum',
  verified: true,
  starknet: aStarknetMarket(),
  global: aGlobalMarket(),
  tags: ['Verified'],
  linePriceFeedInUsd: [aDataPoint()],
});
