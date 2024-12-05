import fetchMock from 'fetch-mock';
import { BASE_URL } from './constants';
import { aPage, ethToken } from './fixtures';
import { fetchTokens } from './token.services';

describe('Token services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('fetchTokens', () => {
    it('should return a page of tokens', async () => {
      // Given
      const response = aPage([ethToken()]);
      fetchMock.get(`${BASE_URL}/v1/starknet/tokens?`, response);

      // When
      const result = await fetchTokens();

      // Then
      expect(result).toStrictEqual(response);
    });

    it('should use throw Error with status code and text when status is higher than 400', async () => {
      // Given
      fetchMock.get(`${BASE_URL}/v1/starknet/tokens?`, 401);

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
});
