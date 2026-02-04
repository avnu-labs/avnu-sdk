import { ContractError } from './types';
import { parseResponse, postRequest } from './utils';

describe('utils', () => {
  describe('postRequest', () => {
    it('should forward abortSignal into RequestInit.signal', () => {
      const controller = new AbortController();
      const init = postRequest({ hello: 'world' }, { abortSignal: controller.signal });
      expect(init.signal).toBe(controller.signal);
    });

    it('should set ask-signature header when avnuPublicKey is provided (even empty string)', () => {
      const init = postRequest(undefined, { avnuPublicKey: '' });
      expect((init.headers as Record<string, string>)['ask-signature']).toBe('true');
    });
  });

  describe('parseResponse', () => {
    it('should throw a default error message if 500 response contains no messages', async () => {
      const response = new Response(JSON.stringify({ messages: [], revertError: undefined }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });

      await expect(parseResponse(response)).rejects.toStrictEqual(new Error('Internal server error'));
    });

    it('should throw ContractError when 500 response message includes "Contract error"', async () => {
      const mkResponse = () =>
        new Response(JSON.stringify({ messages: ['Contract error: revert'], revertError: '0x123' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });

      await expect(parseResponse(mkResponse())).rejects.toBeInstanceOf(ContractError);
      await expect(parseResponse(mkResponse())).rejects.toMatchObject({
        message: 'Contract error: revert',
        revertError: '0x123',
      });
    });
  });
});
