import { parseUnits, toBeHex } from 'ethers';
import fetchMock from 'fetch-mock';
import qs from 'qs';
import { BASE_URL } from './constants';
import {
  aBuildSwapTransaction,
  anInvokeSwapResponse,
  aPage,
  aPrice,
  aPriceRequest,
  aQuote,
  aQuoteRequest,
  aSource,
  ethToken,
} from './fixtures';
import {
  calculateMinAmount,
  fetchBuildExecuteTransaction,
  fetchExecuteSwapTransaction,
  fetchPrices,
  fetchQuotes,
  fetchSources,
  fetchTokens,
} from './services';

describe('Avnu services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('fetchPrices', () => {
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
      const result = await fetchPrices(request);

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
      const result = await fetchPrices(request, { baseUrl });

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
        await fetchPrices(request);
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });
  });

  describe('fetchQuotes', () => {
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
      const result = await fetchQuotes(request);

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
      const result = await fetchQuotes(request, { baseUrl });

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
        await fetchQuotes(request);
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });
  });

  describe('fetchExecuteSwapTransaction', () => {
    it('should return an InvokeSwapResponse', async () => {
      // Given
      const response = anInvokeSwapResponse();
      fetchMock.post(`${BASE_URL}/swap/v2/execute`, response);

      // When
      const result = await fetchExecuteSwapTransaction('quoteId', []);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const baseUrl = 'https://example.com';
      const response = anInvokeSwapResponse();
      fetchMock.post(`${baseUrl}/swap/v2/execute`, response);

      // When
      const result = await fetchExecuteSwapTransaction('quoteId', [], { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.post(`${BASE_URL}/swap/v2/execute`, 401);

      // When & Then
      expect.assertions(1);
      expect(fetchExecuteSwapTransaction('quoteId', [])).rejects.toEqual(Error('401 Unauthorized'));
    });
  });

  describe('fetchBuildExecuteTransaction', () => {
    it('should return a BuildSwapTransaction', async () => {
      // Given
      const response = aBuildSwapTransaction();
      fetchMock.post(`${BASE_URL}/swap/v2/build`, response);

      // When
      const result = await fetchBuildExecuteTransaction('quoteId', '');

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const baseUrl = 'https://example.com';
      const response = aBuildSwapTransaction();
      fetchMock.post(`${baseUrl}/swap/v2/build`, response);

      // When
      const result = await fetchBuildExecuteTransaction('quoteId', '', undefined, true, { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.post(`${BASE_URL}/swap/v2/build`, 401);

      // When & Then
      expect.assertions(1);
      expect(fetchBuildExecuteTransaction('quoteId', '')).rejects.toEqual(Error('401 Unauthorized'));
    });
  });

  describe('fetchTokens', () => {
    it('should return a page of tokens', async () => {
      // Given
      const response = aPage([ethToken()]);
      fetchMock.get(`${BASE_URL}/swap/v2/tokens?`, response);

      // When
      const result = await fetchTokens();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/v2/tokens?`, 401);

      // When
      try {
        await fetchTokens();
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });
  });

  describe('fetchSources', () => {
    it('should return a list of sources', async () => {
      // Given
      const response = [aSource()];
      fetchMock.get(`${BASE_URL}/swap/v2/sources`, response);

      // When
      const result = await fetchSources();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/v2/sources`, 401);

      // When
      try {
        await fetchSources();
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
      const result = calculateMinAmount(amount, slippage);

      // Then
      expect(result).toBe(BigInt(997000));
    });
  });
});
