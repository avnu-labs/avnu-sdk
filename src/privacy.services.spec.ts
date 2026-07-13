import fetchMock from 'fetch-mock';
import type { STRK20_CALL_AND_PROOF } from 'starknet';
import { hash } from 'starknet';
import { BASE_URL, PAYMASTER_BASE_URL, SWAP_API_VERSION } from './constants';
import {
  aCall,
  aPrivacyProof,
  aPrivateFeeMode,
  aPrivateSwapCallAndProof,
  aPrivateSwapFee,
  aPrivateSwapPlan,
  aQuote,
} from './fixtures';
import {
  buildPrivateSwapFee,
  buildStrk20Actions,
  createStrk20WalletProver,
  executePrivateSwap,
  submitPrivateSwap,
  toPaymasterCall,
} from './privacy.services';
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
      // The API rejects takerAddress alongside private=true (mutually exclusive)
      const buildRequest = fetchMock.calls().find(([url]) => url.includes('/swap/'));
      const buildBody = JSON.parse(buildRequest?.[1]?.body as unknown as string);
      expect(buildBody.private).toBe(true);
      expect(buildBody).not.toHaveProperty('takerAddress');
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

  describe('buildStrk20Actions', () => {
    it('should materialize the plan as withdraw sell, withdraw fee, open note, invoke executor', () => {
      // Given
      const plan = aPrivateSwapPlan({
        sellTokenAddress: '0x123',
        sellAmount: 1000000000000000000n,
        buyTokenAddress: '0x456',
        executorAddress: '0x789',
        executorCalls: [aCall({ contractAddress: '0xdead', entrypoint: 'execute_swap', calldata: ['0x1', '0x2'] })],
        fee: aPrivateSwapFee({ token: '0xabc', recipient: '0xfeerecipient', amount: 500n }),
        takerAddress: '0x7a',
      });

      // When
      const actions = buildStrk20Actions(plan);

      // Then
      // fromCallsToExecuteCalldata_cairo1: [n_calls, to, selector('execute_swap'), calldata_len, ...calldata]
      expect(actions).toStrictEqual([
        { type: 'withdraw', token: '0x123', amount: '0xde0b6b3a7640000', recipient: '0x789' },
        { type: 'withdraw', token: '0xabc', amount: '0x1f4', recipient: '0xfeerecipient' },
        { type: 'transfer', token: '0x456', amount: 'OPEN', recipient: '0x7a' },
        {
          type: 'invoke',
          contract: '0x789',
          calldata: [
            '0x456',
            '0x1',
            '0xdead',
            '0x2838190fef3088d277dd6581e49b92f66a21df03d0442e81d31ac1147cc6048',
            '0x2',
            '0x1',
            '0x2',
            '${openNoteIds[0]}',
          ],
        },
      ]);
    });
  });

  describe('createStrk20WalletProver', () => {
    it('should prove the actions with the wallet and map the artifact to PrivateSwapCallAndProof', async () => {
      // Given
      const plan = aPrivateSwapPlan();
      const walletArtifact: STRK20_CALL_AND_PROOF = {
        call: { contract_address: '0x11', entry_point: 'apply_actions', calldata: ['0x1'] },
        proof: { data: 'proof-data', output: ['0x2'], proof_facts: ['0x3'] },
      };
      const account = { strk20PrepareInvoke: jest.fn().mockResolvedValue(walletArtifact) };

      // When
      const result = await createStrk20WalletProver(account).buildAndProve(plan);

      // Then
      expect(account.strk20PrepareInvoke).toHaveBeenCalledWith(buildStrk20Actions(plan));
      expect(result).toStrictEqual({
        call: { contractAddress: '0x11', entrypoint: 'apply_actions', calldata: ['0x1'] },
        proof: { data: 'proof-data', proofFacts: ['0x3'] },
      });
    });

    it('should default missing wallet calldata to an empty array', async () => {
      // Given
      const account = {
        strk20PrepareInvoke: jest.fn().mockResolvedValue({
          call: { contract_address: '0x11', entry_point: 'apply_actions' },
          proof: { data: '', output: [], proof_facts: [] },
        }),
      };

      // When
      const result = await createStrk20WalletProver(account).buildAndProve(aPrivateSwapPlan());

      // Then
      expect(result.call.calldata).toStrictEqual([]);
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
