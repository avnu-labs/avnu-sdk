import fetchMock from 'fetch-mock';
import { IMPULSE_API_VERSION, IMPULSE_BASE_URL, PRICES_API_VERSION } from './constants';
import { FeedDateRange, FeedResolution, PriceFeedType } from './enums';
import {
  aCandlePriceData,
  aDataPoint,
  aDataPointWithUsd,
  anExchangeDataPoint,
  anExchangeRangeDataPoint,
  aPrice,
  aPriceRequest,
  aTokenMarketData,
} from './fixtures';
import {
  getExchangeTVLFeed,
  getExchangeVolumeFeed,
  getMarketData,
  getPriceFeed,
  getPrices,
  getTokenMarketData,
  getTransferVolumeFeed,
  getTVLByExchange,
  getVolumeByExchange,
} from './impulse.services';
import { TokenPriceResponse } from './types';

describe('Impulse services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('getMarketData', () => {
    it('should return a list of TokenMarketData', async () => {
      // Given
      const response = [aTokenMarketData()];
      fetchMock.get(`${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens`, response);

      // When
      const result = await getMarketData();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      fetchMock.get(`${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens`, 401);

      // When
      try {
        await getMarketData();
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });

    it('should use impulseBaseUrl from AvnuOptions when defined', async () => {
      // Given
      const impulseBaseUrl = 'https://example.com';
      const response = [aTokenMarketData()];
      fetchMock.get(`${impulseBaseUrl}/${IMPULSE_API_VERSION}/tokens`, response);

      // When
      const result = await getMarketData({ impulseBaseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });
  });

  describe('getTokenMarketData', () => {
    it('should return TokenMarketData for a specific token', async () => {
      // Given
      const tokenAddress = '0x0token';
      const response = aTokenMarketData();
      fetchMock.get(`${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}`, response);

      // When
      const result = await getTokenMarketData(tokenAddress);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      const tokenAddress = '0x0invalid';
      fetchMock.get(`${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}`, 404);

      // When
      try {
        await getTokenMarketData(tokenAddress);
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('404 Not Found'));
      }
      expect.assertions(1);
    });
  });

  describe('getPriceFeed', () => {
    it('should return DataPoint[] for LINE type', async () => {
      // Given
      const tokenAddress = '0x0token';
      const feedProps = {
        type: PriceFeedType.LINE,
        dateRange: FeedDateRange.ONE_DAY,
        resolution: FeedResolution.HOURLY,
      };
      const response = [aDataPoint()];
      fetchMock.get(`begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/prices/line?`, response);

      // When
      const result = await getPriceFeed(tokenAddress, feedProps);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should return CandlePriceData[] for CANDLE type', async () => {
      // Given
      const tokenAddress = '0x0token';
      const feedProps = {
        type: PriceFeedType.CANDLE,
        dateRange: FeedDateRange.ONE_DAY,
        resolution: FeedResolution.HOURLY,
      };
      const response = [aCandlePriceData()];
      fetchMock.get(`begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/prices/candle?`, response);

      // When
      const result = await getPriceFeed(tokenAddress, feedProps);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should include quoteTokenAddress in request', async () => {
      // Given
      const tokenAddress = '0x0token';
      const quoteTokenAddress = '0x0quote';
      const feedProps = {
        type: PriceFeedType.LINE,
        dateRange: FeedDateRange.ONE_DAY,
        resolution: FeedResolution.HOURLY,
      };
      const response = [aDataPoint()];
      fetchMock.get(`begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/prices/line?`, response);

      // When
      const result = await getPriceFeed(tokenAddress, feedProps, quoteTokenAddress);

      // Then
      expect(result).toStrictEqual(response);
      const [url] = fetchMock.lastCall() || [];
      expect(url).toContain('quoteTokenAddress=0x0quote');
    });
  });

  describe('getVolumeByExchange', () => {
    it('should return ExchangeRangeDataPoint[]', async () => {
      // Given
      const tokenAddress = '0x0token';
      const simpleProps = { dateRange: FeedDateRange.ONE_DAY };
      const response = [anExchangeRangeDataPoint()];
      fetchMock.get(
        `begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-volumes?`,
        response,
      );

      // When
      const result = await getVolumeByExchange(tokenAddress, simpleProps);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should apply dateRange filter', async () => {
      // Given
      const tokenAddress = '0x0token';
      const simpleProps = { dateRange: FeedDateRange.ONE_WEEK };
      const response = [anExchangeRangeDataPoint()];
      fetchMock.get(
        `begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-volumes?`,
        response,
      );

      // When
      const result = await getVolumeByExchange(tokenAddress, simpleProps);

      // Then
      expect(result).toStrictEqual(response);
      const [url] = fetchMock.lastCall() || [];
      expect(url).toContain('startDate=');
      expect(url).toContain('endDate=');
    });
  });

  describe('getExchangeVolumeFeed', () => {
    it('should return ExchangeDataPoint[]', async () => {
      // Given
      const tokenAddress = '0x0token';
      const feedProps = { dateRange: FeedDateRange.ONE_DAY, resolution: FeedResolution.HOURLY };
      const response = [anExchangeDataPoint()];
      fetchMock.get(
        `begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-volumes/line?`,
        response,
      );

      // When
      const result = await getExchangeVolumeFeed(tokenAddress, feedProps);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should apply resolution filter', async () => {
      // Given
      const tokenAddress = '0x0token';
      const feedProps = { dateRange: FeedDateRange.ONE_DAY, resolution: FeedResolution.DAILY };
      const response = [anExchangeDataPoint()];
      fetchMock.get(
        `begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-volumes/line?`,
        response,
      );

      // When
      const result = await getExchangeVolumeFeed(tokenAddress, feedProps);

      // Then
      expect(result).toStrictEqual(response);
      const [url] = fetchMock.lastCall() || [];
      expect(url).toContain('resolution=1D');
    });
  });

  describe('getTVLByExchange', () => {
    it('should return ExchangeDataPoint[]', async () => {
      // Given
      const tokenAddress = '0x0token';
      const response = [anExchangeDataPoint()];
      fetchMock.get(`begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-tvl?`, response);

      // When
      const result = await getTVLByExchange(tokenAddress, {});

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should apply date filter as string', async () => {
      // Given
      const tokenAddress = '0x0token';
      const simpleProps = { date: '2024-01-01' };
      const response = [anExchangeDataPoint()];
      fetchMock.get(`begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-tvl?`, response);

      // When
      const result = await getTVLByExchange(tokenAddress, simpleProps);

      // Then
      expect(result).toStrictEqual(response);
      const [url] = fetchMock.lastCall() || [];
      expect(url).toContain('date=');
    });

    it('should apply date filter as Date', async () => {
      // Given
      const tokenAddress = '0x0token';
      const simpleProps = { date: new Date('2024-01-01') };
      const response = [anExchangeDataPoint()];
      fetchMock.get(`begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-tvl?`, response);

      // When
      const result = await getTVLByExchange(tokenAddress, simpleProps);

      // Then
      expect(result).toStrictEqual(response);
      const [url] = fetchMock.lastCall() || [];
      expect(url).toContain('date=');
    });

    it('should apply date filter as undefined', async () => {
      // Given
      const tokenAddress = '0x0token';
      const response = [anExchangeDataPoint()];
      fetchMock.get(`begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-tvl?`, response);

      // When
      const result = await getTVLByExchange(tokenAddress, {});

      // Then
      expect(result).toStrictEqual(response);
      const [url] = fetchMock.lastCall() || [];
      expect(url).not.toContain('date=');
    });
  });

  describe('getExchangeTVLFeed', () => {
    it('should return ExchangeDataPoint[]', async () => {
      // Given
      const tokenAddress = '0x0token';
      const feedProps = { dateRange: FeedDateRange.ONE_DAY, resolution: FeedResolution.HOURLY };
      const response = [anExchangeDataPoint()];
      fetchMock.get(
        `begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-tvl/line?`,
        response,
      );

      // When
      const result = await getExchangeTVLFeed(tokenAddress, feedProps);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should apply resolution filter', async () => {
      // Given
      const tokenAddress = '0x0token';
      const feedProps = { dateRange: FeedDateRange.ONE_DAY, resolution: FeedResolution.FOUR_HOUR };
      const response = [anExchangeDataPoint()];
      fetchMock.get(
        `begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/exchange-tvl/line?`,
        response,
      );

      // When
      const result = await getExchangeTVLFeed(tokenAddress, feedProps);

      // Then
      expect(result).toStrictEqual(response);
      const [url] = fetchMock.lastCall() || [];
      expect(url).toContain('resolution=4H');
    });
  });

  describe('getTransferVolumeFeed', () => {
    it('should return DataPointWithUsd[]', async () => {
      // Given
      const tokenAddress = '0x0token';
      const feedProps = { dateRange: FeedDateRange.ONE_DAY, resolution: FeedResolution.HOURLY };
      const response = [aDataPointWithUsd()];
      fetchMock.get(`begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/volumes/line?`, response);

      // When
      const result = await getTransferVolumeFeed(tokenAddress, feedProps);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should apply resolution filter', async () => {
      // Given
      const tokenAddress = '0x0token';
      const feedProps = { dateRange: FeedDateRange.ONE_DAY, resolution: FeedResolution.WEEKLY };
      const response = [aDataPointWithUsd()];
      fetchMock.get(`begin:${IMPULSE_BASE_URL}/${IMPULSE_API_VERSION}/tokens/${tokenAddress}/volumes/line?`, response);

      // When
      const result = await getTransferVolumeFeed(tokenAddress, feedProps);

      // Then
      expect(result).toStrictEqual(response);
      const [url] = fetchMock.lastCall() || [];
      expect(url).toContain('resolution=1W');
    });
  });

  describe('getPrices', () => {
    it('should return a list of prices', async () => {
      // Given
      const request = aPriceRequest();
      const response: TokenPriceResponse = [
        {
          address: '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
          decimals: 18,
          globalMarket: { usd: 1700 },
          starknetMarket: { usd: 1700 },
        },
      ];
      fetchMock.post(`${IMPULSE_BASE_URL}/${PRICES_API_VERSION}/tokens/prices`, response);

      // When
      const result = await getPrices(request.tokens);

      // Then
      const expected = [{ ...aPrice() }];
      expect(result).toStrictEqual(expected);
    });

    it('should use impulseBaseUrl from AvnuOption when defined', async () => {
      // Given
      const request = aPriceRequest();
      const impulseBaseUrl = 'https://example.com';
      const response: TokenPriceResponse = [
        {
          ...aPrice(),
        },
      ];

      fetchMock.post(`${impulseBaseUrl}/${PRICES_API_VERSION}/tokens/prices`, response);

      // When
      const result = await getPrices(request.tokens, { impulseBaseUrl });

      // Then
      const expected = [{ ...aPrice() }];
      expect(result).toStrictEqual(expected);
    });

    it('should throw Error with status code and text when status is higher than 400', async () => {
      // Given
      const request = aPriceRequest();
      fetchMock.post(`${IMPULSE_BASE_URL}/${PRICES_API_VERSION}/tokens/prices`, 401);

      // When
      try {
        await getPrices(request.tokens);
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });
  });
});
