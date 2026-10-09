import type { Call } from 'starknet';
import { executeAllPaymasterFlow } from './paymaster.services';
import type { InvokeParams, InvokeTransactionResponse } from './types';

const executeCalls = async (
  { provider, paymaster, executionDetails }: InvokeParams,
  calls: Call[],
): Promise<InvokeTransactionResponse> => {
  if (paymaster?.active) {
    if (executionDetails !== undefined) {
      throw new Error('executionDetails cannot be used with an active paymaster');
    }
    return executeAllPaymasterFlow({ paymaster, provider, calls });
  }

  const result =
    executionDetails === undefined ? await provider.execute(calls) : await provider.execute(calls, executionDetails);
  return { transactionHash: result.transaction_hash };
};

export { executeCalls };
