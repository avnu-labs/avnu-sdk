import fetchMock from 'fetch-mock';
import { BASE_URL, TOKEN_API_VERSION } from './constants';
import { aPage, ethToken } from './fixtures';
import { fetchTokenByAddress, fetchTokens, fetchVerifiedTokenBySymbol } from './token.services';

describe('Token services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('fetchTokens', () => {
    it('should return a page of tokens', async () => {
      // Given
      const response = aPage([ethToken()]);
      fetchMock.get(`${BASE_URL}/${TOKEN_API_VERSION}/starknet/tokens?`, response);

      // When
      const result = await fetchTokens();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/${TOKEN_API_VERSION}/starknet/tokens?`, 401);

      // When
      try {
        await fetchTokens();
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('401 Unauthorized'));
      }
      expect.assertions(1);
    });

    it('should use baseUrl from AvnuOptions when defined', async () => {
      // Given
      const baseUrl = 'https://example.com';
      const response = aPage([ethToken()]);
      fetchMock.get(`${baseUrl}/${TOKEN_API_VERSION}/starknet/tokens?`, response);

      // When
      const result = await fetchTokens(undefined, { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });
  });

  describe('fetchTokenByAddress', () => {
    it('should return a token by address', async () => {
      // Given
      const tokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const response = ethToken();
      fetchMock.get(`${BASE_URL}/${TOKEN_API_VERSION}/starknet/tokens/${tokenAddress}`, response);

      // When
      const result = await fetchTokenByAddress(tokenAddress);

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should throw Error with status code when status > 400', async () => {
      // Given
      const tokenAddress = '0x0invalid';
      fetchMock.get(`${BASE_URL}/${TOKEN_API_VERSION}/starknet/tokens/${tokenAddress}`, 404);

      // When
      try {
        await fetchTokenByAddress(tokenAddress);
      } catch (error) {
        // Then
        expect(error).toStrictEqual(new Error('404 Not Found'));
      }
      expect.assertions(1);
    });

    it('should use baseUrl from AvnuOptions when defined', async () => {
      // Given
      const baseUrl = 'https://example.com';
      const tokenAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
      const response = ethToken();
      fetchMock.get(`${baseUrl}/${TOKEN_API_VERSION}/starknet/tokens/${tokenAddress}`, response);

      // When
      const result = await fetchTokenByAddress(tokenAddress, { baseUrl });

      // Then
      expect(result).toStrictEqual(response);
    });
  });

  describe('fetchVerifiedTokenBySymbol', () => {
    it('should return verified token when symbol matches', async () => {
      // Given
      const symbol = 'ETH';
      const response = aPage([ethToken()]);
      fetchMock.get(`begin:${BASE_URL}/${TOKEN_API_VERSION}/starknet/tokens?`, response);

      // When
      const result = await fetchVerifiedTokenBySymbol(symbol);

      // Then
      expect(result).toStrictEqual(ethToken());
    });

    it('should handle case-insensitive symbol matching', async () => {
      // Given
      const symbol = 'eth';
      const response = aPage([ethToken()]);
      fetchMock.get(`begin:${BASE_URL}/${TOKEN_API_VERSION}/starknet/tokens?`, response);

      // When
      const result = await fetchVerifiedTokenBySymbol(symbol);

      // Then
      expect(result).toStrictEqual(ethToken());
    });

    it('should throw undefined when token not found', async () => {
      // Given
      const symbol = 'UNKNOWN';
      const response = aPage([]);
      fetchMock.get(`begin:${BASE_URL}/${TOKEN_API_VERSION}/starknet/tokens?`, response);

      // When & Then
      await expect(fetchVerifiedTokenBySymbol(symbol)).rejects.toBeUndefined();
    });

    it('should throw undefined when symbol does not match', async () => {
      // Given
      const symbol = 'BTC';
      const response = aPage([ethToken()]); // Returns ETH, but we're looking for BTC
      fetchMock.get(`begin:${BASE_URL}/${TOKEN_API_VERSION}/starknet/tokens?`, response);

      // When & Then
      await expect(fetchVerifiedTokenBySymbol(symbol)).rejects.toBeUndefined();
    });
  });
});
