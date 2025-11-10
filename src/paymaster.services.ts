import { toBeHex } from 'ethers';
import { PreparedInvokeTransaction } from 'starknet';
import {
  BuildPaymasterTransactionParams,
  ExecutePaymasterTransactionParams,
  InvokeTransactionResponse,
  SignedPaymasterTransaction,
  SignTransactionParams,
} from './types';

/**
 * Build a paymaster transaction
 *
 * @param params The paymaster transaction parameters
 * @param params.provider The account which will execute the transaction, must implement the AccountInterface
 * @param params.paymaster The paymaster information
 * @param params.calls The calls to execute
 * @returns The prepared paymaster transaction containing the typed data to sign
 */
const buildPaymasterTransaction = async (
  params: BuildPaymasterTransactionParams,
): Promise<PreparedInvokeTransaction> => {
  const { provider, paymaster, calls } = params;
  return paymaster.provider.buildTransaction(
    { type: 'invoke', invoke: { userAddress: provider.address, calls } },
    paymaster.params,
  ) as Promise<PreparedInvokeTransaction>;
};

/**
 * Sign the paymaster transaction
 *
 * @param params The signature parameters
 * @param params.provider The account which will sign the transaction, must implement the AccountInterface
 * @param params.typedData The typed data to sign
 * @returns The prepared paymaster transaction containing the typed data and the signature
 */
const signPaymasterTransaction = async (params: SignTransactionParams): Promise<SignedPaymasterTransaction> => {
  const { provider, typedData } = params;
  const rawSignature = await provider.signMessage(typedData);
  let signature: string[] = [];
  if (Array.isArray(rawSignature)) {
    signature = rawSignature.map((sig) => toBeHex(BigInt(sig)));
  } else if (rawSignature.r && rawSignature.s) {
    signature = [toBeHex(BigInt(rawSignature.r)), toBeHex(BigInt(rawSignature.s))];
  }
  return {
    typedData,
    signature,
  };
};

/**
 * Execute a paymaster transaction
 *
 * @param params The execution parameters
 * @param params.provider The account which will sign the transaction, must implement the AccountInterface
 * @param params.paymaster The paymaster interface
 * @param params.executionParams The execution parameters
 * @param params.signedTransaction The signed transaction with typed data and signature
 * @returns The transaction hash
 */
const executePaymasterTransaction = async (
  params: ExecutePaymasterTransactionParams,
): Promise<InvokeTransactionResponse> => {
  const { provider, paymaster, executionParams, signedTransaction } = params;
  const { typedData, signature } = signedTransaction;
  return paymaster
    .executeTransaction(
      {
        type: 'invoke',
        invoke: { userAddress: provider.address, typedData, signature },
      },
      executionParams,
    )
    .then((result) => ({ transactionHash: result.transaction_hash }));
};

export { buildPaymasterTransaction, executePaymasterTransaction, signPaymasterTransaction };
