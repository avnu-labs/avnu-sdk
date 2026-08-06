import fetchMock from 'fetch-mock';
import { z } from 'zod';
import { parseResponseWithSchema } from './utils';

describe('utils', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('parseResponseWithSchema', () => {
    const schema = z.object({ traderAddress: z.string() });

    it('should report validation errors without exposing the response URL', async () => {
      // Given
      const url = 'https://example.com/dca/v3/orders?traderAddress=0x0trader&size=10';
      fetchMock.get(url, {});
      const response = await fetch(url);

      // When
      try {
        await parseResponseWithSchema(response, schema);
      } catch (error) {
        // Then
        const message = (error as Error).message;
        expect(message).toContain('Invalid API response:');
        expect(message).not.toContain('/dca/v3/orders');
        expect(message).not.toContain('0x0trader');
        expect(message).toContain('traderAddress');
      }
      expect.assertions(4);
    });
  });
});
