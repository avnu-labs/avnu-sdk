import fetchMock from 'fetch-mock';
import qs from 'qs';
import { BASE_URL } from './constants';
import { aQuote, aQuoteRequest, aTransaction } from './fixtures';
import { buildApproveTx, buildSwapTransaction, getQuotes } from './services';

describe('Avnu services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('getQuotes', () => {
    it('should return a list of quotes', async () => {
      // Given
      const request = aQuoteRequest();
      const response = [aQuote()];
      fetchMock.get(`${BASE_URL}/swap/v1/quotes?${qs.stringify(request)}`, response);

      // When
      const result = await getQuotes(request);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const request = aQuoteRequest();
      const baseUrl = 'http://example.com';
      const response = [aQuote()];
      fetchMock.get(`${baseUrl}/swap/v1/quotes?${qs.stringify(request)}`, response);

      // When
      const result = await getQuotes(request, { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      const request = aQuoteRequest();
      fetchMock.get(`${BASE_URL}/swap/v1/quotes?${qs.stringify(request)}`, 401);

      // When & Then
      expect.assertions(1);
      expect(getQuotes(request)).rejects.toEqual(Error('401 Unauthorized'));
    });
  });

  describe('buildSwapTransaction', () => {
    it('should return a Transaction', async () => {
      // Given
      const response = [aTransaction()];
      fetchMock.post(`${BASE_URL}/swap/v1/build`, response);

      // When
      const result = await buildSwapTransaction('quoteId');

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const baseUrl = 'http://example.com';
      const response = [aTransaction()];
      fetchMock.post(`${baseUrl}/swap/v1/build`, response);

      // When
      const result = await buildSwapTransaction('quoteId', { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.post(`${BASE_URL}/swap/v1/build`, 401);

      // When & Then
      expect.assertions(1);
      expect(buildSwapTransaction('quoteId')).rejects.toEqual(Error('401 Unauthorized'));
    });
  });

  describe('buildApproveTx', () => {
    it('should a Call', () => {
      // When
      const result = buildApproveTx('0x1', '0x2', '1');

      // Then
      expect(result).toStrictEqual({
        calldata: ['0x2', '0x1', '0x0'],
        contractAddress: '0x1',
        entrypoint: 'approve',
      });
    });
  });
});
