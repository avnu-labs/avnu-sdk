import dayjs from 'dayjs';
import qs from 'qs';
import { z } from 'zod';
import { IMPULSE_API_VERSION, PRICES_API_VERSION } from './constants';
import { FeedDateRange, PriceFeedType } from './enums';
import {
  ByExchangeTVLDataSchema,
  ByExchangeVolumeDataSchema,
  CandlePriceDataSchema,
  ExchangeLineVolumeDataSchema,
  SimplePriceDataSchema,
  SimpleVolumeDataSchema,
  TokenMarketDataSchema,
  TokenPriceSchema,
} from './schemas';
import {
  AvnuOptions,
  ByExchangeTVLData,
  ByExchangeVolumeData,
  CandlePriceData,
  ExchangeLineVolumeData,
  FeedProps,
  PriceFeedProps,
  SimpleDateProps,
  SimpleFeedProps,
  SimplePriceData,
  SimpleVolumeData,
  TokenMarketData,
  TokenPriceResponse,
} from './types';
import { getImpulseBaseUrl, getRequest, parseResponseWithSchema, postRequest } from './utils';

/**
 * Internal utils to get the start and end dates for a given date range
 * @param dateRange The date range (ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR)
 * @param fullDate True if the date should be in full ISO format, false if it should be in YYYY-MM-DD format
 * @returns The start and end dates
 */
const getDatesFromRange = (dateRange?: FeedDateRange, fullDate: boolean = true) => {
  const now = dayjs();
  let start;
  switch (dateRange) {
    case FeedDateRange.ONE_HOUR:
      start = now.subtract(1, 'hour');
      break;
    case FeedDateRange.ONE_DAY:
      start = now.subtract(1, 'day');
      break;
    case FeedDateRange.ONE_WEEK:
      start = now.subtract(1, 'week');
      break;
    case FeedDateRange.ONE_MONTH:
      start = now.subtract(1, 'month');
      break;
    case FeedDateRange.ONE_YEAR:
      start = now.subtract(1, 'year');
      break;
    default:
      return undefined;
  }
  const format = 'YYYY-MM-DD';
  return {
    start: fullDate ? start.toISOString() : start.format(format),
    end: fullDate ? now.toISOString() : now.format(format),
  };
};

/**
 * Internal utils to get the date from a string
 * @param date The date string
 * @returns The date
 */
const getDate = (date: string | Date) => {
  return dayjs(date).toISOString();
};

/**
 * Internal utils to get the query params for a given date props
 * @param dateProps The date props (date)
 * @returns The query params
 */
const getDateQueryParams = (dateProps: SimpleDateProps) => {
  const date = dateProps.date ? getDate(dateProps.date) : undefined;
  return qs.stringify({ date }, { arrayFormat: 'repeat' });
};
/**
 * Internal utils to get the query params for a given feed props
 * @param feedProps The feed props (date range and resolution)
 * @param quoteTokenAddress The address of the quote token
 * @returns The query params
 */
const getFeedQueryParams = (feedProps: FeedProps, quoteTokenAddress?: string) => {
  const dates = getDatesFromRange(feedProps.dateRange, true);
  return qs.stringify(
    { resolution: feedProps.resolution, startDate: dates?.start, endDate: dates?.end, quoteTokenAddress },
    { arrayFormat: 'repeat' },
  );
};

/**
 * Internal utils to get the query params for a given simple feed props
 * @param simpleProps The simple feed props (date range)
 * @returns The query params
 */
const getSimpleQueryParams = (simpleProps: SimpleFeedProps) => {
  const dates = getDatesFromRange(simpleProps.dateRange, false);
  return qs.stringify({ startDate: dates?.start, endDate: dates?.end }, { arrayFormat: 'repeat' });
};

/**
 * Get the most popular tokens on Starknet, including their market data
 * @param options Optional SDK configuration
 * @returns The list of tokens with their market data
 */
const getMarketData = (options?: AvnuOptions): Promise<TokenMarketData[]> =>
  fetch(`${getImpulseBaseUrl(options)}/${IMPULSE_API_VERSION}/tokens`, getRequest(options)).then((response) =>
    parseResponseWithSchema(response, z.array(TokenMarketDataSchema), options?.avnuPublicKey),
  );

/**
 * Get the market data for a specific token
 * @param tokenAddress The address of the token
 * @param options Optional SDK configuration
 * @returns The market data for the token
 */
const getTokenMarketData = (tokenAddress: string, options?: AvnuOptions): Promise<TokenMarketData> =>
  fetch(`${getImpulseBaseUrl(options)}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}`, getRequest(options)).then(
    (response) => parseResponseWithSchema(response, TokenMarketDataSchema, options?.avnuPublicKey),
  );

/**
 * Get the price feed for a given token
 * @param tokenAddress The address of the token
 * @param feedProps.type The type of feed (LINE or CANDLE)
 * @param feedProps.dateRange The date range (ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR)
 * @param feedProps.resolution The resolution (1, 5, 15, 1H, 4H, 1D, 1W, 1M, 1Y)
 * @param quoteTokenAddress The address of the quoted token (optional)
 * @param options Optional SDK configuration
 * @returns The price feed data
 */
const getPriceFeed = (
  tokenAddress: string,
  feedProps: PriceFeedProps,
  quoteTokenAddress?: string,
  options?: AvnuOptions,
): Promise<SimplePriceData[] | CandlePriceData[]> => {
  const type = feedProps.type === PriceFeedType.CANDLE ? 'candle' : 'line';
  const queryParams = getFeedQueryParams(feedProps, quoteTokenAddress);
  const schema =
    feedProps.type === PriceFeedType.CANDLE ? z.array(CandlePriceDataSchema) : z.array(SimplePriceDataSchema);
  return fetch(
    `${getImpulseBaseUrl(options)}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/prices/${type}?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponseWithSchema(response, schema, options?.avnuPublicKey));
};

/**
 * Get the volume by exchange for a given token and a given date range
 * @param tokenAddress The address of the token
 * @param simpleProps.dateRange The date range (ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR)
 * @param options Optional SDK configuration
 * @returns The volume by exchange data
 */
const getVolumeByExchange = (
  tokenAddress: string,
  simpleProps: SimpleFeedProps,
  options?: AvnuOptions,
): Promise<ByExchangeVolumeData[]> => {
  const queryParams = getSimpleQueryParams(simpleProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-volumes?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponseWithSchema(response, z.array(ByExchangeVolumeDataSchema), options?.avnuPublicKey));
};

/**
 * Get the exchange volume feed for a given token
 * @param tokenAddress The address of the token
 * @param feedProps.type The type of feed (LINE or CANDLE)
 * @param feedProps.dateRange The date range (ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR)
 * @param feedProps.resolution The resolution (1, 5, 15, 1H, 4H, 1D, 1W, 1M, 1Y)
 * @param options Optional SDK configuration
 * @returns The exchange volume feed data
 */
const getExchangeVolumeFeed = (
  tokenAddress: string,
  feedProps: FeedProps,
  options?: AvnuOptions,
): Promise<ExchangeLineVolumeData[]> => {
  const queryParams = getFeedQueryParams(feedProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-volumes/line?${queryParams}`,
    getRequest(options),
  ).then((response) =>
    parseResponseWithSchema(response, z.array(ExchangeLineVolumeDataSchema), options?.avnuPublicKey),
  );
};

/**
 * Get the TVL by exchange for a given token and a given date range
 * @param tokenAddress The address of the token
 * @param simpleProps.dateRange The date range (ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR)
 * @param options Optional SDK configuration
 * @returns The TVL by exchange data
 */
const getTVLByExchange = (
  tokenAddress: string,
  simpleDateProps: SimpleDateProps,
  options?: AvnuOptions,
): Promise<ByExchangeTVLData[]> => {
  const queryParams = getDateQueryParams(simpleDateProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-tvl?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponseWithSchema(response, z.array(ByExchangeTVLDataSchema), options?.avnuPublicKey));
};

/**
 * Get the exchange TVL feed for a given token
 * @param tokenAddress The address of the token
 * @param feedProps.type The type of feed (LINE or CANDLE)
 * @param feedProps.dateRange The date range (ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR)
 * @param feedProps.resolution The resolution (1, 5, 15, 1H, 4H, 1D, 1W, 1M, 1Y)
 * @param options Optional SDK configuration
 * @returns The exchange TVL feed data
 */
const getExchangeTVLFeed = (
  tokenAddress: string,
  feedProps: FeedProps,
  options?: AvnuOptions,
): Promise<ByExchangeTVLData[]> => {
  const queryParams = getFeedQueryParams(feedProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-tvl/line?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponseWithSchema(response, z.array(ByExchangeTVLDataSchema), options?.avnuPublicKey));
};

/**
 * Get the transfer volume feed for a given token
 * @param tokenAddress The address of the token
 * @param feedProps.type The type of feed (LINE or CANDLE)
 * @param feedProps.dateRange The date range (ONE_HOUR, ONE_DAY, ONE_WEEK, ONE_MONTH, ONE_YEAR)
 * @param feedProps.resolution The resolution (1, 5, 15, 1H, 4H, 1D, 1W, 1M, 1Y)
 * @param options Optional SDK configuration
 * @returns The transfer volume feed data
 */
const getTransferVolumeFeed = (
  tokenAddress: string,
  feedProps: FeedProps,
  options?: AvnuOptions,
): Promise<SimpleVolumeData[]> => {
  const queryParams = getFeedQueryParams(feedProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/volumes/line?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponseWithSchema(response, z.array(SimpleVolumeDataSchema), options?.avnuPublicKey));
};

/**
 * Get the market prices for a given list of tokens
 * @param tokenAddresses The list of token addresses
 * @param options Optional SDK configuration
 * @returns The market prices for the tokens
 */
const getPrices = (tokenAddresses: string[], options?: AvnuOptions): Promise<TokenPriceResponse> => {
  const requestBody: { tokens: string[] } = {
    tokens: tokenAddresses,
  };
  return fetch(
    `${getImpulseBaseUrl(options)}/${PRICES_API_VERSION}/tokens/prices`,
    postRequest(requestBody, options),
  ).then((response) => parseResponseWithSchema(response, z.array(TokenPriceSchema), options?.avnuPublicKey));
};

export {
  getExchangeTVLFeed,
  getExchangeVolumeFeed,
  getMarketData,
  getPriceFeed,
  getPrices,
  getTokenMarketData,
  getTransferVolumeFeed,
  getTVLByExchange,
  getVolumeByExchange,
};
