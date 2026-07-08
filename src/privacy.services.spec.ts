import fetchMock from 'fetch-mock';
import { hash } from 'starknet';
import { BASE_URL, PAYMASTER_BASE_URL, SWAP_API_VERSION } from './constants';
import { aCall, aPrivacyProof, aPrivateFeeMode, aPrivateSwapCallAndProof, aQuote } from './fixtures';
import { buildPrivateSwapFee, executePrivateSwap, submitPrivateSwap, toPaymasterCall } from './privacy.services';
import { createMockPrivateSwapProver } from './test-utils';

describe('Privacy services', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  describe('buildPrivateSwapFee', () => {
    it('should return a PrivateSwapFee with amount converted to bigint', async () => {
      // Given
      const feeMode = aPrivateFeeMode();
      fetchMock.post(PAYMASTER_BASE_URL, {
        result: { fee_action: { token: '0xfee', recipient: '0xrecipient', amount: '0x3e8' } },
      });

      // When
      const result = await buildPrivateSwapFee({ poolAddress: '0xpool', feeMode });

      // Then
      expect(result).toStrictEqual({ token: '0xfee', recipient: '0xrecipient', amount: 1000n });
      expect(result.amount).toBe(1000n);
    });

    it('should use paymasterBaseUrl from AvnuOptions when defined', async () => {
      // Given
      const feeMode = aPrivateFeeMode();
      const paymasterBaseUrl = 'https://example.com';
      fetchMock.post(paymasterBaseUrl, {
        result: { fee_action: { token: '0xfee', recipient: '0xrecipient', amount: '0x3e8' } },
      });

      // When
      const result = await buildPrivateSwapFee({ poolAddress: '0xpool', feeMode }, { paymasterBaseUrl });

      // Then
      expect(result).toStrictEqual({ token: '0xfee', recipient: '0xrecipient', amount: 1000n });
    });

    it('should send the correct JSON-RPC body for paymaster_buildTransaction', async () => {
      // Given
      const feeMode = aPrivateFeeMode();
      fetchMock.post(PAYMASTER_BASE_URL, {
        result: { fee_action: { token: '0xfee', recipient: '0xrecipient', amount: '0x3e8' } },
      });

      // When
      await buildPrivateSwapFee({ poolAddress: '0xpool', feeMode });

      // Then
      const body = JSON.parse(fetchMock.lastOptions()?.body as unknown as string);
      expect(body.method).toBe('paymaster_buildTransaction');
      expect(body.jsonrpc).toBe('2.0');
      expect(body.params.transaction.type).toBe('apply_action');
      expect(body.params.transaction.apply_action.pool_address).toBe('0xpool');
      expect(body.params.parameters.fee_mode).toStrictEqual({
        mode: 'sponsored_private',
        pool_fee_token: '0xfee',
        tip: 'normal',
      });
    });

    it('should send the x-paymaster-api-key header when paymasterApiKey is provided', async () => {
      // Given
      const feeMode = aPrivateFeeMode();
      fetchMock.post(PAYMASTER_BASE_URL, {
        result: { fee_action: { token: '0xfee', recipient: '0xrecipient', amount: '0x3e8' } },
      });

      // When
      await buildPrivateSwapFee({ poolAddress: '0xpool', feeMode, paymasterApiKey: 'secret-key' });

      // Then
      const headers = fetchMock.lastOptions()?.headers as Record<string, string>;
      expect(headers['x-paymaster-api-key']).toBe('secret-key');
    });

    it('should not send the x-paymaster-api-key header when paymasterApiKey is absent', async () => {
      // Given
      const feeMode = aPrivateFeeMode();
      fetchMock.post(PAYMASTER_BASE_URL, {
        result: { fee_action: { token: '0xfee', recipient: '0xrecipient', amount: '0x3e8' } },
      });

      // When
      await buildPrivateSwapFee({ poolAddress: '0xpool', feeMode });

      // Then
      const headers = fetchMock.lastOptions()?.headers as Record<string, string>;
      expect(headers['x-paymaster-api-key']).toBeUndefined();
    });

    it('should throw when the response has an error', async () => {
      // Given
      const feeMode = aPrivateFeeMode();
      fetchMock.post(PAYMASTER_BASE_URL, {
        error: { code: -32000, message: 'pool not found' },
      });

      // When & Then
      expect.assertions(1);
      await expect(buildPrivateSwapFee({ poolAddress: '0xpool', feeMode })).rejects.toEqual(
        new Error('Paymaster paymaster_buildTransaction: pool not found (code: -32000)'),
      );
    });
  });

  describe('submitPrivateSwap', () => {
    it('should return the transactionHash from transaction_hash', async () => {
      // Given
      const feeMode = aPrivateFeeMode();
      const callAndProof = aPrivateSwapCallAndProof();
      fetchMock.post(PAYMASTER_BASE_URL, { result: { transaction_hash: '0xhash' } });

      // When
      const result = await submitPrivateSwap({ callAndProof, feeMode });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xhash' });
    });

    it('should send the correct JSON-RPC body for paymaster_executeTransaction', async () => {
      // Given
      const feeMode = aPrivateFeeMode();
      const call = aCall();
      const proof = aPrivacyProof();
      const callAndProof = aPrivateSwapCallAndProof({ call, proof });
      fetchMock.post(PAYMASTER_BASE_URL, { result: { transaction_hash: '0xhash' } });

      // When
      await submitPrivateSwap({ callAndProof, feeMode });

      // Then
      const body = JSON.parse(fetchMock.lastOptions()?.body as unknown as string);
      expect(body.method).toBe('paymaster_executeTransaction');
      expect(body.params.transaction.type).toBe('apply_action');
      expect(body.params.transaction.apply_action.apply_actions_call).toStrictEqual({
        to: call.contractAddress,
        selector: hash.getSelectorFromName(call.entrypoint),
        calldata: call.calldata,
      });
      expect(body.params.transaction.apply_action.proof).toBe(proof.data);
      expect(body.params.transaction.apply_action.proof_facts).toStrictEqual(proof.proofFacts);
      expect(body.params.parameters.fee_mode).toStrictEqual({
        mode: 'sponsored_private',
        pool_fee_token: '0xfee',
        tip: 'normal',
      });
    });

    it('should throw when the response has an error', async () => {
      // Given
      const feeMode = aPrivateFeeMode();
      const callAndProof = aPrivateSwapCallAndProof();
      fetchMock.post(PAYMASTER_BASE_URL, {
        error: { code: -32001, message: 'invalid proof' },
      });

      // When & Then
      expect.assertions(1);
      await expect(submitPrivateSwap({ callAndProof, feeMode })).rejects.toEqual(
        new Error('Paymaster paymaster_executeTransaction: invalid proof (code: -32001)'),
      );
    });
  });

  describe('executePrivateSwap', () => {
    it('should orchestrate build -> quoteToCalls -> prove -> submit and return the transaction hash', async () => {
      // Given
      const quote = aQuote();
      const feeMode = aPrivateFeeMode();
      const prover = createMockPrivateSwapProver();
      const executorCalls = [aCall()];

      // The paymaster URL is hit twice (build fee, then submit). Distinguish by RPC method.
      fetchMock.post(PAYMASTER_BASE_URL, (_url: string, opts) => {
        const body = JSON.parse(opts.body as string);
        return body.method === 'paymaster_buildTransaction'
          ? { result: { fee_action: { token: '0xfee', recipient: '0xrecipient', amount: '0x3e8' } } }
          : { result: { transaction_hash: '0xfinal' } };
      });
      fetchMock.post(`${BASE_URL}/swap/${SWAP_API_VERSION}/build`, {
        chainId: quote.chainId,
        calls: executorCalls,
        executorAddress: '0xexecutor',
      });

      // When
      const result = await executePrivateSwap({
        quote,
        slippage: 0.01,
        takerAddress: '0xtaker',
        poolAddress: '0xpool',
        feeMode,
        prover,
      });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xfinal' });
      expect(prover.buildAndProve).toHaveBeenCalledWith(
        expect.objectContaining({
          sellTokenAddress: quote.sellTokenAddress,
          sellAmount: quote.sellAmount,
          buyTokenAddress: quote.buyTokenAddress,
          executorAddress: '0xexecutor',
          executorCalls,
          fee: { token: '0xfee', recipient: '0xrecipient', amount: 1000n },
          takerAddress: '0xtaker',
        }),
      );
    });

    it('should throw Invalid chainId when the provided chainId does not match the quote (before any network call)', async () => {
      // Given
      const quote = aQuote();
      const feeMode = aPrivateFeeMode();
      const prover = createMockPrivateSwapProver();

      // When & Then
      expect.assertions(3);
      await expect(
        executePrivateSwap({
          quote,
          slippage: 0.01,
          takerAddress: '0xtaker',
          poolAddress: '0xpool',
          feeMode,
          prover,
          chainId: '0xdeadbeef',
        }),
      ).rejects.toEqual(new Error('Invalid chainId'));
      // No network round-trip and no proof generation happened
      expect(fetchMock.calls()).toHaveLength(0);
      expect(prover.buildAndProve).not.toHaveBeenCalled();
    });

    it('should proceed when the provided chainId matches the quote', async () => {
      // Given
      const quote = aQuote();
      const feeMode = aPrivateFeeMode();
      const prover = createMockPrivateSwapProver();

      fetchMock.post(PAYMASTER_BASE_URL, (_url: string, opts) => {
        const body = JSON.parse(opts.body as string);
        return body.method === 'paymaster_buildTransaction'
          ? { result: { fee_action: { token: '0xfee', recipient: '0xrecipient', amount: '0x3e8' } } }
          : { result: { transaction_hash: '0xfinal' } };
      });
      fetchMock.post(`${BASE_URL}/swap/${SWAP_API_VERSION}/build`, {
        chainId: quote.chainId,
        calls: [aCall()],
        executorAddress: '0xexecutor',
      });

      // When
      const result = await executePrivateSwap({
        quote,
        slippage: 0.01,
        takerAddress: '0xtaker',
        poolAddress: '0xpool',
        feeMode,
        prover,
        chainId: quote.chainId,
      });

      // Then
      expect(result).toStrictEqual({ transactionHash: '0xfinal' });
    });

    it('should throw when quoteToCalls returns no executorAddress', async () => {
      // Given
      const quote = aQuote();
      const feeMode = aPrivateFeeMode();
      const prover = createMockPrivateSwapProver();

      fetchMock.post(PAYMASTER_BASE_URL, (_url: string, opts) => {
        const body = JSON.parse(opts.body as string);
        return body.method === 'paymaster_buildTransaction'
          ? { result: { fee_action: { token: '0xfee', recipient: '0xrecipient', amount: '0x3e8' } } }
          : { result: { transaction_hash: '0xfinal' } };
      });
      // Build endpoint returns AvnuCalls WITHOUT executorAddress
      fetchMock.post(`${BASE_URL}/swap/${SWAP_API_VERSION}/build`, {
        chainId: quote.chainId,
        calls: [aCall()],
      });

      // When & Then
      expect.assertions(2);
      await expect(
        executePrivateSwap({
          quote,
          slippage: 0.01,
          takerAddress: '0xtaker',
          poolAddress: '0xpool',
          feeMode,
          prover,
        }),
      ).rejects.toEqual(
        new Error('Private swap requires an executorAddress from quoteToCalls (ensure private swap is enabled)'),
      );
      expect(prover.buildAndProve).not.toHaveBeenCalled();
    });
  });

  describe('toPaymasterCall', () => {
    it('should convert a starknet Call into a paymaster call shape', () => {
      // Given
      const call = aCall();

      // When
      const result = toPaymasterCall(call);

      // Then
      expect(result).toStrictEqual({
        to: call.contractAddress,
        selector: hash.getSelectorFromName(call.entrypoint),
        calldata: call.calldata,
      });
    });

    it('should default calldata to an empty array when undefined', () => {
      // Given
      const call = aCall({ calldata: undefined });

      // When
      const result = toPaymasterCall(call);

      // Then
      expect(result.calldata).toStrictEqual([]);
    });
  });
});
