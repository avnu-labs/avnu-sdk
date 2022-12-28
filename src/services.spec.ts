import { BigNumber } from 'ethers';
import fetchMock from 'fetch-mock';
import qs from 'qs';
import { StarknetChainId } from 'starknet/dist/constants';
import { BASE_URL } from './constants';
import { anInvokeSwapResponse, aPage, aPair, aQuote, aQuoteRequest, ethToken } from './fixtures';
import { buildApproveTx, buildGetNonce, executeSwapTransaction, getPairs, getQuotes, getTokens } from './services';

describe('Avnu services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('getQuotes', () => {
    it('should return a list of quotes', async () => {
      // Given
      const request = aQuoteRequest();
      const response = [aQuote()];
      const queryParams = { ...aQuoteRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${BASE_URL}/swap/v1/quotes?${qs.stringify(queryParams)}`, response);

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
      const queryParams = { ...aQuoteRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${baseUrl}/swap/v1/quotes?${qs.stringify(queryParams)}`, response);

      // When
      const result = await getQuotes(request, { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      const request = aQuoteRequest();
      const queryParams = { ...aQuoteRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${BASE_URL}/swap/v1/quotes?${qs.stringify(queryParams)}`, 401);

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

  describe('executeSwapTransaction', () => {
    it('should return an InvokeSwapResponse', async () => {
      // Given
      const response = anInvokeSwapResponse();
      fetchMock.post(`${BASE_URL}/swap/v1/execute`, response);

      // When
      const result = await executeSwapTransaction('quoteId', [], '', '');

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const baseUrl = 'http://example.com';
      const response = anInvokeSwapResponse();
      fetchMock.post(`${baseUrl}/swap/v1/execute`, response);

      // When
      const result = await executeSwapTransaction('quoteId', [], '', '', { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.post(`${BASE_URL}/swap/v1/execute`, 401);

      // When & Then
      expect.assertions(1);
      expect(executeSwapTransaction('quoteId', [], '', '')).rejects.toEqual(Error('401 Unauthorized'));
    });
  });

  describe('getTokens', () => {
    it('should return a page of tokens', async () => {
      // Given
      const response = aPage([ethToken()]);
      fetchMock.get(`${BASE_URL}/swap/v1/tokens?`, response);

      // When
      const result = await getTokens();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/v1/tokens?`, 401);

      // When
      try {
        await getTokens();
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });
  });

  describe('getPairs', () => {
    it('should return a page of pairs', async () => {
      // Given
      const response = aPage([aPair()]);
      fetchMock.get(`${BASE_URL}/swap/v1/pairs?`, response);

      // When
      const result = await getPairs();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/v1/pairs?`, { status: 400, body: { messages: ['This is an error'] } });

      // When
      try {
        await getPairs();
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('This is an error'));
      }
      expect.assertions(1);
    });
  });

  describe('buildApproveTx', () => {
    it('should build approve', () => {
      // When
      const result = buildApproveTx('0x1', BigNumber.from('1'), StarknetChainId.TESTNET);

      // Then
      expect(result).toStrictEqual({
        calldata: ['0x5c614428c49b94ab60c90ea55d366d328921c829bbd3ae81d748723750c0931', '0x1', '0x0'],
        contractAddress: '0x1',
        entrypoint: 'approve',
      });
    });
  });

  describe('buildGetNonce', () => {
    it('should build getNonce', () => {
      // When
      const result = buildGetNonce('0x1', StarknetChainId.TESTNET);

      // Then
      expect(result).toStrictEqual({
        calldata: ['1'],
        contractAddress: '0x5c614428c49b94ab60c90ea55d366d328921c829bbd3ae81d748723750c0931',
        entrypoint: 'getNonce',
      });
    });
  });
});
