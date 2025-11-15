import dayjs from 'dayjs';
import qs from 'qs';
import {
  AvnuOptions,
  ByExchangeTVLData,
  ByExchangeVolumeData,
  CandlePriceData,
  FeedDateRange,
  FeedProps,
  PriceFeedProps,
  PriceFeedType,
  SimpleFeedProps,
  SimplePriceData,
  SimpleVolumeData,
  TokenMarketData,
} from './types';
import { getImpulseBaseUrl, getRequest, parseResponse } from './utils';

const getMarketData = (options?: AvnuOptions): Promise<TokenMarketData[]> =>
  fetch(`${getImpulseBaseUrl(options)}/v1/tokens`, getRequest(options)).then((response) =>
    parseResponse<TokenMarketData[]>(response, options?.avnuPublicKey),
  );

const getTokenMarketData = (tokenAddress: string, options?: AvnuOptions): Promise<TokenMarketData> =>
  fetch(`${getImpulseBaseUrl(options)}/v1/tokens/${tokenAddress}`, getRequest(options)).then((response) =>
    parseResponse<TokenMarketData>(response, options?.avnuPublicKey),
  );

export const getDate = (dateRange?: FeedDateRange, fullDate: boolean = true) => {
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

const getFeedQueryParams = (feedProps: FeedProps, quoteTokenAddress?: string) => {
  const dates = getDate(feedProps.dateRange, true);
  return qs.stringify(
    { resolution: feedProps.resolution, startDate: dates?.start, endDate: dates?.end, in: quoteTokenAddress },
    { arrayFormat: 'repeat' },
  );
};

const getSimpleQueryParams = (simpleProps: SimpleFeedProps) => {
  const dates = getDate(simpleProps.dateRange, false);
  return qs.stringify({ startDate: dates?.start, endDate: dates?.end }, { arrayFormat: 'repeat' });
};

const getPriceFeed = (
  tokenAddress: string,
  feedProps: PriceFeedProps,
  quoteTokenAddress?: string,
  options?: AvnuOptions,
): Promise<SimplePriceData[] | CandlePriceData[]> => {
  const type = feedProps.type === PriceFeedType.CANDLE ? 'candle' : 'line';
  const queryParams = getFeedQueryParams(feedProps, quoteTokenAddress);
  return fetch(
    `${getImpulseBaseUrl(options)}/v1/tokens/${tokenAddress}/prices/${type}?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponse<SimplePriceData[] | CandlePriceData[]>(response, options?.avnuPublicKey));
};

const getVolumeByExchange = (
  tokenAddress: string,
  simpleProps: SimpleFeedProps,
  options?: AvnuOptions,
): Promise<ByExchangeVolumeData[]> => {
  const queryParams = getSimpleQueryParams(simpleProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/v1/tokens/${tokenAddress}/exchange-volumes?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponse<ByExchangeVolumeData[]>(response, options?.avnuPublicKey));
};

const getExchangeVolumeFeed = (
  tokenAddress: string,
  feedProps: FeedProps,
  options?: AvnuOptions,
): Promise<ByExchangeVolumeData[]> => {
  const queryParams = getFeedQueryParams(feedProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/v1/tokens/${tokenAddress}/exchange-volumes/line?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponse<ByExchangeVolumeData[]>(response, options?.avnuPublicKey));
};

const getTVLByExchange = (
  tokenAddress: string,
  simpleProps: SimpleFeedProps,
  options?: AvnuOptions,
): Promise<ByExchangeTVLData[]> => {
  const queryParams = getSimpleQueryParams(simpleProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/v1/tokens/${tokenAddress}/exchange-tvl?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponse<ByExchangeTVLData[]>(response, options?.avnuPublicKey));
};

const getExchangeTVLFeed = (
  tokenAddress: string,
  feedProps: FeedProps,
  options?: AvnuOptions,
): Promise<ByExchangeTVLData[]> => {
  const queryParams = getFeedQueryParams(feedProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/v1/tokens/${tokenAddress}/exchange-tvl/line?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponse<ByExchangeTVLData[]>(response, options?.avnuPublicKey));
};

const getTransferVolumeFeed = (
  tokenAddress: string,
  feedProps: FeedProps,
  options?: AvnuOptions,
): Promise<SimpleVolumeData[]> => {
  const queryParams = getFeedQueryParams(feedProps);
  return fetch(
    `${getImpulseBaseUrl(options)}/v1/tokens/${tokenAddress}/volumes/line?${queryParams}`,
    getRequest(options),
  ).then((response) => parseResponse<SimpleVolumeData[]>(response, options?.avnuPublicKey));
};

export {
  getExchangeTVLFeed,
  getExchangeVolumeFeed,
  getMarketData,
  getPriceFeed,
  getTokenMarketData,
  getTransferVolumeFeed,
  getTVLByExchange,
  getVolumeByExchange,
};
