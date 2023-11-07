import { parseUnits, toBeHex } from 'ethers';
import fetchMock from 'fetch-mock';
import qs from 'qs';
import { constants } from 'starknet';
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
  buildApproveTx,
  buildGetNonce,
  calculateMinAmount,
  fetchBuildExecuteTransaction,
  fetchExecuteSwapTransaction,
  fetchPrices,
  fetchQuotes,
  fetchSources,
  fetchTokens,
  hashQuote,
} from './services';
import { Quote } from './types';

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
        },
      ];
      const queryParams = { ...aPriceRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${BASE_URL}/swap/v1/prices?${qs.stringify(queryParams)}`, response);

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
        },
      ];
      const queryParams = { ...aPriceRequest(), sellAmount: '0x0de0b6b3a7640000' };
      fetchMock.get(`${baseUrl}/swap/v1/prices?${qs.stringify(queryParams)}`, response);

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
      fetchMock.get(`${BASE_URL}/swap/v1/prices?${qs.stringify(queryParams)}`, 401);

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
      fetchMock.get(`${BASE_URL}/swap/v1/quotes?${qs.stringify(queryParams)}`, response);

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
      fetchMock.get(`${baseUrl}/swap/v1/quotes?${qs.stringify(queryParams)}`, response);

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
      fetchMock.get(`${BASE_URL}/swap/v1/quotes?${qs.stringify(queryParams)}`, 401);

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
      fetchMock.post(`${BASE_URL}/swap/v1/execute`, response);

      // When
      const result = await fetchExecuteSwapTransaction('quoteId', [], '', '');

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const baseUrl = 'https://example.com';
      const response = anInvokeSwapResponse();
      fetchMock.post(`${baseUrl}/swap/v1/execute`, response);

      // When
      const result = await fetchExecuteSwapTransaction('quoteId', [], '', '', undefined, { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.post(`${BASE_URL}/swap/v1/execute`, 401);

      // When & Then
      expect.assertions(1);
      expect(fetchExecuteSwapTransaction('quoteId', [], '', '')).rejects.toEqual(Error('401 Unauthorized'));
    });
  });

  describe('fetchBuildExecuteTransaction', () => {
    it('should return a BuildSwapTransaction', async () => {
      // Given
      const response = aBuildSwapTransaction();
      fetchMock.post(`${BASE_URL}/swap/v1/build`, response);

      // When
      const result = await fetchBuildExecuteTransaction('quoteId', '', '');

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use baseUrl from AvnuOption when defined', async () => {
      // Given
      const baseUrl = 'https://example.com';
      const response = aBuildSwapTransaction();
      fetchMock.post(`${baseUrl}/swap/v1/build`, response);

      // When
      const result = await fetchBuildExecuteTransaction('quoteId', '', '', undefined, { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.post(`${BASE_URL}/swap/v1/build`, 401);

      // When & Then
      expect.assertions(1);
      expect(fetchBuildExecuteTransaction('quoteId', '', '')).rejects.toEqual(Error('401 Unauthorized'));
    });
  });

  describe('fetchTokens', () => {
    it('should return a page of tokens', async () => {
      // Given
      const response = aPage([ethToken()]);
      fetchMock.get(`${BASE_URL}/swap/v1/tokens?`, response);

      // When
      const result = await fetchTokens();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/v1/tokens?`, 401);

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
      fetchMock.get(`${BASE_URL}/swap/v1/sources`, response);

      // When
      const result = await fetchSources();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/v1/sources`, 401);

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

  describe('buildApproveTx', () => {
    it('should build approve', () => {
      // When
      const result = buildApproveTx('0x1', BigInt('1'), constants.StarknetChainId.SN_GOERLI);

      // Then
      expect(result).toStrictEqual({
        calldata: ['0x7e36202ace0ab52bf438bd8a8b64b3731c48d09f0d8879f5b006384c2f35032', '0x1', '0x0'],
        contractAddress: '0x1',
        entrypoint: 'approve',
      });
    });
  });

  describe('buildGetNonce', () => {
    it('should build getNonce', () => {
      // When
      const result = buildGetNonce('0x1', constants.StarknetChainId.SN_GOERLI);

      // Then
      expect(result).toStrictEqual({
        calldata: ['1'],
        contractAddress: '0x7e36202ace0ab52bf438bd8a8b64b3731c48d09f0d8879f5b006384c2f35032',
        entrypoint: 'getNonce',
      });
    });
  });

  describe('hashQuote', () => {
    it('should return the hash', () => {
      // Given
      const quote: Quote = {
        ...aQuote(),
        sellTokenAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        sellAmount: BigInt('0x0de0b6b3a7640000'),
        buyTokenAddress: '0x72df4dc5b6c4df72e4288857317caf2ce9da166ab8719ab8306516a2fddfff7',
        buyAmount: BigInt('0x0de0b6b3a7640000'),
        routes: [
          {
            ...aQuote().routes[0],
            address: '0x02F7944d1ca7e42683d8562397a221a98105b415200BAA056c326Ad639c6ca2E',
          },
        ],
      };

      // When
      const result = hashQuote(
        '0x052D8E9778d026588A51595E30B0f45609B4F771eEcF0E335CdeFeD1D84A9d89',
        quote,
        '0x0',
        constants.StarknetChainId.SN_GOERLI,
      );

      // Then
      expect(result).toStrictEqual('0xa6b37651d52580635bbd93c0e4008ab939f955ae3914c558865e1870659784');
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
