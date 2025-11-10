import { OutsideExecutionTypedData } from '@starknet-io/starknet-types-09';
import { toBeHex } from 'ethers';
import { AccountInterface, ExecutionParameters, PaymasterInterface, PreparedInvokeTransaction } from 'starknet';
import { InvokeTransactionResponse, PaymasterTransactionParams, PreparedPaymasterTransaction } from './types';

/**
 * Sign the paymaster transaction
 *
 * @param provider The account which will sign the transaction, must implement the AccountInterface
 * @param typedData The typed data to sign
 * @returns The prepared paymaster transaction containing the typed data and the signature
 */
const signPaymasterTransaction = async (
  provider: AccountInterface,
  typedData: OutsideExecutionTypedData,
): Promise<PreparedPaymasterTransaction> => {
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
 * Build a paymaster transaction
 *
 * @param provider The account which will execute the transaction, must implement the AccountInterface
 * @param paymaster The paymaster information
 * @param calls The calls to execute
 * @returns The prepared paymaster transaction containing the typed data to sign
 */
const buildPaymasterTransaction = async ({
  provider,
  paymaster,
  calls,
}: PaymasterTransactionParams): Promise<PreparedInvokeTransaction> => {
  return paymaster.provider.buildTransaction(
    { type: 'invoke', invoke: { userAddress: provider.address, calls } },
    paymaster.params,
  ) as Promise<PreparedInvokeTransaction>;
};

/**
 * Execute a paymaster transaction
 *
 * @param provider The account which will sign the transaction, must implement the AccountInterface
 * @param paymaster The paymaster information
 * @param params The paymaster parameters
 * @param typedData The typed data to sign
 * @param signature The signature of the typed data to execute the transaction
 * @returns The transaction hash
 */
const executePaymasterTransaction = async (
  provider: AccountInterface,
  paymaster: PaymasterInterface,
  params: ExecutionParameters,
  { typedData, signature }: PreparedPaymasterTransaction,
): Promise<InvokeTransactionResponse> => {
  return paymaster
    .executeTransaction(
      {
        type: 'invoke',
        invoke: { userAddress: provider.address, typedData, signature },
      },
      params,
    )
    .then((result) => ({ transactionHash: result.transaction_hash }));
};

export { buildPaymasterTransaction, executePaymasterTransaction, signPaymasterTransaction };
