import fetchMock from 'fetch-mock';
import qs from 'qs';
import { AccountInterface } from 'starknet';
import { StarknetChainId } from 'starknet/dist/constants';
import { BASE_URL } from './constants';
import { aPage, aPair, aQuote, aQuoteRequest, aTransaction, ethToken } from './fixtures';
import {
  buildApproveTx,
  buildSwapTransaction,
  checkAddress,
  executeSwap,
  getPairs,
  getQuotes,
  getTokens,
} from './services';
import { Transaction } from './types';

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

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/v1/tokens?`, 401);

      // When & Then
      expect.assertions(1);
      expect(getTokens()).rejects.toEqual(Error('401 Unauthorized'));
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

    it('should use throw Error with status code and text when status is higher than 400', () => {
      // Given
      fetchMock.get(`${BASE_URL}/swap/v1/pairs?`, 401);

      // When & Then
      expect.assertions(1);
      expect(getPairs()).rejects.toEqual(Error('401 Unauthorized'));
    });
  });

  describe('checkAddress', () => {
    it('should do nothing when address is whitelisted', () => {
      // When & Then
      checkAddress('0x0', StarknetChainId.TESTNET); // TODO: change the address
    });

    it('should throw an error when address is not whitelisted', () => {
      let thrownError;

      // When
      try {
        checkAddress('0x1', StarknetChainId.TESTNET);
      } catch (error) {
        thrownError = error;
      }

      // Then
      expect(thrownError).toEqual(Error('0x1 is not whitelisted'));
    });
  });

  describe('buildApproveTx', () => {
    it('should a Call', () => {
      // When
      const result = buildApproveTx('0x1', '0x0', '1', StarknetChainId.TESTNET);

      // Then
      expect(result).toStrictEqual({
        calldata: ['0x0', '0x1', '0x0'], // TODO: change the address
        contractAddress: '0x1', // TODO: change the address
        entrypoint: 'approve',
      });
    });

    it('should throw an error when contractAddress is not whitelisted', () => {
      let thrownError;

      // When
      try {
        buildApproveTx('0x1', '0x1', '1', StarknetChainId.TESTNET);
      } catch (error) {
        thrownError = error;
      }

      // Then
      expect(thrownError).toEqual(Error('0x1 is not whitelisted'));
    });
  });

  describe('executeSwap', () => {
    it('should throw an error when swapTransaction.contractAddress is not whitelisted', () => {
      // given
      let thrownError;
      const account: AccountInterface = { chainId: StarknetChainId.TESTNET } as AccountInterface;
      const swapTransaction: Transaction = {
        chainId: StarknetChainId.TESTNET,
        contractAddress: '0x1',
        entrypoint: 'approve',
        calldata: [],
      };

      // When
      try {
        executeSwap(account, swapTransaction, '0x1', '1');
      } catch (error) {
        thrownError = error;
      }

      // Then
      expect(thrownError).toEqual(Error('0x1 is not whitelisted'));
    });
    it('should throw an error when invalid chainId', () => {
      // given
      let thrownError;
      const account: AccountInterface = { chainId: StarknetChainId.MAINNET } as AccountInterface;
      const swapTransaction: Transaction = {
        chainId: StarknetChainId.TESTNET,
        contractAddress: '0x0',
        entrypoint: 'approve',
        calldata: [],
      };

      // When
      try {
        executeSwap(account, swapTransaction, '0x1', '1');
      } catch (error) {
        thrownError = error;
      }

      // Then
      expect(thrownError).toEqual(Error('Invalid chainId'));
    });
  });
});
