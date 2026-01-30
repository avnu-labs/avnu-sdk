import { parseUnits, toBeHex } from 'ethers';
import fetchMock from 'fetch-mock';
import qs from 'qs';
import { BASE_URL, SWAP_API_VERSION } from './constants';
import { aAvnuCalls, aQuote, aQuoteRequest, aSource } from './fixtures';
import {
  calculateMaxSpendAmount,
  calculateMinReceivedAmount,
  getQuotes,
  getSources,
  quoteToCalls,
} from './swap.services';

describe('Swap services', () => {
  beforeEach(() => {
    fetchMock.restore();
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
          gasFees: '0x0',
          fee: {
            feeToken: '0x0',
            avnuFees: '0x0',
            avnuFeesInUsd: 0,
            avnuFeesBps: '0x0',
            integratorFees: '0x0',
            integratorFeesInUsd: 0,
            integratorFeesBps: '0x0',
          },
        },
      ];
      const queryParams = { ...aQuoteRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${BASE_URL}/swap/${SWAP_API_VERSION}/quotes?${qs.stringify(queryParams)}`, response);

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
          gasFees: '0x0',
          fee: {
            feeToken: '0x0',
            avnuFees: '0x0',
            avnuFeesInUsd: 0,
            avnuFeesBps: '0x0',
            integratorFees: '0x0',
            integratorFeesInUsd: 0,
            integratorFeesBps: '0x0',
          },
        },
      ];
      const queryParams = { ...aQuoteRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${baseUrl}/swap/${SWAP_API_VERSION}/quotes?${qs.stringify(queryParams)}`, response);

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
      fetchMock.get(`${BASE_URL}/swap/${SWAP_API_VERSION}/quotes?${qs.stringify(queryParams)}`, 401);

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

  describe('getSources', () => {
    it('should return a list of sources', async () => {
      // Given
      const response = [aSource()];
      fetchMock.get(`${BASE_URL}/swap/${SWAP_API_VERSION}/sources`, response);

      // When
      const result = await getSources();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/${SWAP_API_VERSION}/sources`, 401);

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

  describe('quoteToCalls', () => {
    it('should return AvnuCalls', async () => {
      // Given
      const response = aAvnuCalls();
      fetchMock.post(`${BASE_URL}/swap/${SWAP_API_VERSION}/build`, response);

      // When
      const result = await quoteToCalls({ quoteId: '', takerAddress: '', slippage: 0.01 });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const baseUrl = 'https://example.com';
      const response = aAvnuCalls();
      fetchMock.post(`${baseUrl}/swap/${SWAP_API_VERSION}/build`, response);

      // When
      const result = await quoteToCalls({ quoteId: '', takerAddress: '', slippage: 0.01 }, { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.post(`${BASE_URL}/swap/${SWAP_API_VERSION}/build`, 401);

      // When & Then
      expect.assertions(1);
      expect(quoteToCalls({ quoteId: '', takerAddress: '', slippage: 0.01 })).rejects.toEqual(
        Error('401 Unauthorized'),
      );
    });
  });

  describe('calculateMinAmount', () => {
    it('should return min amount', () => {
      // Given
      const amount = BigInt(1000000);
      const slippage = 0.003; // 0.3%

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
      const slippage = 0.003; // 0.3%

      // When
      const result = calculateMaxSpendAmount(amount, slippage);

      // Then
      expect(result).toBe(BigInt(1003000));
    });
  });
});
