import { parseUnits, toBeHex } from 'ethers';
import fetchMock from 'fetch-mock';
import qs from 'qs';
import { BASE_URL } from './constants';
import { aPrice, aPriceRequest, aQuote, aQuoteRequest, aSource, aSwapCalls } from './fixtures';
import {
  calculateMaxSpendAmount,
  calculateMinReceivedAmount,
  getPrices,
  getQuotes,
  getSources,
  quoteToCalls,
} from './swap.services';

describe('Swap services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('getPrices', () => {
    it('should return a list of prices', async () => {
      // Given
      const request = aPriceRequest();
      const response = [
        {
          ...aPrice(),
          sellAmount: toBeHex(parseUnits('1', 18)),
          buyAmount: toBeHex(parseUnits('2', 18)),
          gasFees: '0x0',
        },
      ];
      const queryParams = { ...aPriceRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${BASE_URL}/swap/v2/prices?${qs.stringify(queryParams)}`, response);

      // When
      const result = await getPrices(request);

      // Then
      const expected = [{ ...aPrice() }];
      expect(result).toStrictEqual(expected);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const request = aPriceRequest();
      const baseUrl = 'https://example.com';
      const response = [
        {
          ...aPrice(),
          sellAmount: toBeHex(parseUnits('1', 18)),
          buyAmount: toBeHex(parseUnits('2', 18)),
          gasFees: '0x0',
        },
      ];
      const queryParams = { ...aPriceRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${baseUrl}/swap/v2/prices?${qs.stringify(queryParams)}`, response);

      // When
      const result = await getPrices(request, { baseUrl });

      // Then
      const expected = [{ ...aPrice() }];
      expect(result).toStrictEqual(expected);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      const request = aPriceRequest();
      const queryParams = { ...aPriceRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${BASE_URL}/swap/v2/prices?${qs.stringify(queryParams)}`, 401);

      // When
      try {
        await getPrices(request);
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });
  });

  describe('getQuotes', () => {
    it('should return a list of quotes', async () => {
      // Given
      const request = aQuoteRequest();
      const response = [
        {
          ...aQuote(),
          sellAmount: toBeHex(parseUnits('1', 18)),
          buyAmount: toBeHex(parseUnits('2', 18)),
          buyAmountWithoutFees: toBeHex(parseUnits('2', 18)),
          gasFees: '0x0',
          avnuFees: '0x0',
          integratorFees: '0x0',
          avnuFeesBps: '0x0',
          integratorFeesBps: '0x0',
        },
      ];
      const queryParams = { ...aQuoteRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${BASE_URL}/swap/v2/quotes?${qs.stringify(queryParams)}`, response);

      // When
      const result = await getQuotes(request);

      // Then
      const expected = [{ ...aQuote() }];
      expect(result).toStrictEqual(expected);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const request = aQuoteRequest();
      const baseUrl = 'https://example.com';
      const response = [
        {
          ...aQuote(),
          sellAmount: toBeHex(parseUnits('1', 18)),
          buyAmount: toBeHex(parseUnits('2', 18)),
          buyAmountWithoutFees: toBeHex(parseUnits('2', 18)),
          gasFees: '0x0',
          avnuFees: '0x0',
          integratorFees: '0x0',
          avnuFeesBps: '0x0',
          integratorFeesBps: '0x0',
        },
      ];
      const queryParams = { ...aQuoteRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${baseUrl}/swap/v2/quotes?${qs.stringify(queryParams)}`, response);

      // When
      const result = await getQuotes(request, { baseUrl });

      // Then
      const expected = [{ ...aQuote() }];
      expect(result).toStrictEqual(expected);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      const request = aQuoteRequest();
      const queryParams = { ...aQuoteRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${BASE_URL}/swap/v2/quotes?${qs.stringify(queryParams)}`, 401);

      // When
      try {
        await getQuotes(request);
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });
  });

  describe('quoteToCalls', () => {
    it('should return a SwapCalls', async () => {
      // Given
      const response = aSwapCalls();
      fetchMock.post(`${BASE_URL}/swap/v2/build`, response);

      // When
      const result = await quoteToCalls({ quoteId: '', takerAddress: '', slippage: 0.01 });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const baseUrl = 'https://example.com';
      const response = aSwapCalls();
      fetchMock.post(`${baseUrl}/swap/v2/build`, response);

      // When
      const result = await quoteToCalls({ quoteId: '', takerAddress: '', slippage: 0.01 }, { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.post(`${BASE_URL}/swap/v2/build`, 401);

      // When & Then
      expect.assertions(1);
      expect(quoteToCalls({ quoteId: '', takerAddress: '', slippage: 0.01 })).rejects.toEqual(
        Error('401 Unauthorized'),
      );
    });
  });

  describe('getSources', () => {
    it('should return a list of sources', async () => {
      // Given
      const response = [aSource()];
      fetchMock.get(`${BASE_URL}/swap/v2/sources`, response);

      // When
      const result = await getSources();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/v2/sources`, 401);

      // When
      try {
        await getSources();
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });
  });

  describe('calculateMinAmount', () => {
    it('should return min amount', () => {
      // Given
      const amount = BigInt(1000000);
      const slippage = 30;

      // When
      const result = calculateMinReceivedAmount(amount, slippage);

      // Then
      expect(result).toBe(BigInt(997000));
    });
  });

  describe('calculateMaxSpendAmount', () => {
    it('should return max spend amount', () => {
      // Given
      const amount = BigInt(1000000);
      const slippage = 30;

      // When
      const result = calculateMaxSpendAmount(amount, slippage);

      // Then
      expect(result).toBe(BigInt(1003000));
    });
  });
});
