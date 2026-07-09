import { Call, hash } from 'starknet';
import { quoteToCalls } from './swap.services';
import {
  AvnuOptions,
  BuildPrivateSwapFeeParams,
  ExecutePrivateSwapParams,
  InvokeTransactionResponse,
  PaymasterCall,
  PrivateFeeMode,
  PrivateSwapFee,
  SubmitPrivateSwapParams,
} from './types';
import { getPaymasterBaseUrl } from './utils';

const PAYMASTER_PARAMETERS_VERSION = '0x1';

interface JsonRpcResponse<T> {
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

/**
 * Low-level JSON-RPC call against the AVNU privacy paymaster.
 * !! Be careful if you run this on a client with a paymaster API key: it will leak the key.
 * !! Prefer a server-side environment when a key is required. !!
 */
const paymasterRpcCall = <T>(
  method: string,
  params: unknown,
  options?: AvnuOptions,
  paymasterApiKey?: string,
): Promise<T> =>
  fetch(getPaymasterBaseUrl(options), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(paymasterApiKey && { 'x-paymaster-api-key': paymasterApiKey }),
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: options?.abortSignal,
  })
    .then((response) => response.json() as Promise<JsonRpcResponse<T>>)
    .then((json) => {
      if (json.error) {
        throw new Error(`Paymaster ${method}: ${json.error.message} (code: ${json.error.code})`);
      }
      return json.result as T;
    });

/**
 * Convert the public fee mode into the `sponsored_private` shape expected by the paymaster.
 */
const toRpcFeeMode = (feeMode: PrivateFeeMode) => ({
  mode: 'sponsored_private' as const,
  pool_fee_token: feeMode.poolFeeToken,
  ...(feeMode.tip && { tip: feeMode.tip }),
});

/**
 * Convert a starknet.js Call into the paymaster call shape (to/selector/calldata).
 */
const toPaymasterCall = (call: Call): PaymasterCall => ({
  to: call.contractAddress,
  selector: hash.getSelectorFromName(call.entrypoint),
  calldata: (call.calldata as string[]) ?? [],
});

/**
 * Build the pool fee for a private swap through the paymaster `apply_action` flow.
 * The returned fee must be withdrawn to `recipient` inside the private transaction.
 *
 * @param params.poolAddress The privacy pool contract address
 * @param params.feeMode The `sponsored_private` fee configuration
 * @param params.paymasterApiKey Optional paymaster API key (server-side only)
 * @param options Optional SDK configuration
 * @returns The pool fee (token, recipient, amount)
 */
const buildPrivateSwapFee = (params: BuildPrivateSwapFeeParams, options?: AvnuOptions): Promise<PrivateSwapFee> =>
  paymasterRpcCall<{ fee_action: { token: string; recipient: string; amount: string } }>(
    'paymaster_buildTransaction',
    {
      transaction: { type: 'apply_action', apply_action: { pool_address: params.poolAddress } },
      parameters: { version: PAYMASTER_PARAMETERS_VERSION, fee_mode: toRpcFeeMode(params.feeMode) },
    },
    options,
    params.paymasterApiKey,
  ).then(({ fee_action }) => ({
    token: fee_action.token,
    recipient: fee_action.recipient,
    amount: BigInt(fee_action.amount),
  }));

/**
 * Submit a proven private swap through the paymaster `apply_action` flow.
 * No user signature is required: the transaction settles on-chain straight from the proof.
 *
 * @param params.callAndProof The prepared call and its zero-knowledge proof
 * @param params.feeMode The `sponsored_private` fee configuration
 * @param params.paymasterApiKey Optional paymaster API key (server-side only)
 * @param options Optional SDK configuration
 * @returns The transaction hash
 */
const submitPrivateSwap = (
  params: SubmitPrivateSwapParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> =>
  paymasterRpcCall<{ transaction_hash: string }>(
    'paymaster_executeTransaction',
    {
      transaction: {
        type: 'apply_action',
        apply_action: {
          apply_actions_call: toPaymasterCall(params.callAndProof.call),
          proof: params.callAndProof.proof.data,
          proof_facts: params.callAndProof.proof.proofFacts,
        },
      },
      parameters: { version: PAYMASTER_PARAMETERS_VERSION, fee_mode: toRpcFeeMode(params.feeMode) },
    },
    options,
    params.paymasterApiKey,
  ).then(({ transaction_hash }) => ({ transactionHash: transaction_hash }));

/**
 * Execute a private swap end to end.
 *
 * Orchestrates the four steps of the private swap flow while keeping all
 * cryptography outside the SDK:
 * 1. Fetch the pool fee from the paymaster (`apply_action` build).
 * 2. Build the private swap calls through AVNU's private executor (`quoteToCalls` with `private: true`).
 * 3. Delegate proof generation to the injected `prover` (STRK20 wallet or privacy SDK).
 * 4. Submit the proven transaction through the paymaster (`apply_action` execute).
 *
 * !! When a paymaster API key is required (sponsored_private), run this on a server —
 * !! calling it from a browser leaks the key. Browser dapps should split the flow:
 * !! `buildPrivateSwapFee` and `submitPrivateSwap` behind server endpoints, proving
 * !! (`prover`) client-side with the user's wallet.
 *
 * @param params.quote The selected quote. See `getQuotes`
 * @param params.slippage The maximum acceptable slippage for the trade
 * @param params.takerAddress The address of the trader
 * @param params.poolAddress The privacy pool contract address
 * @param params.feeMode The `sponsored_private` fee configuration
 * @param params.prover The injected proof provider. The SDK never handles keys or notes
 * @param params.paymasterApiKey Optional paymaster API key (server-side only)
 * @param options Optional SDK configuration
 * @returns The transaction hash
 */
const executePrivateSwap = async (
  params: ExecutePrivateSwapParams,
  options?: AvnuOptions,
): Promise<InvokeTransactionResponse> => {
  const { quote, slippage, takerAddress, poolAddress, feeMode, prover, paymasterApiKey, chainId } = params;

  // Fail fast on a network mismatch, before the expensive paymaster and proving round-trips
  if (chainId && chainId !== quote.chainId) {
    throw new Error('Invalid chainId');
  }

  // 1. Fetch the pool fee from the paymaster (required for private swaps)
  const fee = await buildPrivateSwapFee({ poolAddress, feeMode, paymasterApiKey }, options);

  // 2. Build the private swap calls through AVNU's private executor.
  // takerAddress must NOT be sent: the API rejects it alongside private=true
  // (the executor is the taker; the user address only appears inside the proof)
  const { calls, executorAddress } = await quoteToCalls({ quoteId: quote.quoteId, slippage, private: true }, options);
  if (!executorAddress) {
    throw new Error('Private swap requires an executorAddress from quoteToCalls (ensure private swap is enabled)');
  }

  // 3. Delegate proof generation to the injected prover (wallet or privacy SDK)
  const callAndProof = await prover.buildAndProve({
    sellTokenAddress: quote.sellTokenAddress,
    sellAmount: quote.sellAmount,
    buyTokenAddress: quote.buyTokenAddress,
    executorAddress,
    executorCalls: calls,
    fee,
    takerAddress,
  });

  // 4. Submit the proven transaction through the AVNU privacy paymaster
  return submitPrivateSwap({ callAndProof, feeMode, paymasterApiKey }, options);
};

export { buildPrivateSwapFee, executePrivateSwap, submitPrivateSwap, toPaymasterCall };
