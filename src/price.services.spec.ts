import fetchMock from 'fetch-mock';
import qs from 'qs';
import { BASE_URL, IMPULSE_BASE_URL } from './constants';
import { aPrice, aPriceRequest } from './fixtures';
import { getPrices } from './price.services';
import { TokenPriceResponse } from './types';

describe('Price services', () => {
  beforeEach(() => {
    fetchMock.restore();
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
      fetchMock.post(`${IMPULSE_BASE_URL}/v3/tokens/prices`, response);

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

      fetchMock.post(`${impulseBaseUrl}/v3/tokens/prices`, response);

      // When
      const result = await getPrices(request.tokens, { impulseBaseUrl });

      // Then
      const expected = [{ ...aPrice() }];
      expect(result).toStrictEqual(expected);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      const request = aPriceRequest();
      fetchMock.post(`${IMPULSE_BASE_URL}/v3/tokens/prices`, 401);

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
